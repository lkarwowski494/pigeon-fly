/**
 * PIGEON-FLY — Generator Świadectwa Zgodności Weterynaryjnej Punktu Koszowania (Z-092 / DEC-106)
 * Protokół Odkażania i Atestacji Klatek Koszowych PZHGP & Procedura Bioasekuracji PIW:
 * - Atestacja punktu wkładania (sekcyjnego / oddziałowego) przed koszowaniem na lot konkursowy.
 * - Ewidencja preparatów biobójczych (Virkon S, Ecocid S, Rapicid itp.), stężenia roztworu roboczego,
 *   czasu ekspozycji (min. 15-30 min) i numerów partii (LOT).
 * - Przegląd techniczno-sanitarny klatek transportowych (czystość rusztów, ściółka, brak ostrych krawędzi).
 * - Kontrola zabezpieczeń bioasekuracyjnych stacji (maty dezynfekcyjne, wentylacja, deratyzacja, mycie rąk).
 * - Orzeczenie komisji (dopuszczenie bez zastrzeżeń / warunkowe / odrzucenie punktu).
 * - Oficjalny Protokół Odkażania i Atestacji A4 HTML/PDF z podpisami delegata i lekarza weterynarii.
 */

export type BasketingSanitationVerdict =
  | 'approved_full'
  | 'approved_conditional'
  | 'rejected';

export interface DisinfectantDetails {
  productName: string; // np. "Virkon S"
  activeSubstance: string; // np. "Mononadsiarczan potasu (potassium peroxymonosulfate)"
  batchNumber: string; // np. "LOT-2026/03V"
  expiryDate: string; // YYYY-MM-DD
  solutionConcentrationPct: number; // np. 1.0% lub 2.0%
  exposureTimeMinutes: number; // np. 30 min
}

export interface CrateSanitationAudit {
  cratesCount: number; // np. 45 koszy
  cratesCleanAndDisinfected: boolean;
  beddingType: 'corrugated_cardboard' | 'dustless_wood_shavings' | 'paper_mats';
  technicalIntegrityOk: boolean; // brak wystających drutów, sprawne zamki
  densityCompliant: boolean; // zgodność z normą FCI (200-250 cm2 / ptaka)
}

export interface StationBiosecurityChecklist {
  entranceDisinfectionMatsActive: boolean; // maty nasączone biobójczo
  surfacesAndTablesSanitized: boolean; // stoły wkładaniowe odkażone
  ventilationOperational: boolean; // sprawny wyciąg powietrza
  rodentAndWildBirdShielded: boolean; // brak gryzoni i dzikich ptaków
  handSanitationAvailable: boolean; // dozowniki do dezynfekcji rąk komisji
  cleanWaterSourceAvailable: boolean; // dostęp do czystej wody
}

export interface BasketingStationSanitationData {
  protocolNumber: string; // np. "AT-SAN-2026/009"
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:mm
  raceName: string; // np. "Lot nr 3 — Nowa Sól (220 km)"
  stationName: string; // np. "Punkt Wkładań Sekcja 1 — Poznań Wilda"
  stationAddress: string; // np. "ul. Rolna 24, 61-487 Poznań"
  branchNumber: string; // np. "0284"
  branchName: string; // np. "Poznań Zachód"
  disinfectant: DisinfectantDetails;
  crateAudit: CrateSanitationAudit;
  checklist: StationBiosecurityChecklist;
  verdict: BasketingSanitationVerdict;
  inspectorName: string; // Delegat ds. bioasekuracji
  veterinarianName?: string; // Lekarz weterynarii opiekun stacji
  sectionPresidentName: string; // Prezes Sekcji
  conditionalRequirements?: string; // jeśli dopuszczono warunkowo
  notes?: string;
}

export const VERDICT_LABELS: Record<BasketingSanitationVerdict, string> = {
  approved_full: 'DOPUSZCZONY BEZ ZASTRZEŻEŃ (Pełna zgodność sanitarna)',
  approved_conditional: 'DOPUSZCZONY WARUNKOWO (Zobowiązanie do natychmiastowych poprawek)',
  rejected: 'ZAKAZ KOSZOWANIA (Rażące uchybienia bioasekuracji)',
};

/**
 * Validates mandatory fields and technical parameters for basketing station sanitation protocol.
 */
export function validateBasketingStationSanitation(
  data: BasketingStationSanitationData
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.protocolNumber || !data.protocolNumber.trim()) {
    errors.push('Brak numeru protokołu atestacji!');
  }
  if (!data.inspectionDate) {
    errors.push('Brak daty kontroli sanitarnej!');
  }
  if (!data.stationName || !data.stationName.trim()) {
    errors.push('Brak nazwy punktu wkładania!');
  }
  if (!data.inspectorName || !data.inspectorName.trim()) {
    errors.push('Brak nazwiska inspektora / delegata ds. bioasekuracji!');
  }
  if (!data.disinfectant.productName || !data.disinfectant.productName.trim()) {
    errors.push('Brak nazwy zastosowanego preparatu biobójczego!');
  }
  if (data.disinfectant.solutionConcentrationPct <= 0) {
    errors.push('Niepoprawne stężenie roztworu dezynfekcyjnego!');
  }
  if (data.disinfectant.exposureTimeMinutes < 10) {
    errors.push('Czas ekspozycji środka biobójczego musi wynosić minimum 10-15 minut!');
  }
  if (data.crateAudit.cratesCount <= 0) {
    errors.push('Liczba klatek koszowych musi być większa od zera!');
  }
  if (data.verdict === 'approved_conditional' && !data.conditionalRequirements) {
    errors.push('W przypadku dopuszczenia warunkowego wymagany jest opis zaleceń natychmiastowych!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates the biosecurity score of the basketing station (0-100%).
 */
export function calculateSanitationScore(data: BasketingStationSanitationData): {
  score: number;
  criticalIssues: string[];
} {
  let score = 0;
  const criticalIssues: string[] = [];

  // Disinfectant quality
  if (data.disinfectant.solutionConcentrationPct >= 1.0) score += 15;
  if (data.disinfectant.exposureTimeMinutes >= 20) score += 10;
  if (data.disinfectant.batchNumber) score += 5;

  // Crates
  if (data.crateAudit.cratesCleanAndDisinfected) {
    score += 20;
  } else {
    criticalIssues.push('Klatki koszowe nie zostały prawidłowo zdezynfekowane!');
  }

  if (data.crateAudit.technicalIntegrityOk) {
    score += 10;
  } else {
    criticalIssues.push('Usterki techniczne klatek grożące skaleczeniem ptaków!');
  }

  if (data.crateAudit.densityCompliant) score += 5;

  // Station checklist
  if (data.checklist.entranceDisinfectionMatsActive) {
    score += 10;
  } else {
    criticalIssues.push('Brak aktywnych mat dezynfekcyjnych na wejściu!');
  }

  if (data.checklist.surfacesAndTablesSanitized) score += 5;
  if (data.checklist.ventilationOperational) score += 5;
  if (data.checklist.rodentAndWildBirdShielded) score += 5;
  if (data.checklist.handSanitationAvailable) score += 5;
  if (data.checklist.cleanWaterSourceAvailable) score += 5;

  return {
    score,
    criticalIssues,
  };
}

/**
 * Generates official A4 Printable HTML Certificate of Basketing Station Sanitation Protocol.
 */
export function generateBasketingStationSanitationHtml(
  data: BasketingStationSanitationData
): string {
  const { score, criticalIssues } = calculateSanitationScore(data);

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Świadectwo Zgodności Sanitarnej Punktu Koszowania — ${data.protocolNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.35;
      font-size: 8.5pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8pt; text-align: right; color: #334155; }

    .banner {
      background: ${data.verdict === 'approved_full' ? '#f0fdf4' : data.verdict === 'approved_conditional' ? '#fffbeb' : '#fef2f2'};
      border: 1.5px solid ${data.verdict === 'approved_full' ? '#16a34a' : data.verdict === 'approved_conditional' ? '#f59e0b' : '#dc2626'};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner-title {
      font-size: 11pt;
      font-weight: 900;
      color: ${data.verdict === 'approved_full' ? '#166534' : data.verdict === 'approved_conditional' ? '#b45309' : '#991b1b'};
    }
    .banner-desc { font-size: 8pt; color: #475569; margin-top: 2px; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 8pt;
    }
    .label { color: #64748b; }
    .val { font-weight: 700; color: #0f172a; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
      padding-top: 8px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
    }
    .sig-title { font-size: 7.5pt; color: #64748b; text-transform: uppercase; }
    .sig-name { font-size: 8pt; font-weight: 800; margin-top: 2px; }

    .footer {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Protokół Odkażania i Atestacji Sanitarnej Punktu Koszowania</div>
      <div class="subtitle">Zgodność Weterynaryjna PIW & Regulamin Lotowo-Zegarowy PZHGP (Z-092)</div>
    </div>
    <div class="meta">
      <div>Protokół Nr: <strong>${data.protocolNumber}</strong></div>
      <div>Oddział PZHGP: <strong>${data.branchNumber} ${data.branchName}</strong></div>
      <div>Data atestacji: <strong>${data.inspectionDate}</strong>, godz. <strong>${data.inspectionTime}</strong></div>
    </div>
  </div>

  <div class="banner">
    <div>
      <div class="banner-title">${VERDICT_LABELS[data.verdict]}</div>
      <div class="banner-desc">
        Punkt: <strong>${data.stationName}</strong> (${data.stationAddress}) • 
        Lot docelowy: <strong>${data.raceName}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 7.5pt; color: #64748b;">Wskaźnik Zgodności:</span><br>
      <strong style="font-size: 13pt; color: #0f172a;">${score}%</strong>
    </div>
  </div>

  <div class="grid-2">
    <!-- Preparat Biobójczy -->
    <div class="card">
      <div class="card-title">1. ZASTOSOWANY PREPARAT DEZYNFEKCYJNY</div>
      <div class="row">
        <span class="label">Nazwa handlowa:</span>
        <span class="val" style="color: #0284c7;">${data.disinfectant.productName}</span>
      </div>
      <div class="row">
        <span class="label">Substancja czynna:</span>
        <span class="val">${data.disinfectant.activeSubstance}</span>
      </div>
      <div class="row">
        <span class="label">Numer partii (LOT):</span>
        <span class="val" style="font-family: monospace;">${data.disinfectant.batchNumber}</span>
      </div>
      <div class="row">
        <span class="label">Stężenie roztworu roboczego:</span>
        <span class="val">${data.disinfectant.solutionConcentrationPct.toFixed(1)}%</span>
      </div>
      <div class="row">
        <span class="label">Czas ekspozycji biobójczej:</span>
        <span class="val">${data.disinfectant.exposureTimeMinutes} minut</span>
      </div>
    </div>

    <!-- Przegląd Klatek -->
    <div class="card">
      <div class="card-title">2. ATESTACJA KLATEK KOSZOWYCH</div>
      <div class="row">
        <span class="label">Liczba sprawdzonych klatek:</span>
        <span class="val">${data.crateAudit.cratesCount} szt.</span>
      </div>
      <div class="row">
        <span class="label">Czystość i odkażenie:</span>
        <span class="val" style="color: ${data.crateAudit.cratesCleanAndDisinfected ? '#166534' : '#991b1b'};">
          ${data.crateAudit.cratesCleanAndDisinfected ? '✓ Pozytywne (odkażone)' : '✕ Negatywne (zabrudzenia)'}
        </span>
      </div>
      <div class="row">
        <span class="label">Zastosowana ściółka:</span>
        <span class="val">
          ${
            data.crateAudit.beddingType === 'corrugated_cardboard'
              ? 'Tektura falista higieniczna'
              : data.crateAudit.beddingType === 'dustless_wood_shavings'
              ? 'Wióry odpylone'
              : 'Maty papierowe chłonne'
          }
        </span>
      </div>
      <div class="row">
        <span class="label">Stan techniczny i zamki:</span>
        <span class="val">${data.crateAudit.technicalIntegrityOk ? 'Bezpieczne (brak drutów)' : 'Wymaga naprawy'}</span>
      </div>
      <div class="row">
        <span class="label">Norma zagęszczenia FCI:</span>
        <span class="val">${data.crateAudit.densityCompliant ? 'Zgodna (min. 200 cm²/ptaka)' : 'Przekroczona'}</span>
      </div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    3. LISTA KONTROLNA BIOASEKURACJI POMIESZCZENIA WKŁADANIA:
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 70%;">Kryterium Bioasekuracyjne PIW / PZHGP</th>
        <th style="text-align: center;">Status Kontroli</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Aktywne maty dezynfekcyjne przy drzwiach wejściowych</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.entranceDisinfectionMatsActive ? '#166534' : '#991b1b'};">
          ${data.checklist.entranceDisinfectionMatsActive ? 'SPEŁNIONO (ZALANE)' : 'BRAK'}
        </td>
      </tr>
      <tr>
        <td>Odkażenie blatów stołów wkładaniowych i posadzek</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.surfacesAndTablesSanitized ? '#166534' : '#991b1b'};">
          ${data.checklist.surfacesAndTablesSanitized ? 'SPEŁNIONO' : 'NIEODKAŻONE'}
        </td>
      </tr>
      <tr>
        <td>Sprawność wentylacji nawiewno-wywiewnej</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.ventilationOperational ? '#166534' : '#991b1b'};">
          ${data.checklist.ventilationOperational ? 'PRAWIDŁOWA' : 'UCHYBIENIE'}
        </td>
      </tr>
      <tr>
        <td>Zabezpieczenie przed gryzoniami i dzikim ptactwem</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.rodentAndWildBirdShielded ? '#166534' : '#991b1b'};">
          ${data.checklist.rodentAndWildBirdShielded ? 'ZABEZPIECZONO' : 'BRAK SIATEK'}
        </td>
      </tr>
      <tr>
        <td>Stanowisko do higieny i dezynfekcji rąk komisji wkładaniowej</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.handSanitationAvailable ? '#166534' : '#991b1b'};">
          ${data.checklist.handSanitationAvailable ? 'DOSTĘPNE' : 'BRAK PŁYNU'}
        </td>
      </tr>
      <tr>
        <td>Źródło bieżącej czystej wody pitnej dla stada</td>
        <td style="text-align: center; font-weight: 800; color: ${data.checklist.cleanWaterSourceAvailable ? '#166534' : '#991b1b'};">
          ${data.checklist.cleanWaterSourceAvailable ? 'DOSTĘPNE' : 'BRAK'}
        </td>
      </tr>
    </tbody>
  </table>

  ${
    data.conditionalRequirements
      ? `
  <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 6px 10px; border-radius: 4px; margin-bottom: 12px; font-size: 8pt; color: #92400e;">
    <strong>Zalecenia natychmiastowe komisji:</strong> ${data.conditionalRequirements}
  </div>
  `
      : ''
  }

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Delegat ds. Bioasekuracji</div>
      <div class="sig-name">${data.inspectorName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Lekarz Weterynarii / Opiekun</div>
      <div class="sig-name">${data.veterinarianName || 'Podpis lekarza weterynarii'}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Prezes Sekcji / Stacji</div>
      <div class="sig-name">${data.sectionPresidentName}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Sanitarny Punktu Koszowania Z-092 (DEC-106)</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}

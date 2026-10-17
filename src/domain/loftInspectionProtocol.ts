/**
 * PIGEON-FLY — Loft Inspection & Unannounced Visitation Protocol (Z-087 / DEC-101)
 * Official PZHGP Anti-fraud and Loft Visitation Protocol:
 * - Unannounced race-day visits, pre-season census, routine integrity audits.
 * - Headcount verification (racing cocks, hens, young birds vs declared roster).
 * - Ring condition & tamper checks (seamless bands, chip bands, no cuts/alterations).
 * - Electronic trap security (antenna positions, tamper seals, one-way sputnik gates).
 * - Commission verdict, recommendations, and official A4 protocol generator.
 */

export type InspectionType =
  | 'unannounced_race_day'
  | 'pre_season_census'
  | 'routine_integrity_audit'
  | 'post_protest_verification';

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  unannounced_race_day: 'Niezapowiedziana Kontrola w Dniu Lotu Konkursowego',
  pre_season_census: 'Przedsezonowy Spis Kontrolny i Ewidencja Stada',
  routine_integrity_audit: 'Rutynowa Wizytacja Uczciwości i Zabezpieczeń Gołębnika',
  post_protest_verification: 'Komisyjna Weryfikacja po Złożeniu Protestu Lotowego',
};

export interface PigeonPhysicalCheck {
  id: string;
  ringNumber: string;
  sex: 'cock' | 'hen';
  plumageColor: string;
  chipBandSerial: string;
  ringCondition: 'flawless' | 'worn_legible' | 'suspicious_tamper';
  inLoftVerified: boolean;
  notes?: string;
}

export interface LoftInspectionData {
  protocolNumber: string;
  inspectionDate: string;
  inspectionTime: string;
  inspectionType: InspectionType;
  // Breeder details
  breederName: string;
  breederPzhgpNumber: string;
  branchName: string;
  sectionName: string;
  loftAddress: string;
  loftLatitude: number;
  loftLongitude: number;
  // Headcount & Loft census
  declaredBirdsCount: number;
  actualBirdsCount: number;
  foreignBirdsDetectedCount: number;
  // Security Checklist
  gpsCoordinatesMatch: boolean;
  eskAntennaPadsTamperFree: boolean;
  sealsIntact: boolean;
  trapGatesFunctioning: boolean;
  loftHygieneSatisfactory: boolean;
  freeFlightObservations: string;
  // Sampled Pigeons Check
  sampledBirds: PigeonPhysicalCheck[];
  // Commission members & verdict
  commissionMember1: string;
  commissionMember2: string;
  commissionPresident: string;
  commissionVerdict: 'full_compliance' | 'minor_irregularity' | 'severe_violation';
  commissionObservations: string;
}

export interface InspectionEvaluationResult {
  isCompliant: boolean;
  conformityScorePct: number;
  verdictLabel: string;
  verdictColor: string;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Evaluates loft inspection conformity against PZHGP competition regulations.
 */
export function evaluateLoftInspection(
  data: LoftInspectionData
): InspectionEvaluationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let points = 0;
  const maxPoints = 8;

  // 1. Coordinates check
  if (data.gpsCoordinatesMatch) {
    points++;
  } else {
    errors.push('Współrzędne GPS gołębnika niezgodne z rejestrem urzędowym PZHGP!');
  }

  // 2. Headcount match
  const countDiff = Math.abs(data.actualBirdsCount - data.declaredBirdsCount);
  if (countDiff === 0) {
    points++;
  } else if (countDiff <= 2) {
    points += 0.5;
    warnings.push(`Różnica stanu liczbowego stada: ${countDiff} ptaków (deklarowano ${data.declaredBirdsCount}, stwierdzono ${data.actualBirdsCount}).`);
  } else {
    errors.push(`Rażąca niezgodność stanu liczbowego stada: różnica ${countDiff} ptaków!`);
  }

  // 3. Foreign birds check
  if (data.foreignBirdsDetectedCount === 0) {
    points++;
  } else {
    warnings.push(`Stwierdzono obecność ${data.foreignBirdsDetectedCount} obcych ptaków w celach stada lotowego.`);
  }

  // 4. ESK Antennas security
  if (data.eskAntennaPadsTamperFree) {
    points++;
  } else {
    errors.push('Stwierdzono ślady manipulacji przy antenach wlotowych ESK lub ich przemieszczenie!');
  }

  // 5. Tamper seals
  if (data.sealsIntact) {
    points++;
  } else {
    errors.push('Naruszone lub zerwane plomby legalizacyjne stacji zegarowej / magistrali!');
  }

  // 6. Trap gates functionality
  if (data.trapGatesFunctioning) {
    points++;
  } else {
    errors.push('Wloty sputnik / zapadnie niesprawne — ryzyko ominięcia anteny rejestrującej ESK!');
  }

  // 7. Loft hygiene & welfare
  if (data.loftHygieneSatisfactory) {
    points++;
  } else {
    warnings.push('Stan zoohigieniczny gołębnika wymaga poprawy (zapylenie, wentylacja).');
  }

  // 8. Sampled birds check
  const anyTamperedRing = data.sampledBirds.some(
    (b) => b.ringCondition === 'suspicious_tamper'
  );
  const anyMissingBird = data.sampledBirds.some((b) => !b.inLoftVerified);

  if (!anyTamperedRing && !anyMissingBird && data.sampledBirds.length > 0) {
    points++;
  } else {
    if (anyTamperedRing) {
      errors.push('Wykryto obrączkę ze śladami rozcinania, klejenia lub modyfikacji mechanicznej!');
    }
    if (anyMissingBird) {
      errors.push('Brak w gołębniku ptaka wytypowanego do kontroli fizycznej ze spisu!');
    }
  }

  const conformityScorePct = Math.round((points / maxPoints) * 100);

  let isCompliant = true;
  let verdictLabel = 'ZGODNOŚĆ PEŁNA — PROTOKÓŁ POZYTYWNY';
  let verdictColor = '#10B981';

  if (data.commissionVerdict === 'severe_violation' || errors.length > 0 || conformityScorePct < 65) {
    isCompliant = false;
    verdictLabel = 'NARUSZENIE REGULAMINU — WNIOSEK DO SĄDU KOLEŻEŃSKIEGO';
    verdictColor = '#EF4444';
    recommendations.push(
      'Natychmiastowe zabezpieczenie materiału dowodowego i przekazanie protokołu do Zarządu Oddziału.',
      'Zawieszenie wyników lotowych hodowcy do czasu wyjaśnienia przez Komisję Dyscyplinarną.',
      'Wniosek o wszczęcie postępowania dyscyplinarnego przed Sądem Koleżeńskim PZHGP.'
    );
  } else if (data.commissionVerdict === 'minor_irregularity' || warnings.length > 0 || conformityScorePct < 85) {
    isCompliant = true;
    verdictLabel = 'ZALECENIA POKONTROLNE — DROBNE UCHYBIENIA';
    verdictColor = '#F59E0B';
    recommendations.push(
      'Hodowca zobowiązany jest do usunięcia wskazanych uchybień w terminie 7 dni.',
      'Zaleca się ponowną kontrolę sprawdzającą przed kolejnym lotem dalekodystansowym.'
    );
  } else {
    recommendations.push(
      'Wszystkie parametry bezpieczeństwa i stan liczbowy stada są w pełni zgodne z Regulaminem PZHGP.',
      'Brak zastrzeżeń do instalacji zegarowej i identyfikacji ptaków.'
    );
  }

  return {
    isCompliant,
    conformityScorePct,
    verdictLabel,
    verdictColor,
    errors,
    warnings,
    recommendations,
  };
}

/**
 * Generates official PZHGP A4 printable Loft Inspection Protocol HTML.
 */
export function generateLoftInspectionProtocolHtml(
  data: LoftInspectionData
): string {
  const evaluation = evaluateLoftInspection(data);
  const typeText = INSPECTION_TYPE_LABELS[data.inspectionType] || data.inspectionType;

  const sampledBirdsHtml = data.sampledBirds
    .map(
      (b, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
      <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${b.ringNumber}</td>
      <td style="text-align: center;">${b.sex === 'cock' ? '1.0 Samiec' : '0.1 Samica'}</td>
      <td>${b.plumageColor}</td>
      <td style="font-family: monospace; font-size: 8pt;">${b.chipBandSerial}</td>
      <td style="text-align: center; font-weight: 700; color: ${
        b.ringCondition === 'flawless'
          ? '#166534'
          : b.ringCondition === 'worn_legible'
          ? '#ca8a04'
          : '#991b1b'
      };">
        ${
          b.ringCondition === 'flawless'
            ? 'BEZ ZARZUTU'
            : b.ringCondition === 'worn_legible'
            ? 'CZYTELNA'
            : 'PODEJRZANA!'
        }
      </td>
      <td style="text-align: center; font-weight: 800; color: ${b.inLoftVerified ? '#166534' : '#991b1b'};">
        ${b.inLoftVerified ? 'OBECNY' : 'BRAK!'}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Protokół Kontroli Gołębnika — ${data.breederName}</title>
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
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8pt; text-align: right; color: #334155; }

    .verdict-banner {
      border: 1.5px solid ${evaluation.verdictColor};
      background: #f8fafc;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verdict-title { font-size: 11pt; font-weight: 900; color: ${evaluation.verdictColor}; }
    .verdict-sub { font-size: 8pt; color: #475569; margin-top: 2px; }
    .score-box { text-align: right; }
    .score-val { font-size: 16pt; font-weight: 900; color: #0f172a; }
    .score-label { font-size: 7.5pt; color: #64748b; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 9pt;
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
      margin-top: 4px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
    }

    .obs-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0284c7;
      padding: 8px 10px;
      margin-bottom: 10px;
      font-size: 8pt;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 24px;
      padding-top: 8px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
    }
    .sig-title { font-size: 7.5pt; font-weight: 700; color: #475569; text-transform: uppercase; }
    .sig-name { font-size: 8pt; font-weight: 800; color: #0f172a; margin-top: 2px; }

    .footer {
      margin-top: 14px;
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
      <div class="title">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
      <div class="subtitle">Protokół Komisji Lotowej z Kontroli i Wizytacji Gołębnika (Z-087)</div>
    </div>
    <div class="meta">
      <div>Oddział: <strong>${data.branchName}</strong></div>
      <div>Sekcja: <strong>${data.sectionName}</strong></div>
      <div>Protokół nr: <strong>${data.protocolNumber}</strong></div>
      <div>Data i godzina: <strong>${data.inspectionDate} o godz. ${data.inspectionTime}</strong></div>
    </div>
  </div>

  <div class="verdict-banner">
    <div>
      <div class="verdict-title">${evaluation.verdictLabel}</div>
      <div class="verdict-sub">Tryb kontroli: <strong>${typeText}</strong></div>
    </div>
    <div class="score-box">
      <div class="score-val">${evaluation.conformityScorePct}%</div>
      <div class="score-label">Wskaźnik Zgodności</div>
    </div>
  </div>

  <div class="grid-2">
    <!-- Hodowca i Spis -->
    <div class="card">
      <div class="card-title">DANE HODOWCY I SPIS STADA</div>
      <div class="row">
        <span class="label">Hodowca:</span>
        <span class="val">${data.breederName} (${data.breederPzhgpNumber})</span>
      </div>
      <div class="row">
        <span class="label">Adres gołębnika:</span>
        <span class="val">${data.loftAddress}</span>
      </div>
      <div class="row">
        <span class="label">Współrzędne GPS (WGS-84):</span>
        <span class="val">${data.loftLatitude.toFixed(5)}°N, ${data.loftLongitude.toFixed(5)}°E (${data.gpsCoordinatesMatch ? 'ZGODNE' : 'NIEZGODNE!'})</span>
      </div>
      <div class="row">
        <span class="label">Stan ze spisu / Stwierdzony:</span>
        <span class="val">${data.declaredBirdsCount} szt. / ${data.actualBirdsCount} szt.</span>
      </div>
      <div class="row">
        <span class="label">Obce gołębie w celach:</span>
        <span class="val" style="color: ${data.foreignBirdsDetectedCount === 0 ? '#166534' : '#991b1b'};">
          ${data.foreignBirdsDetectedCount} sztuk
        </span>
      </div>
    </div>

    <!-- Audyt Bezpieczeństwa -->
    <div class="card">
      <div class="card-title">AUDYT INSTALACJI I ZABEZPIECZEŃ ESK</div>
      <div class="row">
        <span class="label">Anteny wlotowe ESK:</span>
        <span class="val" style="color: ${data.eskAntennaPadsTamperFree ? '#166534' : '#991b1b'};">
          ${data.eskAntennaPadsTamperFree ? 'Nienaruszone, trwale mocowane' : 'Ślady manipulacji!'}
        </span>
      </div>
      <div class="row">
        <span class="label">Plomby bazy i magistrali:</span>
        <span class="val" style="color: ${data.sealsIntact ? '#166534' : '#991b1b'};">
          ${data.sealsIntact ? 'Wszystkie nienaruszone' : 'ZERWANA PLOMBA!'}
        </span>
      </div>
      <div class="row">
        <span class="label">Wloty jednokierunkowe / zapadnie:</span>
        <span class="val" style="color: ${data.trapGatesFunctioning ? '#166534' : '#991b1b'};">
          ${data.trapGatesFunctioning ? 'Prawidłowe (brak obejścia)' : 'NIESPRAWNE!'}
        </span>
      </div>
      <div class="row">
        <span class="label">Stan zoohigieniczny gołębnika:</span>
        <span class="val">${data.loftHygieneSatisfactory ? 'Prawidłowy (czysto, sucho)' : 'Zastrzeżenia sanitarne'}</span>
      </div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    KONTROLA FIZYCZNA GOŁĘBI WYTYPOWANYCH ZE SPISU (${data.sampledBirds.length} SZTUK):
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">Lp</th>
        <th>Numer Obrączki Rodowej</th>
        <th style="text-align: center;">Płeć</th>
        <th>Barwa Upierzenia</th>
        <th>Nr Chipa ESK</th>
        <th style="text-align: center;">Stan Obrączki</th>
        <th style="text-align: center;">Status w Gołębniku</th>
      </tr>
    </thead>
    <tbody>
      ${sampledBirdsHtml}
    </tbody>
  </table>

  <div class="obs-box">
    <strong>Uwagi i Spostrzeżenia Komisji Lotowej:</strong>
    <p style="margin: 4px 0;">${data.commissionObservations}</p>
    <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">
      Obserwacja oblotu domowego: ${data.freeFlightObservations}
    </div>
  </div>

  <div class="signatures-grid">
    <div class="sig-col">
      <div class="sig-title">Hodowca / Osoba Kontrolowana</div>
      <div class="sig-name">${data.breederName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Członek Komisji 1</div>
      <div class="sig-name">${data.commissionMember1}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Przewodniczący / Członek 2</div>
      <div class="sig-name">${data.commissionPresident || data.commissionMember2}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Kontroli Gołębnika PZHGP Z-087</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}

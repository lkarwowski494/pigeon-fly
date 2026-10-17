/**
 * PIGEON-FLY — Generator Zestawień do Druku Koszowego (Lista Startowo-Zegarowa PZHGP - Z-057)
 * Oficjalny protokół wkładaniowy stada na lot konkursowy PZHGP / FCI:
 * 1. Walidacja unikalności obrączek rodowych i przypisania chipów elektronicznych ESK
 * 2. Ewidencja płci (1.0 samiec, 0.1 samica), barw upierzenia i typowania serii (T)
 * 3. Zestawienie klatek transportowych (kabina) i sumy kontrolne
 * 4. Generowanie urzędowego wydruku A4 (AirPrint / PDF) dla Komisji Wkładaniowej
 */

export type PigeonSex = 'cock' | 'hen' | 'unknown';

export interface BasketingBirdItem {
  ordinal: number;
  ringNumber: string;
  sex: PigeonSex;
  color: string;
  chipId: string;
  crateNumber?: number;
  isDesignated?: boolean; // Typka / Seria (T)
  pedigreeNote?: string;
}

export interface BasketingProtocol {
  branchCodeAndName: string; // np. "0284 Rawicz"
  sectionCodeAndName: string; // np. "01 Rawicz-Miasto"
  raceNumber: number | string; // np. 3
  raceName: string; // np. "Magdeburg 1"
  flightDistanceKm: number; // np. 345.2
  basketingDate: string; // YYYY-MM-DD
  basketingTime?: string; // HH:mm
  basketingPoint: string; // np. "Punkt Wkładań nr 1 - Dom Hodowcy"
  breederName: string; // np. "Jan Kowalski"
  breederCode: string; // np. "1402"
  loftCoordinates: string; // np. "51°52'48.0\" N, 17°01'12.0\" E"
  eskSystem: string; // np. "Tauris Maxi (Matka: TM-4821)"
  birds: BasketingBirdItem[];
  commissionMembers?: string[]; // Członkowie Komisji Wkładaniowej
}

export interface BasketingProtocolSummary {
  totalBirds: number;
  cocksCount: number;
  hensCount: number;
  unknownSexCount: number;
  designatedCount: number;
  chipsPresentCount: number;
  chipsMissingCount: number;
  cratesUsed: number[];
  cratesCount: number;
}

export interface BasketingProtocolValidation {
  isValid: boolean;
  duplicateRings: string[];
  missingChips: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Formatuje płeć według urzędowego kodu PZHGP (1.0 = samiec, 0.1 = samica, 0.0 = nieznana)
 */
export function formatSexPzhgp(sex: PigeonSex): string {
  switch (sex) {
    case 'cock':
      return '1.0';
    case 'hen':
      return '0.1';
    default:
      return '0.0';
  }
}

/**
 * Podsumowuje zestawienie ptaków do protokołu wkładaniowego
 */
export function summarizeBasketingProtocol(protocol: BasketingProtocol): BasketingProtocolSummary {
  let cocks = 0;
  let hens = 0;
  let unknown = 0;
  let designated = 0;
  let chipsPresent = 0;
  let chipsMissing = 0;
  const crates = new Set<number>();

  protocol.birds.forEach((b) => {
    if (b.sex === 'cock') cocks += 1;
    else if (b.sex === 'hen') hens += 1;
    else unknown += 1;

    if (b.isDesignated) designated += 1;

    if (b.chipId && b.chipId.trim().length > 0) {
      chipsPresent += 1;
    } else {
      chipsMissing += 1;
    }

    if (b.crateNumber && b.crateNumber > 0) {
      crates.add(b.crateNumber);
    }
  });

  const cratesArray = Array.from(crates).sort((a, b) => a - b);

  return {
    totalBirds: protocol.birds.length,
    cocksCount: cocks,
    hensCount: hens,
    unknownSexCount: unknown,
    designatedCount: designated,
    chipsPresentCount: chipsPresent,
    chipsMissingCount: chipsMissing,
    cratesUsed: cratesArray,
    cratesCount: cratesArray.length > 0 ? cratesArray.length : Math.ceil(protocol.birds.length / 25),
  };
}

/**
 * Weryfikuje poprawność listy wkładaniowej przed drukiem
 */
export function validateBasketingProtocol(protocol: BasketingProtocol): BasketingProtocolValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateRings: string[] = [];
  const missingChips: string[] = [];

  if (!protocol.breederName.trim()) {
    errors.push('Brak imienia i nazwiska hodowcy.');
  }
  if (!protocol.breederCode.trim()) {
    errors.push('Brak numeru hodowcy w oddziale.');
  }
  if (protocol.birds.length === 0) {
    errors.push('Lista startowa nie zawiera żadnych ptaków.');
  }

  const ringSeen = new Set<string>();
  protocol.birds.forEach((b) => {
    const cleanRing = b.ringNumber.trim().toUpperCase();
    if (!cleanRing) {
      errors.push(`Ptak na pozycji ${b.ordinal} nie posiada numeru obrączki.`);
    } else if (ringSeen.has(cleanRing)) {
      duplicateRings.push(cleanRing);
    } else {
      ringSeen.add(cleanRing);
    }

    if (!b.chipId || b.chipId.trim().length === 0) {
      missingChips.push(cleanRing || `Poz. ${b.ordinal}`);
    }
  });

  if (duplicateRings.length > 0) {
    errors.push(`Wykryto zduplikowane obrączki rodowe: ${duplicateRings.join(', ')}.`);
  }

  if (missingChips.length > 0) {
    warnings.push(`Brak przypisanego chipa elektronicznego dla ${missingChips.length} ptaków: ${missingChips.slice(0, 5).join(', ')}${missingChips.length > 5 ? '...' : ''}.`);
  }

  return {
    isValid: errors.length === 0,
    duplicateRings,
    missingChips,
    errors,
    warnings,
  };
}

/**
 * Generuje oficjalny arkusz A4 HTML Listy Startowo-Zegarowej PZHGP
 */
export function generateBasketingProtocolHtml(protocol: BasketingProtocol): string {
  const summary = summarizeBasketingProtocol(protocol);
  const now = new Date();
  const printTimestamp = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('pl-PL')}`;

  const rowsHtml = protocol.birds
    .map(
      (b) => `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 35px;">${b.ordinal}</td>
        <td style="font-family: monospace; font-weight: bold; font-size: 11pt; padding-left: 8px;">${b.ringNumber}</td>
        <td style="text-align: center; font-weight: bold; width: 45px;">${formatSexPzhgp(b.sex)}</td>
        <td style="text-align: center; width: 60px;">${b.color || '---'}</td>
        <td style="text-align: center; font-family: monospace; font-size: 9pt; width: 85px;">${b.chipId || '<span style="color: #999;">BRAK</span>'}</td>
        <td style="text-align: center; width: 50px; font-weight: bold;">${b.crateNumber ? `K-${b.crateNumber}` : '---'}</td>
        <td style="text-align: center; width: 45px; font-weight: bold; color: ${b.isDesignated ? '#000' : '#888'};">
          ${b.isDesignated ? 'T' : '-'}
        </td>
        <td style="font-size: 8pt; color: #555; padding-left: 6px;">${b.pedigreeNote || ''}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Lista Startowo-Zegarowa PZHGP — Lot ${protocol.raceNumber} ${protocol.raceName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.25;
      background: #FFFFFF;
    }
    .header-box {
      border: 2px solid #000000;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .main-title {
      font-size: 14pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sub-title {
      font-size: 10pt;
      font-weight: bold;
      color: #333333;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 20px;
      row-gap: 3px;
      font-size: 9pt;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
    }
    .meta-label {
      font-weight: bold;
      color: #444444;
    }
    .meta-value {
      font-weight: bold;
    }
    table.birds-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 8px;
    }
    table.birds-table th {
      border: 1.5px solid #000000;
      background-color: #E5E7EB;
      font-size: 8.5pt;
      font-weight: bold;
      padding: 4px 2px;
      text-align: center;
      text-transform: uppercase;
    }
    table.birds-table td {
      border: 1px solid #777777;
      padding: 3px 2px;
      vertical-align: middle;
      font-size: 8.5pt;
    }
    table.birds-table tr:nth-child(even) {
      background-color: #F9FAFB;
    }
    .summary-box {
      border: 1.5px solid #000000;
      background-color: #F3F4F6;
      padding: 8px 12px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5pt;
      font-weight: bold;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      column-gap: 15px;
      margin-top: 20px;
    }
    .signature-card {
      border-top: 1px dashed #000000;
      padding-top: 4px;
      text-align: center;
      font-size: 8pt;
    }
    .footer-note {
      margin-top: 15px;
      text-align: right;
      font-size: 7.5pt;
      color: #666666;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div class="title-row">
      <div>
        <div class="main-title">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
        <div class="sub-title">LISTA STARTOWO-ZEGAROWA (PROTOKÓŁ WKŁADANIA DO KOSZA)</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11pt; font-weight: bold;">LOT NR ${protocol.raceNumber}</div>
        <div style="font-size: 9pt; font-weight: bold; color: #333;">${protocol.basketingDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Oddział PZHGP:</span>
        <span class="meta-value">${protocol.branchCodeAndName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Hodowca:</span>
        <span class="meta-value">${protocol.breederName} (Nr: ${protocol.breederCode})</span>
      </div>

      <div class="meta-item">
        <span class="meta-label">Sekcja:</span>
        <span class="meta-value">${protocol.sectionCodeAndName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Współrzędne gołębnika:</span>
        <span class="meta-value">${protocol.loftCoordinates}</span>
      </div>

      <div class="meta-item">
        <span class="meta-label">Miejscowość lotu:</span>
        <span class="meta-value">${protocol.raceName} (Dystans: ${protocol.flightDistanceKm.toFixed(1)} km)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">System zegarowy ESK:</span>
        <span class="meta-value">${protocol.eskSystem}</span>
      </div>

      <div class="meta-item">
        <span class="meta-label">Punkt wkładań:</span>
        <span class="meta-value">${protocol.basketingPoint}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Godzina koszowania:</span>
        <span class="meta-value">${protocol.basketingTime || '--:--'}</span>
      </div>
    </div>
  </div>

  <table class="birds-table">
    <thead>
      <tr>
        <th>Lp.</th>
        <th>Numer Obrączki Rodowej</th>
        <th>Płeć</th>
        <th>Barwa</th>
        <th>Chip ESK</th>
        <th>Klatka</th>
        <th>Seria</th>
        <th>Uwagi / Rodowód</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="summary-box">
    <div>RAZEM WKŁADANYCH: <u>${summary.totalBirds} szt.</u></div>
    <div>SAMCE (1.0): <u>${summary.cocksCount}</u></div>
    <div>SAMICE (0.1): <u>${summary.hensCount}</u></div>
    <div>SERIA TYPOWANA (T): <u>${summary.designatedCount}</u></div>
    <div>KLATKI / KOSZE: <u>${summary.cratesCount}</u></div>
  </div>

  <div class="signatures-grid">
    <div class="signature-card">
      Podpis Hodowcy<br />
      (Zgodność deklaracji)
    </div>
    <div class="signature-card">
      Przewodniczący Komisji Wkładaniowej<br />
      (Weryfikacja zegara i chipów)
    </div>
    <div class="signature-card">
      Członek Komisji Wkładaniowej / Pieczęć<br />
      (Zapieczętowanie klatek)
    </div>
  </div>

  <div class="footer-note">
    Pigeon-Fly Mobile • Oficjalny protokół startowy wygenerowany: ${printTimestamp} • Urzędowa zgodność z Regulaminem Lotowo-Zegarowym PZHGP / FCI
  </div>

</body>
</html>
  `;
}

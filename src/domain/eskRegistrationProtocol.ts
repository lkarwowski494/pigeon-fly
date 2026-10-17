/**
 * PIGEON-FLY — Electronic Clock & Antenna Registration Protocol (Z-084 / DEC-98)
 * Official PZHGP Electronic Clocking System (ESK) Verification & Loft Registration Protocol:
 * - Regulates electronic clocks: Tauris, Benzing, Bricon, Mega, Tipes, Unikon.
 * - Base station serials, terminal serials, GPS/DCF-77 time synchronization.
 * - Multi-field antenna pads (1, 2, 4, 6-field) sensitivity test (min >= 5 cm required by PZHGP).
 * - Official tamper seals (plomby legalizacyjne) and Clocking Commission signatures.
 */

export type EskSystemBrand = 'Tauris' | 'Benzing' | 'Bricon' | 'Mega' | 'Tipes' | 'Unikon';

export interface EskAntennaPad {
  id: string;
  antennaNumber: number;
  padModel: string;
  serialNumber: string;
  fieldCount: 1 | 2 | 4 | 6;
  entranceLocation: string; // np. "Wylot Wdowcy", "Wylot Samice", "Wylot Młode"
  cableLengthMeters: number;
  sensitivityDistanceCm: number; // PZHGP min: 5.0 cm
  sensitivityTestPassed: boolean;
}

export interface EskTamperSeal {
  id: string;
  sealNumber: string;
  sealLocation: string; // np. "Gniazdo magistrali stacji matki", "Obudowa rozdzielacza anten"
  installedDate: string;
}

export interface EskRegistrationData {
  protocolNumber: string;
  verificationDate: string;
  seasonYear: number;
  // Breeder details
  breederName: string;
  breederPzhgpNumber: string; // np. "PL-0284-1420"
  branchName: string; // np. "0284 Nowy Tomyśl"
  sectionName: string; // np. "Sekcja 01 Zbąszyń"
  loftAddress: string;
  loftLatitude: number;
  loftLongitude: number;
  // Hardware specifications
  systemBrand: EskSystemBrand;
  baseStationSerial: string;
  terminalSerial: string;
  softwareVersion: string;
  backupBatteryWorking: boolean;
  timeSyncSource: 'GPS' | 'DCF-77' | 'Internal';
  // Antennas and seals
  antennas: EskAntennaPad[];
  tamperSeals: EskTamperSeal[];
  // Commission members
  commissionMember1: string;
  commissionMember2: string;
  commissionPresident: string;
  commissionNotes?: string;
}

export interface EskValidationResult {
  isCompliant: boolean;
  errors: string[];
  warnings: string[];
  totalAntennaFields: number;
  allAntennasPassedSensitivity: boolean;
}

/**
 * Validates ESK registration conformity against PZHGP competition standards.
 */
export function validateEskRegistration(data: EskRegistrationData): EskValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.breederName.trim()) {
    errors.push('Brak imienia i nazwiska hodowcy.');
  }
  if (!data.breederPzhgpNumber.trim()) {
    errors.push('Brak numeru ewidencyjnego PZHGP hodowcy.');
  }
  if (!data.baseStationSerial.trim()) {
    errors.push('Brak numeru fabrycznego stacji matki (bazy) ESK.');
  }
  if (data.antennas.length === 0) {
    errors.push('Nie zgłoszono żadnej anteny wlotowej ESK.');
  }

  let totalAntennaFields = 0;
  let allAntennasPassedSensitivity = true;

  data.antennas.forEach((ant) => {
    totalAntennaFields += ant.fieldCount;
    if (ant.sensitivityDistanceCm < 5.0 || !ant.sensitivityTestPassed) {
      allAntennasPassedSensitivity = false;
      errors.push(
        `Antena nr ${ant.antennaNumber} (${ant.padModel}) nie spełnia normy czułości PZHGP (min. 5.0 cm, zmierzono ${ant.sensitivityDistanceCm} cm).`
      );
    }
    if (!ant.serialNumber.trim()) {
      errors.push(`Antena nr ${ant.antennaNumber} nie posiada zapisanego numeru seryjnego.`);
    }
  });

  if (data.tamperSeals.length === 0) {
    warnings.push('Brak zarejestrowanych numerów plomb legalizacyjnych.');
  }

  if (!data.backupBatteryWorking) {
    warnings.push(
      'Brak sprawnego zasilania akumulatorowego 12V — ryzyko utraty rejestracji przy braku zasilania sieciowego 230V!'
    );
  }

  if (!data.commissionMember1.trim() || !data.commissionMember2.trim()) {
    errors.push('Protokół wymaga zatwierdzenia przez co najmniej 2 członków Komisji Zegarowej.');
  }

  return {
    isCompliant: errors.length === 0,
    errors,
    warnings,
    totalAntennaFields,
    allAntennasPassedSensitivity,
  };
}

/**
 * Generates official PZHGP A4 printable Electronic Clocking System (ESK) verification protocol.
 */
export function generateEskRegistrationProtocolHtml(data: EskRegistrationData): string {
  const validation = validateEskRegistration(data);

  const antennasHtml = data.antennas
    .map(
      (ant) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">${ant.antennaNumber}</td>
      <td>${ant.padModel}</td>
      <td style="font-family: monospace; font-size: 8pt;">${ant.serialNumber}</td>
      <td style="text-align: center;">${ant.fieldCount}-polowa</td>
      <td>${ant.entranceLocation}</td>
      <td style="text-align: center;">${ant.cableLengthMeters} m</td>
      <td style="text-align: center; font-weight: 700; color: ${ant.sensitivityTestPassed ? '#166534' : '#991b1b'};">
        ${ant.sensitivityDistanceCm.toFixed(1)} cm (${ant.sensitivityTestPassed ? 'POZYTYWNY' : 'NEGATYWNY'})
      </td>
    </tr>
  `
    )
    .join('');

  const sealsHtml = data.tamperSeals
    .map(
      (seal, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
      <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${seal.sealNumber}</td>
      <td>${seal.sealLocation}</td>
      <td style="text-align: center;">${seal.installedDate}</td>
    </tr>
  `
    )
    .join('');

  const statusColor = validation.isCompliant ? '#15803d' : '#b91c1c';
  const statusLabel = validation.isCompliant
    ? 'SYSTEM ZWERYFIKOWANY — ZATWIERDZONY DO SEZONU'
    : 'SYSTEM NIEZATWIERDZONY — WYMAGA USUNIĘCIA USTEREK';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Protokół Weryfikacji ESK — ${data.breederName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.3;
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
    .pzhgp-title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .pzhgp-subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta-col { text-align: right; font-size: 8pt; color: #334155; }
    
    .status-banner {
      border: 1.5px solid ${statusColor};
      background: #f8fafc;
      border-radius: 5px;
      padding: 8px 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-text { font-size: 9.5pt; font-weight: 900; color: ${statusColor}; }
    .status-sub { font-size: 8pt; color: #475569; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-heading {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { font-weight: 700; color: #0f172a; text-align: right; }

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

    .notes-box {
      border-left: 3px solid #0284c7;
      background: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #334155;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 18px;
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
      <div class="pzhgp-title">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
      <div class="pzhgp-subtitle">Protokół Zgłoszenia i Weryfikacji Stacji Zegarowej ESK (Z-084)</div>
    </div>
    <div class="meta-col">
      <div>Oddział: <strong>${data.branchName}</strong></div>
      <div>Sekcja: <strong>${data.sectionName}</strong></div>
      <div>Protokół nr: <strong>${data.protocolNumber}</strong></div>
      <div>Data: <strong>${data.verificationDate}</strong></div>
    </div>
  </div>

  <div class="status-banner">
    <div>
      <div class="status-text">${statusLabel}</div>
      <div class="status-sub">
        Zgodność z Regulaminem Lotowo-Zegarowym PZHGP na Sezon ${data.seasonYear}
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 8pt; color: #64748b;">Pola antenowe:</span>
      <strong style="font-size: 10pt; color: #0f172a;"> ${validation.totalAntennaFields} pól</strong>
    </div>
  </div>

  <div class="grid-2">
    <!-- Hodowca i Gołębnik -->
    <div class="info-card">
      <div class="card-heading">DANE HODOWCY I WSPÓŁRZĘDNE GOŁĘBNIKA</div>
      <div class="info-row">
        <span class="info-label">Imię i Nazwisko:</span>
        <span class="info-val">${data.breederName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nr ewidencyjny PZHGP:</span>
        <span class="info-val">${data.breederPzhgpNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Adres gołębnika:</span>
        <span class="info-val">${data.loftAddress}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Współrzędne GPS (WGS-84):</span>
        <span class="info-val">${data.loftLatitude.toFixed(6)}°N, ${data.loftLongitude.toFixed(6)}°E</span>
      </div>
    </div>

    <!-- Sprzęt ESK -->
    <div class="info-card">
      <div class="card-heading">SPECYFIKACJA SYSTEMU ELEKTRONICZNEGO</div>
      <div class="info-row">
        <span class="info-label">System ESK / Marka:</span>
        <span class="info-val" style="color: #0284c7;">${data.systemBrand}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nr fabryczny bazy (stacji):</span>
        <span class="info-val" style="font-family: monospace;">${data.baseStationSerial}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nr seryjny zegara (zegar):</span>
        <span class="info-val" style="font-family: monospace;">${data.terminalSerial}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Wersja oprogramowania:</span>
        <span class="info-val">${data.softwareVersion}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Synchronizacja czasu / Bateria:</span>
        <span class="info-val">${data.timeSyncSource} • ${data.backupBatteryWorking ? 'Akumulator 12V OK' : 'BRAK AKUMULATORA'}</span>
      </div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">WYKAZ ZAREJESTROWANYCH ANTEN WLOTOWYCH ESK:</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">Nr</th>
        <th>Model Anteny</th>
        <th>Nr Seryjny</th>
        <th style="text-align: center;">Konfiguracja</th>
        <th>Lokalizacja Wylotu</th>
        <th style="text-align: center;">Przewód</th>
        <th style="text-align: center;">Test Czułości (min. 5 cm)</th>
      </tr>
    </thead>
    <tbody>
      ${antennasHtml}
    </tbody>
  </table>

  ${
    data.tamperSeals.length > 0
      ? `
  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">PLOMBY LEGALIZACYJNE KOMISJI ZEGAROWEJ:</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">Lp</th>
        <th>Numer Plomby</th>
        <th>Miejsce Zaplombowania</th>
        <th style="text-align: center;">Data Zaplombowania</th>
      </tr>
    </thead>
    <tbody>
      ${sealsHtml}
    </tbody>
  </table>
  `
      : ''
  }

  ${
    data.commissionNotes
      ? `
  <div class="notes-box">
    <strong>Uwagi i Zalecenia Komisji Zegarowej:</strong> ${data.commissionNotes}
  </div>
  `
      : ''
  }

  <div style="font-size: 7.5pt; color: #475569; margin-top: 8px;">
    Hodowca oświadcza, że zapoznał się z Regulaminem Lotowo-Zegarowym PZHGP i zobowiązuje się do nienaruszania 
    plomb zabezpieczających oraz instalacji antenowej. Każda zmiana położenia anten lub wymiana komponentów 
    wymaga ponownego sporządzenia protokołu przez Komisję Zegarową Sekcji/Oddziału.
  </div>

  <div class="signatures-grid">
    <div class="sig-col">
      <div class="sig-title">Hodowca</div>
      <div class="sig-name">${data.breederName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Członek Komisji Zegarowej</div>
      <div class="sig-name">${data.commissionMember1}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Przewodniczący Komisji / Członek 2</div>
      <div class="sig-name">${data.commissionPresident || data.commissionMember2}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Rejestracji ESK PZHGP Z-084</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}

/**
 * PIGEON-FLY — Protokół Komisyjnego Otwarcia Zegarów i Kontroli Odchyłki Chodu (Clock Opening Audit Protocol)
 * Zgodność z Regulaminem Lotowo-Zegarowym PZHGP:
 * - Urzędowe otwarcie zegarów tradycyjnych (bębnowych) i elektronicznych stacji ESK po locie.
 * - Kontrola nienaruszalności plomb legalizacyjnych i numerów plomb nałożonych przy koszowaniu.
 * - Obliczenie i weryfikacja odchyłki chodu zegara (dopuszczalna norma PZHGP: do 2 s / 24h).
 * - Weryfikacja sumy kontrolnej (checksum) bazy przylotów terminala ESK przeciw manipulacji.
 * - Orzeczenie komisji zegarowej i generator A4 Protokołu Otwarcia z podpisami 3 członków komisji.
 */

export type ClockSystemType = 'esk_electronic' | 'mechanical_drum';

export const CLOCK_SYSTEM_LABELS: Record<ClockSystemType, string> = {
  esk_electronic: 'Elektroniczny System Konstatowania (ESK — Tauris, Benzing, Bricon, Mega)',
  mechanical_drum: 'Mechaniczny zegar tradycyjny (bęben, taśma papierowa i gumki)',
};

export type ClockDriftStatus =
  | 'normal_within_tolerance'
  | 'drift_corrected'
  | 'disqualified_excessive_drift';

export const DRIFT_STATUS_LABELS: Record<ClockDriftStatus, string> = {
  normal_within_tolerance: 'Odchyłka w normie (≤ ±2 s/24h) — czas bez korekty',
  drift_corrected: 'Odchyłka dopuszczalna (> 2 s i ≤ 10 s) — wprowadzono urzędową korektę liniową',
  disqualified_excessive_drift: 'Odchyłka niedopuszczalna (> 10 s lub zatrzymanie) — zegar unieważniony',
};

export type CommissionVerdict =
  | 'approved'
  | 'approved_with_drift_correction'
  | 'rejected_seal_broken'
  | 'rejected_desync_or_fraud';

export const VERDICT_LABELS: Record<CommissionVerdict, string> = {
  approved: 'ZATWIERDZONY BEZ ZASTRZEŻEŃ — Przekazano do obliczeń konkursowych',
  approved_with_drift_correction: 'ZATWIERDZONY WARUNKOWO Z KOREKTĄ ODCHYŁKI CHODU',
  rejected_seal_broken: 'DYSKWALIFIKACJA — Zerwana lub naruszona plomba legalizacyjna',
  rejected_desync_or_fraud: 'DYSKWALIFIKACJA — Przekroczenie limitu odchyłki / błąd sumy kontrolnej',
};

export interface ClockOpeningAuditProtocol {
  id: string;
  protocolNumber: string; // np. 'OTWARCIE-2026/0284/01'
  raceName: string;
  raceDate: string; // YYYY-MM-DD
  openingDate: string; // YYYY-MM-DD
  openingTime: string; // HH:mm
  stationName: string; // np. 'Punkt Zegarowy Sekcja 02 Poniec'
  branchName: string; // np. 'Oddział 0284 Gostyń'
  sectionName: string;
  breederName: string;
  breederPzhgpNumber: string;
  clockSystemType: ClockSystemType;
  clockDeviceModel: string; // np. 'Benzing M1' / 'Tauris World' / 'Benzing Paloma'
  clockDeviceSerial: string;
  sealSerialNumber: string;
  tamperSealIntact: boolean;
  driftSeconds: number; // np. +1.4 s
  driftStatus: ClockDriftStatus;
  isTwoDayRace: boolean;
  eskSyncSource: 'gps' | 'dcf77' | 'quartz_internal' | 'none';
  totalArrivalsRecorded: number;
  firstArrivalTime?: string; // HH:mm:ss
  firstArrivalRing?: string;
  lastArrivalTime?: string; // HH:mm:ss
  checksumHash?: string; // np. 'SHA256:8f4a129...'
  verdict: CommissionVerdict;
  committeePresident: string;
  committeeMember1: string;
  committeeMember2: string;
  notes?: string;
}

export interface ClockAuditValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Ustala status odchyłki chodu zegara zgodnie z regulaminem PZHGP.
 */
export function determineDriftStatus(
  driftSeconds: number,
  isTwoDayRace: boolean = false
): ClockDriftStatus {
  const absDrift = Math.abs(driftSeconds);
  const maxTolerance = isTwoDayRace ? 4.0 : 2.0;
  const maxAllowableWithCorrection = isTwoDayRace ? 15.0 : 10.0;

  if (absDrift <= maxTolerance) {
    return 'normal_within_tolerance';
  } else if (absDrift <= maxAllowableWithCorrection) {
    return 'drift_corrected';
  } else {
    return 'disqualified_excessive_drift';
  }
}

/**
 * Waliduje formalną poprawność protokołu komisyjnego otwarcia zegarów.
 */
export function validateClockOpeningProtocol(
  protocol: ClockOpeningAuditProtocol
): ClockAuditValidationResult {
  const errors: string[] = [];

  if (!protocol.protocolNumber || protocol.protocolNumber.trim().length < 3) {
    errors.push('Wymagany jest numer protokołu otwarcia zegarów.');
  }

  if (!protocol.raceName || protocol.raceName.trim().length < 3) {
    errors.push('Wymagana jest nazwa lotu konkursowego.');
  }

  if (!protocol.breederName || protocol.breederName.trim().length < 3) {
    errors.push('Wymagane jest nazwisko hodowcy otwierającego zegar.');
  }

  if (!protocol.clockDeviceSerial || protocol.clockDeviceSerial.trim().length < 2) {
    errors.push('Wymagany jest numer fabryczny zegara / bazy.');
  }

  if (!protocol.sealSerialNumber || protocol.sealSerialNumber.trim().length < 2) {
    errors.push('Wymagany jest numer seryjny plomby zabezpieczającej.');
  }

  // Wymóg 3 członków komisji zegarowej
  if (!protocol.committeePresident || protocol.committeePresident.trim().length < 3) {
    errors.push('Wymagane jest nazwisko Przewodniczącego Komisji Zegarowej.');
  }

  if (!protocol.committeeMember1 || protocol.committeeMember1.trim().length < 3) {
    errors.push('Wymagane jest nazwisko pierwszego członka Komisji Zegarowej.');
  }

  if (!protocol.committeeMember2 || protocol.committeeMember2.trim().length < 3) {
    errors.push('Wymagane jest nazwisko drugiego członka Komisji Zegarowej / Rachmistrza.');
  }

  // Integralność plomb
  if (!protocol.tamperSealIntact) {
    if (protocol.verdict === 'approved' || protocol.verdict === 'approved_with_drift_correction') {
      errors.push('Niedopuszczalne zatwierdzenie zegara przy naruszonej lub zerwanej plombie!');
    }
  }

  // Sprawdzenie odchyłki dyskwalifikującej
  if (protocol.driftStatus === 'disqualified_excessive_drift') {
    if (protocol.verdict === 'approved' || protocol.verdict === 'approved_with_drift_correction') {
      errors.push('Zegar z niedopuszczalną odchyłką chodu (>10 s) nie może zostać zatwierdzony.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generuje urzędowy dokument A4 HTML Protokołu Otwarcia Zegarów i Zgrania ESK.
 */
export function generateClockOpeningAuditHtml(protocol: ClockOpeningAuditProtocol): string {
  const isApproved =
    protocol.verdict === 'approved' || protocol.verdict === 'approved_with_drift_correction';

  const verdictBg =
    protocol.verdict === 'approved'
      ? '#059669'
      : protocol.verdict === 'approved_with_drift_correction'
      ? '#d97706'
      : '#dc2626';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Otwarcia Zegarów - ${protocol.protocolNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #0f172a;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .verdict-banner {
      background-color: ${verdictBg};
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
      font-weight: 900;
      font-size: 11pt;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
    }
    .title-main {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      text-align: center;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .title-sub {
      font-size: 9pt;
      font-weight: bold;
      color: #475569;
      text-align: center;
    }
    .section-card {
      border: 1px solid #0f172a;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 10px;
      background-color: #f8fafc;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
    }
    .grid-table td {
      padding: 3px 4px;
      font-size: 8.5pt;
    }
    .label {
      font-weight: bold;
      color: #475569;
    }
    .val {
      font-weight: bold;
      color: #0f172a;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .sig-cell {
      width: 25%;
      text-align: center;
      vertical-align: top;
      padding: 0 4px;
    }
    .sig-line {
      border-bottom: 1px dashed #0f172a;
      height: 38px;
      margin-bottom: 4px;
    }
    .sig-desc {
      font-size: 7.5pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <div class="verdict-banner">
    ${VERDICT_LABELS[protocol.verdict]}
  </div>

  <table class="header-table">
    <tr>
      <td style="width: 25%;">
        <div style="font-weight: 900; font-size: 9pt; color: #1e3a8a;">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
        <div style="font-size: 8pt; color: #475569;">${protocol.branchName} • ${protocol.sectionName}</div>
      </td>
      <td style="width: 50%; text-align: center;">
        <div class="title-main">PROTOKÓŁ KOMISYJNEGO OTWARCIA ZEGARÓW</div>
        <div class="title-sub">Weryfikacja Odchyłki Chodu, Plomb i Zgrania Danych z Terminala ESK</div>
      </td>
      <td style="width: 25%; text-align: right;">
        <div style="font-size: 8pt; font-weight: bold;">Nr Protokołu:</div>
        <div style="font-size: 9.5pt; font-weight: 900; font-family: monospace;">${protocol.protocolNumber}</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">Data otwarcia: ${protocol.openingDate} ${protocol.openingTime}</div>
      </td>
    </tr>
  </table>

  <!-- 1. IDENTYFIKACJA LOTU I HODOWCY -->
  <div class="section-card">
    <div class="section-title">1. Identyfikacja Lotu Konkursowego i Hodowcy</div>
    <table class="grid-table">
      <tr>
        <td style="width: 18%;" class="label">Nazwa Lotu:</td>
        <td style="width: 32%;" class="val">${protocol.raceName} (${protocol.raceDate})</td>
        <td style="width: 18%;" class="label">Punkt Zegarowy:</td>
        <td style="width: 32%;" class="val">${protocol.stationName}</td>
      </tr>
      <tr>
        <td class="label">Hodowca:</td>
        <td class="val">${protocol.breederName}</td>
        <td class="label">Nr Członkowski:</td>
        <td class="val">${protocol.breederPzhgpNumber}</td>
      </tr>
    </table>
  </div>

  <!-- 2. AUDYT TECHNICZNY ZEGARA, PLOMB I ODCHYŁKI -->
  <div class="section-card">
    <div class="section-title">2. Audyt Zegara, Nienaruszalności Plomb i Odchyłki Chodu</div>
    <table class="grid-table">
      <tr>
        <td style="width: 22%;" class="label">System / Model:</td>
        <td style="width: 28%;" class="val">${protocol.clockDeviceModel} (${protocol.clockSystemType === 'esk_electronic' ? 'ESK' : 'Mechaniczny'})</td>
        <td style="width: 22%;" class="label">Nr seryjny urządzenia:</td>
        <td style="width: 28%;" class="val" style="font-family: monospace;">${protocol.clockDeviceSerial}</td>
      </tr>
      <tr>
        <td class="label">Nr plomby wkładaniowej:</td>
        <td class="val" style="font-family: monospace;">${protocol.sealSerialNumber}</td>
        <td class="label">Stan plomby:</td>
        <td class="val" style="color: ${protocol.tamperSealIntact ? '#059669' : '#dc2626'};">
          ${protocol.tamperSealIntact ? '✓ NIENARUSZONA (Zgodna z protokołem wkładaniowym)' : '✗ NARUSZONA / ZERWANA (DYSKWALIFIKACJA)'}
        </td>
      </tr>
      <tr>
        <td class="label">Odchyłka chodu:</td>
        <td class="val" style="font-size: 10pt; color: ${Math.abs(protocol.driftSeconds) <= 2.0 ? '#059669' : '#dc2626'};">
          ${protocol.driftSeconds > 0 ? `+${protocol.driftSeconds}` : protocol.driftSeconds} s
        </td>
        <td class="label">Ocena odchyłki PZHGP:</td>
        <td class="val">${DRIFT_STATUS_LABELS[protocol.driftStatus]}</td>
      </tr>
      ${
        protocol.clockSystemType === 'esk_electronic'
          ? `
      <tr>
        <td class="label">Źródło synchronizacji czasu:</td>
        <td class="val">${protocol.eskSyncSource === 'gps' ? 'GPS Satelitarny' : protocol.eskSyncSource === 'dcf77' ? 'DCF-77 Radiowy' : 'Kwarc wewnętrzny'}</td>
        <td class="label">Suma kontrolna bazy:</td>
        <td class="val" style="font-family: monospace; font-size: 7.5pt;">${protocol.checksumHash || 'Brak SHA-256'}</td>
      </tr>
      `
          : ''
      }
    </table>
  </div>

  <!-- 3. DANE ODBITYCH PRZYLOTÓW -->
  <div class="section-card">
    <div class="section-title">3. Zestawienie Zarejestrowanych Przylotów</div>
    <table class="grid-table">
      <tr>
        <td style="width: 25%;" class="label">Liczba odbitych gołębi:</td>
        <td style="width: 25%;" class="val" style="font-size: 11pt; color: #1e3a8a;">${protocol.totalArrivalsRecorded} szt.</td>
        <td style="width: 25%;" class="label">Pierwszy przylot:</td>
        <td style="width: 25%;" class="val">${protocol.firstArrivalTime || 'Brak'} (${protocol.firstArrivalRing || '—'})</td>
      </tr>
      <tr>
        <td class="label">Ostatni odbity przylot:</td>
        <td class="val">${protocol.lastArrivalTime || 'Brak'}</td>
        <td class="label">Status autoryzacji:</td>
        <td class="val" style="font-weight: 900; color: ${isApproved ? '#059669' : '#dc2626'};">
          ${isApproved ? 'DOPUSZCZONY DO LISTY' : 'ODRZUCONY'}
        </td>
      </tr>
      ${
        protocol.notes
          ? `
      <tr>
        <td class="label">Adnotacje komisji:</td>
        <td colspan="3" class="val" style="font-style: italic;">${protocol.notes}</td>
      </tr>
      `
          : ''
      }
    </table>
  </div>

  <!-- 4. PODPISY KOMISJI ZEGAROWEJ I HODOWCY -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Przewodniczący Komisji</div>
        <div class="sig-desc">${protocol.committeePresident}</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Członek Komisji 1</div>
        <div class="sig-desc">${protocol.committeeMember1}</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Członek 2 / Rachmistrz</div>
        <div class="sig-desc">${protocol.committeeMember2}</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Hodowca Otwierający</div>
        <div class="sig-desc">${protocol.breederName}</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * PIGEON-FLY — Protokół Awarii Kabiny Transportowej i Wypuszczenia Awaryjnego (Emergency Cabin Release Protocol)
 * Moduł zgodny z zaleceniami FCI Medical and Transport Commission oraz Regulaminem Transportu i Konwojowania PZHGP:
 * - Rejestr zdarzeń losowych w trasie: awaria agregatu wentylacyjnego, paraliż drogowy, skrajne załamanie pogody.
 * - Parametryzacja zoohigieniczna mikroklimatu kabiny (temperatura, wilgotność względna, zagęszczenie ptaków).
 * - Ścieżka autoryzacji decyzji kryzysowej (zjazd na punkt awaryjny, natychmiastowe wypuszczenie, powrót na kołach).
 * - Generator urzędowego A4 Protokołu Powypadkowego / Zrzutu Awaryjnego z podpisami konwojentów i Zarządu Oddziału.
 */

export type CabinIncidentType =
  | 'ventilation_failure'
  | 'vehicle_breakdown'
  | 'traffic_blockade'
  | 'extreme_weather'
  | 'watering_system_defect';

export const INCIDENT_TYPE_LABELS: Record<CabinIncidentType, string> = {
  ventilation_failure: 'Awaria agregatu wentylacji mechanicznej (krytyczne)',
  vehicle_breakdown: 'Poważna awaria pojazdu / zawieszenia / ogumienia kabiny',
  traffic_blockade: 'Wielogodzinny zator / blokada autostrady / zamknięcie drogi',
  extreme_weather: 'Nawałnica / gradobicie / niska podstawa chmur uniemożliwiająca lot',
  watering_system_defect: 'Rozszczelnienie lub awaria instalacji pojenia korytkowego',
};

export type EmergencyActionTaken =
  | 'emergency_release_in_transit'
  | 'return_to_base_with_birds'
  | 'divert_to_alternate_release_point'
  | 'temporary_holding_with_repair';

export const ACTION_TAKEN_LABELS: Record<EmergencyActionTaken, string> = {
  emergency_release_in_transit: 'Natychmiastowe wypuszczenie awaryjne ze względów dobrostanu stada',
  return_to_base_with_birds: 'Zawrócenie kabiny z ptakami do Oddziału macierzystego',
  divert_to_alternate_release_point: 'Zjazd na alternatywny, bezpieczny punkt wypuszczenia',
  temporary_holding_with_repair: 'Awaryjny postój w cieniu, wymuszone wietrzenie i doraźna naprawa',
};

export type IncidentSeverity = 'critical' | 'high' | 'moderate';

export interface EmergencyCabinReleaseProtocol {
  id: string;
  protocolNumber: string; // np. 'AWARIA-2026/0284/01'
  raceName: string;
  branchName: string;
  plannedReleaseLocation: string;
  plannedReleaseDate: string; // YYYY-MM-DD
  incidentDate: string; // YYYY-MM-DD
  incidentTime: string; // HH:mm
  incidentType: CabinIncidentType;
  severity: IncidentSeverity;
  incidentLocationName: string; // np. 'A2 km 142 MOP Sosna'
  incidentGpsCoordinates: string; // np. '52°18\'44.2"N 17°22\'11.8"E'
  cabinTemperatureCelsius: number;
  cabinHumidityPercent: number;
  birdsCountInCabin: number;
  convoyer1Name: string;
  convoyer1Phone: string;
  convoyer2Name: string;
  convoyer2Phone: string;
  actionTaken: EmergencyActionTaken;
  emergencyReleaseTime?: string; // HH:mm
  authorizedByOfficerName: string;
  authorizedByOfficerRole: string; // np. 'Wiceprezes ds. Lotów Oddziału'
  authorizationMethod: 'phone' | 'radio' | 'in_person';
  authorizationTimestamp: string; // HH:mm
  incidentDescription: string;
  birdConditionSummary: string;
  lossCount: number;
  policeOrRoadServiceNotified: boolean;
  policeReportNumber?: string;
  notes?: string;
}

export interface EmergencyProtocolValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WelfareRiskAssessment {
  atRisk: boolean;
  riskScore: number; // 0 - 100
  riskLevel: 'safe' | 'warning' | 'critical';
  summary: string;
}

/**
 * Ocenia ryzyko uduszenia / zapaści termicznej stada na podstawie parametrów kabiny.
 */
export function assessWelfareRisk(
  protocol: Pick<
    EmergencyCabinReleaseProtocol,
    'cabinTemperatureCelsius' | 'cabinHumidityPercent' | 'incidentType' | 'actionTaken'
  >
): WelfareRiskAssessment {
  let score = 0;

  // Wpływ temperatury wewnętrznej
  if (protocol.cabinTemperatureCelsius >= 35) {
    score += 55;
  } else if (protocol.cabinTemperatureCelsius >= 30) {
    score += 35;
  } else if (protocol.cabinTemperatureCelsius >= 26) {
    score += 15;
  }

  // Wpływ wilgotności względnej (upośledzenie ziania odparowującego)
  if (protocol.cabinHumidityPercent >= 80) {
    score += 25;
  } else if (protocol.cabinHumidityPercent >= 70) {
    score += 15;
  }

  // Wpływ awarii wentylacji mechanicznej
  if (protocol.incidentType === 'ventilation_failure') {
    score += 30;
  }

  score = Math.min(100, score);

  let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let summary = 'Parametry mikroklimatu w kabinie mieszczą się w normie fizjologicznej.';

  if (score >= 70) {
    riskLevel = 'critical';
    summary =
      'KRYTYCZNE ZAGROŻENIE ŻYCIA STADA: Hipertermia i duszność. Wymagane natychmiastowe otwarcie żaluzji i/lub wypuszczenie awaryjne!';
  } else if (score >= 40) {
    riskLevel = 'warning';
    summary =
      'OSTRZEŻENIE DOBROSTANOWE: Podwyższona temperatura i wilgotność. Konieczne stałe monitorowanie zachowania ptaków i pojenie.';
  }

  return {
    atRisk: score >= 40,
    riskScore: score,
    riskLevel,
    summary,
  };
}

/**
 * Waliduje formalną poprawność protokołu awarii i wypuszczenia awaryjnego.
 */
export function validateEmergencyCabinProtocol(
  protocol: EmergencyCabinReleaseProtocol
): EmergencyProtocolValidationResult {
  const errors: string[] = [];

  if (!protocol.protocolNumber || protocol.protocolNumber.trim().length < 3) {
    errors.push('Wymagany jest numer ewidencyjny protokołu awarii.');
  }

  if (!protocol.raceName || protocol.raceName.trim().length < 3) {
    errors.push('Wymagana jest nazwa planowanego lotu konkursowego.');
  }

  if (!protocol.incidentLocationName || protocol.incidentLocationName.trim().length < 3) {
    errors.push('Wymagane jest dokładne określenie miejsca awarii / postoju (droga, km, MOP).');
  }

  if (!protocol.convoyer1Name || protocol.convoyer1Name.trim().length < 3) {
    errors.push('Wymagane jest imię i nazwisko Głównego Konwojenta.');
  }

  if (!protocol.convoyer1Phone || protocol.convoyer1Phone.trim().length < 6) {
    errors.push('Wymagany jest numer telefonu kontaktowego Głównego Konwojenta.');
  }

  if (!protocol.authorizedByOfficerName || protocol.authorizedByOfficerName.trim().length < 3) {
    errors.push('Wymagane jest nazwisko przedstawiciela Zarządu Oddziału autoryzującego działanie kryzysowe.');
  }

  if (protocol.actionTaken === 'emergency_release_in_transit') {
    if (!protocol.emergencyReleaseTime) {
      errors.push('Dla wypuszczenia awaryjnego wymagana jest dokładna godzina otwarcia zaworów/krat zrzutowych.');
    }
  }

  if (protocol.birdsCountInCabin <= 0) {
    errors.push('Liczba gołębi w kabinie musi być większa od zera.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generuje urzędowy dokument A4 HTML Protokołu Awarii i Wypuszczenia Awaryjnego.
 */
export function generateEmergencyCabinReleaseHtml(protocol: EmergencyCabinReleaseProtocol): string {
  const assessment = assessWelfareRisk(protocol);

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Awarii Kabiny - ${protocol.protocolNumber}</title>
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
    .alert-banner {
      background-color: #b91c1c;
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
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
      text-align: center;
      text-transform: uppercase;
      margin-bottom: 3px;
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
    .welfare-card {
      border: 1.5px solid ${assessment.riskLevel === 'critical' ? '#dc2626' : '#d97706'};
      background-color: ${assessment.riskLevel === 'critical' ? '#fef2f2' : '#fffbeb'};
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 10px;
    }
    .welfare-title {
      font-weight: 900;
      font-size: 9pt;
      color: ${assessment.riskLevel === 'critical' ? '#991b1b' : '#b45309'};
      margin-bottom: 4px;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .sig-cell {
      width: 33.3%;
      text-align: center;
      vertical-align: top;
      padding: 0 8px;
    }
    .sig-line {
      border-bottom: 1px dashed #0f172a;
      height: 40px;
      margin-bottom: 4px;
    }
    .sig-desc {
      font-size: 7.5pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <div class="alert-banner">
    PROTOKÓŁ ZDARZENIA NADZWYCZAJNEGO W TRANSPORCIE GOŁĘBI POCZTOWYCH
  </div>

  <table class="header-table">
    <tr>
      <td style="width: 25%;">
        <div style="font-weight: 900; font-size: 9pt; color: #1e3a8a;">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
        <div style="font-size: 8pt; color: #475569;">${protocol.branchName}</div>
      </td>
      <td style="width: 50%; text-align: center;">
        <div class="title-main">PROTOKÓŁ AWARII KABINY &amp; DZIAŁAŃ KRYZYSOWYCH</div>
        <div class="title-sub">Regulamin Konwojowania PZHGP / Dobrostan Zwierząt w Transporcie</div>
      </td>
      <td style="width: 25%; text-align: right;">
        <div style="font-size: 8pt; font-weight: bold;">Nr Protokołu:</div>
        <div style="font-size: 9.5pt; font-weight: 900; font-family: monospace;">${protocol.protocolNumber}</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">Data: ${protocol.incidentDate} ${protocol.incidentTime}</div>
      </td>
    </tr>
  </table>

  <!-- 1. DANE LOTU I ZDARZENIA -->
  <div class="section-card">
    <div class="section-title">1. Identyfikacja Lotu i Miejsce Wystąpienia Awarii</div>
    <table class="grid-table">
      <tr>
        <td style="width: 18%;" class="label">Nazwa Lotu:</td>
        <td style="width: 32%;" class="val">${protocol.raceName}</td>
        <td style="width: 18%;" class="label">Planowany Wypust:</td>
        <td style="width: 32%;" class="val">${protocol.plannedReleaseLocation} (${protocol.plannedReleaseDate})</td>
      </tr>
      <tr>
        <td class="label">Charakter Awarii:</td>
        <td class="val" style="color: #b91c1c;">${INCIDENT_TYPE_LABELS[protocol.incidentType]}</td>
        <td class="label">Poziom Zagrożenia:</td>
        <td class="val" style="text-transform: uppercase; color: ${protocol.severity === 'critical' ? '#dc2626' : '#d97706'};">${protocol.severity}</td>
      </tr>
      <tr>
        <td class="label">Miejsce Zdarzenia:</td>
        <td class="val">${protocol.incidentLocationName}</td>
        <td class="label">Koordynaty GPS:</td>
        <td class="val" style="font-family: monospace;">${protocol.incidentGpsCoordinates}</td>
      </tr>
      <tr>
        <td class="label">Liczba ptaków:</td>
        <td class="val">${protocol.birdsCountInCabin} szt.</td>
        <td class="label">Straty / Upadki:</td>
        <td class="val" style="color: ${protocol.lossCount > 0 ? '#dc2626' : '#0f172a'};">${protocol.lossCount} szt.</td>
      </tr>
    </table>
  </div>

  <!-- 2. AUDYT MIKROKLIMATU I DOBROSTANU -->
  <div class="welfare-card">
    <div class="welfare-title">2. Parametry Zoohigieniczne i Ocena Ryzyka Dobrostanowego (FCI)</div>
    <table class="grid-table">
      <tr>
        <td style="width: 25%;" class="label">Temperatura w kabinie:</td>
        <td style="width: 25%;" class="val" style="font-size: 10pt; color: ${protocol.cabinTemperatureCelsius >= 30 ? '#dc2626' : '#0f172a'};">
          ${protocol.cabinTemperatureCelsius}°C
        </td>
        <td style="width: 25%;" class="label">Wilgotność względna:</td>
        <td style="width: 25%;" class="val" style="font-size: 10pt;">${protocol.cabinHumidityPercent}%</td>
      </tr>
      <tr>
        <td class="label">Stan stada:</td>
        <td colspan="3" class="val">${protocol.birdConditionSummary}</td>
      </tr>
      <tr>
        <td class="label">Ocena ryzyka:</td>
        <td colspan="3" style="font-weight: bold; color: ${assessment.riskLevel === 'critical' ? '#b91c1c' : '#92400e'};">
          ${assessment.summary} (Indeks Zagrożenia: ${assessment.riskScore}/100)
        </td>
      </tr>
    </table>
  </div>

  <!-- 3. PODJĘTE DZIAŁANIA I AUTORYZACJA -->
  <div class="section-card">
    <div class="section-title">3. Podjęte Działania Kryzysowe i Autoryzacja Zarządu Oddziału</div>
    <table class="grid-table">
      <tr>
        <td style="width: 22%;" class="label">Decyzja Konwoju:</td>
        <td colspan="3" class="val" style="font-size: 9.5pt; color: #1e3a8a;">${ACTION_TAKEN_LABELS[protocol.actionTaken]}</td>
      </tr>
      ${
        protocol.emergencyReleaseTime
          ? `
      <tr>
        <td class="label">Godzina zrzutu:</td>
        <td class="val" style="color: #b91c1c; font-size: 10pt;">${protocol.emergencyReleaseTime} (Otwarcie wszystkich sekcji jednoczesne)</td>
        <td class="label">Powiadomiono służby:</td>
        <td class="val">${protocol.policeOrRoadServiceNotified ? `TAK (Notatka: ${protocol.policeReportNumber || 'Brak nr'})` : 'NIE'}</td>
      </tr>
      `
          : ''
      }
      <tr>
        <td class="label">Autoryzował:</td>
        <td class="val">${protocol.authorizedByOfficerName} (${protocol.authorizedByOfficerRole})</td>
        <td class="label">Sposób i Czas:</td>
        <td class="val">${protocol.authorizationMethod === 'phone' ? 'Telefonicznie' : protocol.authorizationMethod === 'radio' ? 'Radiotelefon' : 'Osobiście'} o godz. ${protocol.authorizationTimestamp}</td>
      </tr>
      <tr>
        <td class="label">Opis przebiegu:</td>
        <td colspan="3" class="val" style="font-style: italic;">${protocol.incidentDescription}</td>
      </tr>
    </table>
  </div>

  <!-- 4. OBSŁUGA KONWOJU I PODPISY -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Główny Konwojent</div>
        <div class="sig-desc">${protocol.convoyer1Name} (Tel: ${protocol.convoyer1Phone})</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Drugi Konwojent / Kierowca</div>
        <div class="sig-desc">${protocol.convoyer2Name} (Tel: ${protocol.convoyer2Phone})</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Komisja Lotowa Oddziału</div>
        <div class="sig-desc">${protocol.authorizedByOfficerName} (${protocol.authorizedByOfficerRole})</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

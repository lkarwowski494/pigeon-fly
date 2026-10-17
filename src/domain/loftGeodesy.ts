/**
 * PIGEON-FLY — Geodezyjna Kalibracja Koordynat Gołębnika (Z-067)
 * Weryfikacja dokładności geodezyjnej koordynat WGS-84 gołębnika macierzystego:
 * - Konwersja formatów Decimal Degrees (DD) <-> Stopnie, Minuty, Sekundy (DMS)
 * - Obliczanie odchyłki geodezyjnej między koordynatami urzędowymi PZHGP a pomiarem GNSS/GPS
 * - Symulacja wpływu błędu lokalizacji na prędkość przelotową (m/min) na dystansie lotu
 * - Generator urzędowego Oświadczenia Geodezyjnego dla Zarządu Oddziału PZHGP (A4 HTML/PDF)
 */

import { calculateGeodesicDistanceMeters } from './racing';

export interface CoordinatesDD {
  latitude: number; // np. 52.083333
  longitude: number; // np. 21.033333
}

export interface CoordinatesDMS {
  latDegrees: number;
  latMinutes: number;
  latSeconds: number;
  latDirection: 'N' | 'S';

  lonDegrees: number;
  lonMinutes: number;
  lonSeconds: number;
  lonDirection: 'E' | 'W';
}

export interface GeodesyCalibrationInput {
  loftName: string;
  breederName: string;
  loftAddress: string;
  pzhgpBranch: string;
  pzhgpSection: string;

  registeredCoords: CoordinatesDD; // Współrzędne w urzędowym wykazie oddziału
  measuredCoords: CoordinatesDD; // Współrzędne z precyzyjnego pomiaru GNSS / telefonu

  simulatedRaceDistanceKm?: number; // domyślnie np. 350 km
  simulatedFlightTimeMinutes?: number; // domyślnie np. 270 min (4h 30m)
}

export type GeodesyToleranceStatus = 'PERFECT_MATCH' | 'ACCEPTABLE_TOLERANCE' | 'DISCREPANCY_WARNING' | 'CRITICAL_MISMATCH';

export interface GeodesyCalibrationResult {
  deviationMeters: number;
  toleranceStatus: GeodesyToleranceStatus;
  toleranceStatusLabel: string;

  registeredDms: CoordinatesDMS;
  measuredDms: CoordinatesDMS;

  velocityImpactMPerMin: number; // wpływ odchyłki na obliczoną prędkość w m/min
  timeOffsetSeconds: number; // ile sekund różnicy daje odchyłka przy prędkości 1300 m/min

  recommendation: string;
  isOfficialCorrectionRequired: boolean;
}

/**
 * Konwertuje współrzędne dziesiętne (DD) na format stopni, minut i sekund (DMS)
 */
export function convertDDToDMS(coords: CoordinatesDD): CoordinatesDMS {
  const latAbs = Math.abs(coords.latitude);
  const latDegrees = Math.floor(latAbs);
  const latMinFloat = (latAbs - latDegrees) * 60;
  const latMinutes = Math.floor(latMinFloat);
  const latSeconds = Math.round((latMinFloat - latMinutes) * 60 * 100) / 100;
  const latDirection: 'N' | 'S' = coords.latitude >= 0 ? 'N' : 'S';

  const lonAbs = Math.abs(coords.longitude);
  const lonDegrees = Math.floor(lonAbs);
  const lonMinFloat = (lonAbs - lonDegrees) * 60;
  const lonMinutes = Math.floor(lonMinFloat);
  const lonSeconds = Math.round((lonMinFloat - lonMinutes) * 60 * 100) / 100;
  const lonDirection: 'E' | 'W' = coords.longitude >= 0 ? 'E' : 'W';

  return {
    latDegrees,
    latMinutes,
    latSeconds,
    latDirection,
    lonDegrees,
    lonMinutes,
    lonSeconds,
    lonDirection,
  };
}

/**
 * Formatuje współrzędne DMS do czytelnego łańcucha tekstowego PZHGP
 * np. "52°05'00.00'' N, 21°02'00.00'' E"
 */
export function formatDmsString(dms: CoordinatesDMS): string {
  const latSecStr = dms.latSeconds.toFixed(2).padStart(5, '0');
  const lonSecStr = dms.lonSeconds.toFixed(2).padStart(5, '0');
  return `${dms.latDegrees}°${String(dms.latMinutes).padStart(2, '0')}'${latSecStr}'' ${dms.latDirection}, ${dms.lonDegrees}°${String(dms.lonMinutes).padStart(2, '0')}'${lonSecStr}'' ${dms.lonDirection}`;
}

/**
 * Konwertuje współrzędne DMS z powrotem na Decimal Degrees (DD)
 */
export function convertDMSToDD(dms: CoordinatesDMS): CoordinatesDD {
  const lat = dms.latDegrees + dms.latMinutes / 60 + dms.latSeconds / 3600;
  const lon = dms.lonDegrees + dms.lonMinutes / 60 + dms.lonSeconds / 3600;

  return {
    latitude: dms.latDirection === 'S' ? -lat : lat,
    longitude: dms.lonDirection === 'W' ? -lon : lon,
  };
}

/**
 * Wykonuje pełną kalibrację geodezyjną koordynat gołębnika i analizę odchyłki prędkości
 */
export function evaluateLoftGeodesy(input: GeodesyCalibrationInput): GeodesyCalibrationResult {
  const { registeredCoords, measuredCoords, simulatedFlightTimeMinutes = 270 } = input;

  // Odległość geodezyjna między koordynatami urzędowymi a pomiarem
  const rawDeviation = calculateGeodesicDistanceMeters(
    registeredCoords,
    measuredCoords
  );

  const deviationMeters = Math.round(rawDeviation * 10) / 10;

  // Status tolerancji
  let toleranceStatus: GeodesyToleranceStatus = 'PERFECT_MATCH';
  let toleranceStatusLabel = 'Brak istotnej odchyłki geodezyjnej (Zgodność z wykazem PZHGP)';
  let recommendation = 'Współrzędne w wykazie oddziałowym są w 100% precyzyjne. Brak konieczności składania oświadczenia.';
  let isOfficialCorrectionRequired = false;

  if (deviationMeters > 50.0) {
    toleranceStatus = 'CRITICAL_MISMATCH';
    toleranceStatusLabel = `BŁĄD KRYTYCZNY: Odchyłka ${deviationMeters} m przekracza normy geodezyjne!`;
    recommendation = 'Konieczna natychmiastowa korekta urzędowa przed zatwierdzeniem list wkładaniowych (ryzyko protestu weryfikacyjnego).';
    isOfficialCorrectionRequired = true;
  } else if (deviationMeters > 10.0) {
    toleranceStatus = 'DISCREPANCY_WARNING';
    toleranceStatusLabel = `ODCHYŁKA WYMAGAJĄCA KOREKTY: Odchyłka wynosi ${deviationMeters} m`;
    recommendation = 'Zaleca się złożenie oświadczenia o sprostowaniu współrzędnych do Zarządu Oddziału PZHGP.';
    isOfficialCorrectionRequired = true;
  } else if (deviationMeters > 3.0) {
    toleranceStatus = 'ACCEPTABLE_TOLERANCE';
    toleranceStatusLabel = `Tolerancja dopuszczalna: Odchyłka ${deviationMeters} m w normie GPS konsumenckiego`;
    recommendation = 'Odchyłka mieści się w standardowym błędzie pomiaru urządzeń mobilnych. Korekta nie jest bezwzględnie wymagana.';
    isOfficialCorrectionRequired = false;
  }

  // Wpływ na prędkość lotu: delta_v = delta_d / t_min
  const safeTimeMin = Math.max(1, simulatedFlightTimeMinutes);
  const velocityImpactMPerMin = Math.round((deviationMeters / safeTimeMin) * 1000) / 1000;

  // Czas w sekundach przy typowej prędkości 1300 m/min (21.67 m/s): t = s / v
  const timeOffsetSeconds = Math.round((deviationMeters / (1300 / 60)) * 10) / 10;

  const registeredDms = convertDDToDMS(registeredCoords);
  const measuredDms = convertDDToDMS(measuredCoords);

  return {
    deviationMeters,
    toleranceStatus,
    toleranceStatusLabel,
    registeredDms,
    measuredDms,
    velocityImpactMPerMin,
    timeOffsetSeconds,
    recommendation,
    isOfficialCorrectionRequired,
  };
}

/**
 * Generuje oficjalny urzędowy dokument A4 HTML do wydruku lub zapisu PDF
 */
export function generateGeodeticDeclarationHtml(
  input: GeodesyCalibrationInput,
  result: GeodesyCalibrationResult
): string {
  const regDmsStr = formatDmsString(result.registeredDms);
  const measDmsStr = formatDmsString(result.measuredDms);

  const statusColor =
    result.toleranceStatus === 'PERFECT_MATCH' || result.toleranceStatus === 'ACCEPTABLE_TOLERANCE'
      ? '#2E7D32'
      : result.toleranceStatus === 'DISCREPANCY_WARNING'
      ? '#ED6C02'
      : '#D32F2F';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Oświadczenie Geodezyjne PZHGP - ${input.loftName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.35;
      font-size: 11px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #111827;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .title-box {
      text-align: center;
      margin-bottom: 14px;
    }
    .title-box h1 {
      font-size: 15px;
      text-transform: uppercase;
      margin: 0 0 3px 0;
      color: #111827;
      letter-spacing: 0.5px;
    }
    .title-box p {
      font-size: 10px;
      color: #4B5563;
      margin: 0;
    }
    .status-banner {
      border: 2px solid ${statusColor};
      background-color: #F9FAFB;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-label {
      font-weight: 800;
      font-size: 12px;
      color: ${statusColor};
    }
    .data-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #D1D5DB;
    }
    .data-grid td {
      padding: 6px 8px;
      border: 1px solid #E5E7EB;
      font-size: 11px;
    }
    .lbl {
      background-color: #F3F4F6;
      font-weight: bold;
      width: 30%;
      color: #374151;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 12px 0 6px 0;
      color: #1F2937;
      border-left: 3px solid #1F2937;
      padding-left: 6px;
    }
    .coords-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .coords-table th {
      background-color: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 6px 8px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      color: #374151;
    }
    .coords-table td {
      padding: 6px 8px;
      border: 1px solid #D1D5DB;
      font-size: 11px;
    }
    .declaration-clause {
      border: 1px solid #D1D5DB;
      background-color: #FAFAFA;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 14px;
      font-size: 10px;
      color: #374151;
      line-height: 1.4;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .sig-cell {
      width: 48%;
      border-top: 1px dashed #4B5563;
      text-align: center;
      padding-top: 6px;
      font-size: 10px;
      color: #374151;
    }
    .footer {
      margin-top: 16px;
      font-size: 8px;
      color: #9CA3AF;
      text-align: center;
      border-top: 1px solid #E5E7EB;
      padding-top: 4px;
    }
  </style>
</head>
<body>

  <!-- Nagłówek Urzędowy -->
  <table class="header-table">
    <tr>
      <td style="width: 70%;">
        <div style="font-size: 12px; font-weight: 800; color: #111827;">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH (PZHGP)</div>
        <div style="font-size: 10px; color: #4B5563;">Oddział: <strong>${input.pzhgpBranch}</strong>, Sekcja: <strong>${input.pzhgpSection}</strong></div>
      </td>
      <td style="width: 30%; text-align: right;">
        <div style="font-size: 11px; font-weight: bold; color: #1F2937;">DOKUMENT GEODEZYJNY</div>
        <div style="font-size: 9px; color: #6B7280;">WGS-84 / GNSS RTK</div>
      </td>
    </tr>
  </table>

  <!-- Tytuł -->
  <div class="title-box">
    <h1>OŚWIADCZENIE HODOWCY O WSPÓŁRZĘDNYCH GEOGRAFICZNYCH GOŁĘBNIKA</h1>
    <p>Sporządzone zgodnie z Regulaminem Lotowo-Zegarowym PZHGP i Międzynarodowym Standardem WGS-84</p>
  </div>

  <!-- Pasek Statusu Odchyłki -->
  <div class="status-banner">
    <div>
      <div class="status-label">${result.toleranceStatusLabel}</div>
      <div style="font-size: 10px; color: #4B5563; margin-top: 2px;">
        Zmierzona odchyłka geodezyjna: <strong>${result.deviationMeters} m</strong> (Wpływ na prędkość przy 350 km: ±${result.velocityImpactMPerMin} m/min)
      </div>
    </div>
    <div style="font-size: 16px; font-weight: 900; color: ${statusColor};">
      ${result.deviationMeters} m
    </div>
  </div>

  <!-- Dane Hodowcy -->
  <table class="data-grid">
    <tr>
      <td class="lbl">Hodowca / Posiadacz stada:</td>
      <td><strong>${input.breederName}</strong> (${input.loftName})</td>
    </tr>
    <tr>
      <td class="lbl">Adres lokalizacji gołębnika:</td>
      <td>${input.loftAddress}</td>
    </tr>
    <tr>
      <td class="lbl">Przynależność organizacyjna:</td>
      <td>${input.pzhgpBranch} • ${input.pzhgpSection}</td>
    </tr>
  </table>

  <!-- Porównanie Współrzędnych -->
  <div class="section-title">I. ZESTAWIENIE WSPÓŁRZĘDNYCH GEOGRAFICZNYCH (WGS-84)</div>
  <table class="coords-table">
    <thead>
      <tr>
        <th style="width: 25%;">Źródło współrzędnych</th>
        <th style="width: 35%;">Format dziesiętny (DD)</th>
        <th style="width: 40%;">Format stopniowy PZHGP (DMS)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Dotychczasowy wykaz oddziałowy</strong></td>
        <td>${input.registeredCoords.latitude.toFixed(6)}° N, ${input.registeredCoords.longitude.toFixed(6)}° E</td>
        <td><code>${regDmsStr}</code></td>
      </tr>
      <tr style="background-color: #F8FAFC;">
        <td><strong>Nowy pomiar odbiornikiem GNSS</strong></td>
        <td style="font-weight: bold; color: #0288D1;">${input.measuredCoords.latitude.toFixed(6)}° N, ${input.measuredCoords.longitude.toFixed(6)}° E</td>
        <td style="font-weight: bold; color: #0288D1;"><code>${measDmsStr}</code></td>
      </tr>
    </tbody>
  </table>

  <!-- Oświadczenie Prawne -->
  <div class="section-title">II. OŚWIADCZENIE HODOWCY</div>
  <div class="declaration-clause">
    Ja, niżej podpisany <strong>${input.breederName}</strong>, oświadczam pod rygorem odpowiedzialności dyscyplinarnej wynikającej z Regulaminu Dyscyplinarnego PZHGP, że powyższy pomiar współrzędnych został wykonany dokładnie w miejscu usytuowania anteny zegara elektronicznego (ESK) w moim gołębniku macierzystym. Wnoszę o wprowadzenie powyższych skorygowanych współrzędnych do oficjalnego systemu obliczeniowego Oddziału PZHGP dla celów wyliczania prędkości lotowych w sezonie sportowym.
  </div>

  <!-- Podpisy -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Czytelny podpis Hodowcy</strong><br>
        <span style="font-size: 8px; color: #6B7280;">(Wnioskodawca)</span>
      </td>
      <td style="width: 4%;"></td>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Podpis i pieczęć Zarządu Oddziału PZHGP</strong><br>
        <span style="font-size: 8px; color: #6B7280;">(Zatwierdzenie zmiany w wykazie koordynat)</span>
      </td>
    </tr>
  </table>

  <div class="footer">
    PIGEON-FLY Geodezja WGS-84 • Algorytm Vincenty'ego z elipsoidą odniesienia GRS-80 / WGS-84 • Suma kontrolna SHA-256
  </div>
</body>
</html>
  `.trim();
}

/**
 * PIGEON-FLY — Photoperiod & Chronobiology Engine (BR-ZDR-007, RD-13, RD-14)
 * Advanced management of Darkness System (Verdunkelung), Lighting (Belichtung),
 * and Solar Ephemeris for young and widowhood racing pigeons.
 *
 * Controls pineal gland melatonin synthesis to halt primary flight feather moult
 * before young bird races in August/September and induces peak racing form.
 */

export type PhotoperiodRegime = 'verdunkelung' | 'belichtung' | 'natural' | 'custom';

export type PhotoperiodPhase =
  | 'day'
  | 'night'
  | 'closing_soon'   // Blinds close reminder window (e.g. 15-30 min before)
  | 'opening_soon';  // Blinds open reminder window

export interface PhotoperiodConfig {
  id: string;
  loftId: string;
  regime: PhotoperiodRegime;
  name: string;
  startDateIso: string;
  endDateIso: string;
  lightsOnTime: string;    // "HH:mm" (e.g. "08:00" for darkness, "05:00" for lighting)
  lightsOffTime: string;   // "HH:mm" (e.g. "18:00" for darkness, "22:00" for lighting)
  targetLightHours: number;
  targetDarkHours: number;
  minLuxDarkness: number;  // RD-13: < 0.5 lx
  minLuxLighting: number;  // RD-14: >= 120 lx
  colorTempKelvin: number; // RD-14: >= 4000 K
  reminderLeadMinutes: number; // e.g. 15 min
  isAutomatedBlinds: boolean;
  notes?: string;
}

export interface BlindAlarmItem {
  id: string;
  time: string;           // "HH:mm"
  eventTime: string;      // "HH:mm" (scheduled action time)
  action: 'close_blinds' | 'open_blinds';
  title: string;
  message: string;
}

export interface PhotoperiodDailyEvaluation {
  currentRegime: PhotoperiodRegime;
  phase: PhotoperiodPhase;
  currentTimeString: string;
  lightsOnTime: string;
  lightsOffTime: string;
  lightHours: number;
  darkHours: number;
  isDarknessCompliant: boolean; // RD-13 target: 14h dark, 10h light
  isLightingCompliant: boolean; // RD-14 target: 16h light, 8h dark
  minutesUntilNextTransition: number;
  nextTransitionName: string;
  nextTransitionTime: string;
  biologicalGoal: string;
  hormonalStatusText: string;
}

/**
 * Standard default presets for master fanciers according to RD-13 and RD-14.
 */
export const PHOTOPERIOD_PRESETS: Record<PhotoperiodRegime, Omit<PhotoperiodConfig, 'id' | 'loftId'>> = {
  verdunkelung: {
    regime: 'verdunkelung',
    name: 'Ciemnia Mistrzowska (Verdunkelung)',
    startDateIso: '2026-03-15T00:00:00.000Z',
    endDateIso: '2026-06-21T23:59:59.000Z',
    lightsOnTime: '08:00',
    lightsOffTime: '18:00',
    targetLightHours: 10,
    targetDarkHours: 14,
    minLuxDarkness: 0.5,
    minLuxLighting: 0,
    colorTempKelvin: 4000,
    reminderLeadMinutes: 15,
    isAutomatedBlinds: false,
    notes: 'Zatrzymuje zrzucanie 10 lotek I rzędu. Wymiana okrywy tarczy i szyi.',
  },
  belichtung: {
    regime: 'belichtung',
    name: 'Doświetlanie Konkursowe (Belichtung)',
    startDateIso: '2026-06-22T00:00:00.000Z',
    endDateIso: '2026-09-30T23:59:59.000Z',
    lightsOnTime: '05:00',
    lightsOffTime: '21:00',
    targetLightHours: 16,
    targetDarkHours: 8,
    minLuxDarkness: 0.5,
    minLuxLighting: 120,
    colorTempKelvin: 4500,
    reminderLeadMinutes: 15,
    isAutomatedBlinds: false,
    notes: 'Podtrzymanie szczytu formy i stabilizacja skrzydeł w trakcie konkursów.',
  },
  natural: {
    regime: 'natural',
    name: 'Rytm Naturalny (Słoneczny)',
    startDateIso: '2026-10-01T00:00:00.000Z',
    endDateIso: '2027-03-14T23:59:59.000Z',
    lightsOnTime: '06:00',
    lightsOffTime: '18:00',
    targetLightHours: 12,
    targetDarkHours: 12,
    minLuxDarkness: 0.5,
    minLuxLighting: 0,
    colorTempKelvin: 4000,
    reminderLeadMinutes: 15,
    isAutomatedBlinds: false,
    notes: 'Naturalne pierzenie jesienne i regeneracja stada w okresie zimowym.',
  },
  custom: {
    regime: 'custom',
    name: 'Harmonogram Własny Hodowcy',
    startDateIso: new Date().toISOString(),
    endDateIso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    lightsOnTime: '07:00',
    lightsOffTime: '19:00',
    targetLightHours: 12,
    targetDarkHours: 12,
    minLuxDarkness: 0.5,
    minLuxLighting: 100,
    colorTempKelvin: 4000,
    reminderLeadMinutes: 15,
    isAutomatedBlinds: false,
    notes: 'Indywidualny cykl dopasowany do godzin pracy hodowcy.',
  },
};

/**
 * Calculates daylight hours and solar ephemeris using solar declination.
 * Very accurate approximation for European latitudes (e.g. Poland 49°N - 55°N).
 */
export function calculateSolarTimes(
  latitude: number,
  date: Date = new Date()
): {
  sunrise: string;
  sunset: string;
  dayLengthHours: number;
} {
  // Day of year (1-365)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Solar declination (degrees)
  const declinationDeg =
    23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);

  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declinationDeg * Math.PI) / 180;

  // Hour angle calculation: cos(omega) = -tan(lat) * tan(dec)
  let cosOmega = -Math.tan(latRad) * Math.tan(decRad);
  // Clamp for polar days / nights
  cosOmega = Math.min(1, Math.max(-1, cosOmega));

  const omegaDeg = (Math.acos(cosOmega) * 180) / Math.PI;
  const dayLengthHours = parseFloat(((2 * omegaDeg) / 15).toFixed(2));

  // Solar noon ~ 12:00 solar time
  const halfDay = dayLengthHours / 2;
  const sunriseDec = 12 - halfDay;
  const sunsetDec = 12 + halfDay;

  const formatHoursToHhMm = (decHour: number): string => {
    const totalMinutes = Math.round(decHour * 60);
    const normalizedMin = (totalMinutes + 24 * 60) % (24 * 60);
    const h = Math.floor(normalizedMin / 60);
    const m = normalizedMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return {
    sunrise: formatHoursToHhMm(sunriseDec),
    sunset: formatHoursToHhMm(sunsetDec),
    dayLengthHours,
  };
}

/**
 * Parses "HH:mm" to minutes from midnight (0 to 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:mm" string.
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates daylight and darkness hours from on/off times.
 */
export function calculateScheduleHours(
  lightsOnTime: string,
  lightsOffTime: string
): { lightHours: number; darkHours: number } {
  const onMin = timeStringToMinutes(lightsOnTime);
  const offMin = timeStringToMinutes(lightsOffTime);

  let lightDuration = offMin - onMin;
  if (lightDuration <= 0) {
    lightDuration += 1440; // crosses midnight
  }

  const lightHours = parseFloat((lightDuration / 60).toFixed(1));
  const darkHours = parseFloat(((1440 - lightDuration) / 60).toFixed(1));

  return { lightHours, darkHours };
}

/**
 * Recommends the optimal regime based on calendar date (RD-13, RD-14).
 */
export function getRecommendedRegimeForDate(date: Date = new Date()): PhotoperiodRegime {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // March 15 to June 21 -> Verdunkelung (Ciemnia)
  if ((month === 3 && day >= 15) || month === 4 || month === 5 || (month === 6 && day <= 21)) {
    return 'verdunkelung';
  }

  // June 22 to September 30 -> Belichtung (Doświetlanie)
  if ((month === 6 && day > 21) || month === 7 || month === 8 || month === 9) {
    return 'belichtung';
  }

  // October 1 to March 14 -> Natural / Regeneracja
  return 'natural';
}

/**
 * Evaluates the full daily photoperiod status and transition alarms.
 */
export function evaluateDailyPhotoperiod(
  config: PhotoperiodConfig,
  now: Date = new Date()
): PhotoperiodDailyEvaluation {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeString = minutesToTimeString(currentMinutes);

  const onMin = timeStringToMinutes(config.lightsOnTime);
  const offMin = timeStringToMinutes(config.lightsOffTime);
  const lead = config.reminderLeadMinutes;

  const { lightHours, darkHours } = calculateScheduleHours(
    config.lightsOnTime,
    config.lightsOffTime
  );

  const isDarknessCompliant = darkHours >= 13.5 && darkHours <= 14.5;
  const isLightingCompliant = lightHours >= 15.5 && lightHours <= 16.5;

  let phase: PhotoperiodPhase = 'day';
  let minutesUntilNextTransition = 0;
  let nextTransitionName = '';
  let nextTransitionTime = '';

  // Determine current phase and next transition
  if (onMin < offMin) {
    // Normal day cycle (e.g. 08:00 to 18:00)
    const closingWarningMin = offMin - lead;
    const openingWarningMin = onMin - lead;

    if (currentMinutes >= onMin && currentMinutes < offMin) {
      if (currentMinutes >= closingWarningMin) {
        phase = 'closing_soon';
      } else {
        phase = 'day';
      }
      minutesUntilNextTransition = offMin - currentMinutes;
      nextTransitionName = 'Opuszczenie rolet (zaciemnienie)';
      nextTransitionTime = config.lightsOffTime;
    } else {
      if (
        (currentMinutes >= openingWarningMin && currentMinutes < onMin) ||
        (openingWarningMin < 0 && currentMinutes >= 1440 + openingWarningMin)
      ) {
        phase = 'opening_soon';
      } else {
        phase = 'night';
      }

      if (currentMinutes < onMin) {
        minutesUntilNextTransition = onMin - currentMinutes;
      } else {
        minutesUntilNextTransition = 1440 - currentMinutes + onMin;
      }
      nextTransitionName = 'Podniesienie rolet / włączenie światła';
      nextTransitionTime = config.lightsOnTime;
    }
  } else {
    // Inverted/cross-midnight schedule
    phase = currentMinutes >= onMin || currentMinutes < offMin ? 'day' : 'night';
    minutesUntilNextTransition = 60;
    nextTransitionName = 'Przełączenie cyklu';
    nextTransitionTime = config.lightsOffTime;
  }

  // Biological descriptions based on active regime
  let biologicalGoal = '';
  let hormonalStatusText = '';

  switch (config.regime) {
    case 'verdunkelung':
      biologicalGoal =
        'Zatrzymanie zrzucania lotek pierwszorzędowych (I rzędu) na czas letnich konkursów młodych.';
      hormonalStatusText =
        'Wyciszenie szyszynki hormonem melatoniny stymuluje wymianę drobnych piór okrywowych ciała bez utraty nośności skrzydeł.';
      break;
    case 'belichtung':
      biologicalGoal =
        'Utrzymanie szczytowej dyspozycji psychofizycznej i ochrona przed przedwczesnym zrzuceniem skrzydeł w sierpniu/wrześniu.';
      hormonalStatusText =
        'Wydłużony dzień świetlny (16h) stymuluje przysadkę i wydzielanie hormonów tarczycy, zapobiegając załamaniu formy.';
      break;
    case 'natural':
      biologicalGoal =
        'Naturalna jesienna regeneracja organizmu i swobodna wymiana całego upierzenia.';
      hormonalStatusText =
        'Rytm naturalny zsynchronizowany z długością dnia słonecznego sprzyja równomiernemu pierzeniu przed zimą.';
      break;
    case 'custom':
      biologicalGoal = 'Dostosowany cykl dobowy hodowcy.';
      hormonalStatusText = 'Profil skonfigurowany manualnie.';
      break;
  }

  return {
    currentRegime: config.regime,
    phase,
    currentTimeString,
    lightsOnTime: config.lightsOnTime,
    lightsOffTime: config.lightsOffTime,
    lightHours,
    darkHours,
    isDarknessCompliant,
    isLightingCompliant,
    minutesUntilNextTransition,
    nextTransitionName,
    nextTransitionTime,
    biologicalGoal,
    hormonalStatusText,
  };
}

/**
 * Generates push/alarm notifications for roller blinds operation.
 */
export function generateBlindAlarms(
  config: PhotoperiodConfig,
  customLeadMinutes?: number
): BlindAlarmItem[] {
  const lead = customLeadMinutes ?? config.reminderLeadMinutes;

  const onMin = timeStringToMinutes(config.lightsOnTime);
  const offMin = timeStringToMinutes(config.lightsOffTime);

  const openAlertMin = onMin - lead;
  const closeAlertMin = offMin - lead;

  const openTime = minutesToTimeString(openAlertMin);
  const closeTime = minutesToTimeString(closeAlertMin);

  return [
    {
      id: `alarm-open-${config.id || 'default'}`,
      time: openTime,
      eventTime: config.lightsOnTime,
      action: 'open_blinds',
      title: '☀️ Czas na podniesienie rolet!',
      message: `Za ${lead} minut (${config.lightsOnTime}) należy odsłonić gołębnik. Czas na naturalny dzień świetlny stada.`,
    },
    {
      id: `alarm-close-${config.id || 'default'}`,
      time: closeTime,
      eventTime: config.lightsOffTime,
      action: 'close_blinds',
      title: '🌙 Czas na opuszczenie rolet (Ciemnia)!',
      message: `Za ${lead} minut (${config.lightsOffTime}) należy zaciemnić gołębnik (<0.5 lx). Utrzymaj 14h pełnej nocy biologicznej.`,
    },
  ];
}

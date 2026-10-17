/**
 * PIGEON-FLY — Symulator Taktyki Wypuszczenia i Korytarzy Wiatrowych (Z-070)
 * Standard PZHGP, FCI i meteorologii lotniczej gołębi pocztowych.
 * Analiza wektorowa wiatru (Headwind / Tailwind / Crosswind Drift), okna startowe,
 * predykcja prędkości szpicy i zamknięcia bazy 20% oraz rekomendacje taktyczno-żywieniowe.
 */

import { Coordinates } from './types';
import { calculateFlightBearing, calculateDriftAngle } from './weather';
import { calculateGeodesicDistanceMeters } from './racing';

export interface RacePresetRoute {
  id: string;
  name: string;
  category: 'A' | 'B' | 'C' | 'M';
  releaseLocation: string;
  releaseCoordinates: Coordinates;
  loftCoordinates: Coordinates;
  approxDistanceKm: number;
}

export const PRESET_RACE_ROUTES: RacePresetRoute[] = [
  {
    id: 'route-magdeburg',
    name: 'Lot Kat. B: Magdeburg (Niemcy)',
    category: 'B',
    releaseLocation: 'Magdeburg (52.13°N, 11.62°E)',
    releaseCoordinates: { latitude: 52.1316, longitude: 11.6276 },
    loftCoordinates: { latitude: 51.8794, longitude: 17.0123 }, // Gostyń
    approxDistanceKm: 375,
  },
  {
    id: 'route-minden',
    name: 'Lot Kat. C: Minden (Niemcy)',
    category: 'C',
    releaseLocation: 'Minden (52.29°N, 8.92°E)',
    releaseCoordinates: { latitude: 52.2895, longitude: 8.9167 },
    loftCoordinates: { latitude: 51.8794, longitude: 17.0123 }, // Gostyń
    approxDistanceKm: 555,
  },
  {
    id: 'route-bruksela',
    name: 'Lot Kat. M: Bruksela (Belgia)',
    category: 'M',
    releaseLocation: 'Bruksela (50.85°N, 4.35°E)',
    releaseCoordinates: { latitude: 50.8503, longitude: 4.3517 },
    loftCoordinates: { latitude: 51.8794, longitude: 17.0123 }, // Gostyń
    approxDistanceKm: 870,
  },
  {
    id: 'route-pyrzyce',
    name: 'Lot Kat. A: Pyrzyce (Polska)',
    category: 'A',
    releaseLocation: 'Pyrzyce (53.14°N, 14.89°E)',
    releaseCoordinates: { latitude: 53.1436, longitude: 14.8958 },
    loftCoordinates: { latitude: 51.8794, longitude: 17.0123 }, // Gostyń
    approxDistanceKm: 200,
  },
];

export interface HourlyWindForecast {
  timeLabel: string; // np. "06:00", "07:00", "08:00"
  windSpeedKmh: number;
  windFromDeg: number; // 0-360° (skąd wieje)
  gustSpeedKmh: number;
  temperatureC: number;
  cloudCoverPct: number;
}

export type ReleaseDecision = 'RECOMMENDED' | 'ACCEPTABLE' | 'RISKY' | 'UNACCEPTABLE';

export interface ReleaseWindowSlot {
  releaseTime: string;
  windSpeedKmh: number;
  windFromDeg: number;
  gustSpeedKmh: number;
  temperatureC: number;
  effectiveTailwindKmh: number; // >0 wiatr w ogon, <0 wiatr w dziób
  crosswindKmh: number;
  driftAngleDeg: number;
  driftDirection: 'left' | 'right' | 'none';
  groundSpeedKmh: number;
  firstBirdVelocityMPerMin: number;
  concourseCloseVelocityMPerMin: number; // estymacja 20% listy
  flightDurationMinutes: number;
  flightDurationHoursFormatted: string;
  estimatedArrivalIso: string;
  safetyScore: number; // 0-100
  decision: ReleaseDecision;
  decisionReason: string;
}

export interface TacticalAdvisory {
  windTypeSummary: string;
  feedingStrategy: string;
  hydrationElectrolytes: string;
  basketTipStrategy: string;
  geographicHazards: string[];
}

export interface TacticalSimulationResult {
  route: RacePresetRoute;
  flightBearingDeg: number;
  distanceKm: number;
  windows: ReleaseWindowSlot[];
  bestWindowIndex: number;
  advisory: TacticalAdvisory;
}

/**
 * Szacuje prędkość zamknięcia bazy 20% (ogona konkursu) na podstawie prędkości szpicy
 * Zgodnie ze statystyką PZHGP: im trudniejszy lot (pod wiatr), tym większy rozrzut stada
 */
export function calculateConcourseCloseVelocity(
  firstBirdVelocityMPerMin: number,
  distanceKm: number
): number {
  if (firstBirdVelocityMPerMin <= 0) return 0;

  // Przy bardzo szybkim locie z wiatrem (>1500 m/min) konkurs zamyka się bardzo ciasno (ok. 90-93% prędkości szpicy)
  // Przy wolnym locie pod wiatr (<1000 m/min) konkurs rozciąga się (ok. 75-80% prędkości szpicy)
  let ratio = 0.88;
  if (firstBirdVelocityMPerMin >= 1500) {
    ratio = 0.92;
  } else if (firstBirdVelocityMPerMin <= 1000) {
    ratio = 0.78;
  } else {
    // Interpolacja liniowa
    ratio = 0.78 + ((firstBirdVelocityMPerMin - 1000) / 500) * 0.14;
  }

  // Dłuższy dystans dodatkowo lekko rozciąga stawkę
  if (distanceKm > 600) {
    ratio -= 0.03;
  }

  return Math.round(firstBirdVelocityMPerMin * ratio);
}

/**
 * Generuje porady taktyczne i żywieniowe dla hodowcy w zależności od profilu wiatru
 */
export function generateTacticalAdvisory(
  avgEffectiveTailwind: number,
  avgCrosswind: number,
  distanceKm: number
): TacticalAdvisory {
  const isHeadwind = avgEffectiveTailwind < -5;
  const isTailwind = avgEffectiveTailwind > 10;
  const isHeavyCrosswind = avgCrosswind > 20;

  let windTypeSummary = 'Wiatr umiarkowany / zmienny';
  let feedingStrategy = 'Standardowa karma lotowa z zrównoważonym udziałem węglowodanów i tłuszczu.';
  let hydrationElectrolytes = 'Standardowe nawodnienie. Po powrocie lekki elektrolit z glukozą w pierwszym poidle.';
  let basketTipStrategy = 'Typuj serię zbalansowaną: gołębie o dobrej orientacji i regularnych konkursach.';
  const geographicHazards: string[] = [];

  if (isHeadwind) {
    windTypeSummary = `Silny wiatr czołowy (${Math.abs(Math.round(avgEffectiveTailwind))} km/h w dziób)`;
    feedingStrategy =
      'DIETA ENERGETYCZNA: Zwiększ udział kukurydzy cribs, kardi, słonecznika łuskanego i orzeszków ziemnych. Podaj lecytynę i L-karnitynę 48h przed koszowaniem w celu ochrony glikogenu mięśniowego.';
    hydrationElectrolytes =
      'Kwas masłowy i magnez w wodzie. Po powrocie natychmiast ciepła woda z miodem i aminokwasami regeneracyjnymi (BCAA).';
    basketTipStrategy =
      'Typuj tzw. "twardzieli" — gołębie o głębokim profilu mostka, mocnym kośćcu, zwartej budowie i krótkim ramieniu przedramienia.';
    geographicHazards.push('Wydłużony czas lotu grozi zetknięciem ze strefami zmożonego polowania jastrzębi w korytarzach leśnych.');
  } else if (isTailwind) {
    windTypeSummary = `Szybki wiatr w ogon (+${Math.round(avgEffectiveTailwind)} km/h pomocniczy)`;
    feedingStrategy =
      'DIETA LEKKA: Ogranicz ciężkie tłuszcze, zwiększ lekkostrawne węglowodany (ryż paddy, jęczmień, pszenica, dari). Ptaki nie mogą być ociężałe na szybki lot.';
    hydrationElectrolytes =
      'Lekkie zakwaszenie wody (ocet jabłkowy / oregano). Ptaki przylecą szybko i nie będą mocno odwodnione.';
    basketTipStrategy =
      'Typuj ptaki o cechach sprinterskich, z wąskimi lotkami wentylacyjnymi, nerwowe i reagujące błyskawicznie na wejście do wlotu.';
    geographicHazards.push('Ryzyko przestrzelenia gołębnika (tzw. overshooting) i utraty cennych sekund przy lądowaniu.');
  }

  if (isHeavyCrosswind) {
    geographicHazards.push(
      `Silny wiatr boczny (${Math.round(avgCrosswind)} km/h) znosi stado z osi przelotu — przewaga gołębi po nawietrznej stronie oddziału.`
    );
  }

  return {
    windTypeSummary,
    feedingStrategy,
    hydrationElectrolytes,
    basketTipStrategy,
    geographicHazards,
  };
}

/**
 * Główny symulator okien wypuszczenia i taktyki wiatrowej
 */
export function simulateTacticalReleaseWindows(params: {
  route: RacePresetRoute;
  hourlyForecasts: HourlyWindForecast[];
  baseAirspeedKmh?: number; // domyślnie 72 km/h
  raceDate?: string; // YYYY-MM-DD
}): TacticalSimulationResult {
  const {
    route,
    hourlyForecasts,
    baseAirspeedKmh = 72,
    raceDate = new Date().toISOString().slice(0, 10),
  } = params;

  const distanceMeters = calculateGeodesicDistanceMeters(
    route.releaseCoordinates,
    route.loftCoordinates
  );
  const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
  const flightBearingDeg = calculateFlightBearing(route.releaseCoordinates, route.loftCoordinates);

  const windows: ReleaseWindowSlot[] = hourlyForecasts.map((forecast) => {
    const driftComp = calculateDriftAngle({
      flightBearingDeg,
      pigeonAirspeedKmh: baseAirspeedKmh,
      windFromDeg: forecast.windFromDeg,
      windSpeedKmh: forecast.windSpeedKmh,
    });

    // Dekompozycja kątowa
    const windToDeg = (forecast.windFromDeg + 180) % 360;
    const relAngleRad = ((windToDeg - flightBearingDeg) * Math.PI) / 180;
    const effectiveTailwindKmh = Math.round(forecast.windSpeedKmh * Math.cos(relAngleRad) * 10) / 10;
    const crosswindKmh = Math.round(Math.abs(forecast.windSpeedKmh * Math.sin(relAngleRad)) * 10) / 10;

    const groundSpeedKmh = driftComp.groundSpeedKmh;
    const firstBirdVelocityMPerMin = Math.round((groundSpeedKmh * 1000) / 60);
    const concourseCloseVelocityMPerMin = calculateConcourseCloseVelocity(firstBirdVelocityMPerMin, distanceKm);

    const flightDurationMinutes = groundSpeedKmh > 0
      ? Math.round((distanceKm / groundSpeedKmh) * 60)
      : 0;

    const hours = Math.floor(flightDurationMinutes / 60);
    const mins = flightDurationMinutes % 60;
    const flightDurationHoursFormatted = `${hours}h ${mins.toString().padStart(2, '0')}m`;

    // Estymacja przylotu
    const [hStr, mStr] = forecast.timeLabel.split(':');
    const startHour = parseInt(hStr, 10) || 6;
    const startMin = parseInt(mStr, 10) || 0;
    const arrivalDate = new Date(`${raceDate}T00:00:00Z`);
    arrivalDate.setUTCHours(startHour + hours, startMin + mins);
    const estimatedArrivalIso = arrivalDate.toISOString();

    // Punktacja bezpieczeństwa i decyzja (0 - 100)
    let safetyScore = 100;
    let decision: ReleaseDecision = 'RECOMMENDED';
    let decisionReason = 'Warunki idealne: stabilny wiatr, brak groźnych porywów.';

    if (forecast.gustSpeedKmh > 45) {
      safetyScore -= 35;
    } else if (forecast.gustSpeedKmh > 30) {
      safetyScore -= 15;
    }

    if (effectiveTailwindKmh < -20) {
      safetyScore -= 25; // bardzo silny wiatr w dziób
    }

    if (crosswindKmh > 25) {
      safetyScore -= 20; // duży znos boczny
    }

    if (forecast.cloudCoverPct > 85) {
      safetyScore -= 10; // brak słońca utrudnia nawigację azymutalną
    }

    if (safetyScore >= 80) {
      decision = 'RECOMMENDED';
      decisionReason = 'Optymalne okno wypuszczenia: wysoki wskaźnik bezpieczeństwa i dobra widoczność.';
    } else if (safetyScore >= 60) {
      decision = 'ACCEPTABLE';
      decisionReason = 'Lot wymagający: umiarkowany znos lub przeciwny wiatr, ale w granicach normy PZHGP.';
    } else if (safetyScore >= 40) {
      decision = 'RISKY';
      decisionReason = 'Duże ryzyko: porywisty wiatr lub ciężki lot pod wiatr grożący rozbiciem stada.';
    } else {
      decision = 'UNACCEPTABLE';
      decisionReason = 'ZAKAZ WYPUSZCZENIA: Skrajnie niebezpieczne porywy wiatru lub nawałnica.';
    }

    return {
      releaseTime: forecast.timeLabel,
      windSpeedKmh: forecast.windSpeedKmh,
      windFromDeg: forecast.windFromDeg,
      gustSpeedKmh: forecast.gustSpeedKmh,
      temperatureC: forecast.temperatureC,
      effectiveTailwindKmh,
      crosswindKmh,
      driftAngleDeg: driftComp.driftAngleDeg,
      driftDirection: driftComp.driftDirection,
      groundSpeedKmh,
      firstBirdVelocityMPerMin,
      concourseCloseVelocityMPerMin,
      flightDurationMinutes,
      flightDurationHoursFormatted,
      estimatedArrivalIso,
      safetyScore: Math.max(0, safetyScore),
      decision,
      decisionReason,
    };
  });

  // Najlepsze okno to to o najwyższym safetyScore
  let bestIdx = 0;
  let maxScore = -1;
  windows.forEach((w, idx) => {
    if (w.safetyScore > maxScore) {
      maxScore = w.safetyScore;
      bestIdx = idx;
    }
  });

  const avgTailwind = windows.reduce((acc, w) => acc + w.effectiveTailwindKmh, 0) / (windows.length || 1);
  const avgCrosswind = windows.reduce((acc, w) => acc + w.crosswindKmh, 0) / (windows.length || 1);
  const advisory = generateTacticalAdvisory(avgTailwind, avgCrosswind, distanceKm);

  return {
    route,
    flightBearingDeg,
    distanceKm,
    windows,
    bestWindowIndex: bestIdx,
    advisory,
  };
}

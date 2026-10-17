/**
 * PIGEON-FLY — Training Toss & Private Release Route Optimizer (Z-053, BR-LOT-013)
 * Plans and optimizes private training tosses before and during race season:
 * - Geodesic bearing and return distance calculation
 * - Wind decomposition (tailwind/headwind/crosswind) and flight time prediction
 * - Raptor / predator terrain risk assessment (forest corridors)
 * - Power line hazards & fog/visibility checks
 * - Safety index (0-100%) and official GO / CAUTION / NO-GO recommendation.
 */

import { Coordinates } from './types';
import { calculateFlightBearing } from './weather';

export type TrainingSquadType =
  | 'youngsters' // Młode gołębie (delikatna progresja 10-35 km)
  | 'widowhood_cocks' // Wdowce samce (środowy trening rozruchowy 25-50 km)
  | 'widowhood_hens' // Wdówki samice
  | 'marathon_squad'; // Gołębie dalekodystansowe (pojedyncze wypuszczanie)

export type RaptorThreatLevel = 'low' | 'medium' | 'high_forest';

export type TossSafetyStatus = 'GO_OPTIMAL' | 'GO_CAUTION' | 'NO_GO_ABORT';

export interface TrainingTossPlanInput {
  tossName: string;
  squadType: TrainingSquadType;
  pigeonsCount: number;
  homeLoft: {
    name: string;
    coords: Coordinates;
  };
  releaseLocation: {
    name: string;
    coords: Coordinates;
    distanceKm: number;
  };
  plannedReleaseHour: string; // HH:MM np. "07:30"
  weather: {
    windSpeedKmh: number;
    windDirectionDeg: number; // Skąd wieje (0-360°)
    visibilityKm: number;
    temperatureC: number;
    rainProbabilityPercent: number;
  };
  terrain: {
    raptorThreat: RaptorThreatLevel;
    powerLinesCrossing: boolean;
  };
}

export interface TrainingTossEvaluation {
  tossName: string;
  distanceKm: number;
  flightBearingDeg: number;
  flightDurationMinutes: number;
  expectedSpeedMPerMin: number;
  safetyScore: number; // 0 - 100
  status: TossSafetyStatus;
  statusLabel: string;
  statusColor: string;
  windDecomposition: {
    effectiveTailwindKmh: number; // Dodatnia: w plecy, ujemna: w dziób
    crosswindKmh: number;
    windTypeDescription: string;
  };
  hazardsDetected: string[];
  tacticalAdvice: string[];
  optimalReleaseWindow: string;
}

/**
 * Evaluates training toss plan and computes aerodynamic and zootechnical safety.
 */
export function evaluateTrainingTossPlan(
  input: TrainingTossPlanInput
): TrainingTossEvaluation {
  const bearing = calculateFlightBearing(
    input.releaseLocation.coords,
    input.homeLoft.coords
  );

  // Wind decomposition relative to flight bearing
  // In meteorology, windDirectionDeg is WHERE wind blows FROM.
  // Wind blows towards: (windDirectionDeg + 180) % 360
  const windTowardsDeg = (input.weather.windDirectionDeg + 180) % 360;
  const angleDiffRad = ((bearing - windTowardsDeg) * Math.PI) / 180;

  // Positive: tailwind (pushes bird forward), Negative: headwind (opposes bird)
  const effectiveTailwindKmh = Number(
    (input.weather.windSpeedKmh * Math.cos(angleDiffRad)).toFixed(1)
  );
  const crosswindKmh = Number(
    (Math.abs(input.weather.windSpeedKmh * Math.sin(angleDiffRad))).toFixed(1)
  );

  // Base speed in calm air: ~1250 m/min (75 km/h)
  // Adjusted by tailwind/headwind (+/- 14 m/min per km/h)
  let speed = 1250 + effectiveTailwindKmh * 14;
  speed = Math.max(750, Math.min(1850, speed));
  const expectedSpeedMPerMin = Math.round(speed);

  const durationMin = Number(
    ((input.releaseLocation.distanceKm * 1000) / expectedSpeedMPerMin).toFixed(1)
  );

  // Safety Score computation (max 100)
  let safetyScore = 100;
  const hazards: string[] = [];
  const advice: string[] = [];

  // Weather hazards:
  if (input.weather.rainProbabilityPercent > 40) {
    safetyScore -= 30;
    hazards.push(`Wysokie ryzyko opadów deszczu (${input.weather.rainProbabilityPercent}%) — ryzyko zmoczenia piór i przymusowego lądowania.`);
  } else if (input.weather.rainProbabilityPercent > 20) {
    safetyScore -= 10;
    hazards.push(`Umiarkowane ryzyko przelotnych opadów (${input.weather.rainProbabilityPercent}%).`);
  }

  if (input.weather.visibilityKm < 5) {
    safetyScore -= 35;
    hazards.push(`Bardzo słaba widoczność / zamglenie (${input.weather.visibilityKm} km) — krytyczne ryzyko utraty orientacji terenu.`);
  } else if (input.weather.visibilityKm < 10) {
    safetyScore -= 12;
    hazards.push(`Ograniczona przejrzystość powietrza (${input.weather.visibilityKm} km).`);
  }

  if (input.weather.temperatureC > 27) {
    safetyScore -= 18;
    hazards.push(`Wysoka temperatura (${input.weather.temperatureC}°C) — ryzyko hipertermii i odwodnienia w locie.`);
  } else if (input.weather.temperatureC < 5) {
    safetyScore -= 10;
    hazards.push(`Niska temperatura (${input.weather.temperatureC}°C) — zalecane rozgrzanie mięśni w koszu przed startem.`);
  }

  if (effectiveTailwindKmh < -25) {
    safetyScore -= 20;
    hazards.push(`Silny wiatr czołowy w dziób (${Math.abs(effectiveTailwindKmh)} km/h) — bardzo duże obciążenie siłowe.`);
  }

  // Terrain & Predator hazards:
  if (input.terrain.raptorThreat === 'high_forest') {
    safetyScore -= 25;
    hazards.push('Trasa przecina zwarty kompleks leśny z wysoką aktywnością jastrzębia gołębiarza (Accipiter gentilis).');
    advice.push('Wypuszczaj całe stado w jednej zwartej grupie (efekt rozproszenia ataku drapieżnika).');
  } else if (input.terrain.raptorThreat === 'medium') {
    safetyScore -= 10;
    hazards.push('Umiarkowane zagrożenie drapieżnikami na skraju doliny rzeki.');
  }

  if (input.terrain.powerLinesCrossing) {
    safetyScore -= 15;
    hazards.push('Obecność napowietrznych linii wysokiego napięcia (400 kV) w promieniu 3 km od punktu zrzutu.');
    advice.push('Oddal miejsce wypuszczenia min. 2 km od słupów trakcyjnych, aby ptaki zdążyły nabrać wysokości.');
  }

  // Squad specific adjustments:
  if (input.squadType === 'youngsters') {
    if (input.releaseLocation.distanceKm > 40) {
      safetyScore -= 15;
      hazards.push(`Dystans ${input.releaseLocation.distanceKm} km jest zbyt duży jak na wczesny etap treningu młodych (zalecane max 30 km).`);
    }
    advice.push('Dla młodych ptaków upewnij się, że niebo jest bezchmurne (nawigacja według słońca).');
  } else if (input.squadType === 'widowhood_cocks') {
    advice.push('Idealny trening rozruchowy w środę rano: samice czekają w celach na szybką nagrodę motywacyjną.');
  }

  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // Determine Status
  let status: TossSafetyStatus = 'GO_OPTIMAL';
  let statusLabel = '🟢 WYPUSZCZAJ (Warunki Optymalne)';
  let statusColor = '#10B981';

  if (safetyScore >= 80) {
    status = 'GO_OPTIMAL';
    statusLabel = '🟢 WYPUSZCZAJ (Warunki Optymalne)';
    statusColor = '#10B981';
  } else if (safetyScore >= 60) {
    status = 'GO_CAUTION';
    statusLabel = '🟡 WYPUSZCZAJ Z OSTROŻNOŚCIĄ';
    statusColor = '#F59E0B';
  } else {
    status = 'NO_GO_ABORT';
    statusLabel = '🔴 WSTRZYMAJ WYWÓZKĘ (Ryzyko Strat)';
    statusColor = '#EF4444';
  }

  let windTypeDesc = '';
  if (effectiveTailwindKmh > 10) {
    windTypeDesc = `Silny wiatr w ogon (+${effectiveTailwindKmh} km/h) — bardzo szybki lot`;
  } else if (effectiveTailwindKmh < -10) {
    windTypeDesc = `Wiatr w dziób (${effectiveTailwindKmh} km/h) — lot siłowy`;
  } else {
    windTypeDesc = `Wiatr neutralny / słaby (${Math.abs(effectiveTailwindKmh)} km/h)`;
  }

  const optimalReleaseWindow =
    input.weather.temperatureC > 24
      ? '06:30 - 08:30 rano (przed wzrostem temperatury i prądami termicznymi)'
      : '07:30 - 10:00 (optymalne oświetlenie horyzontu)';

  return {
    tossName: input.tossName,
    distanceKm: input.releaseLocation.distanceKm,
    flightBearingDeg: bearing,
    flightDurationMinutes: durationMin,
    expectedSpeedMPerMin,
    safetyScore,
    status,
    statusLabel,
    statusColor,
    windDecomposition: {
      effectiveTailwindKmh,
      crosswindKmh,
      windTypeDescription: windTypeDesc,
    },
    hazardsDetected: hazards,
    tacticalAdvice: advice,
    optimalReleaseWindow,
  };
}

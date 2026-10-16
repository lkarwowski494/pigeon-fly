/**
 * PIGEON-FLY — Speed Performance & Flight Form Engine
 * Analyzes multi-race velocity trends, form trajectories (peaking, stable, declining),
 * FCI prize efficiency, and tactical basketing advice for championship competition.
 */

export interface RacePerformanceEntry {
  raceId: string;
  raceName: string;
  releaseDate: string; // YYYY-MM-DD
  distanceKm: number;
  velocityMPerMin: number;
  flightDurationMinutes: number;
  concoursePosition?: number;
  totalBasketed?: number;
  isPrize: boolean;
  fciCoefficient?: number;
  gmpPoints?: number;
}

export type FormTrajectory = 'peaking' | 'stable' | 'declining' | 'recovering';

export interface PigeonFormSummary {
  pigeonId: string;
  totalRaces: number;
  totalPrizes: number;
  totalDistanceKm: number;
  averageVelocityMPerMin: number;
  peakVelocityMPerMin: number;
  efficiencyPercent: number; // (prizes / races) * 100
  formTrajectory: FormTrajectory;
  formScore: number; // 0 to 100 index
  totalGmpPoints: number;
  bestCoefficient: number | null;
  tacticalAdvice: string;
}

/**
 * Calculates form summary, trajectory, and racing condition index.
 */
export function calculatePigeonForm(
  pigeonId: string,
  history: RacePerformanceEntry[]
): PigeonFormSummary {
  if (!history || history.length === 0) {
    return {
      pigeonId,
      totalRaces: 0,
      totalPrizes: 0,
      totalDistanceKm: 0,
      averageVelocityMPerMin: 0,
      peakVelocityMPerMin: 0,
      efficiencyPercent: 0,
      formTrajectory: 'stable',
      formScore: 50,
      totalGmpPoints: 0,
      bestCoefficient: null,
      tacticalAdvice: 'Brak zarejestrowanych lotów w sezonie. Zalecany trening wywózkowy 30-50 km.',
    };
  }

  // Sort chronologically by releaseDate
  const sorted = [...history].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  const totalRaces = sorted.length;
  const totalPrizes = sorted.filter((r) => r.isPrize).length;
  const totalDistanceKm = sorted.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalVelocity = sorted.reduce((acc, r) => acc + r.velocityMPerMin, 0);
  const averageVelocityMPerMin = parseFloat((totalVelocity / totalRaces).toFixed(2));
  const peakVelocityMPerMin = Math.max(...sorted.map((r) => r.velocityMPerMin));
  const efficiencyPercent = parseFloat(((totalPrizes / totalRaces) * 100).toFixed(1));

  const totalGmpPoints = parseFloat(
    sorted.reduce((acc, r) => acc + (r.gmpPoints || 0), 0).toFixed(2)
  );

  const coefficients = sorted
    .filter((r) => r.fciCoefficient !== undefined && r.fciCoefficient !== null)
    .map((r) => r.fciCoefficient as number);
  const bestCoefficient = coefficients.length > 0 ? Math.min(...coefficients) : null;

  // Form trajectory determination based on recent races
  let formTrajectory: FormTrajectory = 'stable';
  let formScore = 50;

  if (sorted.length >= 2) {
    const recent = sorted.slice(-3); // Last 2-3 races
    const speeds = recent.map((r) => r.velocityMPerMin);

    let isIncreasing = true;
    let isDecreasing = true;

    for (let i = 1; i < speeds.length; i++) {
      if (speeds[i] <= speeds[i - 1]) isIncreasing = false;
      if (speeds[i] >= speeds[i - 1]) isDecreasing = false;
    }

    if (isIncreasing && recent[recent.length - 1].isPrize) {
      formTrajectory = 'peaking';
      formScore = Math.min(100, 75 + efficiencyPercent * 0.25);
    } else if (isDecreasing && !recent[recent.length - 1].isPrize) {
      formTrajectory = 'declining';
      formScore = Math.max(15, 50 - (100 - efficiencyPercent) * 0.3);
    } else if (!recent[recent.length - 1].isPrize && recent.length >= 2 && !recent[recent.length - 2].isPrize) {
      formTrajectory = 'recovering';
      formScore = Math.max(25, 40 + efficiencyPercent * 0.2);
    } else {
      formTrajectory = 'stable';
      formScore = Math.round(50 + (efficiencyPercent - 50) * 0.4);
    }
  } else {
    // Single race
    formScore = sorted[0].isPrize ? 75 : 45;
    formTrajectory = sorted[0].isPrize ? 'peaking' : 'stable';
  }

  // Tactical Advice formulation
  let tacticalAdvice = '';
  switch (formTrajectory) {
    case 'peaking':
      tacticalAdvice =
        '🔥 Ptak w szczytowej formie (progresja prędkości). Rekomendowany do serii mistrzowskiej (Typowane 1-5).';
      break;
    case 'declining':
      tacticalAdvice =
        '⚠️ Spadek prędkości i objawy przemęczenia. Zalecany odpoczynek, lżejsza karma (dieta) i elektrolity w poidle.';
      break;
    case 'recovering':
      tacticalAdvice =
        '🔄 Regeneracja po trudnym locie. Ograniczyć obciążenie, nie koszować na maraton w najbliższy weekend.';
      break;
    case 'stable':
    default:
      tacticalAdvice =
        efficiencyPercent >= 50
          ? '⭐ Równy, pewny lotnik konkursowy. Solidny punkt drużyny na dystanse średnie.'
          : '🕊️ Standardowy lotnik. Zapewnić optymalną motywację w celi gniazdowej przed koszowaniem.';
      break;
  }

  return {
    pigeonId,
    totalRaces,
    totalPrizes,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    averageVelocityMPerMin,
    peakVelocityMPerMin: parseFloat(peakVelocityMPerMin.toFixed(2)),
    efficiencyPercent,
    formTrajectory,
    formScore: Math.round(formScore),
    totalGmpPoints,
    bestCoefficient,
    tacticalAdvice,
  };
}

/**
 * Calculates speed change between consecutive flights.
 */
export function calculateSpeedDelta(
  currentMpm: number,
  previousMpm: number
): { deltaMpm: number; percentChange: number } {
  const deltaMpm = parseFloat((currentMpm - previousMpm).toFixed(2));
  const percentChange = previousMpm > 0
    ? parseFloat(((deltaMpm / previousMpm) * 100).toFixed(2))
    : 0;

  return { deltaMpm, percentChange };
}

/**
 * Predicts realistic flight velocity for an upcoming race based on past performance curve.
 */
export function predictNextRaceVelocity(
  history: RacePerformanceEntry[],
  expectedDistanceKm: number,
  tailwindMpmBonus: number = 0
): number {
  if (!history || history.length === 0) {
    return 1200 + tailwindMpmBonus; // Standard default assumption
  }

  // Weighted average: more weight on recent races (weight 3 for latest, 2 for prior, 1 for older)
  const sorted = [...history].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  let weightedSum = 0;
  let weightSum = 0;

  sorted.forEach((entry, idx) => {
    const weight = idx + 1;
    // Distance penalty: flights over 600km typically have lower average velocity by ~5%
    let distanceFactor = 1.0;
    if (expectedDistanceKm > 600 && entry.distanceKm < 400) {
      distanceFactor = 0.94;
    } else if (expectedDistanceKm < 300 && entry.distanceKm > 500) {
      distanceFactor = 1.05;
    }

    weightedSum += entry.velocityMPerMin * distanceFactor * weight;
    weightSum += weight;
  });

  const basePredicted = weightedSum / weightSum;
  return parseFloat((basePredicted + tailwindMpmBonus).toFixed(2));
}

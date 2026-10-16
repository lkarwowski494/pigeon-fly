/**
 * PIGEON-FLY — Concourse & Competition Ranking Domain Engine (FCI / PZHGP)
 * Official calculation of prize limits (baza konkursowa 20%/25%/33%),
 * FCI Coefficients (GMP / Mistrzostwo), and Ace Pigeon (As Lotnik) scoring.
 */

export interface ConcourseParams {
  totalBasketed: number; // Całkowita liczba gołębi włożonych do kosza
  basePercent?: 20 | 25 | 33; // Domyślnie baza 20% (standard FCI / PZHGP)
}

export interface ConcourseResult {
  totalBasketed: number;
  prizeLimit: number; // Liczba gołębi, która wchodzi na listę konkursową
  basePercent: number;
}

export interface PigeonPrizeCalculation {
  position: number; // Pozycja na liście konkursowej (1, 2, 3...)
  totalBasketed: number;
  distanceKm: number;
  basePercent?: 20 | 25 | 33;
}

export interface PigeonPrizeResult {
  position: number;
  isPrize: boolean; // Czy ptak zdobył konkurs (mieści się w limicie bazy)
  prizeLimit: number;
  fciCoefficient: number; // Współczynnik Coeff (im niższy, tym lepszy, np. 0.450)
  gmpPoints: number; // Punkty do Mistrzostwa Polski (skala 20.00-40.00 pkt)
  concourseKilometers: number; // kkm zdobyte w tym locie (0 jeśli brak konkursu)
}

/**
 * Calculates how many pigeons earn a prize based on total basketed birds and selected prize base.
 * Standard PZHGP rule: prizeLimit = ceil(totalBasketed * (basePercent / 100)).
 */
export function calculateConcourseLimit(
  totalBasketed: number,
  basePercent: 20 | 25 | 33 = 20
): ConcourseResult {
  if (totalBasketed <= 0) {
    return { totalBasketed: 0, prizeLimit: 0, basePercent };
  }

  const limit = Math.ceil(totalBasketed * (basePercent / 100));
  return {
    totalBasketed,
    prizeLimit: limit,
    basePercent,
  };
}

/**
 * Calculates official FCI / PZHGP Coefficient.
 * Formula: Coeff = (position * 1000) / totalBasketed
 * Precision: 3 decimal places (e.g. 1.250).
 */
export function calculateFciCoefficient(position: number, totalBasketed: number): number {
  if (position <= 0 || totalBasketed <= 0) {
    return 0.0;
  }
  const rawCoeff = (position * 1000) / totalBasketed;
  return Math.round(rawCoeff * 1000) / 1000;
}

/**
 * Calculates National Championship (GMP) points according to official PZHGP formula.
 * Formula: P = BaseMax - ((BaseMax - BaseMin) * (position - 1) / (prizeLimit - 1))
 * Standard GMP: BaseMax = 40.00 pkt, BaseMin = 20.00 pkt for Category A/B.
 */
export function calculateGmpPoints(
  position: number,
  prizeLimit: number,
  baseMax = 40.0,
  baseMin = 20.0
): number {
  if (position <= 0 || prizeLimit <= 0 || position > prizeLimit) {
    return 0.0;
  }
  if (prizeLimit === 1) {
    return baseMax;
  }

  const points = baseMax - ((baseMax - baseMin) * (position - 1)) / (prizeLimit - 1);
  return Math.round(points * 100) / 100;
}

/**
 * Computes full prize assessment for an individual pigeon arrival.
 */
export function evaluatePigeonPrize(params: PigeonPrizeCalculation): PigeonPrizeResult {
  const { totalBasketed, position, distanceKm, basePercent = 20 } = params;
  const concourse = calculateConcourseLimit(totalBasketed, basePercent);

  const isPrize = position > 0 && position <= concourse.prizeLimit;
  const fciCoefficient = calculateFciCoefficient(position, totalBasketed);
  const gmpPoints = isPrize ? calculateGmpPoints(position, concourse.prizeLimit) : 0.0;
  const concourseKilometers = isPrize ? Math.round(distanceKm * 100) / 100 : 0.0;

  return {
    position,
    isPrize,
    prizeLimit: concourse.prizeLimit,
    fciCoefficient,
    gmpPoints,
    concourseKilometers,
  };
}

/**
 * Aggregate summary for Ace Pigeon (Lotnik Roku / As) from a series of races.
 */
export interface AcePigeonSummary {
  pigeonId: string;
  ringNumber: string;
  totalPrizes: number; // Liczba konkursów (np. 12/12)
  totalConcourseKm: number; // Suma kkm
  totalGmpPoints: number; // Suma punktów GMP
  averageCoeff: number; // Średni Coeff
  bestCoeff: number; // Najlepszy pojedynczy Coeff
}

export function calculateAcePigeonSummary(
  pigeonId: string,
  ringNumber: string,
  races: { position: number; totalBasketed: number; distanceKm: number }[]
): AcePigeonSummary {
  let totalPrizes = 0;
  let totalKm = 0;
  let totalPoints = 0;
  let coeffSum = 0;
  let bestCoeff = 9999.0;

  for (const r of races) {
    const res = evaluatePigeonPrize({
      position: r.position,
      totalBasketed: r.totalBasketed,
      distanceKm: r.distanceKm,
    });

    if (res.isPrize) {
      totalPrizes += 1;
      totalKm += res.concourseKilometers;
      totalPoints += res.gmpPoints;
      coeffSum += res.fciCoefficient;
      if (res.fciCoefficient < bestCoeff) {
        bestCoeff = res.fciCoefficient;
      }
    }
  }

  const averageCoeff = totalPrizes > 0 ? Math.round((coeffSum / totalPrizes) * 1000) / 1000 : 0.0;

  return {
    pigeonId,
    ringNumber,
    totalPrizes,
    totalConcourseKm: Math.round(totalKm * 100) / 100,
    totalGmpPoints: Math.round(totalPoints * 100) / 100,
    averageCoeff,
    bestCoeff: totalPrizes > 0 ? bestCoeff : 0.0,
  };
}

export type OlympicCategoryCode = 'A' | 'B' | 'C' | 'M' | 'D' | 'F';

export interface OlympicCategoryDefinition {
  code: OlympicCategoryCode;
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  minPrizesRequired: number;
  minTotalConcourseKm: number;
  description: string;
}

export const OLYMPIC_CATEGORIES: Record<OlympicCategoryCode, OlympicCategoryDefinition> = {
  A: {
    code: 'A',
    name: 'Krótki Dystans (Sprint)',
    minDistanceKm: 100,
    maxDistanceKm: 400,
    minPrizesRequired: 5,
    minTotalConcourseKm: 1000,
    description: '100 – 400 km, min. 5 konkursów, min. 1000 kkm. Decyduje najniższy łączny Coeff.',
  },
  B: {
    code: 'B',
    name: 'Średni Dystans',
    minDistanceKm: 300,
    maxDistanceKm: 600,
    minPrizesRequired: 4,
    minTotalConcourseKm: 1400,
    description: '300 – 600 km, min. 4 konkursy, min. 1400 kkm. Decyduje najniższy łączny Coeff.',
  },
  C: {
    code: 'C',
    name: 'Długi Dystans',
    minDistanceKm: 500,
    maxDistanceKm: 9999,
    minPrizesRequired: 3,
    minTotalConcourseKm: 1500,
    description: 'Powyżej 500 km, min. 3 konkursy, min. 1500 kkm. Decyduje najniższy łączny Coeff.',
  },
  M: {
    code: 'M',
    name: 'Maraton',
    minDistanceKm: 700,
    maxDistanceKm: 9999,
    minPrizesRequired: 2,
    minTotalConcourseKm: 1400,
    description: 'Powyżej 700 km, min. 2 konkursy, min. 1400 kkm. Decyduje najniższy łączny Coeff.',
  },
  D: {
    code: 'D',
    name: 'Wyczyn (All-round)',
    minDistanceKm: 100,
    maxDistanceKm: 9999,
    minPrizesRequired: 11,
    minTotalConcourseKm: 3500,
    description: 'Wszystkie kategorie, min. 11 konkursów w sezonie, min. 3500 kkm.',
  },
  F: {
    code: 'F',
    name: 'Młode (Youngsters)',
    minDistanceKm: 100,
    maxDistanceKm: 400,
    minPrizesRequired: 3,
    minTotalConcourseKm: 300,
    description: 'Loty gołębi młodych w roku urodzenia, min. 3 konkursy, min. 300 kkm.',
  },
};

export interface OlympicQualificationResult {
  category: OlympicCategoryCode;
  categoryName: string;
  isQualified: boolean;
  qualifiedPrizesCount: number;
  totalConcourseKm: number;
  totalFciCoeff: number;
  reason?: string;
}

/**
 * Evaluates whether a pigeon qualifies for an Olympic / FCI Sport Category.
 */
export function evaluateOlympicQualification(
  categoryCode: OlympicCategoryCode,
  races: { position: number; totalBasketed: number; distanceKm: number; isPrize?: boolean }[]
): OlympicQualificationResult {
  const def = OLYMPIC_CATEGORIES[categoryCode];
  const eligibleRaces: { coeff: number; km: number }[] = [];

  for (const r of races) {
    const isPrize = r.isPrize ?? r.position <= Math.ceil(r.totalBasketed * 0.2);
    if (!isPrize) continue;

    if (r.distanceKm >= def.minDistanceKm && r.distanceKm <= def.maxDistanceKm) {
      const coeff = calculateFciCoefficient(r.position, r.totalBasketed);
      eligibleRaces.push({ coeff, km: r.distanceKm });
    }
  }

  // Sort by lowest Coeff (best performance)
  eligibleRaces.sort((a, b) => a.coeff - b.coeff);

  const selectedRaces = eligibleRaces.slice(0, def.minPrizesRequired);
  const qualifiedCount = selectedRaces.length;
  const totalKm = Math.round(selectedRaces.reduce((acc, r) => acc + r.km, 0) * 100) / 100;
  const totalCoeff = Math.round(selectedRaces.reduce((acc, r) => acc + r.coeff, 0) * 1000) / 1000;

  const hasEnoughPrizes = qualifiedCount >= def.minPrizesRequired;
  const hasEnoughKm = totalKm >= def.minTotalConcourseKm;
  const isQualified = hasEnoughPrizes && hasEnoughKm;

  let reason: string | undefined;
  if (!hasEnoughPrizes) {
    reason = `Brakuje ${def.minPrizesRequired - qualifiedCount} konkursów (wymagane min. ${def.minPrizesRequired}).`;
  } else if (!hasEnoughKm) {
    reason = `Brakuje ${(def.minTotalConcourseKm - totalKm).toFixed(1)} kkm (wymagane min. ${def.minTotalConcourseKm} kkm).`;
  }

  return {
    category: categoryCode,
    categoryName: def.name,
    isQualified,
    qualifiedPrizesCount: qualifiedCount,
    totalConcourseKm: totalKm,
    totalFciCoeff: isQualified ? totalCoeff : 9999.0,
    reason,
  };
}

/**
 * Evaluates Team / Loft Championship score from a single race (e.g. 5 z 50).
 */
export function calculateTeamSeriesScore(
  seriesType: '5_from_50' | '7_from_all',
  arrivals: { isTip: boolean; isPrize: boolean; gmpPoints: number; ringNumber: string }[]
): {
  totalSeriesPoints: number;
  countingPigeonsCount: number;
  countingBirds: { ringNumber: string; points: number }[];
} {
  const maxCounting = seriesType === '5_from_50' ? 5 : 7;

  // Filter only prize winners; if 5_from_50, only tipped birds (isTip === true)
  const candidateBirds = arrivals.filter((a) => {
    if (!a.isPrize) return false;
    if (seriesType === '5_from_50' && !a.isTip) return false;
    return true;
  });

  // Sort by highest GMP points
  candidateBirds.sort((a, b) => b.gmpPoints - a.gmpPoints);

  const counting = candidateBirds.slice(0, maxCounting);
  const totalSeriesPoints = Math.round(counting.reduce((acc, b) => acc + b.gmpPoints, 0) * 100) / 100;

  return {
    totalSeriesPoints,
    countingPigeonsCount: counting.length,
    countingBirds: counting.map((b) => ({ ringNumber: b.ringNumber, points: b.gmpPoints })),
  };
}

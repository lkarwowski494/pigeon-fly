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

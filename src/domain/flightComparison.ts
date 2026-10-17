/**
 * PIGEON-FLY — Branch & District Race Comparison Engine (Z-051, BR-LOT-012)
 * Comprehensive post-race analysis comparing individual loft results against
 * the entire PZHGP Branch (Oddział) or District (Okręg) competition sheet:
 * - Speed delta vs Branch Top 1 and concourse close (baza 20%)
 * - Flock compactness and arrival tempo
 * - Loft efficiency quota vs branch average (konkursy z kosza %)
 * - Geographic & wind handicap diagnosis (front vs back lofts, crosswind drift)
 * - Traditional & GMP championship points preview.
 */

import { ArrivalWithPigeon } from '../db/raceRepository';
import { calculateFciCoefficient } from './concourse';

export interface BranchRaceStats {
  branchName: string;
  totalLoftsCount: number;
  totalBirdsBasketed: number;
  prizeLimit: number; // np. 20% z totalBirdsBasketed
  basePercent: 20 | 25 | 33;
  winnerBird: {
    breederName: string;
    ringNumber: string;
    speedMPerMin: number;
    arrivalTimeIso: string;
    distanceKm: number;
  };
  closingBird: {
    speedMPerMin: number;
    arrivalTimeIso: string;
  };
  raceCategory: 'A' | 'B' | 'C' | 'M' | 'Maraton';
  averageBranchDistanceKm: number;
  windInfo?: {
    speedKmh: number;
    directionDeg: number; // 0-360 deg
    description: string;
  };
}

export interface LoftRaceInput {
  loftName: string;
  loftDistanceKm: number;
  basketedCount: number;
  arrivals: ArrivalWithPigeon[];
}

export type LoftPerformanceTier =
  | 'outstanding_domination' // Ponad 40% konkursów, ptaki w szpicy
  | 'solid_above_average' // 25-39% konkursów, dobra regularność
  | 'average_in_limit' // 15-24% konkursów, blisko średniej oddziałowej
  | 'below_average_warning' // 5-14% konkursów, wyraźne braki
  | 'critical_failure'; // <5% konkursów, rozbicie stada / błędy przygotowania

export interface FlightComparisonReport {
  branchName: string;
  loftName: string;
  loftDistanceKm: number;
  branchAverageDistanceKm: number;
  distanceHandicapType: 'front_short_loft' | 'neutral' | 'back_long_loft';
  distanceDifferenceKm: number;

  totalBasketedLoft: number;
  prizesWonCount: number;
  loftEfficiencyPercent: number; // np. 35.0%
  branchEfficiencyPercent: number; // np. 20.0%
  efficiencyMultiplier: number; // np. 1.75x średniej oddziałowej

  winnerSpeedMPerMin: number;
  loftFirstSpeedMPerMin: number;
  speedDeltaWinnerMPerMin: number; // Jeśli ujemna, to strata do zwycięzcy
  concourseClosingSpeedMPerMin: number;
  speedDeltaCloseMPerMin: number;

  loftTopPositionEstimated: number; // Szacowane miejsce w oddziale 1. gołębia
  estimatedFciCoeffTop1: number;

  flockArrivalCompactness: {
    firstArrivalTimeIso?: string;
    tenthArrivalTimeIso?: string;
    durationTo10thMinutes?: number;
    compactnessEvaluation: 'very_tight' | 'moderate' | 'scattered' | 'insufficient_birds';
  };

  windHandicapAnalysis: {
    crosswindImpact: 'favorable_drift' | 'neutral' | 'unfavorable_drift';
    notes: string;
  };

  performanceTier: LoftPerformanceTier;
  tacticalDiagnosisTitle: string;
  tacticalDiagnosisDetails: string[];
  coachRecommendations: string[];
}

/**
 * Calculates full comparative flight report of loft performance against branch.
 */
export function calculateFlightComparison(
  loft: LoftRaceInput,
  branch: BranchRaceStats
): FlightComparisonReport {
  const sortedArrivals = [...loft.arrivals].sort(
    (a, b) => b.velocityMPerMin - a.velocityMPerMin
  );

  const totalBasketedLoft = Math.max(1, loft.basketedCount);
  const closingSpeed = branch.closingBird.speedMPerMin;

  // Filter birds with speed >= branch closing speed (earned a prize in 20% base)
  const prizeArrivals = sortedArrivals.filter(
    (a) => a.velocityMPerMin >= closingSpeed
  );
  const prizesWonCount = prizeArrivals.length;
  const loftEfficiencyPercent = Number(
    ((prizesWonCount / totalBasketedLoft) * 100).toFixed(1)
  );
  const branchEfficiencyPercent = branch.basePercent;
  const efficiencyMultiplier = Number(
    (loftEfficiencyPercent / branchEfficiencyPercent).toFixed(2)
  );

  const winnerSpeed = branch.winnerBird.speedMPerMin;
  const loftFirstSpeed = sortedArrivals.length > 0 ? sortedArrivals[0].velocityMPerMin : 0;
  const speedDeltaWinner = Number((loftFirstSpeed - winnerSpeed).toFixed(2));
  const speedDeltaClose =
    sortedArrivals.length > 0
      ? Number((sortedArrivals[0].velocityMPerMin - closingSpeed).toFixed(2))
      : 0;

  // Estimate branch position:
  // If our speed >= winner speed -> pos 1
  // Heuristic mapping: based on speed distribution between winner and close
  let estimatedTopPos = 1;
  if (loftFirstSpeed >= winnerSpeed) {
    estimatedTopPos = 1;
  } else if (loftFirstSpeed <= closingSpeed) {
    estimatedTopPos = branch.prizeLimit + 1;
  } else {
    const span = winnerSpeed - closingSpeed;
    const progress = (winnerSpeed - loftFirstSpeed) / (span || 1);
    estimatedTopPos = Math.max(
      2,
      Math.min(branch.prizeLimit, Math.round(1 + progress * branch.prizeLimit))
    );
  }

  const estimatedFciCoeffTop1 = calculateFciCoefficient(
    estimatedTopPos,
    branch.totalBirdsBasketed
  );

  // Distance handicap analysis
  const distDiffKm = Number((loft.loftDistanceKm - branch.averageBranchDistanceKm).toFixed(1));
  let distanceHandicap: 'front_short_loft' | 'neutral' | 'back_long_loft' = 'neutral';
  if (distDiffKm < -5) {
    distanceHandicap = 'front_short_loft'; // Przedni gołębnik (krótszy nadlot)
  } else if (distDiffKm > 5) {
    distanceHandicap = 'back_long_loft'; // Głęboki gołębnik (dłuższy nadlot)
  }

  // Flock Compactness (zwartość stada)
  const firstArrival = sortedArrivals[0];
  const tenthArrival = sortedArrivals.length >= 10 ? sortedArrivals[9] : undefined;
  let durationTo10thMin: number | undefined;
  let compactnessEval: 'very_tight' | 'moderate' | 'scattered' | 'insufficient_birds' =
    'insufficient_birds';

  if (firstArrival && tenthArrival) {
    const tFirst = new Date(firstArrival.arrivalTime).getTime();
    const tTenth = new Date(tenthArrival.arrivalTime).getTime();
    durationTo10thMin = Math.max(0, Math.round((tTenth - tFirst) / (1000 * 60)));

    if (durationTo10thMin <= 8) {
      compactnessEval = 'very_tight';
    } else if (durationTo10thMin <= 20) {
      compactnessEval = 'moderate';
    } else {
      compactnessEval = 'scattered';
    }
  }

  // Wind handicap analysis
  let crosswindImpact: 'favorable_drift' | 'neutral' | 'unfavorable_drift' = 'neutral';
  let windNotes = 'Brak istotnego dryfu bocznego na trasie przelotu.';

  if (branch.windInfo && branch.windInfo.speedKmh >= 15) {
    // If wind is strong, crosswind shifts flight corridor
    if (branch.windInfo.directionDeg >= 225 && branch.windInfo.directionDeg <= 315) {
      // West / North-West wind pushes birds to the East side of branch
      crosswindImpact = 'favorable_drift';
      windNotes = `Wiatr zachodni (${branch.windInfo.speedKmh} km/h) spychał korytarz lotu na wschód oddziału.`;
    } else if (branch.windInfo.directionDeg >= 45 && branch.windInfo.directionDeg <= 135) {
      // East wind
      crosswindImpact = 'unfavorable_drift';
      windNotes = `Wiatr wschodni (${branch.windInfo.speedKmh} km/h) faworyzował zachodnie skrzydło oddziału.`;
    }
  }

  // Determine Performance Tier
  let performanceTier: LoftPerformanceTier = 'average_in_limit';
  if (loftEfficiencyPercent >= 40) {
    performanceTier = 'outstanding_domination';
  } else if (loftEfficiencyPercent >= 25) {
    performanceTier = 'solid_above_average';
  } else if (loftEfficiencyPercent >= 15) {
    performanceTier = 'average_in_limit';
  } else if (loftEfficiencyPercent >= 5) {
    performanceTier = 'below_average_warning';
  } else {
    performanceTier = 'critical_failure';
  }

  // Tactical Diagnoses & Recommendations
  const tacticalDiagnosisDetails: string[] = [];
  const coachRecommendations: string[] = [];
  let tacticalDiagnosisTitle = '';

  switch (performanceTier) {
    case 'outstanding_domination':
      tacticalDiagnosisTitle = '👑 Dominacja w Oddziale';
      tacticalDiagnosisDetails.push(
        `Wspaniały wynik: ${loftEfficiencyPercent}% stada w konkursie (wskaźnik ${efficiencyMultiplier}x normy oddziałowej).`,
        `Pierwszy gołąb odbity z prędkością ${loftFirstSpeed.toFixed(1)} m/min (szacowana pozycja #${estimatedTopPos} w oddziale, Coeff: ${estimatedFciCoeffTop1}).`
      );
      coachRecommendations.push(
        'Utrzymaj obecną rotację węglowodanowo-tłuszczową w diecie.',
        'Nie zmieniaj motywacji wdowieństwa — system funkcjonuje bezbłędnie.'
      );
      break;

    case 'solid_above_average':
      tacticalDiagnosisTitle = '🥈 Solidny Lot Powyżej Średniej';
      tacticalDiagnosisDetails.push(
        `Wynik ${loftEfficiencyPercent}% stada w konkursie przewyższa średnią oddziałową bazy 20%.`,
        `Strata do zwycięzcy oddziału: ${Math.abs(speedDeltaWinner).toFixed(1)} m/min.`
      );
      coachRecommendations.push(
        'Skup się na przyspieszeniu pierwszych 3 minut po locie (szpica).',
        'Sprawdź drogi oddechowe (olejki eteryczne na karmę w środę).'
      );
      break;

    case 'average_in_limit':
      tacticalDiagnosisTitle = '⚖️ Wynik Przeciętny w Limicie';
      tacticalDiagnosisDetails.push(
        `Zdobyto ${prizesWonCount} konkursów z ${totalBasketedLoft} włożonych (${loftEfficiencyPercent}%).`,
        `Ptaki doleciały poprawnie, lecz zabrakło prędkości w czubie konkursu.`
      );
      coachRecommendations.push(
        'Wprowadź dodatkowy trening wywózkowy 25-30 km w środę rano.',
        'Zwiększ udział kukurydzy cribs i orzeszków ziemnych w ostatnich 3 posiłkach przed koszowaniem.'
      );
      break;

    case 'below_average_warning':
      tacticalDiagnosisTitle = '⚠️ Ostrzeżenie: Wynik Poniżej Oczekiwań';
      tacticalDiagnosisDetails.push(
        `Niska wydajność ${loftEfficiencyPercent}% z kosza. ${totalBasketedLoft - prizesWonCount} ptaków poza konkursem.`,
        distanceHandicap === 'front_short_loft'
          ? 'Gołębie z przodu oddziału mogły minąć gołębnik w stadzie i wracać z głębi.'
          : 'Możliwe zmęczenie mięśniowe lub niedostateczna regeneracja po poprzednim locie.'
      );
      coachRecommendations.push(
        'Wykonaj kontrolne badanie wola i kału na obecność Trichomonas i kokcydiów.',
        'Zastosuj 2 dni lekkiej karmy dietetycznej (Depurative) z elektrolitami i witaminą C.'
      );
      break;

    case 'critical_failure':
      tacticalDiagnosisTitle = '🛑 Alert Taktyczny: Rozbicie Stada';
      tacticalDiagnosisDetails.push(
        `Zaledwie ${loftEfficiencyPercent}% stada w limicie konkursowym.`,
        'Poważny problem z orientacją lub gwałtowny spadek odporności/infekcja.'
      );
      coachRecommendations.push(
        'Wstrzymaj koszowanie czołowych lotników w najbliższym locie.',
        'Skonsultuj stado z lekarzem weterynarii przed kolejnym weekendem.'
      );
      break;
  }

  if (compactnessEval === 'very_tight') {
    tacticalDiagnosisDetails.push(
      `Znakomita zwartość stada: pierwsze 10 ptaków zameldowało się w zaledwie ${durationTo10thMin} min!`
    );
  } else if (compactnessEval === 'scattered') {
    tacticalDiagnosisDetails.push(
      `Rozciągnięty powrót: ${durationTo10thMin} minut między 1. a 10. gołębiem wskazuje na nierówną formę poszczególnych wdowców.`
    );
  }

  return {
    branchName: branch.branchName,
    loftName: loft.loftName,
    loftDistanceKm: loft.loftDistanceKm,
    branchAverageDistanceKm: branch.averageBranchDistanceKm,
    distanceHandicapType: distanceHandicap,
    distanceDifferenceKm: distDiffKm,

    totalBasketedLoft,
    prizesWonCount,
    loftEfficiencyPercent,
    branchEfficiencyPercent,
    efficiencyMultiplier,

    winnerSpeedMPerMin: winnerSpeed,
    loftFirstSpeedMPerMin: loftFirstSpeed,
    speedDeltaWinnerMPerMin: speedDeltaWinner,
    concourseClosingSpeedMPerMin: closingSpeed,
    speedDeltaCloseMPerMin: speedDeltaClose,

    loftTopPositionEstimated: estimatedTopPos,
    estimatedFciCoeffTop1,

    flockArrivalCompactness: {
      firstArrivalTimeIso: firstArrival?.arrivalTime,
      tenthArrivalTimeIso: tenthArrival?.arrivalTime,
      durationTo10thMinutes: durationTo10thMin,
      compactnessEvaluation: compactnessEval,
    },

    windHandicapAnalysis: {
      crosswindImpact,
      notes: windNotes,
    },

    performanceTier,
    tacticalDiagnosisTitle,
    tacticalDiagnosisDetails,
    coachRecommendations,
  };
}

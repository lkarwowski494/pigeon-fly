/**
 * PIGEON-FLY — Commercial Market Valuation Engine (Z-048, DEC-07)
 * Objective market value appraisal for racing and breeding pigeons (PLN / EUR).
 * Accounts for competition prizes (1:5, 1:100, 1st awards), FCI coefficients,
 * national and olympic titles, pedigree bloodline tiers, Wright's inbreeding,
 * conformation standard score, and proven progeny.
 */

export const PLN_TO_EUR_EXCHANGE_RATE = 4.3;

export type PigeonRole = 'racer' | 'breeder' | 'youngster';

export type BloodlineTier =
  | 'ordinary' // Zwykłe pochodzenie użytkowe
  | 'regional_winner' // Linia zwycięzców oddziałowych / okręgowych
  | 'national_ace_bloodline' // Linia Asów Narodowych / Mistrzów Polski
  | 'olympic_dynasty'; // Potomkowie medalistów Olimpijskich (FCI Olympiad / PIPA Top)

export type ValuationTier =
  | 'club_level' // Poziom klubowy / oddziałowy (< 600 PLN)
  | 'regional_ace' // As Okręgu / Regionu (600 - 2 500 PLN)
  | 'national_elite' // Narodowa Elita Sportowa (2 500 - 10 000 PLN)
  | 'olympic_international'; // Klasa Międzynarodowa / Olimpijska (> 10 000 PLN)

export interface PigeonValuationInput {
  ringNumber: string;
  ageYears?: number;
  sex?: 'cock' | 'hen';
  role: PigeonRole;
  totalPrizes: number; // Łączna liczba konkursów w karierze
  prizesBase20?: number; // Konkursy w bazie 20% (1:5)
  top100Prizes?: number; // Konkursy w pierwszej 100-tce oddziału
  firstPrizes?: number; // 1. nagrody (zwycięzca lotu)
  podiumPrizes?: number; // 2. i 3. miejsca
  bestFciCoefficient?: number; // Najlepszy uzyskany coeficient (np. 8.42)
  olympicOrNationalTitles?: string[];
  bloodlineTier: BloodlineTier;
  inbreedingCoefficient?: number; // Współczynnik inbredu Wrighta F w % (np. 6.25%)
  conformationScoreFci?: number; // Punkty z oceny budowy (90.00 - 95.00 pkt)
  provenChildrenPrizes?: number; // Konkursy zdobyte przez potomstwo
}

export interface ValuationBreakdownItem {
  category: string;
  plnValue: number;
  description: string;
}

export interface PigeonMarketValuation {
  ringNumber: string;
  tier: ValuationTier;
  tierTitle: string;
  estimatedValuePln: {
    min: number;
    median: number;
    max: number;
  };
  estimatedValueEur: {
    min: number;
    median: number;
    max: number;
  };
  breakdown: ValuationBreakdownItem[];
  auctionRecommendation: {
    startingBidPln: number;
    reservePricePln: number;
    buyNowPln?: number;
    recommendedPlatform: 'local_section' | 'national_auction' | 'international_pipa_herbots';
  };
  valuationSummary: string;
}

/**
 * Calculates objective market valuation of a pigeon based on performance, pedigree, and conformation.
 */
export function calculateMarketValuation(input: PigeonValuationInput): PigeonMarketValuation {
  const breakdown: ValuationBreakdownItem[] = [];

  // 1. Base value according to bird role
  let basePln = 200;
  if (input.role === 'racer') basePln = 300;
  if (input.role === 'breeder') basePln = 450;
  if (input.role === 'youngster') basePln = 200;

  breakdown.push({
    category: 'Wartość bazowa (Rola)',
    plnValue: basePln,
    description: `Wartość wyjściowa dla statusu: ${
      input.role === 'racer' ? 'Lotnik' : input.role === 'breeder' ? 'Rozpłodowiec' : 'Młódek'
    }`,
  });

  let performancePln = 0;

  // 2. Regular and Top 100 prizes
  const totalPrizes = Math.max(0, input.totalPrizes);
  const prizesValue = totalPrizes * 70;
  performancePln += prizesValue;
  if (totalPrizes > 0) {
    breakdown.push({
      category: 'Dorobek konkursowy',
      plnValue: prizesValue,
      description: `${totalPrizes} konkursów w karierze (baza 1:5)`,
    });
  }

  const top100 = Math.max(0, input.top100Prizes || 0);
  if (top100 > 0) {
    const top100Val = top100 * 130;
    performancePln += top100Val;
    breakdown.push({
      category: 'Konkursy w szpicy (Top 100)',
      plnValue: top100Val,
      description: `${top100} konkursów w pierwszej setce oddziału`,
    });
  }

  // 3. 1st prizes and podium finishes
  const firsts = Math.max(0, input.firstPrizes || 0);
  if (firsts > 0) {
    const firstVal = firsts * 1200;
    performancePln += firstVal;
    breakdown.push({
      category: 'Zwycięstwa w locie (1. nagrody)',
      plnValue: firstVal,
      description: `${firsts}x 1. konkurs w locie konkursowym`,
    });
  }

  const podium = Math.max(0, input.podiumPrizes || 0);
  if (podium > 0) {
    const podiumVal = podium * 450;
    performancePln += podiumVal;
    breakdown.push({
      category: 'Miejsca na podium (2.-3.)',
      plnValue: podiumVal,
      description: `${podium}x 2. lub 3. konkurs w oddziale`,
    });
  }

  // 4. FCI Coefficient bonus
  if (input.bestFciCoefficient !== undefined && input.bestFciCoefficient > 0) {
    const coeff = input.bestFciCoefficient;
    let coeffBonus = 0;
    let desc = '';
    if (coeff < 10.0) {
      coeffBonus = 3000;
      desc = `Genialny Coeficient FCI: ${coeff.toFixed(2)} (Poziom As Narodowy)`;
    } else if (coeff < 25.0) {
      coeffBonus = 1400;
      desc = `Wybitny Coeficient FCI: ${coeff.toFixed(2)} (Czołówka Okręgu)`;
    } else if (coeff < 60.0) {
      coeffBonus = 500;
      desc = `Bardzo dobry Coeficient FCI: ${coeff.toFixed(2)}`;
    }
    if (coeffBonus > 0) {
      performancePln += coeffBonus;
      breakdown.push({
        category: 'Jakość coeficientu FCI',
        plnValue: coeffBonus,
        description: desc,
      });
    }
  }

  // 5. Championship and Olympic titles
  const titles = input.olympicOrNationalTitles || [];
  if (titles.length > 0) {
    const titleVal = titles.length * 2500;
    performancePln += titleVal;
    breakdown.push({
      category: 'Tytuły Mistrzowskie / Olimpijskie',
      plnValue: titleVal,
      description: titles.join(', '),
    });
  }

  // 6. Proven Progeny
  const childrenPrizes = Math.max(0, input.provenChildrenPrizes || 0);
  if (childrenPrizes > 0) {
    const progenyVal = childrenPrizes * 180;
    performancePln += progenyVal;
    breakdown.push({
      category: 'Sprawdzone potomstwo',
      plnValue: progenyVal,
      description: `${childrenPrizes} konkursów zdobytych przez bezpośrednie dzieci`,
    });
  }

  let totalBeforeMultipliers = basePln + performancePln;

  // 7. Bloodline Multiplier
  let bloodlineMult = 1.0;
  if (input.bloodlineTier === 'olympic_dynasty') bloodlineMult = 2.2;
  else if (input.bloodlineTier === 'national_ace_bloodline') bloodlineMult = 1.6;
  else if (input.bloodlineTier === 'regional_winner') bloodlineMult = 1.25;

  if (bloodlineMult > 1.0) {
    const bloodlineBonus = Math.round(totalBeforeMultipliers * (bloodlineMult - 1.0));
    breakdown.push({
      category: 'Premia rodowodowa',
      plnValue: bloodlineBonus,
      description: `Mnożnik x${bloodlineMult} za pochodzenie: ${
        input.bloodlineTier === 'olympic_dynasty'
          ? 'Dynastia Olimpijska'
          : input.bloodlineTier === 'national_ace_bloodline'
          ? 'Linia Asów Narodowych'
          : 'Linia Mistrzów Okręgu'
      }`,
    });
    totalBeforeMultipliers += bloodlineBonus;
  }

  // 8. Inbreeding adjustment
  if (input.inbreedingCoefficient !== undefined && input.inbreedingCoefficient > 0) {
    const F = input.inbreedingCoefficient;
    if (F >= 3.125 && F <= 12.5) {
      const inbredBonus = Math.round(totalBeforeMultipliers * 0.15);
      breakdown.push({
        category: 'Konsolidacja genetyczna (Inbred)',
        plnValue: inbredBonus,
        description: `Optymalny inbred F=${F.toFixed(2)}% — wzmacnia cechy rozpłodowe`,
      });
      totalBeforeMultipliers += inbredBonus;
    } else if (F > 25.0 && input.role === 'racer') {
      const inbredPenalty = Math.round(totalBeforeMultipliers * -0.12);
      breakdown.push({
        category: 'Korekta inbredowa (Ryzyko lotowe)',
        plnValue: inbredPenalty,
        description: `Wysoki inbred F=${F.toFixed(2)}% — ryzyko spadku wigoru w locie`,
      });
      totalBeforeMultipliers += inbredPenalty;
    }
  }

  // 9. Conformation adjustment
  if (input.conformationScoreFci !== undefined) {
    const score = input.conformationScoreFci;
    if (score >= 93.0) {
      const confBonus = Math.round(totalBeforeMultipliers * 0.15);
      breakdown.push({
        category: 'Budowa anatomiczna (FCI Standard)',
        plnValue: confBonus,
        description: `Wzorcowa budowa ciała: ${score.toFixed(2)} pkt FCI`,
      });
      totalBeforeMultipliers += confBonus;
    } else if (score < 91.0) {
      const confPenalty = Math.round(totalBeforeMultipliers * -0.15);
      breakdown.push({
        category: 'Korekta budowy anatomicznej',
        plnValue: confPenalty,
        description: `Ocena budowy poniżej normy: ${score.toFixed(2)} pkt FCI`,
      });
      totalBeforeMultipliers += confPenalty;
    }
  }

  // Final median clamping
  const medianPln = Math.max(150, Math.round(totalBeforeMultipliers / 10) * 10);
  const minPln = Math.round((medianPln * 0.8) / 10) * 10;
  const maxPln = Math.round((medianPln * 1.3) / 10) * 10;

  const medianEur = Math.round(medianPln / PLN_TO_EUR_EXCHANGE_RATE);
  const minEur = Math.round(minPln / PLN_TO_EUR_EXCHANGE_RATE);
  const maxEur = Math.round(maxPln / PLN_TO_EUR_EXCHANGE_RATE);

  // Determine Valuation Tier
  let tier: ValuationTier = 'club_level';
  let tierTitle = 'Klasa Oddziałowa / Klubowa';
  let recommendedPlatform: PigeonMarketValuation['auctionRecommendation']['recommendedPlatform'] =
    'local_section';

  if (medianPln >= 10000) {
    tier = 'olympic_international';
    tierTitle = 'Klasa Międzynarodowa / Wybitny As';
    recommendedPlatform = 'international_pipa_herbots';
  } else if (medianPln >= 2500) {
    tier = 'national_elite';
    tierTitle = 'Narodowa Elita Sportowa';
    recommendedPlatform = 'national_auction';
  } else if (medianPln >= 600) {
    tier = 'regional_ace';
    tierTitle = 'Czołówka Okręgowa / As Regionu';
    recommendedPlatform = 'national_auction';
  }

  const startingBidPln = Math.round((medianPln * 0.5) / 10) * 10;
  const reservePricePln = Math.round((medianPln * 0.85) / 10) * 10;
  const buyNowPln = Math.round((medianPln * 1.4) / 10) * 10;

  const summary = `Szacowana rynkowa wartość gołębia ${input.ringNumber} wynosi ${medianPln} PLN (~${medianEur} EUR). Zakres widełkowy: ${minPln} - ${maxPln} PLN (${minEur} - ${maxEur} EUR). Kwalifikacja do kategorii: ${tierTitle}.`;

  return {
    ringNumber: input.ringNumber,
    tier,
    tierTitle,
    estimatedValuePln: {
      min: minPln,
      median: medianPln,
      max: maxPln,
    },
    estimatedValueEur: {
      min: minEur,
      median: medianEur,
      max: maxEur,
    },
    breakdown,
    auctionRecommendation: {
      startingBidPln,
      reservePricePln,
      buyNowPln,
      recommendedPlatform,
    },
    valuationSummary: summary,
  };
}

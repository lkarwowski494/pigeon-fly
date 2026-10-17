/**
 * PIGEON-FLY — Intelligent Pairing & Genetic Breeding Assistant Engine (Z-052)
 * Evaluates prospective cock x hen pairings based on:
 * - Wright's Inbreeding Coefficient (F) and safety tiers (outcross vs linebreeding vs inbreeding depression)
 * - Physical conformation compensation (forearm leverage, primary flights ventilation, muscle elasticity, vent bones)
 * - Eye sign & breeding circle (pierścień adaptacyjny)
 * - Distance category synergy (Kat. A/B/C/M)
 * Yields overall compatibility score (0-100), breeding tier, anticipated chick traits, and actionable AI advice.
 */

export type ForearmLength = 'short' | 'medium' | 'long';
export type PrimaryFlightsType = 'long_ventilated' | 'medium_standard' | 'short_broad';
export type MuscleElasticity = 'fibrillar_supple' | 'medium_firm' | 'heavy_stiff';
export type VentBonesTightness = 'tight_rock_hard' | 'slightly_open' | 'weak_wide';
export type EyeSignCircle = 'full_360' | 'partial_half' | 'none';
export type RaceCategorySpecialty = 'sprint_A' | 'middle_B' | 'long_C' | 'marathon_M' | 'all_round';

export interface BreederBirdProfile {
  id: string;
  ringNumber: string;
  name?: string;
  sex: 'cock' | 'hen';
  bloodline?: string; // np. "Gaby Vandenabeele", "De Rauw-Sablon", "Janssen"
  conformation: {
    forearm: ForearmLength;
    primaryFlights: PrimaryFlightsType;
    muscle: MuscleElasticity;
    ventBones: VentBonesTightness;
    eyeCircle: EyeSignCircle;
  };
  raceSpecialty: RaceCategorySpecialty;
  totalPrizesWon?: number;
  fciAcePoints?: number; // Dorobek konkursowy (0-100)
}

export type PairingTier =
  | 'elite_champion' // 90-100 pkt: idealna kompensacja, optymalna genetyka
  | 'highly_recommended' // 75-89 pkt: bardzo silna para, wysoki potencjał
  | 'acceptable' // 60-74 pkt: para poprawna, drobne braki kompensacji
  | 'not_recommended'; // <60 pkt: ryzyko inbredu lub kumulacja wad budowy

export interface PairingSynergyResult {
  overallScore: number; // 0 - 100
  tier: PairingTier;
  tierLabel: string;
  breakdown: {
    conformationCompensationScore: number; // max 35
    geneticDiversityScore: number; // max 35
    racePerformanceScore: number; // max 30
  };
  inbreedingCoefficientF: number; // 0.0 do 1.0
  inbreedingEvaluation: string;
  isHighInbreedingRisk: boolean;
  compensationHighlights: string[];
  anticipatedChickTraits: string[];
  targetCategoryRecommended: string;
  aiBreedingAdvice: string;
}

/**
 * Calculates compatibility and breeding synergy between prospective cock and hen.
 */
export function evaluateBreedingPair(
  cock: BreederBirdProfile,
  hen: BreederBirdProfile,
  options?: {
    calculatedInbreedingF?: number; // Jeśli obliczono z rodowodów, np. 0.0625 (6.25%)
  }
): PairingSynergyResult {
  const compHighlights: string[] = [];
  const chickTraits: string[] = [];

  // 1. CONFORMATION COMPENSATION (Max 35 pts)
  let confScore = 20; // baseline

  // Forearm & Wing leverage compensation:
  // Short forearm + long ventilated flights is the gold standard for aerodynamic efficiency.
  const hasShortForearm =
    cock.conformation.forearm === 'short' || hen.conformation.forearm === 'short';
  const hasLongFlights =
    cock.conformation.primaryFlights === 'long_ventilated' ||
    hen.conformation.primaryFlights === 'long_ventilated';

  if (hasShortForearm && hasLongFlights) {
    confScore += 6;
    compHighlights.push('Kompensacja skrzydła: krótkie przedramię dźwigniowe w parze z długą wentylowaną lotką.');
    chickTraits.push('Znakomity profil aerodynamiczny skrzydła o wysokiej nośności.');
  } else if (
    cock.conformation.forearm === 'long' &&
    hen.conformation.forearm === 'long'
  ) {
    confScore -= 5;
    compHighlights.push('Uwaga: Oboje partnerzy mają długie przedramię (słabsza dźwignia i szybsze zmęczenie skrzydła).');
  }

  // Muscle Elasticity compensation:
  // Supple, vibrating fibrillar muscle is ideal. Never pair heavy+heavy.
  if (
    cock.conformation.muscle === 'fibrillar_supple' &&
    hen.conformation.muscle === 'fibrillar_supple'
  ) {
    confScore += 6;
    compHighlights.push('Elastyczność mięśniowa: oboje partnerzy posiadają wybitne mięśnie drgające (typ długodystansowy).');
    chickTraits.push('Wysoka odporność mięśni piersiowych na kwas mlekowy w trudnych lotach pod wiatr.');
  } else if (
    (cock.conformation.muscle === 'fibrillar_supple' && hen.conformation.muscle === 'heavy_stiff') ||
    (cock.conformation.muscle === 'heavy_stiff' && hen.conformation.muscle === 'fibrillar_supple')
  ) {
    confScore += 4;
    compHighlights.push('Pozytywna kompensacja umięśnienia: elastyczny partner równoważy cięższe mięśnie partnera.');
  } else if (
    cock.conformation.muscle === 'heavy_stiff' &&
    hen.conformation.muscle === 'heavy_stiff'
  ) {
    confScore -= 6;
    compHighlights.push('Wada krytyczna: podwójne ciężkie mięśnie — wysokie ryzyko potomstwa ociężałego, tracącego siły po 4h lotu.');
  }

  // Vent Bones (widełki miednicowe):
  // Cock MUST be rock-hard tight.
  if (cock.conformation.ventBones === 'tight_rock_hard') {
    confScore += 3;
  } else if (cock.conformation.ventBones === 'weak_wide') {
    confScore -= 5;
    compHighlights.push('Samiec posiada luźne widełki miednicowe — cecha niepożądana w linii męskiej.');
  }

  // Eye sign (pierścień adaptacyjny 360°):
  if (
    cock.conformation.eyeCircle === 'full_360' ||
    hen.conformation.eyeCircle === 'full_360'
  ) {
    confScore += 3;
    compHighlights.push('Obecny pełny pierścień adaptacyjny oka 360° (silny marker przekaźnictwa cech orientacyjnych).');
    chickTraits.push('Głęboka pigmentacja tęczówki z wyraźnym pierścieniem korelacji.');
  }

  confScore = Math.max(5, Math.min(35, confScore));

  // 2. GENETICS & WRIGHT'S INBREEDING F (Max 35 pts)
  let inbreedingF = options?.calculatedInbreedingF ?? 0.0;
  // Fallback heuristic if bloodlines identical
  if (cock.bloodline && hen.bloodline && cock.bloodline === hen.bloodline && inbreedingF === 0) {
    inbreedingF = 0.0625; // 6.25% linebreeding default
  }

  let genScore = 20;
  let inbreedingEval = '';
  let isHighRisk = false;

  if (inbreedingF === 0) {
    genScore = 32; // Pure outcross = high heterosis
    inbreedingEval = 'Czysty Outcross (F = 0.0%): maksymalny efekt bujności mieszańców (heterozji), idealny na lotniki.';
    chickTraits.push('Wysoki wigor biologiczny i żywotność pierwszego pokolenia (F1).');
  } else if (inbreedingF >= 0.03125 && inbreedingF <= 0.125) {
    genScore = 35; // Optimum linebreeding!
    inbreedingEval = `Optymalny Inbred Liniowy (F = ${(inbreedingF * 100).toFixed(1)}%): złoty środek utrwalający cechy wybitnego przodka bez depresji wsobnej.`;
    chickTraits.push('Utrwalenie genotypu wybitnej linii rozpłodowej.');
  } else if (inbreedingF > 0.125 && inbreedingF <= 0.20) {
    genScore = 24;
    inbreedingEval = `Bliski Inbred (F = ${(inbreedingF * 100).toFixed(1)}%): dopuszczalny wyłącznie w celu budowy czystego szczepu rozpłodowego.`;
  } else {
    genScore = 10;
    isHighRisk = true;
    inbreedingEval = `Ekstremalny Inbred (F = ${(inbreedingF * 100).toFixed(1)}%): wysokie ryzyko depresji wsobnej, spadku witalności i wad upierzenia!`;
  }

  genScore = Math.max(5, Math.min(35, genScore));

  // 3. RACE PERFORMANCE & DISTANCE SYNERGY (Max 30 pts)
  let perfScore = 15;
  const cockPrizes = cock.totalPrizesWon || 0;
  const henPrizes = hen.totalPrizesWon || 0;

  if (cockPrizes >= 20 || henPrizes >= 20) {
    perfScore += 10;
  } else if (cockPrizes >= 10 || henPrizes >= 10) {
    perfScore += 6;
  }

  // Category synergy
  let targetCategory = 'Kategoria All-Round (100 - 700 km)';
  if (cock.raceSpecialty === 'marathon_M' && hen.raceSpecialty === 'marathon_M') {
    perfScore += 5;
    targetCategory = 'Ekstremalny Maraton (Kat. M / Powyżej 700 km)';
    chickTraits.push('Żelazna wytrzymałość i zdolność do lotu o zmierzchu/świcie.');
  } else if (cock.raceSpecialty === 'sprint_A' && hen.raceSpecialty === 'sprint_A') {
    perfScore += 5;
    targetCategory = 'Czysty Sprint (Kat. A / 100 - 400 km)';
    chickTraits.push('Błyskawiczne odbicie z kosza i wysoka kadencja skrzydeł.');
  } else if (
    (cock.raceSpecialty === 'sprint_A' && hen.raceSpecialty === 'marathon_M') ||
    (cock.raceSpecialty === 'marathon_M' && hen.raceSpecialty === 'sprint_A')
  ) {
    perfScore += 4;
    targetCategory = 'Nowoczesny Średni Dystans (Kat. B / 300 - 600 km)';
    compHighlights.push('Krzyżówka szybkości z wytrzymałością (Sprint x Maraton).');
  }

  perfScore = Math.max(5, Math.min(30, perfScore));

  // TOTAL SCORE
  const overallScore = Math.round(confScore + genScore + perfScore);

  let tier: PairingTier = 'acceptable';
  let tierLabel = 'Akceptowalna (Drobne uwagi)';
  if (overallScore >= 90) {
    tier = 'elite_champion';
    tierLabel = '👑 Para Wybitna (Champion)';
  } else if (overallScore >= 75) {
    tier = 'highly_recommended';
    tierLabel = '⭐ Bardzo Zalecana';
  } else if (overallScore >= 60) {
    tier = 'acceptable';
    tierLabel = '⚖️ Akceptowalna';
  } else {
    tier = 'not_recommended';
    tierLabel = '🛑 Niezalecana (Ryzyko)';
  }

  // AI Advice text
  let aiAdvice = '';
  if (tier === 'elite_champion') {
    aiAdvice = `Zestawienie o najwyższym potencjale biologicznym (${overallScore}/100). Kompensacja cech budowy i profil genetyczny dają gwarancję potomstwa o wybitnej motoryce. Zalecane zostawienie całego pierwszego lęgu do własnego gołębnika lotowego.`;
  } else if (tier === 'highly_recommended') {
    aiAdvice = `Bardzo dobre skojarzenie (${overallScore}/100). Partnerzy harmonijnie się uzupełniają. Potomstwo dedykowane do rywalizacji w: ${targetCategory}.`;
  } else if (tier === 'acceptable') {
    aiAdvice = `Para poprawna (${overallScore}/100), jednak nie wnosi wybitnego postępu hodowlanego. Warto rozważyć alternatywnego partnera o krótszym przedramieniu lub większej liczbie konkursów.`;
  } else {
    aiAdvice = `Kojarzenie odradzane (${overallScore}/100). Zbyt duże ryzyko kumulacji wad lub depresji inbredowej. Rekomendujemy zmianę partnera w celu ochrony stada.`;
  }

  return {
    overallScore,
    tier,
    tierLabel,
    breakdown: {
      conformationCompensationScore: confScore,
      geneticDiversityScore: genScore,
      racePerformanceScore: perfScore,
    },
    inbreedingCoefficientF: inbreedingF,
    inbreedingEvaluation: inbreedingEval,
    isHighInbreedingRisk: isHighRisk,
    compensationHighlights: compHighlights,
    anticipatedChickTraits: chickTraits,
    targetCategoryRecommended: targetCategory,
    aiBreedingAdvice: aiAdvice,
  };
}

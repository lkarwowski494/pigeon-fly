/**
 * PIGEON-FLY — Conformation, Eye Sign & Wing Appraisal Domain Engine
 * Physical assessment of racing pigeons according to FCI Standard and traditional master hand evaluation.
 * Evaluates eye sign ring, keel/fork tightness, back firmness, muscle elasticity, and wing ventilation.
 */

export type EyeColor = 'yellow' | 'pearl' | 'orange_red' | 'dark_bull';
export type EyeSignRing = 'full_circle' | 'standing' | 'lying' | 'inner_speed' | 'absent';
export type KeelStrength = 'tight_closed' | 'medium' | 'wide_open';
export type BackStrength = 'rock_solid' | 'medium' | 'weak';
export type WingVentilation = 'excellent' | 'moderate' | 'poor';
export type RacingSuitability = 'sprint_speed' | 'all_round' | 'marathon_endurance';

export interface AppraisalInput {
  pigeonId: string;
  ringNumber: string;
  eyeColor: EyeColor;
  eyeSignRing: EyeSignRing;
  keelStrength: KeelStrength;
  backStrength: BackStrength;
  pectoralMuscleFlexibility: number; // 1 to 5 (5 = flexible, vibrating like silk)
  featherSilkyPowder: number; // 1 to 5 (5 = rich velvety powder)
  wingVentilation: WingVentilation;
  wingStepGap: boolean; // Uskok między 7. a 8. lotką
  breederNotes?: string;
}

export interface AppraisalResult {
  scoreStandardFci: number; // 90.00 to 95.00 pts (FCI Standard Olympiad scale)
  racingSuitability: RacingSuitability;
  suitabilityTitle: string;
  strengths: string[];
  weaknesses: string[];
  breederSummary: string;
}

/**
 * Calculates official conformation appraisal score and racing suitability.
 */
export function calculateAppraisalScore(input: AppraisalInput): AppraisalResult {
  let baseScore = 91.0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // 1. Keel & Pelvic bones (widełki miednicowe)
  if (input.keelStrength === 'tight_closed') {
    baseScore += 1.0;
    strengths.push('Idealnie zwarte i mocne kości miednicy (widełki)');
  } else if (input.keelStrength === 'wide_open') {
    baseScore -= 1.2;
    weaknesses.push('Rozwarte widełki miednicowe — ryzyko opadania na długim dystansie');
  }

  // 2. Back firmness (grzbiet i kuper)
  if (input.backStrength === 'rock_solid') {
    baseScore += 0.8;
    strengths.push('Szeroki, twardy i niewzruszony grzbiet');
  } else if (input.backStrength === 'weak') {
    baseScore -= 0.8;
    weaknesses.push('Miękki grzbiet — podatność na boczny wiatr');
  }

  // 3. Muscle elasticity (mięśnie piersiowe)
  if (input.pectoralMuscleFlexibility >= 4) {
    baseScore += 0.8;
    strengths.push('Elastyczne, napowietrzone mięśnie piersiowe');
  } else if (input.pectoralMuscleFlexibility <= 2) {
    baseScore -= 0.6;
    weaknesses.push('Twarde lub otłuszczone mięśnie bez pożądanej wibracji');
  }

  // 4. Feather quality (upierzenie i puder)
  if (input.featherSilkyPowder >= 4) {
    baseScore += 0.6;
    strengths.push('Obfity puder i jedwabista struktura piór (wodoodporność)');
  } else if (input.featherSilkyPowder <= 2) {
    baseScore -= 0.5;
    weaknesses.push('Suche pióra ze słabym pokryciem pudrowym');
  }

  // 5. Eye sign ring (znak oka i pierścień korelacji)
  if (input.eyeSignRing === 'full_circle') {
    baseScore += 0.5;
    strengths.push('Pełny pierścień przystosowania (Wartość wybitnie rozpłodowa)');
  } else if (input.eyeSignRing === 'standing' || input.eyeSignRing === 'inner_speed') {
    baseScore += 0.4;
    strengths.push('Ciemny pierścień szybkościowy w przednim sektorze źrenicy');
  }

  // 6. Wing aerodynamics
  if (input.wingVentilation === 'excellent') {
    baseScore += 0.5;
    strengths.push('Głęboka wentylacja ostatnich 4 lotek (kat. dalekodystansowa)');
  } else if (input.wingVentilation === 'poor') {
    weaknesses.push('Wąskie szczeliny wentylacyjne na końcach lotek');
  }

  if (input.wingStepGap) {
    strengths.push('Wyraźny uskok skrzydełkowy — ułatwia oderwanie strug powietrza');
  }

  // Clamped to standard FCI Olympiad range: 90.00 to 95.00 pts
  const scoreStandardFci = Math.round(Math.max(90.0, Math.min(95.0, baseScore)) * 100) / 100;

  // Determine suitability
  let racingSuitability: RacingSuitability = 'all_round';
  let suitabilityTitle = 'Uniwersalny Lotnik (Kat. B / All-Round)';
  let breederSummary = 'Ptak o zrównoważonej budowie, doskonale sprawdzający się na średnich dystansach 300-600 km.';

  if (
    input.wingVentilation === 'excellent' &&
    input.keelStrength === 'tight_closed' &&
    input.backStrength === 'rock_solid'
  ) {
    racingSuitability = 'marathon_endurance';
    suitabilityTitle = 'Żelazny Długodystansowiec (Kat. C / Maraton)';
    breederSummary =
      'Wyjątkowo mocny szkielet, zwarte widełki i doskonała wentylacja skrzydeł predestynują ptaka do lotów pod wiatr i maratonów 700-1000 km.';
  } else if (input.eyeSignRing === 'inner_speed' || (input.pectoralMuscleFlexibility === 5 && input.wingStepGap)) {
    racingSuitability = 'sprint_speed';
    suitabilityTitle = 'Ekspresowy Sprinter (Kat. A / Krótki Dystans)';
    breederSummary =
      'Błyskawiczna mechanika skrzydła i wysoka elastyczność mięśniowa czynią z ptaka faworyta na dystansach 100-350 km.';
  }

  return {
    scoreStandardFci,
    racingSuitability,
    suitabilityTitle,
    strengths,
    weaknesses,
    breederSummary,
  };
}

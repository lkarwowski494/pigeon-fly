/**
 * PIGEON-FLY — Drinker pH, Rehydration Osmolarity & Energy Shift Engine
 * Implementation of scientific master fancier principles:
 * - RD-15: Carbo-Lipid Shift (Pre-race dietary fat percentage based on race distance)
 * - RD-16: Mitochondrial L-Carnitine Shuttle (Lactate clearance & beta-oxidation)
 * - RD-17: Drinker pH Buffering & Trichomoniasis / Salmonella Inhibition
 * - RD-18: Post-Flight Rehydration Tonicity & Osmolarity (290 - 310 mOsm/L)
 */

export type AcidifierType =
  | 'apple_cider_vinegar'   // Ocet jabłkowy 5% (5 ml / L)
  | 'organic_acids_blend'   // Mieszanina kwasów organicznych: mrówkowy, propionowy, mlekowy (1.5 ml / L)
  | 'citric_acid'           // Kwas cytrynowy (1 g / L)
  | 'none';

export interface DrinkerPhEvaluation {
  initialPh: number;
  finalPh: number;
  acidifierUsed: AcidifierType;
  dosageMlPerLiter: number;
  trichomonasSurvivalTimeText: string;
  isSterilizingSafe: boolean;
  status: 'optimal' | 'too_acidic' | 'ineffective';
  recommendation: string;
}

export interface ElectrolyteRecipe {
  waterLiters: number;
  glucoseGrams: number;        // Molecular weight ~180 g/mol
  saltNaclGrams: number;       // Molecular weight ~58.4 g/mol (dissociates into 2 ions)
  potassiumKclGrams: number;   // Molecular weight ~74.5 g/mol (dissociates into 2 ions)
  sodiumCitrateGrams: number;  // Molecular weight ~258 g/mol (dissociates into 4 ions)
  magnesiumGrams: number;      // e.g. MgSO4 / Mg2+ salts
}

export interface RehydrationOsmolarityEvaluation {
  osmolarityMOsmPerLiter: number;
  tonicCategory: 'hypotonic' | 'isotonic' | 'hypertonic';
  safetyRating: 'safe_optimal' | 'safe_mild_hypotonic' | 'danger_hypertonic_shock';
  cellularAbsorptionRateText: string;
  guidanceText: string;
}

export interface PreRaceFatRequirement {
  raceDistanceKm: number;
  recommendedFatPercent: number;
  recommendedCarbPercent: number;
  carnitineDosageMgPerLiter: number;
  timingAdvice: string;
  recommendedGrains: string[];
}

/**
 * Evaluates drinker water acidification and anti-trichomoniasis sterilization (RD-17).
 */
export function calculateDrinkerPh(
  initialPh: number = 7.4,
  acidifier: AcidifierType = 'apple_cider_vinegar',
  dosageMlPerLiter: number = 5.0
): DrinkerPhEvaluation {
  let finalPh = initialPh;

  if (acidifier === 'apple_cider_vinegar') {
    // 5 ml / L reduces typical tap water (7.4) to ~4.2 - 4.4
    const delta = (dosageMlPerLiter / 5.0) * 3.1;
    finalPh = parseFloat(Math.max(3.2, initialPh - delta).toFixed(2));
  } else if (acidifier === 'organic_acids_blend') {
    // 1.5 ml / L reduces to ~4.1 - 4.3
    const delta = (dosageMlPerLiter / 1.5) * 3.2;
    finalPh = parseFloat(Math.max(3.0, initialPh - delta).toFixed(2));
  } else if (acidifier === 'citric_acid') {
    const delta = (dosageMlPerLiter / 1.0) * 2.8;
    finalPh = parseFloat(Math.max(3.2, initialPh - delta).toFixed(2));
  }

  let status: 'optimal' | 'too_acidic' | 'ineffective' = 'optimal';
  let trichomonasSurvivalTimeText = '';
  let isSterilizingSafe = false;
  let recommendation = '';

  if (finalPh >= 6.5) {
    status = 'ineffective';
    trichomonasSurvivalTimeText = '> 48 godzin (wysokie ryzyko infekcji stada)';
    isSterilizingSafe = false;
    recommendation =
      'Woda obojętna/zasadowa sprzyja namnażaniu rzęsistka (Trichomonas gallinae) i pałeczek E. coli. Dodaj zakwaszacz.';
  } else if (finalPh >= 5.0 && finalPh < 6.5) {
    status = 'ineffective';
    trichomonasSurvivalTimeText = 'Ok. 12 - 24 godzin';
    isSterilizingSafe = false;
    recommendation =
      'Częściowe zakwaszenie, ale niewystarczające do natychmiastowej sterylizacji rzęsistka. Zwiększ dawkę zakwaszacza.';
  } else if (finalPh >= 4.0 && finalPh <= 4.6) {
    status = 'optimal';
    trichomonasSurvivalTimeText = '< 15 minut (błyskawiczna eliminacja pierwotniaków)';
    isSterilizingSafe = true;
    recommendation =
      'Wzorcowe pH poidła (4.2 ± 0.2). Całkowita sterylizacja pierwotniaków bez naruszenia naturalnej flory wola.';
  } else {
    // Below 4.0
    status = 'too_acidic';
    trichomonasSurvivalTimeText = '< 5 minut';
    isSterilizingSafe = false;
    recommendation =
      'Woda zbyt kwaśna (pH < 4.0). Ryzyko podrażnienia śluzówki wola i niechętnego pobierania wody przez ptaki. Zmniejsz dawkę.';
  }

  return {
    initialPh,
    finalPh,
    acidifierUsed: acidifier,
    dosageMlPerLiter,
    trichomonasSurvivalTimeText,
    isSterilizingSafe,
    status,
    recommendation,
  };
}

/**
 * Calculates osmolarity of post-flight rehydration drink according to RD-18:
 * Osmolarity = sum(c_i * Phi_i) [mOsm/L]
 * Target isotonic window: 290 - 310 mOsm/L.
 */
export function calculateRehydrationOsmolarity(
  recipe: ElectrolyteRecipe
): RehydrationOsmolarityEvaluation {
  const liters = Math.max(0.1, recipe.waterLiters);

  // Concentrations in g/L
  const cGlucose = recipe.glucoseGrams / liters;
  const cNacl = recipe.saltNaclGrams / liters;
  const cKcl = recipe.potassiumKclGrams / liters;
  const cCitrate = recipe.sodiumCitrateGrams / liters;
  const cMg = recipe.magnesiumGrams / liters;

  // Osmolar contributions (mOsm/L):
  // Glucose: (c / 180) * 1000 * 1
  const mOsmGlucose = (cGlucose / 180.16) * 1000;
  // NaCl: (c / 58.44) * 1000 * 2 (Na+ + Cl-)
  const mOsmNacl = (cNacl / 58.44) * 1000 * 2 * 0.93; // osmotic coefficient ~0.93
  // KCl: (c / 74.55) * 1000 * 2 (K+ + Cl-)
  const mOsmKcl = (cKcl / 74.55) * 1000 * 2 * 0.92;
  // Sodium citrate: (c / 258.06) * 1000 * 4 (3 Na+ + Citrate3-)
  const mOsmCitrate = (cCitrate / 258.06) * 1000 * 3.5;
  // Mg salts: (c / 120.36) * 1000 * 1.8
  const mOsmMg = (cMg / 120.36) * 1000 * 1.8;

  const totalMOsm = Math.round(
    mOsmGlucose + mOsmNacl + mOsmKcl + mOsmCitrate + mOsmMg
  );

  let tonicCategory: 'hypotonic' | 'isotonic' | 'hypertonic' = 'isotonic';
  let safetyRating: 'safe_optimal' | 'safe_mild_hypotonic' | 'danger_hypertonic_shock' =
    'safe_optimal';
  let cellularAbsorptionRateText = '';
  let guidanceText = '';

  if (totalMOsm < 270) {
    tonicCategory = 'hypotonic';
    safetyRating = 'safe_mild_hypotonic';
    cellularAbsorptionRateText = 'Szybkie wchłanianie czystej wody, umiarkowana odbudowa elektrolitów.';
    guidanceText =
      'Roztwór lekko hipotoniczny. Bezpieczny, lecz dla wycieńczonych ptaków po locie maratońskim warto uzupełnić elektrolity.';
  } else if (totalMOsm >= 270 && totalMOsm <= 325) {
    tonicCategory = 'isotonic';
    safetyRating = 'safe_optimal';
    cellularAbsorptionRateText = 'Maksymalne tempo rehydratacji enterocytów bez obciążenia nerek.';
    guidanceText =
      'Wzorcowy roztwór izotoniczny (290 - 310 mOsm/L). Błyskawicznie odbudowuje homeostazę płynów i zapobiega kwasicy mięśniowej.';
  } else {
    // > 325 mOsm/L
    tonicCategory = 'hypertonic';
    safetyRating = 'danger_hypertonic_shock';
    cellularAbsorptionRateText = 'UWAGA: Odciąganie wody ze ścianek wola do światła jelita (szok hipowolemiczny)!';
    guidanceText =
      'ZBYT GĘSTY ROZTWÓR (hipertoniczny > 330 mOsm/L)! Grozi odwodnieniem wewnętrznym i biegunką osmotyczną. Rozcieńcz wodą!';
  }

  return {
    osmolarityMOsmPerLiter: totalMOsm,
    tonicCategory,
    safetyRating,
    cellularAbsorptionRateText,
    guidanceText,
  };
}

/**
 * Standard master post-flight rehydration preset for 1 liter of recovery water (RD-18).
 */
export function getStandardRehydrationPreset(liters: number = 1.0): ElectrolyteRecipe {
  return {
    waterLiters: liters,
    glucoseGrams: 25.0 * liters,
    saltNaclGrams: 2.5 * liters,
    potassiumKclGrams: 1.5 * liters,
    sodiumCitrateGrams: 2.0 * liters,
    magnesiumGrams: 0.5 * liters,
  };
}

/**
 * Calculates pre-race dietary fat requirements using Carbo-Lipid Shift (RD-15)
 * and L-Carnitine loading dosage (RD-16).
 *
 * Formula: % Tłuszczu = 4.0% + (Dystans_km / 150) * 1.8% (capped at 11.5%).
 */
export function calculateCarboLipidShift(raceDistanceKm: number): PreRaceFatRequirement {
  const distance = Math.max(50, raceDistanceKm);
  const calculatedFat = 4.0 + (distance / 150) * 1.8;
  const recommendedFatPercent = parseFloat(Math.min(11.5, calculatedFat).toFixed(1));
  const recommendedCarbPercent = parseFloat((65.0 - (recommendedFatPercent - 4.0) * 1.5).toFixed(1));

  // L-Carnitine: 1000 mg/L in Thursday & Friday for races > 450 km
  const carnitineDosageMgPerLiter = distance >= 450 ? 1000 : distance >= 300 ? 500 : 0;

  let timingAdvice = '';
  const recommendedGrains: string[] = [];

  if (distance < 300) {
    timingAdvice = 'Lot krótki / prędkościowy (kat. A). Podstawą są lekkostrawne węglowodany (jęczmień, dari, ryż paddy).';
    recommendedGrains.push('Kukurydza drobna', 'Dari białe', 'Ryż paddy', 'Krokosz (kardi) 5%');
  } else if (distance < 550) {
    timingAdvice = 'Średni dystans (kat. B). W ostatnich 48h przed koszowaniem włącz ziarna oleiste bogate w kardi i słonecznik.';
    recommendedGrains.push('Kukurydza Cribs', 'Krokosz (kardi)', 'Słonecznik łuskany', 'Konopie');
  } else {
    timingAdvice = 'Maraton / Daleki dystans (kat. C i M). W czwartek i piątek maksymalne ładowanie tłuszczowe + 1000 mg L-karnityny/L wody.';
    recommendedGrains.push('Orzeszki ziemne łuskane', 'Konopie', 'Krokosz (kardi)', 'Słonecznik łuskany', 'Rzepak');
  }

  return {
    raceDistanceKm: distance,
    recommendedFatPercent,
    recommendedCarbPercent,
    carnitineDosageMgPerLiter,
    timingAdvice,
    recommendedGrains,
  };
}

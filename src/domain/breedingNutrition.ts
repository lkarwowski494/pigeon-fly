/**
 * PIGEON-FLY — Breeding Nutrition & Squab Rearing Engine (Z-074 / DEC-88)
 * Scientific feed balancing for racing pigeon breeding:
 * - Phase 1: Składanie jaj i krycie (Egg formation, Ca/Grit, Vit D3)
 * - Phase 2: Mleczko wola (Crop milk, D1-D5, Crude Protein >= 18-20%, Fat 6-8%)
 * - Phase 3: Odchów i upierzenie (Squab rearing, D6-D24, Lysine >= 0.85%, Methionine >= 0.35%)
 * Feeder consumption model: pair (80-90g) + squabs (up to 60-70g) = 130-150g/pair/day.
 */

export type BreedingNutritionPhase =
  | 'EGG_FORMATION' // Składanie jaj (wysokie Ca, grit, wit. D3)
  | 'CROP_MILK' // Mleczko wola D1-D5 (białko surowe >= 18%, bez twardej kukurydzy)
  | 'FEATHERING_GROWTH'; // Wzrost i upierzenie D6-D24 (lizyna >= 0.85%, metionina >= 0.35%)

export interface GrainNutrientProfile {
  id: string;
  name: string;
  category: 'legume' | 'cereal' | 'oilseed';
  crudeProteinPct: number; // Białko surowe %
  crudeFatPct: number; // Tłuszcz surowy %
  crudeFiberPct: number; // Włókno surowe %
  lysinePct: number; // Lizyna % (budowa mięśni)
  methioninePct: number; // Metionina % (keratyna piór)
  calciumPct: number; // Wapń Ca %
  phosphorusPct: number; // Fosfor P %
  metabolizableEnergyKcalKg: number; // Energia metaboliczna kcal/kg
}

export interface RationIngredient {
  grainId: string;
  percentage: number; // 0 - 100%
}

export interface CalculatedNutrients {
  crudeProteinPct: number;
  crudeFatPct: number;
  crudeFiberPct: number;
  lysinePct: number;
  methioninePct: number;
  calciumPct: number;
  phosphorusPct: number;
  caToPRatio: number;
  metabolizableEnergyKcalKg: number;
}

export interface NutritionDeficitAlert {
  nutrient: string;
  severity: 'warning' | 'critical' | 'info';
  currentValue: number;
  requiredValue: number;
  message: string;
  recommendation: string;
}

export interface DietValidationResult {
  isOptimal: boolean;
  score: number; // 0 - 100 pkt
  alerts: NutritionDeficitAlert[];
  adviceList: string[];
}

export interface FeederDemandResult {
  numPairs: number;
  numSquabs: number;
  phase: BreedingNutritionPhase;
  squabsAgeDays: number;
  dailyFeedPerPairGrams: number;
  totalDailyFeedGrams: number;
  totalDailyFeedKg: number;
  dailyWaterPerPairMl: number;
  totalDailyWaterLiters: number;
  dailyGritTotalGrams: number;
  feedFrequencyTimesPerDay: number;
  recommendedFeederType: string;
  specialSupplements: string[];
}

export const BREEDING_GRAINS_DB: Record<string, GrainNutrientProfile> = {
  groch_zolty: {
    id: 'groch_zolty',
    name: 'Groch żółty / zielony',
    category: 'legume',
    crudeProteinPct: 22.0,
    crudeFatPct: 1.5,
    crudeFiberPct: 5.5,
    lysinePct: 1.6,
    methioninePct: 0.25,
    calciumPct: 0.08,
    phosphorusPct: 0.38,
    metabolizableEnergyKcalKg: 2850,
  },
  peluszka: {
    id: 'peluszka',
    name: 'Peluszka (groch polny)',
    category: 'legume',
    crudeProteinPct: 21.0,
    crudeFatPct: 1.8,
    crudeFiberPct: 6.0,
    lysinePct: 1.5,
    methioninePct: 0.24,
    calciumPct: 0.09,
    phosphorusPct: 0.4,
    metabolizableEnergyKcalKg: 2800,
  },
  wyka: {
    id: 'wyka',
    name: 'Wyka siewna',
    category: 'legume',
    crudeProteinPct: 26.0,
    crudeFatPct: 1.2,
    crudeFiberPct: 5.0,
    lysinePct: 1.8,
    methioninePct: 0.3,
    calciumPct: 0.12,
    phosphorusPct: 0.42,
    metabolizableEnergyKcalKg: 2900,
  },
  bobik: {
    id: 'bobik',
    name: 'Bobik drobny',
    category: 'legume',
    crudeProteinPct: 25.0,
    crudeFatPct: 1.4,
    crudeFiberPct: 7.0,
    lysinePct: 1.65,
    methioninePct: 0.22,
    calciumPct: 0.14,
    phosphorusPct: 0.45,
    metabolizableEnergyKcalKg: 2820,
  },
  kukurydza_drobna: {
    id: 'kukurydza_drobna',
    name: 'Kukurydza drobna (Cribbs/Popcorn)',
    category: 'cereal',
    crudeProteinPct: 9.0,
    crudeFatPct: 4.2,
    crudeFiberPct: 2.5,
    lysinePct: 0.28,
    methioninePct: 0.18,
    calciumPct: 0.03,
    phosphorusPct: 0.25,
    metabolizableEnergyKcalKg: 3300,
  },
  pszenica: {
    id: 'pszenica',
    name: 'Pszenica ozima',
    category: 'cereal',
    crudeProteinPct: 11.5,
    crudeFatPct: 1.8,
    crudeFiberPct: 2.8,
    lysinePct: 0.32,
    methioninePct: 0.17,
    calciumPct: 0.05,
    phosphorusPct: 0.3,
    metabolizableEnergyKcalKg: 3100,
  },
  dari: {
    id: 'dari',
    name: 'Dari białe / Milo',
    category: 'cereal',
    crudeProteinPct: 10.0,
    crudeFatPct: 3.0,
    crudeFiberPct: 2.5,
    lysinePct: 0.25,
    methioninePct: 0.16,
    calciumPct: 0.04,
    phosphorusPct: 0.28,
    metabolizableEnergyKcalKg: 3150,
  },
  kardi: {
    id: 'kardi',
    name: 'Kardi (krokosz barwierski)',
    category: 'oilseed',
    crudeProteinPct: 15.0,
    crudeFatPct: 26.0,
    crudeFiberPct: 12.0,
    lysinePct: 0.5,
    methioninePct: 0.25,
    calciumPct: 0.2,
    phosphorusPct: 0.5,
    metabolizableEnergyKcalKg: 3400,
  },
  slonecznik_czarny: {
    id: 'slonecznik_czarny',
    name: 'Słonecznik czarny drobny',
    category: 'oilseed',
    crudeProteinPct: 18.0,
    crudeFatPct: 38.0,
    crudeFiberPct: 15.0,
    lysinePct: 0.7,
    methioninePct: 0.38,
    calciumPct: 0.2,
    phosphorusPct: 0.55,
    metabolizableEnergyKcalKg: 3900,
  },
  siemie_lniane: {
    id: 'siemie_lniane',
    name: 'Siemię lniane (Omega-3)',
    category: 'oilseed',
    crudeProteinPct: 22.0,
    crudeFatPct: 35.0,
    crudeFiberPct: 7.0,
    lysinePct: 0.85,
    methioninePct: 0.42,
    calciumPct: 0.25,
    phosphorusPct: 0.55,
    metabolizableEnergyKcalKg: 3800,
  },
  rzepik: {
    id: 'rzepik',
    name: 'Rzepik słodki / Rzepak',
    category: 'oilseed',
    crudeProteinPct: 20.0,
    crudeFatPct: 40.0,
    crudeFiberPct: 8.0,
    lysinePct: 0.8,
    methioninePct: 0.4,
    calciumPct: 0.4,
    phosphorusPct: 0.7,
    metabolizableEnergyKcalKg: 4100,
  },
  konopie: {
    id: 'konopie',
    name: 'Konopie siewne',
    category: 'oilseed',
    crudeProteinPct: 24.0,
    crudeFatPct: 30.0,
    crudeFiberPct: 14.0,
    lysinePct: 0.9,
    methioninePct: 0.45,
    calciumPct: 0.2,
    phosphorusPct: 0.6,
    metabolizableEnergyKcalKg: 3750,
  },
};

export interface PredefinedBreedingRation {
  id: string;
  name: string;
  description: string;
  targetPhase: BreedingNutritionPhase;
  ingredients: RationIngredient[];
}

export const PREDEFINED_BREEDING_RATIONS: PredefinedBreedingRation[] = [
  {
    id: 'ration-super-protein-19',
    name: 'Mieszanka Lęgowa Super Protein (Białko 19.2%)',
    description: 'Optymalna mieszanka białkowa z 50% udziałem roślin motylkowych do fazy mleczka i odchowu.',
    targetPhase: 'CROP_MILK',
    ingredients: [
      { grainId: 'groch_zolty', percentage: 25 },
      { grainId: 'peluszka', percentage: 15 },
      { grainId: 'wyka', percentage: 15 },
      { grainId: 'bobik', percentage: 10 },
      { grainId: 'kukurydza_drobna', percentage: 10 },
      { grainId: 'dari', percentage: 7 },
      { grainId: 'kardi', percentage: 6 },
      { grainId: 'slonecznik_czarny', percentage: 4 },
      { grainId: 'siemie_lniane', percentage: 4 },
      { grainId: 'rzepik', percentage: 4 },
    ],
  },
  {
    id: 'ration-traditional-18',
    name: 'Tradycyjna Mieszanka Lęgowa (Białko 18.0%)',
    description: 'Zrównoważona receptura lęgowa z grochem, peluszką i nasionami oleistymi.',
    targetPhase: 'FEATHERING_GROWTH',
    ingredients: [
      { grainId: 'groch_zolty', percentage: 20 },
      { grainId: 'peluszka', percentage: 15 },
      { grainId: 'bobik', percentage: 5 },
      { grainId: 'kukurydza_drobna', percentage: 20 },
      { grainId: 'pszenica', percentage: 15 },
      { grainId: 'dari', percentage: 10 },
      { grainId: 'kardi', percentage: 5 },
      { grainId: 'rzepik', percentage: 5 },
      { grainId: 'siemie_lniane', percentage: 5 },
    ],
  },
  {
    id: 'ration-egg-prep-ca',
    name: 'Mieszanka Przygotowawcza do Zniesień (Wapń + Białko 17.5%)',
    description: 'Faza parowania i składania jaj, bogata w nasiona oleiste z wapniem i kardi.',
    targetPhase: 'EGG_FORMATION',
    ingredients: [
      { grainId: 'groch_zolty', percentage: 18 },
      { grainId: 'peluszka', percentage: 12 },
      { grainId: 'wyka', percentage: 8 },
      { grainId: 'kukurydza_drobna', percentage: 18 },
      { grainId: 'pszenica', percentage: 14 },
      { grainId: 'dari', percentage: 10 },
      { grainId: 'kardi', percentage: 8 },
      { grainId: 'siemie_lniane', percentage: 4 },
      { grainId: 'rzepik', percentage: 4 },
      { grainId: 'konopie', percentage: 4 },
    ],
  },
];

/**
 * Calculates weighted nutritional profile of a given ration mixture.
 */
export function calculateRationNutrition(ingredients: RationIngredient[]): CalculatedNutrients {
  let totalPct = 0;
  let cpSum = 0;
  let fatSum = 0;
  let fiberSum = 0;
  let lysSum = 0;
  let metSum = 0;
  let caSum = 0;
  let pSum = 0;
  let meSum = 0;

  for (const item of ingredients) {
    const grain = BREEDING_GRAINS_DB[item.grainId];
    if (!grain) continue;

    totalPct += item.percentage;
    cpSum += (grain.crudeProteinPct * item.percentage) / 100;
    fatSum += (grain.crudeFatPct * item.percentage) / 100;
    fiberSum += (grain.crudeFiberPct * item.percentage) / 100;
    lysSum += (grain.lysinePct * item.percentage) / 100;
    metSum += (grain.methioninePct * item.percentage) / 100;
    caSum += (grain.calciumPct * item.percentage) / 100;
    pSum += (grain.phosphorusPct * item.percentage) / 100;
    meSum += (grain.metabolizableEnergyKcalKg * item.percentage) / 100;
  }

  // Normalize if totalPct is slightly off 100%
  const factor = totalPct > 0 ? 100 / totalPct : 1;

  const cp = cpSum * factor;
  const fat = fatSum * factor;
  const fiber = fiberSum * factor;
  const lys = lysSum * factor;
  const met = metSum * factor;
  const ca = caSum * factor;
  const p = pSum * factor;
  const me = meSum * factor;
  const caToP = p > 0 ? ca / p : 1.0;

  return {
    crudeProteinPct: Math.round(cp * 100) / 100,
    crudeFatPct: Math.round(fat * 100) / 100,
    crudeFiberPct: Math.round(fiber * 100) / 100,
    lysinePct: Math.round(lys * 100) / 100,
    methioninePct: Math.round(met * 100) / 100,
    calciumPct: Math.round(ca * 1000) / 1000,
    phosphorusPct: Math.round(p * 1000) / 1000,
    caToPRatio: Math.round(caToP * 100) / 100,
    metabolizableEnergyKcalKg: Math.round(me),
  };
}

/**
 * Validates whether nutritional profile meets scientific breeding standards.
 */
export function validateBreedingDiet(
  nutrients: CalculatedNutrients,
  phase: BreedingNutritionPhase
): DietValidationResult {
  const alerts: NutritionDeficitAlert[] = [];
  const adviceList: string[] = [];
  let score = 100;

  if (phase === 'CROP_MILK') {
    // Phase 2: Crop milk requires >= 18.0% crude protein, ideally 19-20%
    if (nutrients.crudeProteinPct < 18.0) {
      score -= 25;
      alerts.push({
        nutrient: 'Białko Surowe (CP)',
        severity: 'critical',
        currentValue: nutrients.crudeProteinPct,
        requiredValue: 18.0,
        message: `Niedobór białka surowego (${nutrients.crudeProteinPct}% < 18.0%) w fazie karmienia mleczkiem wola.`,
        recommendation: 'Zwiększ udział grochu, wyki lub peluszki do minimum 45-50% mieszanki.',
      });
    }

    if (nutrients.crudeFatPct < 5.0) {
      score -= 10;
      alerts.push({
        nutrient: 'Tłuszcz Surowy',
        severity: 'warning',
        currentValue: nutrients.crudeFatPct,
        requiredValue: 5.0,
        message: 'Zbyt niski poziom tłuszczu w fazie mleczka — mleczko wola w 30% składa się z lipidów.',
        recommendation: 'Dodaj 4-5% siemienia lnianego, słonecznika lub rzepiku.',
      });
    }

    adviceList.push('UWAGA BIOLOGICZNA: W pierwszych 4 dniach życia piskląt unikaj podawania grubej kukurydzy.');
    adviceList.push('Mleczko wola produkowane jest przez komórki nabłonka wola i nie zawiera skrobi.');
  } else if (phase === 'FEATHERING_GROWTH') {
    // Phase 3: Squab rearing & feathering requires high lysine & methionine
    if (nutrients.crudeProteinPct < 17.5) {
      score -= 20;
      alerts.push({
        nutrient: 'Białko Surowe (CP)',
        severity: 'critical',
        currentValue: nutrients.crudeProteinPct,
        requiredValue: 17.5,
        message: `Za mało białka (${nutrients.crudeProteinPct}% < 17.5%) do intensywnego wzrostu szkieletu i mięśni.`,
        recommendation: 'Dodaj bobik, wykę lub peluszkę.',
      });
    }

    if (nutrients.lysinePct < 0.85) {
      score -= 15;
      alerts.push({
        nutrient: 'Lizyna (Lys)',
        severity: 'warning',
        currentValue: nutrients.lysinePct,
        requiredValue: 0.85,
        message: `Niedobór lizyny (${nutrients.lysinePct}% < 0.85%). Spowolniony przyrost masy mięśni piersiowych.`,
        recommendation: 'Zwiększ rośliny strączkowe bogate w lizynę (wyka, groch).',
      });
    }

    if (nutrients.methioninePct < 0.3) {
      score -= 15;
      alerts.push({
        nutrient: 'Metionina (Met)',
        severity: 'warning',
        currentValue: nutrients.methioninePct,
        requiredValue: 0.3,
        message: `Niedobór metioniny (${nutrients.methioninePct}% < 0.30%) — aminokwas siarkowy krytyczny dla keratyny piór.`,
        recommendation: 'Dodaj nasiona oleiste (słonecznik, siemię, rzepik, konopie).',
      });
    }

    adviceList.push('Od 10. dnia życia pisklęta pobierają z wola rodziców całe, napęczniałe ziarna.');
    adviceList.push('Należy zapewnić stały dostęp do świeżej wody w miskach gniazdowych.');
  } else {
    // Phase 1: Egg formation
    adviceList.push('Kluczowy jest stały dostęp do czerwonego gritu, muszli ostryg i kostek mineralnych (Ca).');
    adviceList.push('Podawaj witaminę D3 (metabolizm wapnia) oraz witaminę E + Selen (płodność samców).');
  }

  // Grain mixtures naturally have low calcium (~0.1%) vs phosphorus (~0.3-0.4%)
  adviceList.push('Grit i minerały muszą być podawane ad-libitum w osobnych karmnikach (ziarno nie zaspokaja zapotrzebowania na Ca).');

  return {
    isOptimal: alerts.length === 0,
    score: Math.max(0, score),
    alerts,
    adviceList,
  };
}

/**
 * Calculates daily grain, water, and mineral consumption for breeding pairs with squabs.
 */
export function calculateFeederDemand(params: {
  numPairs: number;
  numSquabs: number;
  squabsAgeDays?: number;
  phase: BreedingNutritionPhase;
}): FeederDemandResult {
  const { numPairs, numSquabs, phase } = params;
  const age = params.squabsAgeDays ?? (phase === 'CROP_MILK' ? 3 : phase === 'FEATHERING_GROWTH' ? 14 : 0);

  // Adult pair baseline: ~40-45g per bird = 85g/pair/day
  const adultBaselinePerPair = 85;

  // Squab feed intake varies with age
  let squabIntakeGrams = 0;
  if (phase === 'CROP_MILK') {
    // Days 1-5: ~5g/day/squab (parents convert to crop milk)
    squabIntakeGrams = 5;
  } else if (phase === 'FEATHERING_GROWTH') {
    if (age <= 10) {
      squabIntakeGrams = 15;
    } else if (age <= 18) {
      squabIntakeGrams = 28;
    } else {
      squabIntakeGrams = 35;
    }
  } else {
    // Egg formation
    squabIntakeGrams = 0;
  }

  const squabsPerPair = numPairs > 0 ? numSquabs / numPairs : 0;
  const dailyFeedPerPairGrams = Math.round(adultBaselinePerPair + squabsPerPair * squabIntakeGrams);
  const totalDailyFeedGrams = Math.round(dailyFeedPerPairGrams * numPairs);
  const totalDailyFeedKg = Math.round((totalDailyFeedGrams / 1000) * 10) / 10;

  // Water intake: typically 2.2x feed intake in ml
  const dailyWaterPerPairMl = Math.round(dailyFeedPerPairGrams * 2.2);
  const totalDailyWaterLiters = Math.round(((dailyWaterPerPairMl * numPairs) / 1000) * 10) / 10;

  // Grit demand: ~6g per pair/day
  const dailyGritTotalGrams = Math.round(numPairs * 6);

  const feedFrequency = phase === 'FEATHERING_GROWTH' && age >= 10 ? 2 : 1;
  const recommendedFeederType =
    phase === 'CROP_MILK' || phase === 'FEATHERING_GROWTH'
      ? 'Karmidło celkowe gniazdowe (indywidualne) + poidło miskowe w celi'
      : 'Karmidło korytowe z kratką anty-zanieczyszczeniową';

  const specialSupplements: string[] = [];
  if (phase === 'EGG_FORMATION') {
    specialSupplements.push('Grit wapniowy z anyżem i czerwonym kamieniem (ad-libitum)');
    specialSupplements.push('Witamina AD3E + Selen do wody 2x w tygodniu');
    specialSupplements.push('Kostka mineralna do dziobania w każdej celi');
  } else if (phase === 'CROP_MILK') {
    specialSupplements.push('Drożdże piwne z aminokwasami zwilżone olejem czosnkowym/rybim');
    specialSupplements.push('Elektrolity do poidła (wspomaganie laktacji wola)');
    specialSupplements.push('Drobny grit gniazdowy bez grubych muszli');
  } else {
    specialSupplements.push('Mieszanka mineralno-witaminowa z aminokwasami siarkowymi (metionina)');
    specialSupplements.push('Drobne nasiona oleiste (siemię/konopie) na deser po karmieniu');
    specialSupplements.push('Zakwaszacz do wody (ochrona wola przed rzęsistkiem i Candidą)');
  }

  return {
    numPairs,
    numSquabs,
    phase,
    squabsAgeDays: age,
    dailyFeedPerPairGrams,
    totalDailyFeedGrams,
    totalDailyFeedKg,
    dailyWaterPerPairMl,
    totalDailyWaterLiters,
    dailyGritTotalGrams,
    feedFrequencyTimesPerDay: feedFrequency,
    recommendedFeederType,
    specialSupplements,
  };
}

/**
 * Generates printable HTML feeding guide for the breeding loft.
 */
export function generateBreedingNutritionPdfHtml(params: {
  rationName: string;
  nutrients: CalculatedNutrients;
  validation: DietValidationResult;
  demand: FeederDemandResult;
  loftName?: string;
  seasonYear?: number;
}): string {
  const { rationName, nutrients, validation, demand } = params;
  const loft = params.loftName || 'Gołębnik Pigeon-Fly';
  const year = params.seasonYear || new Date().getFullYear();

  const phaseNames: Record<BreedingNutritionPhase, string> = {
    EGG_FORMATION: 'Składanie jaj i krycie (Ca / Grit)',
    CROP_MILK: 'Mleczko wola D1-D5 (Białko >= 18%)',
    FEATHERING_GROWTH: 'Wzrost i upierzenie D6-D24 (Lizyna / Metionina)',
  };

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Karta Żywieniowa Fazy Lęgowej - ${loft}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      -webkit-print-color-adjust: exact;
    }
    .header-box {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .title { font-size: 20px; font-weight: 900; color: #1e3a8a; }
    .subtitle { font-size: 11px; color: #6b7280; font-weight: 600; }
    .grid-2 { display: flex; gap: 14px; margin-bottom: 14px; }
    .card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 5px 6px; background: #e2e8f0; color: #334155; }
    td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; }
    .val-highlight { font-weight: 800; color: #0284c7; }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #991b1b;
    }
    .supplements-list { font-size: 11px; line-height: 1.5; color: #334155; padding-left: 16px; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title">🥣 ASYSTENT ŻYWIENIOWY FAZY LĘGOWEJ — PZHGP ${year}</div>
    <div class="subtitle">${loft} &bull; Faza: ${phaseNames[demand.phase]} &bull; Pisklęta: ${demand.squabsAgeDays}. dzień</div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Mieszanka: ${rationName}</div>
      <table>
        <tr><td>Białko Surowe (CP):</td><td class="val-highlight">${nutrients.crudeProteinPct}%</td></tr>
        <tr><td>Tłuszcz Surowy:</td><td class="val-highlight">${nutrients.crudeFatPct}%</td></tr>
        <tr><td>Włókno Surowe:</td><td>${nutrients.crudeFiberPct}%</td></tr>
        <tr><td>Lizyna (wzrost mięśni):</td><td class="val-highlight">${nutrients.lysinePct}%</td></tr>
        <tr><td>Metionina (keratyna piór):</td><td class="val-highlight">${nutrients.methioninePct}%</td></tr>
        <tr><td>Wapń (Ca) / Fosfor (P):</td><td>${nutrients.calciumPct}% / ${nutrients.phosphorusPct}%</td></tr>
        <tr><td>Stosunek Ca : P:</td><td>${nutrients.caToPRatio} : 1</td></tr>
        <tr><td>Energia Metaboliczna:</td><td>${nutrients.metabolizableEnergyKcalKg} kcal/kg</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Zapotrzebowanie Karmnika (${demand.numPairs} par + ${demand.numSquabs} młódków)</div>
      <table>
        <tr><td>Karma dzienna / para:</td><td class="val-highlight">${demand.dailyFeedPerPairGrams} g/parę</td></tr>
        <tr><td>Razem karma na dobę:</td><td class="val-highlight">${demand.totalDailyFeedKg} kg (${demand.totalDailyFeedGrams} g)</td></tr>
        <tr><td>Woda dzienna / para:</td><td>${demand.dailyWaterPerPairMl} ml</td></tr>
        <tr><td>Razem woda na dobę:</td><td class="val-highlight">${demand.totalDailyWaterLiters} l</td></tr>
        <tr><td>Grit mineralny na dobę:</td><td>${demand.dailyGritTotalGrams} g</td></tr>
        <tr><td>Częstotliwość karmienia:</td><td>${demand.feedFrequencyTimesPerDay}x dziennie</td></tr>
      </table>
    </div>
  </div>

  ${
    validation.alerts.length > 0
      ? `
  <div class="alert-box">
    <strong>ALERTY DIETETYCZNE:</strong><br />
    ${validation.alerts.map((a) => `&bull; ${a.message} <em>(${a.recommendation})</em>`).join('<br />')}
  </div>
  `
      : ''
  }

  <div class="card" style="margin-bottom: 12px;">
    <div class="card-title">Zalecane Suplementy i Minerały w Celach</div>
    <ul class="supplements-list">
      ${demand.specialSupplements.map((s) => `<li>${s}</li>`).join('')}
    </ul>
  </div>

  <div style="font-size: 10px; color: #94a3b8; text-align: right;">
    Pigeon-Fly Nutrition Lab &bull; Zgodność ze standardem PZHGP/FCI &bull; Wygenerowano: ${new Date().toISOString().slice(0, 10)}
  </div>
</body>
</html>
  `.trim();
}

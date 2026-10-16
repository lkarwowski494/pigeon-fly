/**
 * PIGEON-FLY — Feed Compounder & Biochemical Nutrition Engine (BR-ZDR-006)
 * Scientific 20-grain database with exact crude protein, fat, digestible carbs,
 * fiber, and metabolizable energy (MJ/kg). Formulates custom mixes and analyzes suitability.
 */

export interface GrainProfile {
  id: string;
  name: string;
  category: 'cereal' | 'legume' | 'oilseed';
  proteinPct: number;    // Białko ogólne (%)
  fatPct: number;        // Tłuszcz surowy (%)
  carbsPct: number;      // Węglowodany strawne (%)
  fiberPct: number;      // Włókno surowe (%)
  energyMjKg: number;    // Energia metaboliczna (MJ/kg)
  description: string;
}

export const GRAIN_DATABASE: Record<string, GrainProfile> = {
  corn_criollo: {
    id: 'corn_criollo',
    name: 'Kukurydza drobna (Criollo)',
    category: 'cereal',
    proteinPct: 9.5,
    fatPct: 4.2,
    carbsPct: 68.0,
    fiberPct: 2.3,
    energyMjKg: 13.5,
    description: 'Łatwostrawne źródło energii węglowodanowej, idealne ziarno bazowe na loty.',
  },
  corn_bordeaux: {
    id: 'corn_bordeaux',
    name: 'Kukurydza czerwona (Bordeaux)',
    category: 'cereal',
    proteinPct: 10.0,
    fatPct: 4.5,
    carbsPct: 67.0,
    fiberPct: 2.4,
    energyMjKg: 13.6,
    description: 'Wysoka zawartość karotenoidów wzmacniających wzrok i wybarwienie upierzenia.',
  },
  peas_yellow: {
    id: 'peas_yellow',
    name: 'Groch żółty',
    category: 'legume',
    proteinPct: 22.5,
    fatPct: 1.4,
    carbsPct: 58.0,
    fiberPct: 5.5,
    energyMjKg: 11.8,
    description: 'Podstawowe białko budulcowe dla mięśni piersiowych i wychowu młódków.',
  },
  peas_green: {
    id: 'peas_green',
    name: 'Groch zielony',
    category: 'legume',
    proteinPct: 23.0,
    fatPct: 1.5,
    carbsPct: 57.0,
    fiberPct: 5.6,
    energyMjKg: 11.9,
    description: 'Wysoka przyswajalność aminokwasów lizyny i argininy.',
  },
  maple_peas: {
    id: 'maple_peas',
    name: 'Peluszka (Groch polny)',
    category: 'legume',
    proteinPct: 21.8,
    fatPct: 1.6,
    carbsPct: 56.0,
    fiberPct: 6.0,
    energyMjKg: 11.7,
    description: 'Tradycyjne ziarno lęgowe o twardej strukturze, stymulujące pracę żołądka mięśniowego.',
  },
  vetch: {
    id: 'vetch',
    name: 'Wyka ptasia',
    category: 'legume',
    proteinPct: 28.0,
    fatPct: 1.5,
    carbsPct: 52.0,
    fiberPct: 6.5,
    energyMjKg: 12.0,
    description: 'Skoncentrowane białko regeneracyjne po wyczerpującym locie.',
  },
  faba_beans: {
    id: 'faba_beans',
    name: 'Bobik drobny',
    category: 'legume',
    proteinPct: 26.0,
    fatPct: 1.3,
    carbsPct: 51.0,
    fiberPct: 7.2,
    energyMjKg: 11.5,
    description: 'Wysokobiałkowe ziarno dla gołębi rozpłodowych w szczycie karmienia.',
  },
  soy_toasted: {
    id: 'soy_toasted',
    name: 'Soja tostowana',
    category: 'legume',
    proteinPct: 36.0,
    fatPct: 18.0,
    carbsPct: 28.0,
    fiberPct: 5.0,
    energyMjKg: 15.2,
    description: 'Bomba białkowo-tłuszczowa bez inhibitorów trypsyny. Szybka odbudowa masy.',
  },
  wheat: {
    id: 'wheat',
    name: 'Pszenica',
    category: 'cereal',
    proteinPct: 12.0,
    fatPct: 1.8,
    carbsPct: 70.0,
    fiberPct: 2.6,
    energyMjKg: 12.8,
    description: 'Chętnie pobierane ziarno węglowodanowe bogate w gluten i witaminę E.',
  },
  barley: {
    id: 'barley',
    name: 'Jęczmień browarny',
    category: 'cereal',
    proteinPct: 11.0,
    fatPct: 2.1,
    carbsPct: 66.0,
    fiberPct: 4.8,
    energyMjKg: 11.9,
    description: 'Naturalny filtr jelitowy, podstawa diet oczyszczających i zimowych.',
  },
  dari: {
    id: 'dari',
    name: 'Dari (Sorgo białe)',
    category: 'cereal',
    proteinPct: 10.5,
    fatPct: 3.2,
    carbsPct: 72.0,
    fiberPct: 2.3,
    energyMjKg: 13.1,
    description: 'Szlachetne ziarno energetyczne bez barwników, nie obciąża wątroby.',
  },
  milo: {
    id: 'milo',
    name: 'Milo (Sorgo czerwone)',
    category: 'cereal',
    proteinPct: 10.8,
    fatPct: 3.4,
    carbsPct: 71.0,
    fiberPct: 2.5,
    energyMjKg: 13.0,
    description: 'Doskonałe uzupełnienie dari o wyższej zawartości garbników ściągających.',
  },
  kardi: {
    id: 'kardi',
    name: 'Kardi (Krokosz barwierski)',
    category: 'oilseed',
    proteinPct: 14.5,
    fatPct: 26.0,
    carbsPct: 16.0,
    fiberPct: 28.0,
    energyMjKg: 14.8,
    description: 'Kluczowe ziarno sportowe. Wysoka zawartość kwasu linolowego (omega-6).',
  },
  sunflower_black: {
    id: 'sunflower_black',
    name: 'Słonecznik czarny drobny',
    category: 'oilseed',
    proteinPct: 16.0,
    fatPct: 42.0,
    carbsPct: 15.0,
    fiberPct: 18.0,
    energyMjKg: 18.5,
    description: 'Paliwo rakietowe na loty długodystansowe i maratony.',
  },
  sunflower_striped: {
    id: 'sunflower_striped',
    name: 'Słonecznik pasiasty',
    category: 'oilseed',
    proteinPct: 15.5,
    fatPct: 36.0,
    carbsPct: 18.0,
    fiberPct: 22.0,
    energyMjKg: 17.2,
    description: 'Źródło nienasyconych kwasów tłuszczowych oraz witaminy E.',
  },
  hemp: {
    id: 'hemp',
    name: 'Konopie siewne',
    category: 'oilseed',
    proteinPct: 21.0,
    fatPct: 32.0,
    carbsPct: 18.0,
    fiberPct: 16.0,
    energyMjKg: 16.8,
    description: 'Najlepszy stymulant formy i wigoru lęgowego oraz magazyn tłuszczu.',
  },
  rapeseed: {
    id: 'rapeseed',
    name: 'Rzepak ozimy',
    category: 'oilseed',
    proteinPct: 20.0,
    fatPct: 40.0,
    carbsPct: 14.0,
    fiberPct: 9.0,
    energyMjKg: 18.0,
    description: 'Wysokooleiste drobne ziarno, niezastąpione w okresie pierzenia i chłodów.',
  },
  flaxseed: {
    id: 'flaxseed',
    name: 'Siemię lniane',
    category: 'oilseed',
    proteinPct: 22.0,
    fatPct: 36.0,
    carbsPct: 20.0,
    fiberPct: 8.0,
    energyMjKg: 17.5,
    description: 'Śluzy powlekające układ pokarmowy, nadaje jedwabisty połysk upierzeniu.',
  },
  millet_yellow: {
    id: 'millet_yellow',
    name: 'Proso żółte',
    category: 'cereal',
    proteinPct: 11.5,
    fatPct: 4.0,
    carbsPct: 65.0,
    fiberPct: 8.5,
    energyMjKg: 12.5,
    description: 'Drobne ziarno bogate w krzemionkę, kluczową dla budowy stosiny piór.',
  },
  paddy_rice: {
    id: 'paddy_rice',
    name: 'Ryż niełuskany (Paddy)',
    category: 'cereal',
    proteinPct: 7.8,
    fatPct: 2.2,
    carbsPct: 66.0,
    fiberPct: 9.5,
    energyMjKg: 11.2,
    description: 'Doskonałe ziarno dietetyczne, uspokaja perystaltykę jelit po locie.',
  },
};

export interface MixIngredient {
  grainId: string;
  percentage: number; // 0 to 100
}

export interface NutrientsBreakdown {
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
  fiberPct: number;
  energyMjKg: number;
}

export type MixPurpose = 'racing_speed' | 'racing_marathon' | 'breeding_rearing' | 'depurative' | 'moult';

export interface MixSuitabilityResult {
  purpose: MixPurpose;
  purposeName: string;
  score: number; // 0 to 100
  verdict: string;
  recommendation: string;
}

/**
 * Calculates weighted nutritional composition of a grain mixture.
 */
export function calculateMixNutrients(ingredients: MixIngredient[]): NutrientsBreakdown {
  if (!ingredients || ingredients.length === 0) {
    return { proteinPct: 0, fatPct: 0, carbsPct: 0, fiberPct: 0, energyMjKg: 0 };
  }

  const totalShare = ingredients.reduce((sum, item) => sum + item.percentage, 0);
  if (totalShare === 0) {
    return { proteinPct: 0, fatPct: 0, carbsPct: 0, fiberPct: 0, energyMjKg: 0 };
  }

  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;
  let totalEnergy = 0;

  ingredients.forEach((item) => {
    const key = item.grainId === 'safflower' ? 'kardi' : item.grainId;
    const grain = GRAIN_DATABASE[key];
    if (grain) {
      const weight = item.percentage / totalShare;
      totalProtein += grain.proteinPct * weight;
      totalFat += grain.fatPct * weight;
      totalCarbs += grain.carbsPct * weight;
      totalFiber += grain.fiberPct * weight;
      totalEnergy += grain.energyMjKg * weight;
    }
  });

  return {
    proteinPct: parseFloat(totalProtein.toFixed(2)),
    fatPct: parseFloat(totalFat.toFixed(2)),
    carbsPct: parseFloat(totalCarbs.toFixed(2)),
    fiberPct: parseFloat(totalFiber.toFixed(2)),
    energyMjKg: parseFloat(totalEnergy.toFixed(2)),
  };
}

/**
 * Validates whether the sum of ingredient percentages equals 100%.
 */
export function validateMixTotalPercent(
  ingredients: MixIngredient[]
): { isValid: boolean; totalPercent: number } {
  const sum = ingredients.reduce((acc, curr) => acc + curr.percentage, 0);
  const roundedSum = Math.round(sum * 10) / 10;
  return {
    isValid: Math.abs(roundedSum - 100) < 0.1,
    totalPercent: roundedSum,
  };
}

/**
 * Evaluates mix suitability across sport and biological applications.
 */
export function evaluateMixSuitability(
  nutrients: NutrientsBreakdown,
  targetPurpose: MixPurpose
): MixSuitabilityResult {
  let score = 50;
  let verdict = '';
  let recommendation = '';

  switch (targetPurpose) {
    case 'racing_speed':
      // Ideal: Protein 11-13%, Fat 5-8%, Energy 12.8-13.6 MJ/kg
      if (nutrients.proteinPct >= 11 && nutrients.proteinPct <= 14 && nutrients.fatPct >= 5 && nutrients.fatPct <= 8) {
        score = 95;
        verdict = '🟢 Znakomita mieszanka na loty szybkościowe (kat. A/B).';
        recommendation = 'Optymalny bilans energii węglowodanowej bez obciążania nerek białkiem.';
      } else if (nutrients.proteinPct > 15) {
        score = 60;
        verdict = '🟡 Zbyt wysokie białko na loty sprinterskie.';
        recommendation = 'Zmniejsz udział roślin motylkowych (groch/bobik), dodaj kukurydzy lub dari.';
      } else {
        score = 75;
        verdict = '⚪ Poprawna mieszanka sportowa.';
        recommendation = 'Dobra jako uniwersalna baza środka tygodnia.';
      }
      return { purpose: targetPurpose, purposeName: 'Loty Krótkie / Średnie', score, verdict, recommendation };

    case 'racing_marathon':
      // Ideal: Fat 10-18%, Energy > 14.2 MJ/kg
      if (nutrients.fatPct >= 10 && nutrients.energyMjKg >= 14.5) {
        score = 98;
        verdict = '🚀 Rewelacyjne ładowanie tłuszczowe na maratony (700-1000 km).';
        recommendation = 'Wysokie rezerwy kwasów tłuszczowych na wielogodzinny lot pod wiatr.';
      } else if (nutrients.fatPct < 8) {
        score = 45;
        verdict = '🔴 Za mało tłuszczu na maraton.';
        recommendation = 'Zwiększ udział nasion oleistych (kardi, konopie, słonecznik, orzeszki).';
      } else {
        score = 75;
        verdict = '🟡 Średnia energetyczność na daleki dystans.';
        recommendation = 'Zwiększ nasiona oleiste o 5-10% na 48h przed koszowaniem.';
      }
      return { purpose: targetPurpose, purposeName: 'Maraton i Daleki Dystans', score, verdict, recommendation };

    case 'breeding_rearing':
      // Ideal: Protein 16-20%, Fat 4-7%
      if (nutrients.proteinPct >= 16 && nutrients.proteinPct <= 21) {
        score = 95;
        verdict = '🍼 Idealna mieszanka lęgowa na wychów piskląt.';
        recommendation = 'Wysoka koncentracja aminokwasów zapewnia szybki wzrost kośćca i piór.';
      } else if (nutrients.proteinPct < 15) {
        score = 55;
        verdict = '⚠️ Niedobór białka w okresie karmienia piskląt.';
        recommendation = 'Zwiększ udział grochów, wyki lub soi tostowanej do min. 30%.';
      } else {
        score = 80;
        verdict = '🟢 Zadowalający poziom lęgowy.';
        recommendation = 'Zadbaj o równoległe podawanie gritu mineralnego w celi.';
      }
      return { purpose: targetPurpose, purposeName: 'Lęgi i Wychów Piskląt', score, verdict, recommendation };

    case 'depurative':
      // Ideal: Protein 10-11%, Fiber > 5%, Energy < 12.5 MJ/kg
      if (nutrients.proteinPct <= 12 && nutrients.fiberPct >= 4.5) {
        score = 96;
        verdict = '🍃 Doskonała dieta oczyszczająca po powrocie z lotu.';
        recommendation = 'Odciąża wątrobę i nerki po zakwaszeniu kwasem mlekowym.';
      } else {
        score = 65;
        verdict = '🟡 Mieszanka zbyt ciężka na dietę depuratywną.';
        recommendation = 'Zwiększ udział jęczmienia browarnego i ryżu paddy.';
      }
      return { purpose: targetPurpose, purposeName: 'Dieta Oczyszczająca (Depurative)', score, verdict, recommendation };

    case 'moult':
      // Ideal: Protein 14-17%, Fat 6-10%, high sulfur amino acids
      if (nutrients.proteinPct >= 14 && nutrients.fatPct >= 7) {
        score = 94;
        verdict = '🪶 Wzorcowa mieszanka pierzeniowa.';
        recommendation = 'Zapewnia siarkę i lipidy niezbędne do elastycznej odbudowy 10 lotek.';
      } else {
        score = 70;
        verdict = '🟡 Umiarkowane wsparcie wymiany upierzenia.';
        recommendation = 'Dodaj siemienia lnianego, rzepaku lub konopi siewnych.';
      }
      return { purpose: targetPurpose, purposeName: 'Wielkie Pierzenie Jesienne', score, verdict, recommendation };
  }
}

/**
 * Classic master feeding presets for quick loading.
 */
export const MASTER_FEED_PRESETS: { name: string; description: string; ingredients: MixIngredient[] }[] = [
  {
    name: 'Wdowieństwo Sport (Lotowa Baza)',
    description: 'Klasyczna mieszanka lotowa na loty krótko- i średniodystansowe.',
    ingredients: [
      { grainId: 'corn_criollo', percentage: 30 },
      { grainId: 'dari', percentage: 20 },
      { grainId: 'kardi', percentage: 15 },
      { grainId: 'peas_yellow', percentage: 15 },
      { grainId: 'barley', percentage: 10 },
      { grainId: 'hemp', percentage: 10 },
    ],
  },
  {
    name: 'Ekstremalny Maraton (Ładowanie Tłuszczowe)',
    description: 'Wysokoenergetyczna bomba lipidowa podawana na 3 dni przed maratonem.',
    ingredients: [
      { grainId: 'corn_bordeaux', percentage: 20 },
      { grainId: 'kardi', percentage: 25 },
      { grainId: 'sunflower_black', percentage: 20 },
      { grainId: 'hemp', percentage: 15 },
      { grainId: 'flaxseed', percentage: 10 },
      { grainId: 'soy_toasted', percentage: 10 },
    ],
  },
  {
    name: 'Wychów Mistrza (Białko Lęgowe)',
    description: 'Bogata w aminokwasy mieszanka na okres karmienia piskląt w celach.',
    ingredients: [
      { grainId: 'corn_criollo', percentage: 25 },
      { grainId: 'peas_yellow', percentage: 20 },
      { grainId: 'peas_green', percentage: 15 },
      { grainId: 'maple_peas', percentage: 10 },
      { grainId: 'vetch', percentage: 10 },
      { grainId: 'wheat', percentage: 10 },
      { grainId: 'hemp', percentage: 10 },
    ],
  },
  {
    name: 'Lekka Depuratywna (Oczyszczenie Powrotne)',
    description: 'Dieta powrotna z jęczmieniem i ryżem paddy na niedzielę i poniedziałek.',
    ingredients: [
      { grainId: 'barley', percentage: 40 },
      { grainId: 'paddy_rice', percentage: 25 },
      { grainId: 'wheat', percentage: 15 },
      { grainId: 'dari', percentage: 10 },
      { grainId: 'millet_yellow', percentage: 10 },
    ],
  },
];

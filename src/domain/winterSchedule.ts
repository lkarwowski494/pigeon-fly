/**
 * PIGEON-FLY — Inteligentny Generator Harmonogramu Sezonu Zimowego i Zimowania (Z-058)
 * Zoohigieniczny i weterynaryjny model spoczynku zimowego gołębi:
 * 1. Fazy zimowania: Rozdzielenie płci, głęboki spoczynek i hartowanie, przygotowanie przedlęgowe
 * 2. Termiczna modulacja diety jęczmiennej (oczyszczanie vs mrozy < -5°C)
 * 3. Chronometraż szczepień zimowych (Salmonelloza / Paratyfus, PMV-1 + Ospa z regułą min. 14 dni odstępu)
 * 4. Koproskopia przedsezonowa i witaminizacja E + Selen przed parowaniem wiosennym
 */

export type WinterPhaseId = 'separation' | 'deep_rest' | 'pre_breeding_prep';

export interface WinterPhaseInfo {
  id: WinterPhaseId;
  name: string;
  periodDescription: string;
  biologicalGoal: string;
  dietFocus: string;
  recommendedSupplements: string[];
  keyRules: string[];
}

export interface WinterDietRecommendation {
  temperatureCelsius: number;
  dietName: string;
  barleyPercent: number; // Jęczmień %
  wheatPercent: number; // Pszenica %
  cornPercent: number; // Kukurydza %
  fatSeedsPercent: number; // Kardi, słonecznik, siemię lniane %
  legumesPercent: number; // Strączkowe (groch, wyka) %
  dailyGramsPerBird: number;
  notes: string;
  drinkerAdditions: string[];
}

export interface WinterMilestone {
  daysBeforePairing: number;
  targetDate: string; // YYYY-MM-DD
  title: string;
  category: 'separation' | 'lab' | 'treatment' | 'vaccine' | 'disinfection' | 'nutrition' | 'pairing';
  description: string;
  mandatory: boolean;
  minGapToNextVaccineDays?: number;
}

export interface WinterScheduleParams {
  targetPairingDate: string; // YYYY-MM-DD (data planowanego połączenia w pary)
  outdoorTemperatureCelsius?: number; // do wyliczenia proporcji paszy
  includeSalmonellaVaccine?: boolean;
  includeParamyxoPoxVaccine?: boolean;
  hasHeatedBreedingSection?: boolean;
}

export interface WinterSchedulePlan {
  targetPairingDate: string;
  milestones: WinterMilestone[];
  currentPhase: WinterPhaseInfo;
  diet: WinterDietRecommendation;
  safetyWarnings: string[];
  totalRestPeriodDays: number;
}

/**
 * Standardowe fazy spoczynku zimowego stada
 */
export const WINTER_PHASES: Record<WinterPhaseId, WinterPhaseInfo> = {
  separation: {
    id: 'separation',
    name: 'Rozdzielenie Płci i Regeneracja',
    periodDescription: 'Listopad (po zakończeniu lotów i pierzenia)',
    biologicalGoal: 'Wygaszenie popędu płciowego, odpoczynek jajników i wola, zakończenie pierzenia lotek 9-10.',
    dietFocus: 'Dieta lekkostrawna (40-50% jęczmienia, bez ciężkich nasion strączkowych).',
    recommendedSupplements: ['Herbata ziołowa z miodem', 'Ocet jabłkowy z czosnkiem', 'Siemię lniane'],
    keyRules: [
      'Całkowite odseparowanie samców od samic do oddzielnych przedziałów.',
      'Usunięcie misek lęgowych i zamknięcie cel.',
      'Wypalenie rusztów palnikiem i odkażenie ścian wapnem gaszonym.',
    ],
  },
  deep_rest: {
    id: 'deep_rest',
    name: 'Głęboki Spoczynek i Hartowanie',
    periodDescription: 'Grudzień – Połowa Stycznia',
    biologicalGoal: 'Spowolnienie metabolizmu, hartowanie odporności w wolierze, ochrona przed otłuszczeniem.',
    dietFocus: 'Monodieta jęczmienna (55-70% jęczmienia w zależności od mrozów).',
    recommendedSupplements: ['Sól kłodawska do kąpieli raz w tygodniu', 'Propolis', 'Warzywa (marchew)'],
    keyRules: [
      'Ptaki karmione raz dziennie do syta lub porcjami 30g/dzień.',
      'Kąpiele tylko w ciepłe dni w południe (nigdy przed wieczorem w mróz).',
      'Kontrola dotykowa mostka (zapobieganie stłuszczeniu wątroby).',
    ],
  },
  pre_breeding_prep: {
    id: 'pre_breeding_prep',
    name: 'Przygotowanie Przedlęgowe i Profilaktyka',
    periodDescription: 'Druga połowa Stycznia – Luty (6-8 tyg. przed parowaniem)',
    biologicalGoal: 'Badanie kału, uodpornienie stada (szczepienia), synchronizacja owulacji.',
    dietFocus: 'Stopniowe zwiększanie udziału kukurydzy, kardi i białka przed złożeniem jaj.',
    recommendedSupplements: ['Witamina E + Selen', 'Grit mineralny z czerwoną glinką', 'Drożdże piwne'],
    keyRules: [
      'Bezwzględne zachowanie min. 14 dni odstępu między szczepieniem na salmonellę i PMV-1.',
      'Odrobaczanie wyłącznie po potwierdzeniu obecności jaj w badaniu kału.',
      'Doświetlanie stada rozpłodowego do 14h na 7-10 dni przed połączeniem.',
    ],
  },
};

/**
 * Oblicza optymalną recepturę karmy zimowej na podstawie panującej temperatury
 */
export function calculateWinterDietFormula(temperatureCelsius = 0): WinterDietRecommendation {
  if (temperatureCelsius < -5) {
    // Silne mrozy (< -5°C): ptak spala tłuszcz na termogenezę
    return {
      temperatureCelsius,
      dietName: 'Mieszanka Zimowa Mrozowa (Wysokoenergetyczna)',
      barleyPercent: 35,
      wheatPercent: 20,
      cornPercent: 25,
      fatSeedsPercent: 15, // kardi, słonecznik, rzepak
      legumesPercent: 5,
      dailyGramsPerBird: 36,
      notes: 'Zwiększony udział tłuszczu i węglowodanów złożonych (kukurydza) chroni stado przed wyziębieniem.',
      drinkerAdditions: ['Miód naturalny + napar z ziół', 'Witamina C + elektrolity glukozowe'],
    };
  }

  if (temperatureCelsius <= 5) {
    // Umiarkowana zima (-5°C do +5°C): standardowy spoczynek
    return {
      temperatureCelsius,
      dietName: 'Mieszanka Zimowa Spoczynkowa (Zrównoważona)',
      barleyPercent: 50,
      wheatPercent: 20,
      cornPercent: 18,
      fatSeedsPercent: 10,
      legumesPercent: 2,
      dailyGramsPerBird: 32,
      notes: '50% jęczmienia oczyszcza wątrobę i zapobiega nadwadze, utrzymując ptaki w optymalnej kondycji spoczynkowej.',
      drinkerAdditions: ['Ocet jabłkowy 5% (1 łyżka/litr)', 'Ekstrakt z czosnku i cebuli'],
    };
  }

  // Ciepła zima / odwilż (> 5°C): rygorystyczne oczyszczanie jęczmienne
  return {
    temperatureCelsius,
    dietName: 'Mieszanka Dietetyczna Jęczmienna (Oczyszczająca)',
    barleyPercent: 65,
    wheatPercent: 15,
    cornPercent: 12,
    fatSeedsPercent: 8,
    legumesPercent: 0,
    dailyGramsPerBird: 28,
    notes: 'Przy braku mrozów wysoki jęczmień (65%) bez strączków uniemożliwia przedwczesną ruję i stłuszczenie.',
    drinkerAdditions: ['Napar z pokrzywy i dziurawca', 'Probiotyk z kwasem masłowym'],
  };
}

/**
 * Generuje kompletny 8-etapowy harmonogram weterynaryjny i zoohigieniczny zimy
 */
export function generateWinterSchedulePlan(params: WinterScheduleParams): WinterSchedulePlan {
  const pairingDateObj = new Date(params.targetPairingDate);
  const isValidDate = !isNaN(pairingDateObj.getTime());
  const baseDate = isValidDate ? pairingDateObj : new Date('2027-02-20');

  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().slice(0, 10);
  };

  const milestones: WinterMilestone[] = [];
  const safetyWarnings: string[] = [];

  // T - 56 dni (8 tyg): Kontrola separacji i masy stada
  milestones.push({
    daysBeforePairing: 56,
    targetDate: addDays(baseDate, -56),
    title: 'Weryfikacja separacji płci i wagi stada',
    category: 'separation',
    description: 'Samce i samice odseparowane, kontrola umięśnienia mostka i kondycji przed zimą.',
    mandatory: true,
  });

  // T - 42 dni (6 tyg): Badanie kału (Koproskopia)
  milestones.push({
    daysBeforePairing: 42,
    targetDate: addDays(baseDate, -42),
    title: 'Przedlęgowe badanie kału (Koproskopia McMaster)',
    category: 'lab',
    description: 'Badanie próbki zbiorczej pod kątem kokcydiozy, glistnicy i nicieni (Capillaria).',
    mandatory: true,
  });

  // T - 35 dni (5 tyg): Odrobaczanie celowane
  milestones.push({
    daysBeforePairing: 35,
    targetDate: addDays(baseDate, -35),
    title: 'Ewentualne odrobaczanie celowane i dezynfekcja',
    category: 'treatment',
    description: 'Podanie leku (np. Lewamizol) tylko w razie dodatniego wyniku badania kału. Następnego dnia palnik gazowy.',
    mandatory: false,
  });

  // T - 28 dni (4 tyg): Szczepienie na Salmonellozę
  if (params.includeSalmonellaVaccine !== false) {
    milestones.push({
      daysBeforePairing: 28,
      targetDate: addDays(baseDate, -28),
      title: 'Szczepienie przeciw Salmonellozie (Paratyfus)',
      category: 'vaccine',
      description: 'Inaktywowana szczepionka (np. Zoosal T / Salmo PT). Ochrona jajowodu przed zakażeniem żółtka.',
      mandatory: true,
      minGapToNextVaccineDays: 14,
    });
  }

  // T - 14 dni (2 tyg): Szczepienie PMV-1 + Ospa
  if (params.includeParamyxoPoxVaccine !== false) {
    milestones.push({
      daysBeforePairing: 14,
      targetDate: addDays(baseDate, -14),
      title: 'Szczepienie PMV-1 (Paramykso) + Ospa gołębi',
      category: 'vaccine',
      description: 'Szczepionka skojarzona (np. Pharmavac Columbi 2). Zachowany rygor min. 14 dni od szczepionki na salmonellę.',
      mandatory: true,
    });
  }

  // T - 10 dni: Dezynfekcja cel i misek
  milestones.push({
    daysBeforePairing: 10,
    targetDate: addDays(baseDate, -10),
    title: 'Dezynfekcja cel lęgowych i wstawienie misek',
    category: 'disinfection',
    description: 'Mycie na mokro Virkonem / Rapicidem, montaż wkładek gipsowych i świeżego tytoniu/siana.',
    mandatory: true,
  });

  // T - 7 dni (1 tydz): Doświetlanie i Witamina E + Selen
  milestones.push({
    daysBeforePairing: 7,
    targetDate: addDays(baseDate, -7),
    title: 'Doświetlanie stada (14h) + Witamina E i Selen',
    category: 'nutrition',
    description: 'Wydłużenie fotoperiodu pobudza przysadkę mózgową. Wit. E stymuluje plemniki i syntezę żółtka.',
    mandatory: true,
  });

  // T (Dzień 0): Łączenie w pary
  milestones.push({
    daysBeforePairing: 0,
    targetDate: addDays(baseDate, 0),
    title: 'Łączenie par rozpłodowych w celach lęgowych',
    category: 'pairing',
    description: 'Wpuszczenie samic do cel, kontrola akceptacji partnerów, karma rozpłodowa w karmniku.',
    mandatory: true,
  });

  // Safety checks
  const month = baseDate.getMonth(); // 0 = styczeń, 1 = luty
  if (month === 0 && !params.hasHeatedBreedingSection) {
    safetyWarnings.push(
      'Planowane parowanie w styczniu bez ogrzewania celi lęgowej stwarza ryzyko wychłodzenia pierwszego jaja i obumarcia zarodków.'
    );
  }

  const diet = calculateWinterDietFormula(params.outdoorTemperatureCelsius ?? 0);

  return {
    targetPairingDate: baseDate.toISOString().slice(0, 10),
    milestones,
    currentPhase: WINTER_PHASES.pre_breeding_prep,
    diet,
    safetyWarnings,
    totalRestPeriodDays: 56,
  };
}

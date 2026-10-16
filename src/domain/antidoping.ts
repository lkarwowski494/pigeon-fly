/**
 * PIGEON-FLY — FCI & PZHGP Antidoping & Prohibited Substances Guard (Z-304, BR-ZDR-009)
 * Comprehensive regulatory guard enforcing FCI (Fédération Colombophile Internationale)
 * and PZHGP anti-doping codes, withdrawal windows, and basketing eligibility.
 */

import { HealthLog } from './types';

export type DopingCategory =
  | 'corticosteroid'
  | 'anabolic_steroid'
  | 'beta2_agonist'
  | 'nsaid'
  | 'stimulant'
  | 'bronchodilator'
  | 'antiprotozoal'
  | 'antibiotic'
  | 'other_prohibited';

export type FciClassification = 'strictly_banned' | 'racing_restricted' | 'controlled_substance';

export interface ProhibitedSubstance {
  id: string;
  name: string;
  innName: string; // International Nonproprietary Name
  category: DopingCategory;
  categoryLabel: string;
  fciClassification: FciClassification;
  standardWithdrawalDays: number;
  detectionWindowDays: number;
  brandNames: string[];
  description: string;
  fciRuleReference: string;
  liverDetoxRecommended: boolean;
}

export interface DopingViolationRecord {
  substanceId: string;
  substanceName: string;
  category: DopingCategory;
  categoryLabel: string;
  treatmentDate: string;
  withdrawalDays: number;
  clearanceDate: string; // YYYY-MM-DD
  daysRemaining: number;
  isStrictlyBanned: boolean;
  productName: string;
  ruleReference: string;
}

export type AntidopingStatus = 'eligible' | 'warning' | 'prohibited';

export interface AntidopingClearanceResult {
  pigeonId: string;
  status: AntidopingStatus;
  isClearForRace: boolean;
  violationsCount: number;
  activeViolations: DopingViolationRecord[];
  safestBasketingDate?: string;
  summaryMessage: string;
}

/**
 * Standard registry of prohibited and restricted substances under FCI & PZHGP regulations.
 */
export const FCI_SUBSTANCES_REGISTRY: ProhibitedSubstance[] = [
  // 1. Corticosteroids (Glikokortykosteroidy — bezwzględny zakaz w sezonie lotowym)
  {
    id: 'sub-cort-01',
    name: 'Deksametazon',
    innName: 'Dexamethasonum',
    category: 'corticosteroid',
    categoryLabel: 'Glikokortykosteroid (Doping)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 21,
    detectionWindowDays: 28,
    brandNames: ['Dexasone', 'Rapidexon', 'Colvasone', 'Dexafort', 'Dexamed'],
    description: 'Silny środek przeciwzapalny maskujący ból i zmęczenie. Bezwzględny zakaz FCI.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 4.1 (Glucocorticoids)',
    liverDetoxRecommended: true,
  },
  {
    id: 'sub-cort-02',
    name: 'Betametazon',
    innName: 'Betamethasonum',
    category: 'corticosteroid',
    categoryLabel: 'Glikokortykosteroid (Doping)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 21,
    detectionWindowDays: 30,
    brandNames: ['Betamox-D', 'Celestone', 'Diprospan'],
    description: 'Długodziałający steryd. Maskuje urazy aparatu ruchu skrzydeł.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 4.1',
    liverDetoxRecommended: true,
  },
  {
    id: 'sub-cort-03',
    name: 'Prednizolon',
    innName: 'Prednisolonum',
    category: 'corticosteroid',
    categoryLabel: 'Glikokortykosteroid (Doping)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 14,
    detectionWindowDays: 21,
    brandNames: ['Encortolon', 'Predniderm', 'Prednivet'],
    description: 'Steryd o działaniu ogólnoustrojowym.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 4.1',
    liverDetoxRecommended: true,
  },

  // 2. Anabolic Steroids (Steroidy anaboliczno-androgenne)
  {
    id: 'sub-anab-01',
    name: 'Nandrolon',
    innName: 'Nandroloni decanoas',
    category: 'anabolic_steroid',
    categoryLabel: 'Steroid Anaboliczny (Doping Ciężki)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 60,
    detectionWindowDays: 90,
    brandNames: ['Deca-Durabolin', 'Nandrovet'],
    description: 'Substancja sztucznie budująca masę mięśniową i wytrzymałość. Trwała dyskwalifikacja.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 2.1 (Anabolic Agents)',
    liverDetoxRecommended: true,
  },
  {
    id: 'sub-anab-02',
    name: 'Testosteron',
    innName: 'Testosteronum',
    category: 'anabolic_steroid',
    categoryLabel: 'Steroid Anaboliczny (Doping Ciężki)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 45,
    detectionWindowDays: 60,
    brandNames: ['Testoviron', 'Omnadren'],
    description: 'Hormon androgenny stymulujący agresję i motywację powrotu.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 2.1',
    liverDetoxRecommended: true,
  },

  // 3. Beta-2 Agonists (Beta-2 mimetyki / Leki rozszerzające oskrzela)
  {
    id: 'sub-b2-01',
    name: 'Klenbuterol',
    innName: 'Clenbuterolum',
    category: 'beta2_agonist',
    categoryLabel: 'Beta-2 Agonista (Doping)',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 28,
    detectionWindowDays: 35,
    brandNames: ['Ventipulmin', 'Spiropent', 'Dilaterol'],
    description: 'Zwiększa pojemność płuc i transport tlenu, działa silnie antykatabolicznie.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 3.2 (Beta-2 Agonists)',
    liverDetoxRecommended: true,
  },

  // 4. NSAIDs (Niesteroidowe Leki Przeciwzapalne / Przeciwbólowe)
  {
    id: 'sub-nsaid-01',
    name: 'Meloksykam',
    innName: 'Meloxicamum',
    category: 'nsaid',
    categoryLabel: 'NLPZ (Środek Przeciwbólowy)',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 7,
    detectionWindowDays: 10,
    brandNames: ['Metacam', 'Meloxidyl', 'Meloxivet', 'Loxicom'],
    description: 'Lek przeciwbólowy i przeciwzapalny. Karencja minimum 7 dni przed koszowaniem.',
    fciRuleReference: 'FCI Regulations on Therapeutics & NSAIDs',
    liverDetoxRecommended: false,
  },
  {
    id: 'sub-nsaid-02',
    name: 'Fluniksyna',
    innName: 'Flunixinum megluminum',
    category: 'nsaid',
    categoryLabel: 'NLPZ (Środek Przeciwbólowy)',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 10,
    detectionWindowDays: 14,
    brandNames: ['Finadyne', 'Vetaflun', 'Flunixin', 'Meflosyl'],
    description: 'Mocny niesteroidowy lek przeciwbólowy. Karencja 10 dni.',
    fciRuleReference: 'FCI Regulations on Therapeutics & NSAIDs',
    liverDetoxRecommended: false,
  },
  {
    id: 'sub-nsaid-03',
    name: 'Ketoprofen',
    innName: 'Ketoprofenum',
    category: 'nsaid',
    categoryLabel: 'NLPZ (Środek Przeciwbólowy)',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 7,
    detectionWindowDays: 10,
    brandNames: ['Ketofen', 'Dinalgen'],
    description: 'Lek przeciwbólowy i przeciwgorączkowy.',
    fciRuleReference: 'FCI Regulations on Therapeutics & NSAIDs',
    liverDetoxRecommended: false,
  },

  // 5. Stimulants (Stymulanty OUN)
  {
    id: 'sub-stim-01',
    name: 'Kofeina / Teofilina',
    innName: 'Coffeinum / Theophyllinum',
    category: 'stimulant',
    categoryLabel: 'Stymulant Układu Nerwowego',
    fciClassification: 'strictly_banned',
    standardWithdrawalDays: 14,
    detectionWindowDays: 18,
    brandNames: ['Coffeinum', 'Theospirex', 'Guarana Extract High Dose'],
    description: 'Zwiększa czujność, przyspiesza akcję serca. Surowo wzbronione podawanie w dawkach farmakologicznych.',
    fciRuleReference: 'FCI Anti-Doping Code Art. 5.1 (Stimulants)',
    liverDetoxRecommended: false,
  },

  // 6. Bronchodilators & Expectorants (Mukolityki i wykrztuśne w locie)
  {
    id: 'sub-bronch-01',
    name: 'Bromheksyna',
    innName: 'Bromhexinum',
    category: 'bronchodilator',
    categoryLabel: 'Mukolityk Układu Oddechowego',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 5,
    detectionWindowDays: 7,
    brandNames: ['Bisolvon', 'Bromhexin', 'Mucosolvan'],
    description: 'Rozrzedza śluz w drogach oddechowych. Wstrzymać 5 dni przed koszowaniem.',
    fciRuleReference: 'PZHGP Wytyczne Weterynaryjne Dział IV',
    liverDetoxRecommended: false,
  },

  // 7. Synthetic Antiprotozoals (Syntetyczne leki na rzęsistka i kokcydia)
  {
    id: 'sub-proto-01',
    name: 'Ronidazol',
    innName: 'Ronidazolum',
    category: 'antiprotozoal',
    categoryLabel: 'Chemioterapeutyk Przeciwpierwotniakowy',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 5,
    detectionWindowDays: 7,
    brandNames: ['Ronidazol 10%', 'Tricho Plus', 'Ronivet', 'Spartrix', 'Chevi-kok'],
    description: 'Środek na trichomonadozę (żółty guzek). Karencja 5 dni przed lotem.',
    fciRuleReference: 'PZHGP Regulamin Lotowy & FCI Withdrawal List',
    liverDetoxRecommended: true,
  },
  {
    id: 'sub-proto-02',
    name: 'Metronidazol',
    innName: 'Metronidazolum',
    category: 'antiprotozoal',
    categoryLabel: 'Chemioterapeutyk Przeciwpierwotniakowy',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 7,
    detectionWindowDays: 10,
    brandNames: ['Metronidazol', 'Klion'],
    description: 'Mocny antiprotozoal. Obciąża wątrobę i koordynację nerwową.',
    fciRuleReference: 'FCI Therapeutics Withdrawal List',
    liverDetoxRecommended: true,
  },

  // 8. Antibiotics (Antybiotyki z okresem karencji)
  {
    id: 'sub-ab-01',
    name: 'Enrofloksacyna',
    innName: 'Enrofloxacinum',
    category: 'antibiotic',
    categoryLabel: 'Fluorochinolon (Antybiotyk)',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 7,
    detectionWindowDays: 12,
    brandNames: ['Baytril', 'Enrobioflox', 'Enroxil'],
    description: 'Silny antybiotyk bakteriobójczy. Karencja 7 dni. Niewskazany w sezonie lotowym.',
    fciRuleReference: 'PZHGP Karencje Lekowe & FCI Ethics',
    liverDetoxRecommended: true,
  },
  {
    id: 'sub-ab-02',
    name: 'Doksycyklina',
    innName: 'Doxycyclinum',
    category: 'antibiotic',
    categoryLabel: 'Tetracyklina (Antybiotyk)',
    fciClassification: 'racing_restricted',
    standardWithdrawalDays: 7,
    detectionWindowDays: 10,
    brandNames: ['Doxycyclinum', 'Doxybactin', 'Ronaxan'],
    description: 'Antybiotyk na ornitozę i mikoplazmozę. Karencja 7 dni.',
    fciRuleReference: 'PZHGP Karencje Lekowe',
    liverDetoxRecommended: true,
  },
];

/**
 * Normalizes string for fuzzy/case-insensitive matching.
 */
function normalizeStr(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => {
      const map: Record<string, string> = {
        ą: 'a',
        ć: 'c',
        ę: 'e',
        ł: 'l',
        ń: 'n',
        ó: 'o',
        ś: 's',
        ź: 'z',
        ż: 'z',
      };
      return map[m] || m;
    })
    .trim();
}

/**
 * Matches a product name or active substance string against the FCI prohibited registry.
 */
export function detectSubstanceInProduct(productName: string): ProhibitedSubstance | null {
  if (!productName || !productName.trim()) return null;
  const normQuery = normalizeStr(productName);

  for (const item of FCI_SUBSTANCES_REGISTRY) {
    if (normalizeStr(item.name).length > 2 && normQuery.includes(normalizeStr(item.name))) {
      return item;
    }
    if (normalizeStr(item.innName).length > 2 && normQuery.includes(normalizeStr(item.innName))) {
      return item;
    }
    for (const brand of item.brandNames) {
      if (normalizeStr(brand).length > 2 && normQuery.includes(normalizeStr(brand))) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Adds days to a YYYY-MM-DD date string.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Computes difference in calendar days between two dates (targetDate - fromDate).
 */
function diffDays(fromDateStr: string, toDateStr: string): number {
  const f = new Date(fromDateStr);
  const t = new Date(toDateStr);
  const diffTime = t.getTime() - f.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Checks antidoping clearance for a specific pigeon on a given race/basketing date.
 */
export function checkAntidopingClearance(params: {
  pigeonId: string;
  healthLogs: HealthLog[];
  raceDate: string | Date;
}): AntidopingClearanceResult {
  const { pigeonId, healthLogs, raceDate } = params;
  const raceDateStr =
    typeof raceDate === 'string'
      ? raceDate.includes('T')
        ? raceDate.split('T')[0]
        : raceDate
      : raceDate.toISOString().split('T')[0];

  // Match logs: specific bird OR entire flock (pigeonId is null/undefined)
  const applicableLogs = healthLogs.filter(
    (log) => !log.pigeonId || log.pigeonId === pigeonId
  );

  const activeViolations: DopingViolationRecord[] = [];
  let latestClearanceDate: string | undefined = undefined;

  for (const log of applicableLogs) {
    const detected = detectSubstanceInProduct(log.productName);
    const withdrawalDays = Math.max(
      log.withdrawalDays || 0,
      detected ? detected.standardWithdrawalDays : 0
    );

    if (withdrawalDays <= 0 && !detected) {
      continue;
    }

    const clearanceDate = addDays(log.date, withdrawalDays);
    const daysUntilClear = diffDays(raceDateStr, clearanceDate);

    // If clearanceDate is AFTER or EQUAL to raceDate, there is an active violation
    if (daysUntilClear > 0) {
      const substanceName = detected ? detected.name : log.productName;
      const category = detected ? detected.category : 'other_prohibited';
      const categoryLabel = detected
        ? detected.categoryLabel
        : 'Substancja podlegająca karencji';
      const isStrictlyBanned = detected ? detected.fciClassification === 'strictly_banned' : false;
      const ruleReference = detected
        ? detected.fciRuleReference
        : 'Regulamin Dyscyplinarny PZHGP (Karencja lekowa)';

      activeViolations.push({
        substanceId: detected ? detected.id : `log-${log.id}`,
        substanceName,
        category,
        categoryLabel,
        treatmentDate: log.date,
        withdrawalDays,
        clearanceDate,
        daysRemaining: daysUntilClear,
        isStrictlyBanned,
        productName: log.productName,
        ruleReference,
      });

      if (!latestClearanceDate || clearanceDate > latestClearanceDate) {
        latestClearanceDate = clearanceDate;
      }
    }
  }

  if (activeViolations.length === 0) {
    return {
      pigeonId,
      status: 'eligible',
      isClearForRace: true,
      violationsCount: 0,
      activeViolations: [],
      safestBasketingDate: raceDateStr,
      summaryMessage: 'Czysty status antydopingowy FCI/PZHGP. Brak aktywnych karencji.',
    };
  }

  const hasStrictlyBanned = activeViolations.some((v) => v.isStrictlyBanned);

  return {
    pigeonId,
    status: 'prohibited',
    isClearForRace: false,
    violationsCount: activeViolations.length,
    activeViolations,
    safestBasketingDate: latestClearanceDate,
    summaryMessage: hasStrictlyBanned
      ? `ZAKAZ KOSZOWANIA (DOPING FCI)! Wykryto substancje zabronione (${activeViolations.map((v) => v.substanceName).join(', ')}). Bezpieczna data: ${latestClearanceDate}.`
      : `AKTYWNA KARENCJA LEKOWA! Ptak pod wpływem leków (${activeViolations.map((v) => v.substanceName).join(', ')}). Wymagany odstęp do: ${latestClearanceDate}.`,
  };
}

/**
 * Quick validation helper for basketing gate check.
 * Throws an alert/blocking error if bird cannot be basketed due to doping.
 */
export function validateBasketingAntidoping(
  pigeonId: string,
  ringNumber: string,
  healthLogs: HealthLog[],
  raceDate: string | Date
): { isAllowed: boolean; errorMessage?: string; clearanceDate?: string } {
  const result = checkAntidopingClearance({ pigeonId, healthLogs, raceDate });

  if (!result.isClearForRace) {
    return {
      isAllowed: false,
      errorMessage: `BLOKADA ANTYDOPINGOWA FCI: Gołąb ${ringNumber} ma aktywną karencję/doping. Powód: ${result.summaryMessage}`,
      clearanceDate: result.safestBasketingDate,
    };
  }

  return { isAllowed: true };
}

/**
 * Evaluates full liver and metabolic detox support for a pigeon recovering from medication.
 */
export function getDetoxRecommendation(substanceCategory: DopingCategory): {
  protocolName: string;
  durationDays: number;
  supplements: string[];
  hydrationAdvise: string;
} {
  switch (substanceCategory) {
    case 'corticosteroid':
    case 'anabolic_steroid':
      return {
        protocolName: 'Głęboki Detoks Hepatologiczny (Po Steroidach)',
        durationDays: 7,
        supplements: [
          'Sedochol (cholina + metionina) 10 ml / 1 L wody',
          'Ostropest plamisty (sylimaryna)',
          'Witamina B-Kompleks + Witamina C (ochrona nerek)',
        ],
        hydrationAdvise: 'Zwiększone poidło z roztworem elektrolitowym o niskiej osmolalności (280 mOsm/L).',
      };
    case 'antibiotic':
      return {
        protocolName: 'Odbudowa Mikrobiomu i Ochrona Wątroby (Po Antybiotyku)',
        durationDays: 5,
        supplements: [
          'Probiotyk żywych kultur (Enterococcus faecium)',
          'Kwas maślany (Sodium Butyrate) na kosmki jelitowe',
          'Wyciąg z karczocha i mniszka lekarskiego',
        ],
        hydrationAdvise: 'Zakwaszanie wody octem jabłkowym lub kwasem mlekowym (pH 4.5).',
      };
    case 'antiprotozoal':
      return {
        protocolName: 'Regeneracja Nabłonka Wola i Wątroby',
        durationDays: 3,
        supplements: [
          'Witamina A + D3 + E',
          'Cholina i betaina',
          'Nasiona czarnuszki i anyżu',
        ],
        hydrationAdvise: 'Czysta, świeża woda źródlana bez chloru.',
      };
    default:
      return {
        protocolName: 'Standardowa Ochrona Wątroby',
        durationDays: 3,
        supplements: ['Elektrolity regeneracyjne', 'Drożdże piwne bogate w witaminy B'],
        hydrationAdvise: 'Woda z miodem i cytryną.',
      };
  }
}

/**
 * PIGEON-FLY — Genetics & Pedigree Analysis
 * Calculation of Wright's Inbreeding Coefficient (F) and ancestor path traversal.
 */

import { Pigeon } from './types';

export interface AncestorPath {
  ancestorId: string;
  generationCock: number; // n1
  generationHen: number; // n2
  pathLength: number; // n1 + n2 + 1
}

export interface InbreedingResult {
  coefficientF: number; // 0.0 to 1.0 (e.g. 0.25 = 25%)
  percentage: number; // 0% to 100%
  level: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
  commonAncestorIds: string[];
  warningMessage?: string;
}

/**
 * Traverses pedigree ancestors up to maxGenerations.
 * Returns a map of ancestorId -> Array of path depths (generations from root).
 */
export function getAncestorsDepthMap(
  pigeonId: string,
  pigeonLookup: Map<string, Pigeon>,
  maxGenerations = 5,
  currentDepth = 0
): Map<string, number[]> {
  const map = new Map<string, number[]>();

  if (currentDepth >= maxGenerations || !pigeonId) {
    return map;
  }

  const pigeon = pigeonLookup.get(pigeonId);
  if (!pigeon) {
    return map;
  }

  const addDepth = (id: string, depth: number) => {
    const list = map.get(id) || [];
    list.push(depth);
    map.set(id, list);
  };

  // Father lineage
  if (pigeon.fatherId) {
    addDepth(pigeon.fatherId, currentDepth + 1);
    const fatherAncestors = getAncestorsDepthMap(
      pigeon.fatherId,
      pigeonLookup,
      maxGenerations,
      currentDepth + 1
    );
    for (const [id, depths] of fatherAncestors.entries()) {
      const existing = map.get(id) || [];
      map.set(id, existing.concat(depths));
    }
  }

  // Mother lineage
  if (pigeon.motherId) {
    addDepth(pigeon.motherId, currentDepth + 1);
    const motherAncestors = getAncestorsDepthMap(
      pigeon.motherId,
      pigeonLookup,
      maxGenerations,
      currentDepth + 1
    );
    for (const [id, depths] of motherAncestors.entries()) {
      const existing = map.get(id) || [];
      map.set(id, existing.concat(depths));
    }
  }

  return map;
}

/**
 * Calculates Sewall Wright's Inbreeding Coefficient (F) for mating between cockId and henId.
 * Formula: F_X = sum [ (1/2)^(n1 + n2 + 1) * (1 + F_A) ]
 */
export function calculateWrightInbreeding(
  cockId: string | null | undefined,
  henId: string | null | undefined,
  pigeonLookup: Map<string, Pigeon>,
  maxGenerations = 5
): InbreedingResult {
  if (!cockId || !henId) {
    return {
      coefficientF: 0.0,
      percentage: 0.0,
      level: 'none',
      commonAncestorIds: [],
    };
  }

  // Direct parent-offspring mating check
  if (cockId === henId) {
    return {
      coefficientF: 1.0,
      percentage: 100.0,
      level: 'extreme',
      commonAncestorIds: [cockId],
      warningMessage: 'Krytyczny błąd: kojarzenie ptaka z samym sobą.',
    };
  }

  const cock = pigeonLookup.get(cockId);
  const hen = pigeonLookup.get(henId);

  // Check if cock is father of hen
  if (hen && hen.fatherId === cockId) {
    // Parent x Child mating (e.g. Ojciec x Córka) => min F = 0.25
    return {
      coefficientF: 0.25,
      percentage: 25.0,
      level: 'high',
      commonAncestorIds: [cockId],
      warningMessage: 'Ścisły inbred: kojarzenie ojciec x córka (F = 25%).',
    };
  }

  // Check if hen is mother of cock
  if (cock && cock.motherId === henId) {
    // Mother x Son => min F = 0.25
    return {
      coefficientF: 0.25,
      percentage: 25.0,
      level: 'high',
      commonAncestorIds: [henId],
      warningMessage: 'Ścisły inbred: kojarzenie matka x syn (F = 25%).',
    };
  }

  const cockAncestors = getAncestorsDepthMap(cockId, pigeonLookup, maxGenerations, 0);
  const henAncestors = getAncestorsDepthMap(henId, pigeonLookup, maxGenerations, 0);

  // Find common ancestors
  const commonAncestorIds: string[] = [];
  let sumF = 0;

  for (const [ancestorId, cockDepths] of cockAncestors.entries()) {
    if (henAncestors.has(ancestorId)) {
      commonAncestorIds.push(ancestorId);
      const henDepths = henAncestors.get(ancestorId)!;

      // In pure Wright formula: sum over all independent connecting genealogical paths
      for (const n1 of cockDepths) {
        for (const n2 of henDepths) {
          // (0.5)^(n1 + n2 + 1)
          const pathContribution = Math.pow(0.5, n1 + n2 + 1);
          sumF += pathContribution;
        }
      }
    }
  }

  const clampedF = Math.min(1.0, Math.round(sumF * 10000) / 10000);
  const percentage = Math.round(clampedF * 10000) / 100;

  let level: InbreedingResult['level'] = 'none';
  let warningMessage: string | undefined;

  if (clampedF === 0) {
    level = 'none';
  } else if (clampedF < 0.0625) {
    level = 'low';
  } else if (clampedF < 0.125) {
    level = 'moderate';
    warningMessage = 'Umiarkowany inbred (F < 12.5%): wskazany do utrwalania cech wybitnych linii.';
  } else if (clampedF < 0.25) {
    level = 'high';
    warningMessage = 'Wysoki inbred (F ≥ 12.5%): ryzyko spadku witalności i płodności stada.';
  } else {
    level = 'extreme';
    warningMessage = 'Ekstremalny inbred (F ≥ 25%): tylko dla doświadczonych mistrzów hodowli zachowawczej.';
  }

  return {
    coefficientF: clampedF,
    percentage,
    level,
    commonAncestorIds,
    warningMessage,
  };
}

export type BaseColorType = 'ash_red' | 'blue_bar' | 'brown' | 'unknown';
export type DilutionType = 'dense' | 'dilute';

export interface PlumagePrediction {
  cockColorRaw: string;
  henColorRaw: string;
  cockBaseColor: BaseColorType;
  henBaseColor: BaseColorType;
  isAutosexing: boolean;
  autosexingCategory?: 'color_linked' | 'dilution_linked' | 'none';
  autosexingBadge?: string;
  autosexingExplanation?: string;
  sonsExpected: string[];
  daughtersExpected: string[];
  hatchlingDownDescription?: string;
}

/**
 * Normalizes user-entered Polish plumage color string into genetics base color allele.
 * Rule RD-38: Dominance hierarchy: Ash-red (B^A) > Wild Blue (B+) > Brown (b).
 */
export function parsePlumageBaseColor(colorName: string): {
  base: BaseColorType;
  dilution: DilutionType;
} {
  const norm = (colorName || '').toLowerCase().trim();

  // Dilute check
  const isDilute =
    norm.includes('żółt') ||
    norm.includes('zolt') ||
    norm.includes('srebrn') ||
    norm.includes('izabel') ||
    norm.includes('płowa jasna') ||
    norm.includes('plowa jasna');

  if (norm.includes('czerwon') || norm.includes('płow') || norm.includes('plow') || norm.includes('szpak')) {
    return { base: 'ash_red', dilution: isDilute ? 'dilute' : 'dense' };
  }

  if (norm.includes('brąz') || norm.includes('braz') || norm.includes('czekolad') || norm.includes('kawow')) {
    return { base: 'brown', dilution: isDilute ? 'dilute' : 'dense' };
  }

  if (
    norm.includes('niebiesk') ||
    norm.includes('nakrapian') ||
    norm.includes('ciemn') ||
    norm.includes('pst') ||
    norm.includes('siw') ||
    norm.includes('grodz') ||
    norm.includes('czarn')
  ) {
    return { base: 'blue_bar', dilution: isDilute ? 'dilute' : 'dense' };
  }

  // Default to wild blue type
  return { base: 'blue_bar', dilution: isDilute ? 'dilute' : 'dense' };
}

/**
 * Predicts offspring plumage colors and detects sex-linked autosexing in the nest (RD-38, RD-39).
 * In pigeons:
 * - Male is homogametic (ZZ).
 * - Female is heterogametic (ZW). She gives her only Z to her SONS, and W to her DAUGHTERS.
 * When Cock has recessive color (e.g. Blue Z^B+ Z^B+) and Hen has dominant (Ash-Red Z^B^A W):
 * -> All daughters receive Z from father (Blue Z^B+ W)
 * -> All sons receive Z from mother (Ash-Red Z^B^A Z^B+)
 * -> 100% Autosexing at hatching!
 */
export function predictPlumageAndAutosexing(
  cockColor: string,
  henColor: string
): PlumagePrediction {
  const cockGen = parsePlumageBaseColor(cockColor);
  const henGen = parsePlumageBaseColor(henColor);

  let isAutosexing = false;
  let autosexingCategory: PlumagePrediction['autosexingCategory'] = 'none';
  let autosexingBadge: string | undefined;
  let autosexingExplanation: string | undefined;
  let sonsExpected: string[] = [];
  let daughtersExpected: string[] = [];
  let hatchlingDownDescription: string | undefined;

  // Case 1: Blue Cock x Ash-Red Hen
  if (cockGen.base === 'blue_bar' && henGen.base === 'ash_red') {
    isAutosexing = true;
    autosexingCategory = 'color_linked';
    autosexingBadge = '✨ 100% AUTOSEKSING (Kolor)';
    autosexingExplanation =
      'Kojarzenie autoseksingowe! Samica przekazuje dominujący gen czerwieni Z(B^A) wyłącznie synom. Wszystkie czerwone/płowe pisklęta to samce (1.0 ♂), a wszystkie niebieskie/nakrapiane to samice (0.1 ♀).';
    sonsExpected = ['Czerwony nakrapiany', 'Płowy z pasami'];
    daughtersExpected = ['Niebieska z pasami', 'Niebieska nakrapiana', 'Ciemna nakrapiana'];
    hatchlingDownDescription = 'Wszystkie pisklęta o upierzeniu ojca to samice, a o upierzeniu matki to samce.';
  }
  // Case 2: Brown Cock x Blue or Red Hen
  else if (cockGen.base === 'brown' && (henGen.base === 'blue_bar' || henGen.base === 'ash_red')) {
    isAutosexing = true;
    autosexingCategory = 'color_linked';
    autosexingBadge = '✨ 100% AUTOSEKSING (Brąz)';
    const henLabel = henGen.base === 'ash_red' ? 'Czerwona' : 'Niebieska';
    autosexingExplanation = `Kojarzenie autoseksingowe z recesywnym brązem! Córki dziedziczą brąz po ojcu (0.1 ♀ Brązowe), a synowie są barwy matki (${henLabel} 1.0 ♂).`;
    sonsExpected = [henGen.base === 'ash_red' ? 'Czerwony' : 'Niebieski/Ciemny'];
    daughtersExpected = ['Brązowa / Czekoladowa'];
    hatchlingDownDescription = 'Pisklęta brązowe w gnieździe to w 100% samice!';
  }
  // Case 3: Dilute Cock x Dense Hen (e.g. Srebrny/Żółty Samiec x Niebieska/Czerwona Samica)
  else if (cockGen.dilution === 'dilute' && henGen.dilution === 'dense') {
    isAutosexing = true;
    autosexingCategory = 'dilution_linked';
    autosexingBadge = '✨ 100% AUTOSEKSING (Puch)';
    autosexingExplanation =
      'Autoseksing rozcieńczenia (Dilution)! Córki dziedziczą rozcieńczenie po ojcu (krótki puch przy wykluciu = 0.1 ♀). Synowie mają gęsty normalny puch (1.0 ♂).';
    sonsExpected = ['Barwa intensywna (Niebieski/Czerwony)'];
    daughtersExpected = ['Barwa rozcieńczona (Srebrna/Żółta/Płowa jasna)'];
    hatchlingDownDescription = 'W 1. dobie po wykluciu: krótki, rzadki puch oznacza samicę, długi gęsty puch oznacza samca!';
  }
  // Case 4: Standard non-autosexing cross
  else {
    isAutosexing = false;
    autosexingCategory = 'none';

    if (cockGen.base === 'ash_red' && henGen.base === 'ash_red') {
      sonsExpected = ['Czerwony', 'Płowy'];
      daughtersExpected = ['Czerwona', 'Płowa', 'Niebieska (jeśli samiec nosi niebieski)'];
    } else if (cockGen.base === 'ash_red' && henGen.base === 'blue_bar') {
      sonsExpected = ['Czerwony/Płowy'];
      daughtersExpected = ['Czerwona/Płowa (50%)', 'Niebieska/Nakrapiana (50%)'];
      autosexingExplanation = 'Brak pełnego autoseksingu (samiec czerwony może dać oba kolory u obu płci).';
    } else {
      // Blue x Blue
      sonsExpected = ['Niebieski', 'Nakrapiany', 'Ciemny'];
      daughtersExpected = ['Niebieska', 'Nakrapiana', 'Ciemna'];
    }
  }

  return {
    cockColorRaw: cockColor,
    henColorRaw: henColor,
    cockBaseColor: cockGen.base,
    henBaseColor: henGen.base,
    isAutosexing,
    autosexingCategory,
    autosexingBadge,
    autosexingExplanation,
    sonsExpected,
    daughtersExpected,
    hatchlingDownDescription,
  };
}


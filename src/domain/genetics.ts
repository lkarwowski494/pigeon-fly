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

/**
 * PIGEON-FLY — Racing Squads & Tactical Team Management (BR-STADO-006, Z-018)
 * Manages flock grouping into competitive squads: Drużyna A (GMP 5/50),
 * Drużyna B (Średni Dystans), Drużyna C (Maraton), and Młode Lotowe.
 */

import { Pigeon } from './types';

export type SquadType =
  | 'championship_a' // Drużyna A (Reprezentacja GMP / Typowane do Mistrzostwa Polski)
  | 'middle_distance_b' // Drużyna B (Kat. B 300-600 km)
  | 'marathon_c' // Drużyna C (Kat. M / Daleki Dystans >700 km)
  | 'youngsters' // Drużyna Młodych (Gołębie z bieżącego rocznika)
  | 'reserve'; // Rezerwa lotowa

export interface RacingSquad {
  id: string;
  loftId: string;
  name: string;
  type: SquadType;
  color: string;
  targetCategory?: string; // np. "GMP", "Kat. B", "Kat. M", "Kat. F"
  maxCapacity: number; // np. 50 ptaków dla bazy GMP PZHGP
  assignedPigeonIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PigeonPerformanceSummary {
  prizesCount: number;
  concourseKm: number;
  averageCoeff: number;
  isFit: boolean; // ARI >= 85% i brak karencji
}

export interface SquadAnalysis {
  squadId: string;
  squadName: string;
  squadType: SquadType;
  totalBirds: number;
  cocksCount: number;
  hensCount: number;
  averageAgeYears: number;
  totalPrizes: number;
  totalConcourseKm: number;
  averageCoeff: number;
  fitBirdsCount: number;
  readinessScorePct: number; // % ptaków zdolnych do lotu
  isAtCapacity: boolean;
}

/**
 * Returns standard championship squad presets for a new season.
 */
export function getDefaultSquadPresets(loftId: string): RacingSquad[] {
  const now = new Date().toISOString();
  return [
    {
      id: `squad-${loftId}-a`,
      loftId,
      name: 'Drużyna A (GMP Mistrzostwo)',
      type: 'championship_a',
      color: '#E5A93C', // Złoty mistrzowski
      targetCategory: 'GMP (5 z 50)',
      maxCapacity: 50,
      assignedPigeonIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `squad-${loftId}-b`,
      loftId,
      name: 'Drużyna B (Kat. B 300-600 km)',
      type: 'middle_distance_b',
      color: '#3B82F6', // Niebieski sportowy
      targetCategory: 'Kat. B',
      maxCapacity: 35,
      assignedPigeonIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `squad-${loftId}-c`,
      loftId,
      name: 'Drużyna C (Maraton >700 km)',
      type: 'marathon_c',
      color: '#8B5CF6', // Fiolet maratoński
      targetCategory: 'Kat. M',
      maxCapacity: 25,
      assignedPigeonIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `squad-${loftId}-young`,
      loftId,
      name: 'Drużyna Młodych (Kat. F)',
      type: 'youngsters',
      color: '#10B981', // Zielony młodzieżowy
      targetCategory: 'Kat. F',
      maxCapacity: 60,
      assignedPigeonIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Validates whether a pigeon can be assigned to a specific squad.
 */
export function canAssignToSquad(
  squad: RacingSquad,
  pigeon: Pigeon,
  currentYear: number = new Date().getFullYear()
): { allowed: boolean; reason?: string } {
  // Check if squad is at max capacity
  if (squad.assignedPigeonIds.length >= squad.maxCapacity) {
    return {
      allowed: false,
      reason: `Drużyna "${squad.name}" osiągnęła maksymalną pojemność (${squad.maxCapacity} ptaków).`,
    };
  }

  // Check if pigeon status allows racing
  if (pigeon.status !== 'racing') {
    return {
      allowed: false,
      reason: `Ptak ma status "${pigeon.status}". Tylko ptaki o statusie "Lotowy" (racing) mogą być w składzie drużyny.`,
    };
  }

  // Youngsters squad validation (must be born in current season)
  if (squad.type === 'youngsters') {
    if (pigeon.year !== currentYear) {
      return {
        allowed: false,
        reason: `Drużyna Młodych przyjmuje wyłącznie gołębie z bieżącego rocznika (${currentYear}). Ptak ma rocznik ${pigeon.year}.`,
      };
    }
  }

  // Adult squads validation (should not be youngsters)
  if (squad.type === 'championship_a' || squad.type === 'marathon_c') {
    if (pigeon.year === currentYear) {
      return {
        allowed: false,
        reason: `Młody gołąb z rocznika ${currentYear} nie może być przypisany do dorosłej drużyny maratońskiej lub GMP.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Computes comprehensive squad analysis, average age, concourse prizes, Coeff, and readiness score.
 */
export function analyzeSquad(params: {
  squad: RacingSquad;
  pigeons: Pigeon[];
  performances?: Record<string, PigeonPerformanceSummary>;
  currentYear?: number;
}): SquadAnalysis {
  const { squad, pigeons, performances = {}, currentYear = new Date().getFullYear() } = params;

  const squadPigeons = pigeons.filter((p) => squad.assignedPigeonIds.includes(p.id));
  const totalBirds = squadPigeons.length;

  if (totalBirds === 0) {
    return {
      squadId: squad.id,
      squadName: squad.name,
      squadType: squad.type,
      totalBirds: 0,
      cocksCount: 0,
      hensCount: 0,
      averageAgeYears: 0,
      totalPrizes: 0,
      totalConcourseKm: 0,
      averageCoeff: 0,
      fitBirdsCount: 0,
      readinessScorePct: 100,
      isAtCapacity: false,
    };
  }

  const cocksCount = squadPigeons.filter((p) => p.sex === 'cock').length;
  const hensCount = squadPigeons.filter((p) => p.sex === 'hen').length;

  const totalAge = squadPigeons.reduce((acc, p) => acc + (currentYear - p.year), 0);
  const averageAgeYears = Math.round((totalAge / totalBirds) * 10) / 10;

  let totalPrizes = 0;
  let totalConcourseKm = 0;
  let coeffSum = 0;
  let coeffCount = 0;
  let fitBirdsCount = 0;

  squadPigeons.forEach((p) => {
    const perf = performances[p.id];
    if (perf) {
      totalPrizes += perf.prizesCount;
      totalConcourseKm += perf.concourseKm;
      if (perf.averageCoeff > 0) {
        coeffSum += perf.averageCoeff;
        coeffCount++;
      }
      if (perf.isFit) {
        fitBirdsCount++;
      }
    } else {
      // Domyślnie ptak bez historii uznawany za zdatny
      fitBirdsCount++;
    }
  });

  const averageCoeff =
    coeffCount > 0 ? Math.round((coeffSum / coeffCount) * 1000) / 1000 : 0.0;
  const readinessScorePct = Math.round((fitBirdsCount / totalBirds) * 100);

  return {
    squadId: squad.id,
    squadName: squad.name,
    squadType: squad.type,
    totalBirds,
    cocksCount,
    hensCount,
    averageAgeYears,
    totalPrizes,
    totalConcourseKm: Math.round(totalConcourseKm * 10) / 10,
    averageCoeff,
    fitBirdsCount,
    readinessScorePct,
    isAtCapacity: squad.assignedPigeonIds.length >= squad.maxCapacity,
  };
}

/**
 * Assigns a pigeon to a target squad, removing it from any other squad (exclusive squad membership).
 */
export function assignPigeonToSquad(params: {
  squads: RacingSquad[];
  pigeonId: string;
  targetSquadId: string;
  pigeon: Pigeon;
  currentYear?: number;
}): RacingSquad[] {
  const { squads, pigeonId, targetSquadId, pigeon, currentYear = new Date().getFullYear() } = params;

  const targetSquad = squads.find((s) => s.id === targetSquadId);
  if (!targetSquad) {
    throw new Error('Nie znaleziono wybranej drużyny lotowej.');
  }

  // Already assigned to this squad
  if (targetSquad.assignedPigeonIds.includes(pigeonId)) {
    return squads;
  }

  const validation = canAssignToSquad(targetSquad, pigeon, currentYear);
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const now = new Date().toISOString();

  return squads.map((s) => {
    if (s.id === targetSquadId) {
      return {
        ...s,
        assignedPigeonIds: [...s.assignedPigeonIds, pigeonId],
        updatedAt: now,
      };
    }
    // Remove from other squads to keep exclusivity
    if (s.assignedPigeonIds.includes(pigeonId)) {
      return {
        ...s,
        assignedPigeonIds: s.assignedPigeonIds.filter((id) => id !== pigeonId),
        updatedAt: now,
      };
    }
    return s;
  });
}

/**
 * Removes a pigeon from a squad.
 */
export function removePigeonFromSquad(params: {
  squads: RacingSquad[];
  pigeonId: string;
  squadId: string;
}): RacingSquad[] {
  const { squads, pigeonId, squadId } = params;
  const now = new Date().toISOString();

  return squads.map((s) => {
    if (s.id === squadId) {
      return {
        ...s,
        assignedPigeonIds: s.assignedPigeonIds.filter((id) => id !== pigeonId),
        updatedAt: now,
      };
    }
    return s;
  });
}

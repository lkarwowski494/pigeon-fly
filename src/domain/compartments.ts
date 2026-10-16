/**
 * PIGEON-FLY — Loft Compartments & Section Management Engine (BR-STADO-005)
 * Physical sections of the loft: Cocks (Wdowce), Hens (Wdówki), Youngsters (Młode),
 * Breeding (Rozpłodowy), Quarantine (Izolatka), and Aviary (Woliera).
 *
 * Enforces zootechnical stocking density limits (m² and m³ per bird),
 * Crowding Index calculation to prevent respiratory infections (ornithosis/coryza),
 * and widowhood pairing & pre-basketing motivation routines.
 */

import { Pigeon } from './types';

export type CompartmentType =
  | 'cocks'        // Wdowce — samce lotowe w celach
  | 'hens'         // Wdówki — samice lotowe na spoczynkach
  | 'youngsters'   // Młode — stado tegoroczne
  | 'breeding'     // Rozpłodowy — cele dla par rodzicielskich
  | 'quarantine'   // Kwarantanna / Izolatka — nowe nabytki i rekonwalescenci
  | 'aviary';      // Woliera — napowietrzanie i kąpiel

export interface LoftCompartment {
  id: string;
  loftId: string;
  name: string;
  type: CompartmentType;
  floorAreaM2: number;
  volumeM3: number;
  nestBoxCapacity: number;
  perchCapacity: number;
  assignedPigeonIds: string[];
  ventilationRating: 'excellent' | 'adequate' | 'poor';
  notes?: string;
}

export interface CompartmentStats {
  compartmentId: string;
  compartmentName: string;
  type: CompartmentType;
  pigeonCount: number;
  cocksCount: number;
  hensCount: number;
  recommendedPigeons: number;
  maxSafePigeons: number;
  crowdingPct: number; // (pigeonCount / maxSafePigeons) * 100
  floorAreaPerBirdM2: number;
  airVolumePerBirdM3: number;
  isOvercrowded: boolean;
  statusLevel: 'optimal' | 'warning' | 'danger';
  warningMessage?: string;
}

/**
 * Calculates zootechnical capacity standards (FCI / PZHGP guidelines):
 * - Breeding: 0.8 m² floor and 2.2 m³ air per pair (0.4 m² / 1.1 m³ per bird)
 * - Widow Cocks: 0.35 m² floor and 1.0 m³ air per bird
 * - Widow Hens: 0.30 m² floor and 0.9 m³ air per bird
 * - Youngsters: 0.28 m² floor and 0.8 m³ air per bird
 * - Quarantine: 0.50 m² floor and 1.5 m³ air per bird
 */
export function calculateCompartmentCapacity(
  floorAreaM2: number,
  volumeM3: number,
  type: CompartmentType
): { recommendedPigeons: number; maxSafePigeons: number } {
  let areaPerBird = 0.35;
  let volumePerBird = 1.0;

  switch (type) {
    case 'breeding':
      areaPerBird = 0.45;
      volumePerBird = 1.2;
      break;
    case 'cocks':
      areaPerBird = 0.35;
      volumePerBird = 1.0;
      break;
    case 'hens':
      areaPerBird = 0.30;
      volumePerBird = 0.9;
      break;
    case 'youngsters':
      areaPerBird = 0.28;
      volumePerBird = 0.8;
      break;
    case 'quarantine':
      areaPerBird = 0.50;
      volumePerBird = 1.5;
      break;
    case 'aviary':
      areaPerBird = 0.25;
      volumePerBird = 0.7;
      break;
  }

  const capacityByArea = Math.floor(floorAreaM2 / areaPerBird);
  const capacityByVolume = Math.floor(volumeM3 / volumePerBird);

  // Limiting factor is whichever is smaller
  const recommendedPigeons = Math.max(1, Math.min(capacityByArea, capacityByVolume));
  // Maximum tolerance before severe biological crowding stress (+20%)
  const maxSafePigeons = Math.max(recommendedPigeons, Math.floor(recommendedPigeons * 1.2));

  return { recommendedPigeons, maxSafePigeons };
}

/**
 * Evaluates current stocking density, sex distribution, and air quality risk.
 */
export function evaluateCompartment(
  compartment: LoftCompartment,
  pigeons: Pigeon[]
): CompartmentStats {
  const assignedSet = new Set(compartment.assignedPigeonIds);
  const compartmentPigeons = pigeons.filter((p) => assignedSet.has(p.id));

  const count = compartmentPigeons.length;
  let cocks = 0;
  let hens = 0;

  for (const p of compartmentPigeons) {
    if (p.sex === 'cock') cocks++;
    else if (p.sex === 'hen') hens++;
  }

  const { recommendedPigeons, maxSafePigeons } = calculateCompartmentCapacity(
    compartment.floorAreaM2,
    compartment.volumeM3,
    compartment.type
  );

  const crowdingPct =
    maxSafePigeons > 0 ? Math.round((count / maxSafePigeons) * 100) : 0;

  const floorAreaPerBirdM2 =
    count > 0 ? parseFloat((compartment.floorAreaM2 / count).toFixed(2)) : compartment.floorAreaM2;
  const airVolumePerBirdM3 =
    count > 0 ? parseFloat((compartment.volumeM3 / count).toFixed(2)) : compartment.volumeM3;

  const isOvercrowded = count > maxSafePigeons;

  let statusLevel: 'optimal' | 'warning' | 'danger' = 'optimal';
  let warningMessage: string | undefined;

  if (crowdingPct > 115 || isOvercrowded) {
    statusLevel = 'danger';
    warningMessage = `KRYTYCZNE PRZEZAGĘSZCZENIE (${count}/${maxSafePigeons} ptaków). Wysokie ryzyko zapalenia worków powietrznych, rzęsistkowicy i kataru zakaźnego.`;
  } else if (crowdingPct > 90) {
    statusLevel = 'warning';
    warningMessage = `Przedział bliski maksymalnej pojemności (${count}/${recommendedPigeons} zalecanych). Sprawdź ciąg wentylacyjny.`;
  }

  // Cross-sex warning for widowhood compartments
  if (compartment.type === 'cocks' && hens > 0) {
    statusLevel = 'warning';
    warningMessage = `W przedziale wdowców znajduje się ${hens} samic! Rozdziel płeć przed wygaszeniem motywacji.`;
  } else if (compartment.type === 'hens' && cocks > 0) {
    statusLevel = 'warning';
    warningMessage = `W przedziale wdówek znajduje się ${cocks} samców! Ryzyko przedwczesnego parowania i znoszenia jaj na spoczynkach.`;
  }

  return {
    compartmentId: compartment.id,
    compartmentName: compartment.name,
    type: compartment.type,
    pigeonCount: count,
    cocksCount: cocks,
    hensCount: hens,
    recommendedPigeons,
    maxSafePigeons,
    crowdingPct,
    floorAreaPerBirdM2,
    airVolumePerBirdM3,
    isOvercrowded,
    statusLevel,
    warningMessage,
  };
}

/**
 * Validates whether a pigeon can be assigned to a specific compartment.
 */
export function canAssignPigeonToCompartment(
  compartment: LoftCompartment,
  pigeon: Pigeon
): { allowed: boolean; reason?: string } {
  if (compartment.assignedPigeonIds.includes(pigeon.id)) {
    return { allowed: true };
  }

  // Widowhood cocks section: recommend only cocks
  if (compartment.type === 'cocks' && pigeon.sex === 'hen') {
    return {
      allowed: false,
      reason: 'Przedział Wdowców jest zarezerwowany dla samców lotowych (metoda wdowieństwa).',
    };
  }

  // Widowhood hens section: recommend only hens
  if (compartment.type === 'hens' && pigeon.sex === 'cock') {
    return {
      allowed: false,
      reason: 'Przedział Wdówek jest przeznaczony wyłącznie dla samic lotowych.',
    };
  }

  // Youngsters section: recommend current year youngsters
  const currentYear = new Date().getFullYear();
  if (compartment.type === 'youngsters' && pigeon.year < currentYear - 1) {
    return {
      allowed: false,
      reason: `Ptak z rocznika ${pigeon.year} jest ptakiem dorosłym i nie powinien przebywać w gołębniku młodych.`,
    };
  }

  return { allowed: true };
}

/**
 * Moves a pigeon from one compartment to another cleanly.
 */
export function movePigeonBetweenCompartments(
  pigeonId: string,
  fromCompartmentId: string,
  toCompartmentId: string,
  compartments: LoftCompartment[]
): LoftCompartment[] {
  return compartments.map((comp) => {
    if (comp.id === fromCompartmentId) {
      return {
        ...comp,
        assignedPigeonIds: comp.assignedPigeonIds.filter((id) => id !== pigeonId),
      };
    }
    if (comp.id === toCompartmentId) {
      if (!comp.assignedPigeonIds.includes(pigeonId)) {
        return {
          ...comp,
          assignedPigeonIds: [...comp.assignedPigeonIds, pigeonId],
        };
      }
    }
    return comp;
  });
}

/**
 * Standard master loft compartment configuration preset for Polish and European lofts.
 */
export function getStandardCompartmentPresets(loftId: string): LoftCompartment[] {
  return [
    {
      id: `${loftId}-sec-cocks`,
      loftId,
      name: 'Przedział Wdowców (Samce)',
      type: 'cocks',
      floorAreaM2: 7.2,
      volumeM3: 16.5,
      nestBoxCapacity: 16,
      perchCapacity: 20,
      assignedPigeonIds: ['p-01', 'p-03'],
      ventilationRating: 'excellent',
      notes: '16 cel gniazdowych z obrotowymi ramkami wdowieństwa.',
    },
    {
      id: `${loftId}-sec-hens`,
      loftId,
      name: 'Przedział Wdówek (Samice)',
      type: 'hens',
      floorAreaM2: 5.0,
      volumeM3: 11.5,
      nestBoxCapacity: 0,
      perchCapacity: 24,
      assignedPigeonIds: ['p-02'],
      ventilationRating: 'excellent',
      notes: 'Ruchome siodełka rolkowe zapobiegające parowaniu samic.',
    },
    {
      id: `${loftId}-sec-breeding`,
      loftId,
      name: 'Przedział Rozpłodowy',
      type: 'breeding',
      floorAreaM2: 9.0,
      volumeM3: 20.7,
      nestBoxCapacity: 12,
      perchCapacity: 16,
      assignedPigeonIds: [],
      ventilationRating: 'excellent',
      notes: 'Przestronne cele dla par zarodowych z miskami gipsowymi.',
    },
    {
      id: `${loftId}-sec-youngsters`,
      loftId,
      name: 'Gołębnik Młodych',
      type: 'youngsters',
      floorAreaM2: 8.5,
      volumeM3: 19.5,
      nestBoxCapacity: 0,
      perchCapacity: 45,
      assignedPigeonIds: [],
      ventilationRating: 'excellent',
      notes: 'Przedział wyposażony w automatyczne rolety systemu Ciemni (Verdunkelung).',
    },
    {
      id: `${loftId}-sec-quarantine`,
      loftId,
      name: 'Izolatka / Kwarantanna',
      type: 'quarantine',
      floorAreaM2: 3.0,
      volumeM3: 7.0,
      nestBoxCapacity: 4,
      perchCapacity: 8,
      assignedPigeonIds: [],
      ventilationRating: 'adequate',
      notes: 'Osobne poidła i karmniki do kwarantanny nowych nabytków i leczenia.',
    },
  ];
}

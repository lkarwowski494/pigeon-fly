/**
 * PIGEON-FLY — Nest Box Matrix & Breeding Loft Grid Engine (BR-ROZP-001)
 * Manages spatial breeding loft layout (sections, rows, boxes), real-time lifecycle states,
 * egg swapping protocols (jajka gipsowe), and critical banding alerts (6-8 days old).
 */

export type NestBoxState =
  | 'empty'           // Pusta, czysta, gotowa
  | 'pairing'         // Para zestawiona (Dzień 0-8)
  | 'sitting'         // Wysiadywanie jaj (Inkubacja Dzień 1-18)
  | 'rearing'         // Pisklęta w gnieździe (Dzień 1-24)
  | 'banding_alert'   // KRYTYCZNY ALARM: Dzień 6-8 życia piskląt (Obrączkowanie!)
  | 'quarantine';     // Wyłączona / kwarantanna

export interface NestBoxItem {
  id: string;
  section: string;      // np. 'Sektor Rozpłód' lub 'Wdowce A'
  boxNumber: string;    // np. 'A-01', '14', 'Cela 3'
  state: NestBoxState;
  cockRingNumber?: string;
  henRingNumber?: string;
  pairedDate?: string;
  egg1Date?: string;
  egg2Date?: string;
  egg1Status?: 'laid' | 'swapped_fake' | 'incubating' | 'fertile' | 'clear' | 'broken';
  egg2Status?: 'laid' | 'incubating' | 'fertile' | 'clear' | 'broken';
  hatchDate?: string;
  chick1RingNumber?: string;
  chick2RingNumber?: string;
  chick1Banded?: boolean;
  chick2Banded?: boolean;
  inbreedingF?: number;
  notes?: string;
}

export interface BreedingSummaryStats {
  totalBoxes: number;
  occupiedBoxes: number;
  emptyBoxes: number;
  activePairs: number;
  totalEggsLaid: number;
  fertileEggsCount: number;
  fertilityRatePct: number;
  hatchedChicksCount: number;
  urgentBandingAlertsCount: number;
}

/**
 * Evaluates the precise state of a nest box based on active lifecycle dates.
 */
export function evaluateNestBoxState(
  box: Partial<NestBoxItem>,
  currentDate: Date = new Date()
): NestBoxState {
  if (!box.cockRingNumber && !box.henRingNumber) {
    return 'empty';
  }

  // If chicks have hatched, check banding urgency
  if (box.hatchDate) {
    const hatchTime = new Date(box.hatchDate).getTime();
    const diffDays = Math.floor((currentDate.getTime() - hatchTime) / (1000 * 60 * 60 * 24));

    const needsBanding =
      (!box.chick1Banded && !box.chick1RingNumber) ||
      (!box.chick2Banded && !box.chick2RingNumber && box.egg2Status === 'fertile');

    if (diffDays >= 6 && diffDays <= 8 && needsBanding) {
      return 'banding_alert';
    }

    if (diffDays >= 0 && diffDays <= 25) {
      return 'rearing';
    }
  }

  // If eggs are laid, active sitting / incubation
  if (box.egg1Date || box.egg2Date) {
    return 'sitting';
  }

  // Otherwise, active paired couple
  return 'pairing';
}

/**
 * Checks banding urgency window for newly hatched squabs (6 to 8 days old).
 */
export function checkBandingUrgency(
  hatchDate: string,
  currentDate: Date = new Date()
): { isUrgent: boolean; daysOld: number; statusText: string } {
  const hatchTime = new Date(hatchDate).getTime();
  const daysOld = Math.floor((currentDate.getTime() - hatchTime) / (1000 * 60 * 60 * 24));

  if (daysOld < 5) {
    return {
      isUrgent: false,
      daysOld,
      statusText: `Pisklę ${daysOld} dni. Nóżka za mała — obrączka zsunie się z gniazda.`,
    };
  } else if (daysOld === 5) {
    return {
      isUrgent: false,
      daysOld,
      statusText: `Pisklę 5 dni. Obserwować — jutro otwiera się idealne okno obrączkowania.`,
    };
  } else if (daysOld >= 6 && daysOld <= 8) {
    return {
      isUrgent: true,
      daysOld,
      statusText: `⚠️ KRYTYCZNE OKNO (Dzień ${daysOld})! Załóż obrączkę rodową 8.0 mm i zeskanuj kod QR!`,
    };
  } else {
    return {
      isUrgent: false,
      daysOld,
      statusText: `Pisklę ${daysOld} dni. Staw skokowy stwardniał — uwaga przy próbie obrączkowania!`,
    };
  }
}

/**
 * Egg Swapping Protocol Assistant (Asystent Podmiany na Jajka Gipsowe)
 */
export function simulateEggSwapProtocol(
  egg1Date?: string,
  egg2Date?: string
): {
  recommendation: string;
  isEgg1Swapped: boolean;
  canReturnEgg1: boolean;
  incubationStartDate: string | null;
} {
  if (!egg1Date) {
    return {
      recommendation: 'Oczekiwanie na zniesienie 1. jajka (zazwyczaj 8-10 dzień po sparowaniu po godz. 17:00).',
      isEgg1Swapped: false,
      canReturnEgg1: false,
      incubationStartDate: null,
    };
  }

  if (egg1Date && !egg2Date) {
    return {
      recommendation:
        '🥚 1. jajo zniesione! Wyjmij je do pojemnika z nasionami (12-16°C) i podłóż sztuczne jajo gipsowe.',
      isEgg1Swapped: true,
      canReturnEgg1: false,
      incubationStartDate: null,
    };
  }

  return {
    recommendation:
      '✨ 2. jajo zniesione! Włóż 1. jajo z powrotem do gniazda i usuń jajo gipsowe. Rozpoczyna się równomierna inkubacja.',
    isEgg1Swapped: false,
    canReturnEgg1: true,
    incubationStartDate: egg2Date || egg1Date,
  };
}

/**
 * Computes loft-wide statistics across all nest boxes.
 */
export function calculateFlockBreedingSummary(boxes: NestBoxItem[]): BreedingSummaryStats {
  const totalBoxes = boxes.length;
  const occupiedBoxes = boxes.filter((b) => b.state !== 'empty' && b.state !== 'quarantine').length;
  const emptyBoxes = boxes.filter((b) => b.state === 'empty').length;
  const activePairs = boxes.filter((b) => b.cockRingNumber && b.henRingNumber).length;

  let totalEggsLaid = 0;
  let fertileEggsCount = 0;
  let hatchedChicksCount = 0;
  let urgentBandingAlertsCount = 0;

  boxes.forEach((b) => {
    if (b.egg1Date) totalEggsLaid += 1;
    if (b.egg2Date) totalEggsLaid += 1;

    if (b.egg1Status === 'fertile') fertileEggsCount += 1;
    if (b.egg2Status === 'fertile') fertileEggsCount += 1;

    if (b.hatchDate) {
      if (b.chick1RingNumber || b.chick1Banded) hatchedChicksCount += 1;
      if (b.chick2RingNumber || b.chick2Banded) hatchedChicksCount += 1;
    }

    if (b.state === 'banding_alert') {
      urgentBandingAlertsCount += 1;
    }
  });

  const fertilityRatePct =
    totalEggsLaid > 0 ? parseFloat(((fertileEggsCount / totalEggsLaid) * 100).toFixed(1)) : 0;

  return {
    totalBoxes,
    occupiedBoxes,
    emptyBoxes,
    activePairs,
    totalEggsLaid,
    fertileEggsCount,
    fertilityRatePct,
    hatchedChicksCount,
    urgentBandingAlertsCount,
  };
}

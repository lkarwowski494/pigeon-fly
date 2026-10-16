/**
 * PIGEON-FLY — Breeding & Clutch Domain Engine (Rozpłód, Parowanie i Cykl Lęgowy)
 * Calculates biological milestones: egg laying, candling (owoskopia), hatching, banding, and weaning.
 */

import { Pigeon } from './types';
import { calculateWrightInbreeding, InbreedingResult } from './genetics';

export type EggStatus = 'expected' | 'laid' | 'fertile' | 'infertile' | 'broken' | 'hatched' | 'dead_in_shell';

export type ClutchStage =
  | 'mated' // sparowane, oczekiwanie na jajka
  | 'laying' // zniesione 1. jajko, oczekiwanie na 2. (+44h)
  | 'incubating' // wysiadywanie obu jaj (17-18 dni)
  | 'candling_due' // czas na owoskopię (5-6 dzień)
  | 'hatching_due' // czas na wylęg (17-18 dzień)
  | 'banding_due' // krytyczne okno obrączkowania (6-8 dzień życia)
  | 'rearing' // odchów młódków (9-21 dzień)
  | 'weaning_due' // odsadzenie młodych (22-25 dzień)
  | 'completed'; // lęg zakończony, młode w przedziale młodzieży

export interface ClutchMilestones {
  pairDate: string; // YYYY-MM-DD
  expectedEgg1Date: string; // +8..10 days from pair
  expectedEgg2Date: string; // +2 days from egg 1 (+44h)
  candlingDate: string; // +5 days from egg 2
  expectedHatchDate: string; // +17..18 days from egg 2
  bandingStartDate: string; // +6 days from hatch
  bandingEndDate: string; // +8 days from hatch
  weaningDate: string; // +24 days from hatch
}

export interface ClutchRecord {
  id: string;
  loftId: string;
  roundNumber: number; // 1 = lęg wiosenny, 2 = lęg letni, 3 = lęg jesienny
  nestBox: string; // np. "Cela A-12"
  cockId: string;
  henId: string;
  pairedDate: string; // YYYY-MM-DD
  egg1Date?: string;
  egg2Date?: string;
  egg1Status: EggStatus;
  egg2Status: EggStatus;
  hatchDate?: string;
  chick1RingNumber?: string;
  chick2RingNumber?: string;
  chick1Banded: boolean;
  chick2Banded: boolean;
  weanedDate?: string;
  inbreedingResult?: InbreedingResult;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates all official biological breeding milestones based on pairing date or egg 1 date.
 */
export function calculateClutchMilestones(params: {
  pairDate?: string | Date;
  egg1Date?: string | Date;
}): ClutchMilestones {
  let baseDate: Date;
  let egg1: Date;

  if (params.egg1Date) {
    egg1 = new Date(params.egg1Date);
    egg1.setHours(12, 0, 0, 0);
    baseDate = new Date(egg1);
    baseDate.setDate(baseDate.getDate() - 9);
  } else if (params.pairDate) {
    baseDate = new Date(params.pairDate);
    baseDate.setHours(12, 0, 0, 0);
    egg1 = new Date(baseDate);
    egg1.setDate(egg1.getDate() + 9);
  } else {
    baseDate = new Date();
    baseDate.setHours(12, 0, 0, 0);
    egg1 = new Date(baseDate);
    egg1.setDate(egg1.getDate() + 9);
  }

  egg1.setHours(12, 0, 0, 0);

  // Egg 2 is laid ~44h (2 days) after egg 1
  const egg2 = new Date(egg1);
  egg2.setDate(egg2.getDate() + 2);
  egg2.setHours(12, 0, 0, 0);

  // Candling (owoskopia) on day 5 of incubation (from egg 2)
  const candling = new Date(egg2);
  candling.setDate(candling.getDate() + 5);
  candling.setHours(12, 0, 0, 0);

  // Hatching occurs 17 to 18 days after egg 2
  const hatch = new Date(egg2);
  hatch.setDate(hatch.getDate() + 18);
  hatch.setHours(12, 0, 0, 0);

  // Banding window: 6th to 8th day after hatching
  const bandingStart = new Date(hatch);
  bandingStart.setDate(bandingStart.getDate() + 6);
  bandingStart.setHours(12, 0, 0, 0);

  const bandingEnd = new Date(hatch);
  bandingEnd.setDate(bandingEnd.getDate() + 8);
  bandingEnd.setHours(12, 0, 0, 0);

  // Weaning (odsadzenie): 24th day after hatching
  const weaning = new Date(hatch);
  weaning.setDate(weaning.getDate() + 24);
  weaning.setHours(12, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  return {
    pairDate: fmt(baseDate),
    expectedEgg1Date: fmt(egg1),
    expectedEgg2Date: fmt(egg2),
    candlingDate: fmt(candling),
    expectedHatchDate: fmt(hatch),
    bandingStartDate: fmt(bandingStart),
    bandingEndDate: fmt(bandingEnd),
    weaningDate: fmt(weaning),
  };
}

/**
 * Determines current clutch lifecycle stage and urgency alerts for breeder.
 */
export function evaluateClutchStage(
  clutch: ClutchRecord,
  today: Date = new Date()
): { stage: ClutchStage; alertMessage?: string; daysToNextMilestone: number } {
  const todayStr = today.toISOString().split('T')[0];
  const milestones = calculateClutchMilestones({
    pairDate: clutch.pairedDate,
    egg1Date: clutch.egg1Date,
  });

  if (clutch.weanedDate) {
    return { stage: 'completed', daysToNextMilestone: 0 };
  }

  if (clutch.hatchDate) {
    const hatchTime = new Date(clutch.hatchDate).getTime();
    const chickAgeDays = Math.floor((today.getTime() - hatchTime) / (1000 * 60 * 60 * 24));

    if (chickAgeDays >= 24) {
      return {
        stage: 'weaning_due',
        alertMessage: 'Czas na odsadzenie młódków do przedziału młodzieży (24. dzień życia).',
        daysToNextMilestone: 0,
      };
    }

    if (chickAgeDays >= 6 && chickAgeDays <= 8) {
      const needsBanding = (!clutch.chick1Banded && clutch.egg1Status === 'hatched') ||
                           (!clutch.chick2Banded && clutch.egg2Status === 'hatched');
      return {
        stage: 'banding_due',
        alertMessage: needsBanding
          ? `KRYTYCZNE OKNO OBRĄCZKOWANIA: ${chickAgeDays}. dzień życia! Załóż obrączki rodowe i mikronaklejki QR.`
          : undefined,
        daysToNextMilestone: Math.max(0, 8 - chickAgeDays),
      };
    }

    return {
      stage: 'rearing',
      daysToNextMilestone: Math.max(0, 24 - chickAgeDays),
    };
  }

  if (clutch.egg2Date || clutch.egg1Date) {
    const effectiveEggDate = new Date(clutch.egg2Date || clutch.egg1Date!);
    const daysIncubating = Math.floor((today.getTime() - effectiveEggDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysIncubating >= 17) {
      return {
        stage: 'hatching_due',
        alertMessage: 'Czas klucia! Sprawdź wilgotność i czy pisklęta nakłuwają skorupki.',
        daysToNextMilestone: Math.max(0, 18 - daysIncubating),
      };
    }

    if (daysIncubating >= 5 && daysIncubating <= 7) {
      const isCandled = (clutch.egg1Status === 'fertile' || clutch.egg1Status === 'infertile') &&
                        (clutch.egg2Status === 'fertile' || clutch.egg2Status === 'infertile');
      return {
        stage: 'candling_due',
        alertMessage: isCandled ? undefined : 'Czas na owoskopię (5. dzień). Prześwietl jajka latarką owoskopową.',
        daysToNextMilestone: Math.max(0, 7 - daysIncubating),
      };
    }

    return {
      stage: 'incubating',
      daysToNextMilestone: Math.max(0, 18 - daysIncubating),
    };
  }

  return {
    stage: 'mated',
    alertMessage: 'Oczekiwanie na zniesienie 1. jajka (zwykle 8–10 dni po sparowaniu).',
    daysToNextMilestone: 3,
  };
}

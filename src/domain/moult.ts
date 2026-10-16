/**
 * PIGEON-FLY — Wing Moult & Photoperiod Engine (Cykl Pierzenia — 10 Lotek i Zaciemnianie)
 * Tracks the 10 primary flight feathers (lotki pierwszorzędowe), tail feathers (12 sterówek),
 * and calculates the Darkness System (Verdunkelung) and Lighting (Belichtung) schedules for young birds.
 */

import { FeatherStatus, MoultLog } from './types';

export interface WingMoultAnalysis {
  pigeonId: string;
  droppedFeatherCount: number; // 0 to 10
  currentDroppingFeather: number | null; // which feather is currently regrowing
  annualRegenerationIndex: number; // 0.0 to 100.0% (100% = fully renewed wing)
  isFitForRacing: boolean;
  unfitnessReason?: string;
  feathers: {
    featherNumber: number;
    status: FeatherStatus;
    lengthPct: number;
  }[];
}

export interface PhotoperiodSystemStatus {
  systemType: 'darkness' | 'lighting' | 'natural';
  isActive: boolean;
  darkHoursPerDay: number;
  lightHoursPerDay: number;
  scheduleDescription: string;
  biologicalGoal: string;
}

/**
 * Analyzes the status of the 10 primary flight feathers.
 * Feathers are numbered 1 (innermost) to 10 (outermost wing tip).
 */
export function analyzeWingMoult(
  pigeonId: string,
  moultLogs: MoultLog[]
): WingMoultAnalysis {
  const featherMap = new Map<number, { status: FeatherStatus; lengthPct: number }>();

  // Initialize with intact feathers (100% length)
  for (let i = 1; i <= 10; i++) {
    featherMap.set(i, { status: 'intact', lengthPct: 100 });
  }

  // Overlay latest moult logs for this bird
  for (const log of moultLogs) {
    if (log.pigeonId === pigeonId && log.primaryFeatherNumber >= 1 && log.primaryFeatherNumber <= 10) {
      featherMap.set(log.primaryFeatherNumber, {
        status: log.status,
        lengthPct: log.lengthPct,
      });
    }
  }

  let totalLength = 0;
  let droppedCount = 0;
  let currentRegrowing: number | null = null;
  const feathers: WingMoultAnalysis['feathers'] = [];

  for (let i = 1; i <= 10; i++) {
    const f = featherMap.get(i)!;
    feathers.push({
      featherNumber: i,
      status: f.status,
      lengthPct: f.lengthPct,
    });

    totalLength += f.lengthPct;

    if (f.status === 'dropped' || (f.status === 'regrowing' && f.lengthPct < 100)) {
      droppedCount++;
      if (currentRegrowing === null || i > currentRegrowing) {
        currentRegrowing = i;
      }
    }
  }

  // Annual Regeneration Index: avg percentage of all 10 feathers
  const annualRegenerationIndex = Math.round((totalLength / 1000) * 1000) / 10;

  // Flight fitness rules:
  // 1. Gap on outer wing (feathers 7-10) regrowing < 60% impairs lift in headwind
  // 2. Freshly dropped feather (length < 15%) has vulnerable blood-filled quill
  let isFitForRacing = true;
  let unfitnessReason: string | undefined;

  for (const f of feathers) {
    if (f.featherNumber >= 7 && (f.status === 'dropped' || f.lengthPct < 60)) {
      isFitForRacing = false;
      unfitnessReason = `Lotka skrajna #${f.featherNumber} w trakcie wzrostu (${f.lengthPct}%). Ryzyko utraty nośności i zerwania pióra na locie.`;
      break;
    }
    if (f.status === 'dropped' || f.lengthPct < 15) {
      isFitForRacing = false;
      unfitnessReason = `Świeżo zrzucona lotka #${f.featherNumber}. Dętka pióra podatna na uszkodzenia krwotoczne przy dużym obciążeniu.`;
      break;
    }
  }

  return {
    pigeonId,
    droppedFeatherCount: droppedCount,
    currentDroppingFeather: currentRegrowing,
    annualRegenerationIndex,
    isFitForRacing,
    unfitnessReason,
    feathers,
  };
}

/**
 * Evaluates the young bird Photoperiod System (Verdunkelung / Belichtung).
 * - March 15 to June 21: Darkness System (14h dark, 10h light). Halts flight feather moult.
 * - June 22 to Sept 15: Lighting System (16h light, 8h dark). Maintains form and stops body moult during races.
 */
export function getPhotoperiodStatus(targetDate: Date = new Date()): PhotoperiodSystemStatus {
  const month = targetDate.getMonth() + 1; // 1-12
  const day = targetDate.getDate();

  // March 15 (3.15) to June 21 (6.21): Darkness (Verdunkelung)
  const isMarchAfter15 = month === 3 && day >= 15;
  const isAprilOrMay = month === 4 || month === 5;
  const isJuneBefore21 = month === 6 && day <= 21;

  if (isMarchAfter15 || isAprilOrMay || isJuneBefore21) {
    return {
      systemType: 'darkness',
      isActive: true,
      darkHoursPerDay: 14,
      lightHoursPerDay: 10,
      scheduleDescription: 'Zaciemnienie od 18:00 do 08:00 rano (14h ciemności / 10h światła).',
      biologicalGoal: 'Zatrzymanie zrzucania lotek pierwszorzędowych przed sierpniowymi lotami młodych.',
    };
  }

  // June 22 to September 15: Lighting System (Belichtung)
  const isJuneAfter21 = month === 6 && day > 21;
  const isJulyOrAugust = month === 7 || month === 8;
  const isSeptBefore15 = month === 9 && day <= 15;

  if (isJuneAfter21 || isJulyOrAugust || isSeptBefore15) {
    return {
      systemType: 'lighting',
      isActive: true,
      darkHoursPerDay: 8,
      lightHoursPerDay: 16,
      scheduleDescription: 'Doświetlanie od 05:00 rano i wieczorem do 22:30 (16h światła na dobę).',
      biologicalGoal: 'Utrzymanie szczytowej formy konkursowej i zatrzymanie pierzenia drobnego podczas lotów.',
    };
  }

  return {
    systemType: 'natural',
    isActive: false,
    darkHoursPerDay: 12,
    lightHoursPerDay: 12,
    scheduleDescription: 'Naturalny rytm dobowy (brak sztucznego zaciemniania i doświetlania).',
    biologicalGoal: 'Naturalne, pełne pierzenie jesienne stada (wymiana całego upierzenia).',
  };
}

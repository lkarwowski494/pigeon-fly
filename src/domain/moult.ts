/**
 * PIGEON-FLY — Wing Moult Engine (Cykl Pierzenia — 10 Lotek)
 * Tracks the 10 primary flight feathers (lotki pierwszorzędowe) and evaluates flight fitness.
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

/**
 * Analyzes the status of the 10 primary flight feathers.
 * Feathers are numbered 1 (innermost) to 10 (outermost wing tip).
 */
export function analyzeWingMoult(
  pigeonId: string,
  moultLogs: MoultLog[]
): WingMoultAnalysis {
  // Sort logs by primaryFeatherNumber ascending
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

  // Fitness for racing rules (RD-08):
  // 1. A bird with feather gap on outer wing (feathers 8, 9, 10) regrowing < 70% cannot fly heavy races.
  // 2. A bird with an active bleeding or newly dropped feather (length < 20%) suffers pain during heavy wing flap.
  let isFitForRacing = true;
  let unfitnessReason: string | undefined;

  for (const f of feathers) {
    if (f.featherNumber >= 7 && (f.status === 'dropped' || f.lengthPct < 60)) {
      isFitForRacing = false;
      unfitnessReason = `Lotka skrajna #${f.featherNumber} w trakcie wzrostu (${f.lengthPct}%). Wysokie ryzyko utraty nośności i zerwania pióra na locie.`;
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

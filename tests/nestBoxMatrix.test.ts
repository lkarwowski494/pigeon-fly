/**
 * Unit Tests for Nest Box Matrix and Breeding Loft Grid Engine (BR-ROZP-001)
 */

import {
  evaluateNestBoxState,
  checkBandingUrgency,
  simulateEggSwapProtocol,
  calculateFlockBreedingSummary,
  NestBoxItem,
} from '../src/domain/nestBoxMatrix';

describe('Nest Box Matrix & Breeding Loft Grid Engine', () => {
  test('evaluates empty box when no cock or hen assigned', () => {
    const box: Partial<NestBoxItem> = {
      boxNumber: 'A-01',
    };
    expect(evaluateNestBoxState(box)).toBe('empty');
  });

  test('evaluates pairing state when birds are paired but no eggs yet', () => {
    const box: Partial<NestBoxItem> = {
      boxNumber: 'A-02',
      cockRingNumber: 'PL-0284-23-1001',
      henRingNumber: 'PL-0284-22-2002',
    };
    expect(evaluateNestBoxState(box)).toBe('pairing');
  });

  test('evaluates sitting state when eggs are laid', () => {
    const box: Partial<NestBoxItem> = {
      boxNumber: 'A-03',
      cockRingNumber: 'PL-0284-23-1001',
      henRingNumber: 'PL-0284-22-2002',
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
    };
    expect(evaluateNestBoxState(box)).toBe('sitting');
  });

  test('triggers critical banding alert on day 7 of chick life', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const box: Partial<NestBoxItem> = {
      boxNumber: 'A-04',
      cockRingNumber: 'PL-0284-23-1001',
      henRingNumber: 'PL-0284-22-2002',
      hatchDate: sevenDaysAgo,
      chick1Banded: false,
    };

    expect(evaluateNestBoxState(box)).toBe('banding_alert');

    const urgency = checkBandingUrgency(sevenDaysAgo);
    expect(urgency.isUrgent).toBe(true);
    expect(urgency.statusText).toContain('KRYTYCZNE OKNO');
  });

  test('simulates egg swapping protocol with fake egg recommendation', () => {
    // Stage 1: Only egg 1 laid
    const stage1 = simulateEggSwapProtocol('2026-03-10');
    expect(stage1.isEgg1Swapped).toBe(true);
    expect(stage1.canReturnEgg1).toBe(false);
    expect(stage1.recommendation).toContain('jajo gipsowe');

    // Stage 2: Egg 2 laid
    const stage2 = simulateEggSwapProtocol('2026-03-10', '2026-03-12');
    expect(stage2.canReturnEgg1).toBe(true);
    expect(stage2.recommendation).toContain('Włóż 1. jajo z powrotem');
  });

  test('computes flock-wide breeding summary accurately', () => {
    const boxes: NestBoxItem[] = [
      {
        id: 'b-1',
        section: 'Sektor A',
        boxNumber: 'A-01',
        state: 'empty',
      },
      {
        id: 'b-2',
        section: 'Sektor A',
        boxNumber: 'A-02',
        state: 'sitting',
        cockRingNumber: 'PL-01',
        henRingNumber: 'PL-02',
        egg1Date: '2026-03-10',
        egg2Date: '2026-03-12',
        egg1Status: 'fertile',
        egg2Status: 'fertile',
      },
      {
        id: 'b-3',
        section: 'Sektor A',
        boxNumber: 'A-03',
        state: 'banding_alert',
        cockRingNumber: 'PL-03',
        henRingNumber: 'PL-04',
        hatchDate: '2026-03-01',
        chick1Banded: true,
        chick1RingNumber: 'PL-26-101',
      },
    ];

    const summary = calculateFlockBreedingSummary(boxes);
    expect(summary.totalBoxes).toBe(3);
    expect(summary.emptyBoxes).toBe(1);
    expect(summary.activePairs).toBe(2);
    expect(summary.totalEggsLaid).toBe(2);
    expect(summary.fertileEggsCount).toBe(2);
    expect(summary.fertilityRatePct).toBe(100.0);
    expect(summary.urgentBandingAlertsCount).toBe(1);
  });
});

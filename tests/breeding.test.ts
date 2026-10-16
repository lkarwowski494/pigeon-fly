/**
 * Tests for Breeding & Clutch Domain Engine
 */

import { calculateClutchMilestones, evaluateClutchStage, ClutchRecord } from '../src/domain/breeding';

describe('Breeding Engine — Biological Milestones Calculator', () => {
  test('calculates correct biological milestone dates from pair date', () => {
    // Paired on 2026-03-01
    const milestones = calculateClutchMilestones({ pairDate: '2026-03-01' });

    expect(milestones.expectedEgg1Date).toBe('2026-03-10'); // +9 days
    expect(milestones.expectedEgg2Date).toBe('2026-03-12'); // +2 days (+44h)
    expect(milestones.candlingDate).toBe('2026-03-17'); // +5 days from egg 2
    expect(milestones.expectedHatchDate).toBe('2026-03-30'); // +18 days from egg 2
    expect(milestones.bandingStartDate).toBe('2026-04-05'); // +6 days from hatch
    expect(milestones.bandingEndDate).toBe('2026-04-07'); // +8 days from hatch
    expect(milestones.weaningDate).toBe('2026-04-23'); // +24 days from hatch
  });
});

describe('Breeding Engine — Clutch Stage Evaluator', () => {
  const baseClutch: ClutchRecord = {
    id: 'c-01',
    loftId: 'l-01',
    roundNumber: 1,
    nestBox: 'Cela 1',
    cockId: 'p-01',
    henId: 'p-02',
    pairedDate: '2026-03-01',
    egg1Date: '2026-03-10',
    egg2Date: '2026-03-12',
    egg1Status: 'laid',
    egg2Status: 'laid',
    chick1Banded: false,
    chick2Banded: false,
    createdAt: '',
    updatedAt: '',
  };

  test('triggers candling_due alert on day 5 of incubation', () => {
    // Egg 2 laid on March 12, day 5 is March 17
    const today = new Date('2026-03-17T12:00:00Z');
    const result = evaluateClutchStage(baseClutch, today);

    expect(result.stage).toBe('candling_due');
    expect(result.alertMessage).toContain('owoskopię');
  });

  test('triggers hatching_due alert on day 18 of incubation', () => {
    // Day 18 is March 30
    const today = new Date('2026-03-30T12:00:00Z');
    const result = evaluateClutchStage(baseClutch, today);

    expect(result.stage).toBe('hatching_due');
    expect(result.alertMessage).toContain('klucia');
  });

  test('triggers banding_due alert when chicks are 7 days old', () => {
    const hatchedClutch: ClutchRecord = {
      ...baseClutch,
      egg1Status: 'hatched',
      egg2Status: 'hatched',
      hatchDate: '2026-03-30',
    };

    // 7 days after March 30 is April 6
    const today = new Date('2026-04-06T12:00:00Z');
    const result = evaluateClutchStage(hatchedClutch, today);

    expect(result.stage).toBe('banding_due');
    expect(result.alertMessage).toContain('OBRĄCZKOWANIA');
  });

  test('triggers weaning_due alert when chicks are 24 days old', () => {
    const hatchedClutch: ClutchRecord = {
      ...baseClutch,
      egg1Status: 'hatched',
      egg2Status: 'hatched',
      hatchDate: '2026-03-30',
      chick1Banded: true,
      chick2Banded: true,
    };

    // 24 days after March 30 is April 23
    const today = new Date('2026-04-23T12:00:00Z');
    const result = evaluateClutchStage(hatchedClutch, today);

    expect(result.stage).toBe('weaning_due');
    expect(result.alertMessage).toContain('odsadzenie');
  });
});

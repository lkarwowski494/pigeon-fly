/**
 * Test Suite: Advanced Moult Progress Tracker & Keratin Nutrition (Z-055)
 * Verifies 10 primary flight feathers stage evaluation, basketing blocks for outer wing
 * and vulnerable blood-filled quills, keratin nutritional protocol, and flock distribution.
 */

import {
  evaluatePigeonMoult,
  calculateFlockMoultDistribution,
  PigeonMoultProfile,
  PrimaryFeatherDetail,
} from '../src/domain/moultTracker';

describe('Advanced Moult Progress Tracker & Keratin Nutrition Engine (Z-055)', () => {
  const createMockPrimaries = (
    droppedFeatherIndex?: number,
    droppedLength = 0,
    isBloodQuill = false
  ): PrimaryFeatherDetail[] => {
    const list: PrimaryFeatherDetail[] = [];
    for (let i = 1; i <= 10; i++) {
      if (i === droppedFeatherIndex) {
        list.push({
          number: i,
          stage: droppedLength === 0 ? 'dropped' : isBloodQuill ? 'blood_quill' : 'maturing',
          lengthPercent: droppedLength,
          isBloodQuillVulnerable: isBloodQuill,
          isOuterWingFeather: i >= 7,
        });
      } else {
        list.push({
          number: i,
          stage: 'intact',
          lengthPercent: 100,
          isBloodQuillVulnerable: false,
          isOuterWingFeather: i >= 7,
        });
      }
    }
    return list;
  };

  it('allows basketing when all 10 primary flight feathers are intact', () => {
    const profile: PigeonMoultProfile = {
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      inspectionDate: '2026-09-01',
      primaries: createMockPrimaries(),
      tail: { droppedPairsCount: 0, isTailMoultActive: false, notes: 'Ogon kompletny' },
      bodyMoultIntensity: 'none',
    };

    const result = evaluatePigeonMoult(profile);

    expect(result.isFitForBasketing).toBe(true);
    expect(result.overallWingRenovationPercent).toBe(100.0);
    expect(result.flightRiskLevel).toBe('safe');
    expect(result.basketingBlockReason).toBeUndefined();
  });

  it('strictly blocks basketing when outer flight feather #8 is regrowing at 40%', () => {
    const profile: PigeonMoultProfile = {
      pigeonId: 'p-02',
      ringNumber: 'PL-0284-23-1403',
      inspectionDate: '2026-09-01',
      primaries: createMockPrimaries(8, 40, false), // 8th outer feather
      tail: { droppedPairsCount: 1, isTailMoultActive: true, notes: '1 para sterówek' },
      bodyMoultIntensity: 'light',
    };

    const result = evaluatePigeonMoult(profile);

    expect(result.isFitForBasketing).toBe(false);
    expect(result.flightRiskLevel).toBe('dangerous_prohibited');
    expect(result.basketingBlockReason).toContain('Skrajna lotka nośna #8');
  });

  it('strictly blocks basketing for vulnerable blood quill on any feather', () => {
    const profile: PigeonMoultProfile = {
      pigeonId: 'p-03',
      ringNumber: 'PL-0284-23-1404',
      inspectionDate: '2026-09-01',
      primaries: createMockPrimaries(3, 15, true), // 3rd feather with blood quill
      tail: { droppedPairsCount: 0, isTailMoultActive: false, notes: '' },
      bodyMoultIntensity: 'light',
    };

    const result = evaluatePigeonMoult(profile);

    expect(result.isFitForBasketing).toBe(false);
    expect(result.flightRiskLevel).toBe('dangerous_prohibited');
    expect(result.basketingBlockReason).toContain('ukrwioną dętkę');
  });

  it('recommends intensive sulfur amino acids and biotin supplements during peak body moult', () => {
    const profile: PigeonMoultProfile = {
      pigeonId: 'p-04',
      ringNumber: 'PL-0284-23-1405',
      inspectionDate: '2026-10-01',
      primaries: createMockPrimaries(5, 50, false),
      tail: { droppedPairsCount: 3, isTailMoultActive: true, notes: '' },
      bodyMoultIntensity: 'heavy_peak',
    };

    const result = evaluatePigeonMoult(profile);

    expect(result.keratinNutritionalAdvice.some((a) => a.includes('metionina i cysteina'))).toBe(true);
    expect(result.recommendedFeedSupplements.some((s) => s.includes('MSM'))).toBe(true);
    expect(result.recommendedFeedSupplements.some((s) => s.includes('Siemię lniane'))).toBe(true);
  });

  it('correctly aggregates flock-wide moult statistics', () => {
    const flock: PigeonMoultProfile[] = [
      {
        pigeonId: 'p-01',
        ringNumber: 'PL-0284-23-01',
        inspectionDate: '2026-09-10',
        primaries: createMockPrimaries(), // 100% fit
        tail: { droppedPairsCount: 0, isTailMoultActive: false, notes: '' },
        bodyMoultIntensity: 'none',
      },
      {
        pigeonId: 'p-02',
        ringNumber: 'PL-0284-23-02',
        inspectionDate: '2026-09-10',
        primaries: createMockPrimaries(4, 20, true), // blocked by blood quill
        tail: { droppedPairsCount: 1, isTailMoultActive: true, notes: '' },
        bodyMoultIntensity: 'light',
      },
    ];

    const distribution = calculateFlockMoultDistribution(flock);

    expect(distribution.totalBirdsInspected).toBe(2);
    expect(distribution.birdsFitForRacingCount).toBe(1);
    expect(distribution.birdsBlockedDueToMoultCount).toBe(1);
    expect(distribution.averageRenovationPercent).toBeLessThan(100);
  });
});

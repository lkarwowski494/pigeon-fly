/**
 * Unit tests for Career Passport Domain Engine (Z-079 / DEC-93)
 */

import {
  calculateCareerPassport,
  generateCareerPassportHtml,
  CareerPassportInput,
  ConcourseRecord,
} from '../src/domain/careerPassport';

describe('CareerPassport Domain (Z-079)', () => {
  const sampleRecords: ConcourseRecord[] = [
    {
      id: 'rec-1',
      year: 2024,
      raceDate: '2024-05-12',
      raceName: 'Świebodzin',
      releaseLocation: 'Świebodzin',
      distanceKm: 165.5,
      basketedCount: 3200,
      concoursePosition: 1,
      fciCoefficient: 0.312,
      pzhgpPoints: 39.8,
      speedMPerMin: 1420.5,
      concourseBase: 20,
      category: 'A',
    },
    {
      id: 'rec-2',
      year: 2024,
      raceDate: '2024-05-26',
      raceName: 'Nowy Tomyśl',
      releaseLocation: 'Nowy Tomyśl',
      distanceKm: 212.0,
      basketedCount: 3100,
      concoursePosition: 7,
      fciCoefficient: 2.258,
      pzhgpPoints: 38.9,
      speedMPerMin: 1380.2,
      concourseBase: 20,
      category: 'A',
    },
    {
      id: 'rec-3',
      year: 2024,
      raceDate: '2024-06-09',
      raceName: 'Magdeburg 1',
      releaseLocation: 'Magdeburg',
      distanceKm: 345.2,
      basketedCount: 2800,
      concoursePosition: 14,
      fciCoefficient: 5.0,
      pzhgpPoints: 37.5,
      speedMPerMin: 1290.4,
      concourseBase: 20,
      category: 'B',
    },
    {
      id: 'rec-4',
      year: 2025,
      raceDate: '2025-06-20',
      raceName: 'Hannover',
      releaseLocation: 'Hannover',
      distanceKm: 525.0,
      basketedCount: 2100,
      concoursePosition: 4,
      fciCoefficient: 1.905,
      pzhgpPoints: 39.6,
      speedMPerMin: 1315.8,
      concourseBase: 20,
      category: 'C',
    },
    {
      id: 'rec-5',
      year: 2025,
      raceDate: '2025-07-26',
      raceName: 'Oostende Maraton',
      releaseLocation: 'Oostende',
      distanceKm: 825.0,
      basketedCount: 1600,
      concoursePosition: 1,
      fciCoefficient: 0.625,
      pzhgpPoints: 40.0,
      speedMPerMin: 1195.0,
      concourseBase: 20,
      category: 'M',
    },
  ];

  const sampleInput: CareerPassportInput = {
    ringNumber: 'PL-0284-23-1402',
    pigeonName: 'Błękitny As Gostynia',
    strain: 'Koopman / Gaby Vandenabeele',
    sex: 'cock',
    birthYear: 2023,
    color: 'Niebieski',
    totalBasketingCount: 6,
    records: sampleRecords,
  };

  test('calculateCareerPassport aggregates total prizes, total kkm, and efficiency', () => {
    const analytics = calculateCareerPassport(sampleInput);

    expect(analytics.totalPrizesWon).toBe(5);
    expect(analytics.totalBasketingCount).toBe(6);
    // 5 / 6 * 100 = 83.3%
    expect(analytics.prizeEfficiencyPercent).toBe(83.3);
    // 165.5 + 212.0 + 345.2 + 525.0 + 825.0 = 2072.7 km
    expect(analytics.totalConcourseKm).toBe(2072.7);
    expect(analytics.firstPrizeCount).toBe(2);
    expect(analytics.topTenCount).toBe(4);
    expect(analytics.bestPosition).toBe(1);
    expect(analytics.bestCoefficient).toBe(0.312);
  });

  test('calculateCareerPassport categorizes distance breakdown correctly', () => {
    const analytics = calculateCareerPassport(sampleInput);
    const bd = analytics.distanceBreakdown;

    // Short < 300km: rec-1 (165.5) + rec-2 (212.0) = 377.5
    expect(bd.shortSprintKm).toBe(377.5);
    expect(bd.shortSprintPrizes).toBe(2);

    // Middle 300-500km: rec-3 (345.2)
    expect(bd.middleDistanceKm).toBe(345.2);
    expect(bd.middleDistancePrizes).toBe(1);

    // Long 500-700km: rec-4 (525.0)
    expect(bd.longDistanceKm).toBe(525.0);
    expect(bd.longDistancePrizes).toBe(1);

    // Marathon > 700km: rec-5 (825.0)
    expect(bd.marathonKm).toBe(825.0);
    expect(bd.marathonPrizes).toBe(1);
  });

  test('calculateCareerPassport groups records by year', () => {
    const analytics = calculateCareerPassport(sampleInput);

    expect(analytics.recordsByYear[2024].length).toBe(3);
    expect(analytics.recordsByYear[2025].length).toBe(2);
  });

  test('calculateCareerPassport evaluates FCI Exhibition qualification accurately', () => {
    // 5 prizes are not enough for Wyczyn (requires 18)
    const analytics = calculateCareerPassport(sampleInput);
    expect(analytics.fciExhibitionEligibility.wyczyn).toBe(false);

    // Mock an elite 18-prize champion with 6500 kkm
    const eighteenRecords: ConcourseRecord[] = Array.from({ length: 18 }, (_, idx) => ({
      id: `p-${idx}`,
      year: 2024 + (idx % 2),
      raceDate: '2024-06-01',
      raceName: `Lot ${idx + 1}`,
      releaseLocation: 'Punkt Lotowy',
      distanceKm: 380.0, // 18 * 380 = 6840 km
      basketedCount: 2000,
      concoursePosition: (idx % 5) + 1,
      fciCoefficient: 1.5,
      speedMPerMin: 1300,
      concourseBase: 20,
      category: 'B',
    }));

    const champAnalytics = calculateCareerPassport({
      ...sampleInput,
      records: eighteenRecords,
    });

    expect(champAnalytics.totalPrizesWon).toBe(18);
    expect(champAnalytics.totalConcourseKm).toBeGreaterThanOrEqual(6000);
    expect(champAnalytics.fciExhibitionEligibility.wyczyn).toBe(true);
  });

  test('generateCareerPassportHtml produces valid printable HTML', () => {
    const analytics = calculateCareerPassport(sampleInput);
    const html = generateCareerPassportHtml(analytics, {
      loftName: 'Gołębnik Mistrza Gostyń',
      breederName: 'Łukasz',
      branchName: 'Oddział 0284 Gostyń',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Oficjalny Paszport Sportowy Lotnika');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('Błękitny As Gostynia');
    expect(html).toContain('Oostende Maraton');
    expect(html).toContain('2072.7 km');
    expect(html).toContain('Gołębnik Mistrza Gostyń');
  });
});

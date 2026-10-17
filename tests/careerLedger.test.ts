/**
 * Tests for Pigeon-Fly Career Ledger & Trophy Cabinet Engine (Z-061)
 */

import {
  calculatePigeonCareer,
  evaluateOlympicQualifications,
  evaluateTrophyCabinet,
  RacePrizeRecord,
} from '../src/domain/careerLedger';

describe('Career Ledger & Trophy Cabinet Engine (Z-061)', () => {
  const samplePrizes: RacePrizeRecord[] = [
    {
      id: 'p1',
      year: 2024,
      raceDate: '2024-05-12',
      raceName: 'Świebodzin (160 km)',
      raceDistanceKm: 165.5,
      basketedCount: 3200,
      concoursePosition: 1, // 1st prize
      fciCoefficient: 0.312,
      category: 'A',
    },
    {
      id: 'p2',
      year: 2024,
      raceDate: '2024-05-26',
      raceName: 'Nowy Tomyśl (210 km)',
      raceDistanceKm: 212.0,
      basketedCount: 3100,
      concoursePosition: 7, // top 10
      fciCoefficient: 2.258,
      category: 'A',
    },
    {
      id: 'p3',
      year: 2024,
      raceDate: '2024-06-09',
      raceName: 'Magdeburg 1 (345 km)',
      raceDistanceKm: 345.2,
      basketedCount: 2800,
      concoursePosition: 14,
      fciCoefficient: 5.000,
      category: 'B',
    },
    {
      id: 'p4',
      year: 2025,
      raceDate: '2025-06-20',
      raceName: 'Hannover (520 km)',
      raceDistanceKm: 525.0,
      basketedCount: 2100,
      concoursePosition: 4, // top 10
      fciCoefficient: 1.905,
      category: 'C',
    },
    {
      id: 'p5',
      year: 2025,
      raceDate: '2025-07-12',
      raceName: 'Bruksela Narodowy (740 km)',
      raceDistanceKm: 742.0,
      basketedCount: 1800,
      concoursePosition: 2, // top 10
      fciCoefficient: 1.111,
      category: 'M',
    },
    {
      id: 'p6',
      year: 2025,
      raceDate: '2025-07-26',
      raceName: 'Oostende Maraton (820 km)',
      raceDistanceKm: 825.0,
      basketedCount: 1600,
      concoursePosition: 1, // 1st prize marathon
      fciCoefficient: 0.625,
      category: 'M',
    },
  ];

  describe('Career Metric Aggregations', () => {
    it('accurately computes career totals, first prizes, top tens, and effectiveness', () => {
      // 6 prizes won out of 8 basketed races
      const career = calculatePigeonCareer('PL-0284-23-1402', samplePrizes, 8);

      expect(career.pigeonRing).toBe('PL-0284-23-1402');
      expect(career.totalPrizesWon).toBe(6);
      expect(career.totalRacesBasketed).toBe(8);
      // Effectiveness = 6 / 8 * 100 = 75.0%
      expect(career.concourseEffectivenessPercent).toBe(75.0);

      // Kkm = 165.5 + 212.0 + 345.2 + 525.0 + 742.0 + 825.0 = 2814.7 kkm
      expect(career.totalConcourseKilometers).toBeCloseTo(2814.7, 1);

      // 1st prizes = 2 (p1 and p6)
      expect(career.firstPrizeCount).toBe(2);
      // Top 10 = 5 (p1, p2, p4, p5, p6)
      expect(career.topTenCount).toBe(5);

      // Best Coeff = 0.312 (p1)
      expect(career.bestFciCoefficient).toBe(0.312);

      // Yearly breakdown has entries for 2024 and 2025
      expect(career.yearlyBreakdown[2024].prizes).toBe(3);
      expect(career.yearlyBreakdown[2025].prizes).toBe(3);
    });
  });

  describe('Olympic Category Eligibility Engine', () => {
    it('qualifies for Category M (Marathon) with 2 prizes over 700 km and >1400 kkm', () => {
      const quals = evaluateOlympicQualifications(samplePrizes);
      const catM = quals.find((q) => q.category === 'M');

      expect(catM).toBeDefined();
      expect(catM?.earnedPrizes).toBe(2); // Bruksela (742 km) + Oostende (825 km)
      expect(catM?.earnedKkm).toBe(1567); // 742 + 825
      expect(catM?.isQualified).toBe(true);
      expect(catM?.notes).toContain('Kwalifikacja');
    });

    it('rejects Category A when fewer than 10 prizes are registered', () => {
      const quals = evaluateOlympicQualifications(samplePrizes);
      const catA = quals.find((q) => q.category === 'A');

      expect(catA?.isQualified).toBe(false);
      expect(catA?.earnedPrizes).toBe(3); // 165.5, 212, 345.2 km
      expect(catA?.notes).toContain('Brakuje 7');
    });
  });

  describe('Trophy Cabinet & Badges', () => {
    it('unlocks 1st Prize, Super Ace (<5.0) and Olympian trophies', () => {
      const career = calculatePigeonCareer('PL-0284-23-1402', samplePrizes, 8);

      const firstPrizeTrophy = career.trophies.find((t) => t.id === 'first_prize');
      expect(firstPrizeTrophy?.isUnlocked).toBe(true);

      const superAceTrophy = career.trophies.find((t) => t.id === 'super_ace');
      expect(superAceTrophy?.isUnlocked).toBe(true);

      const olympianTrophy = career.trophies.find((t) => t.id === 'olympian');
      expect(olympianTrophy?.isUnlocked).toBe(true); // Because Cat M qualified!

      const tenThousandKkm = career.trophies.find((t) => t.id === 'club_10000_kkm');
      expect(tenThousandKkm?.isUnlocked).toBe(false); // Only 2814.7 kkm
    });
  });
});

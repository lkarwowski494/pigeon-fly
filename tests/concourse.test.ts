/**
 * Tests for FCI / PZHGP Concourse & Ace Pigeon Engine (src/domain/concourse.ts)
 */

import * as fc from 'fast-check';
import {
  calculateConcourseLimit,
  calculateFciCoefficient,
  calculateGmpPoints,
  evaluatePigeonPrize,
  calculateAcePigeonSummary,
} from '../src/domain/concourse';

describe('Concourse Engine — Prize Limits', () => {
  test('calculates 20% prize base correctly', () => {
    const res = calculateConcourseLimit(1000, 20);
    expect(res.prizeLimit).toBe(200);
    expect(res.totalBasketed).toBe(1000);
  });

  test('calculates 25% and 33% prize bases correctly', () => {
    expect(calculateConcourseLimit(800, 25).prizeLimit).toBe(200);
    expect(calculateConcourseLimit(100, 33).prizeLimit).toBe(33);
  });

  test('handles fractional ceiling for odd bird counts', () => {
    // 53 birds * 20% = 10.6 -> ceil = 11
    expect(calculateConcourseLimit(53, 20).prizeLimit).toBe(11);
  });

  test('returns 0 for non-positive basketed counts', () => {
    expect(calculateConcourseLimit(0, 20).prizeLimit).toBe(0);
    expect(calculateConcourseLimit(-10, 20).prizeLimit).toBe(0);
  });
});

describe('Concourse Engine — FCI / PZHGP Coefficients', () => {
  test('calculates exact Coeff with 3 decimal precision', () => {
    // 1st place out of 2500 birds -> (1 * 1000) / 2500 = 0.400
    expect(calculateFciCoefficient(1, 2500)).toBe(0.4);

    // 5th place out of 1000 birds -> (5 * 1000) / 1000 = 5.000
    expect(calculateFciCoefficient(5, 1000)).toBe(5.0);

    // 12th place out of 3450 birds -> (12 * 1000) / 3450 = 3.478
    expect(calculateFciCoefficient(12, 3450)).toBe(3.478);
  });

  test('returns 0 for invalid inputs', () => {
    expect(calculateFciCoefficient(0, 1000)).toBe(0);
    expect(calculateFciCoefficient(5, 0)).toBe(0);
  });

  test('property: coefficient strictly increases with position for fixed total basketed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 501, max: 2000 }),
        (pos1, total) => {
          const pos2 = pos1 + 1;
          const c1 = calculateFciCoefficient(pos1, total);
          const c2 = calculateFciCoefficient(pos2, total);
          return c2 >= c1 && c1 >= 0;
        }
      )
    );
  });
});

describe('Concourse Engine — GMP Championship Points', () => {
  test('first place gets maximum 40.00 points', () => {
    expect(calculateGmpPoints(1, 200)).toBe(40.0);
  });

  test('last prize position gets minimum 20.00 points', () => {
    expect(calculateGmpPoints(200, 200)).toBe(20.0);
  });

  test('mid-pack position scales linearly', () => {
    // halfway between 1 and 201 (pos 101 out of 201) -> 30.00 pts
    expect(calculateGmpPoints(101, 201)).toBe(30.0);
  });

  test('returns 0 for positions outside prize limit', () => {
    expect(calculateGmpPoints(201, 200)).toBe(0.0);
  });
});

describe('Concourse Engine — Individual Evaluation & Ace Pigeon', () => {
  test('evaluatePigeonPrize marks prize and kkm correctly', () => {
    const prize = evaluatePigeonPrize({
      position: 15,
      totalBasketed: 1000,
      distanceKm: 345.2,
      basePercent: 20,
    });

    expect(prize.isPrize).toBe(true);
    expect(prize.concourseKilometers).toBe(345.2);
    expect(prize.fciCoefficient).toBe(15.0);
    expect(prize.gmpPoints).toBeGreaterThan(20);

    const noPrize = evaluatePigeonPrize({
      position: 250,
      totalBasketed: 1000,
      distanceKm: 345.2,
      basePercent: 20,
    });

    expect(noPrize.isPrize).toBe(false);
    expect(noPrize.concourseKilometers).toBe(0.0);
    expect(noPrize.gmpPoints).toBe(0.0);
  });

  test('calculateAcePigeonSummary aggregates multi-race season', () => {
    const summary = calculateAcePigeonSummary('p-01', 'PL-0284-23-1402', [
      { position: 5, totalBasketed: 1000, distanceKm: 340.0 }, // prize
      { position: 20, totalBasketed: 1000, distanceKm: 520.0 }, // prize
      { position: 300, totalBasketed: 1000, distanceKm: 340.0 }, // no prize (>200)
    ]);

    expect(summary.totalPrizes).toBe(2);
    expect(summary.totalConcourseKm).toBe(860.0); // 340 + 520
    expect(summary.bestCoeff).toBe(5.0);
    expect(summary.averageCoeff).toBe(12.5); // (5 + 20) / 2
    expect(summary.totalGmpPoints).toBeGreaterThan(60);
  });
});

describe('Concourse Engine — Olympic / FCI Sport Categories', () => {
  const { evaluateOlympicQualification, calculateTeamSeriesScore } = require('../src/domain/concourse');

  test('qualifies pigeon for Category A (Sprint) when requirements met (5 prizes, >=1000 kkm)', () => {
    const races = [
      { position: 2, totalBasketed: 2000, distanceKm: 220 }, // coeff: 1.000
      { position: 5, totalBasketed: 2000, distanceKm: 180 }, // coeff: 2.500
      { position: 8, totalBasketed: 2000, distanceKm: 250 }, // coeff: 4.000
      { position: 10, totalBasketed: 2000, distanceKm: 310 }, // coeff: 5.000
      { position: 15, totalBasketed: 2000, distanceKm: 240 }, // coeff: 7.500
    ];

    const result = evaluateOlympicQualification('A', races);
    expect(result.isQualified).toBe(true);
    expect(result.qualifiedPrizesCount).toBe(5);
    expect(result.totalConcourseKm).toBe(1200); // >= 1000 kkm
    expect(result.totalFciCoeff).toBe(20.0); // 1.0 + 2.5 + 4.0 + 5.0 + 7.5
  });

  test('fails qualification when not enough prizes', () => {
    const races = [
      { position: 2, totalBasketed: 2000, distanceKm: 220 },
      { position: 5, totalBasketed: 2000, distanceKm: 180 },
    ];

    const result = evaluateOlympicQualification('A', races);
    expect(result.isQualified).toBe(false);
    expect(result.reason).toContain('Brakuje 3 konkursów');
  });

  test('calculateTeamSeriesScore computes top 5 from 50 series score', () => {
    const arrivals = [
      { isTip: true, isPrize: true, gmpPoints: 39.5, ringNumber: 'PL-1' },
      { isTip: true, isPrize: true, gmpPoints: 38.0, ringNumber: 'PL-2' },
      { isTip: false, isPrize: true, gmpPoints: 40.0, ringNumber: 'PL-3' }, // not tipped!
      { isTip: true, isPrize: true, gmpPoints: 35.0, ringNumber: 'PL-4' },
      { isTip: true, isPrize: true, gmpPoints: 33.0, ringNumber: 'PL-5' },
      { isTip: true, isPrize: true, gmpPoints: 30.0, ringNumber: 'PL-6' },
      { isTip: true, isPrize: false, gmpPoints: 0, ringNumber: 'PL-7' }, // outside prize base
    ];

    const teamScore = calculateTeamSeriesScore('5_from_50', arrivals);
    // Should count top 5 tipped: 39.5 + 38.0 + 35.0 + 33.0 + 30.0 = 175.5
    expect(teamScore.countingPigeonsCount).toBe(5);
    expect(teamScore.totalSeriesPoints).toBe(175.5);
  });
});

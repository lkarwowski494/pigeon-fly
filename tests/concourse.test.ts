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

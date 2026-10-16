/**
 * Unit Tests for Performance & Flight Form Engine
 */

import {
  calculatePigeonForm,
  calculateSpeedDelta,
  predictNextRaceVelocity,
  RacePerformanceEntry,
} from '../src/domain/performance';

describe('Performance & Flight Form Engine', () => {
  const mockHistory: RacePerformanceEntry[] = [
    {
      raceId: 'r-1',
      raceName: 'Lot 1 — Świebodzin',
      releaseDate: '2026-05-03',
      distanceKm: 165.4,
      velocityMPerMin: 1180.5,
      flightDurationMinutes: 140.1,
      concoursePosition: 24,
      totalBasketed: 1500,
      isPrize: true,
      fciCoefficient: 16.0,
      gmpPoints: 20.0,
    },
    {
      raceId: 'r-2',
      raceName: 'Lot 2 — Gorzów Wlkp.',
      releaseDate: '2026-05-10',
      distanceKm: 220.8,
      velocityMPerMin: 1245.0,
      flightDurationMinutes: 177.3,
      concoursePosition: 12,
      totalBasketed: 1420,
      isPrize: true,
      fciCoefficient: 8.45,
      gmpPoints: 24.5,
    },
    {
      raceId: 'r-3',
      raceName: 'Lot 3 — Szczecin',
      releaseDate: '2026-05-17',
      distanceKm: 340.2,
      velocityMPerMin: 1390.2,
      flightDurationMinutes: 244.7,
      concoursePosition: 3,
      totalBasketed: 1350,
      isPrize: true,
      fciCoefficient: 2.22,
      gmpPoints: 35.8,
    },
  ];

  test('calculates empty history gracefully', () => {
    const summary = calculatePigeonForm('empty-bird', []);
    expect(summary.totalRaces).toBe(0);
    expect(summary.totalPrizes).toBe(0);
    expect(summary.efficiencyPercent).toBe(0);
    expect(summary.formTrajectory).toBe('stable');
    expect(summary.bestCoefficient).toBeNull();
  });

  test('detects peaking form trajectory when speed consistently accelerates with prizes', () => {
    const summary = calculatePigeonForm('p-01', mockHistory);
    expect(summary.totalRaces).toBe(3);
    expect(summary.totalPrizes).toBe(3);
    expect(summary.efficiencyPercent).toBe(100);
    expect(summary.formTrajectory).toBe('peaking');
    expect(summary.peakVelocityMPerMin).toBe(1390.2);
    expect(summary.bestCoefficient).toBe(2.22);
    expect(summary.tacticalAdvice).toContain('szczytowej formie');
  });

  test('detects declining form when speed plummets without prizes', () => {
    const decliningHistory: RacePerformanceEntry[] = [
      {
        raceId: 'r-1',
        raceName: 'Lot 1',
        releaseDate: '2026-05-03',
        distanceKm: 200,
        velocityMPerMin: 1400,
        flightDurationMinutes: 142,
        isPrize: true,
      },
      {
        raceId: 'r-2',
        raceName: 'Lot 2',
        releaseDate: '2026-05-10',
        distanceKm: 250,
        velocityMPerMin: 1200,
        flightDurationMinutes: 208,
        isPrize: false,
      },
      {
        raceId: 'r-3',
        raceName: 'Lot 3',
        releaseDate: '2026-05-17',
        distanceKm: 300,
        velocityMPerMin: 1050,
        flightDurationMinutes: 285,
        isPrize: false,
      },
    ];

    const summary = calculatePigeonForm('declining-bird', decliningHistory);
    expect(summary.formTrajectory).toBe('declining');
    expect(summary.tacticalAdvice).toContain('przemęczenia');
  });

  test('calculates speed delta and percentage change correctly', () => {
    const delta = calculateSpeedDelta(1390.2, 1245.0);
    expect(delta.deltaMpm).toBe(145.2);
    expect(delta.percentChange).toBeCloseTo(11.66, 1);
  });

  test('predicts next race velocity using weighted recency and wind bonus', () => {
    const predicted = predictNextRaceVelocity(mockHistory, 380, 50);
    expect(predicted).toBeGreaterThan(1300);
    expect(predicted).toBeLessThan(1500);
  });
});

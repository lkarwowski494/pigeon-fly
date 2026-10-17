/**
 * Test Suite: Branch Race Comparison Domain Engine (Z-051, BR-LOT-012)
 * Verifies calculation of speed deltas against branch winner,
 * concourse closing speed, loft efficiency quota vs branch average,
 * flock compactness, and tactical diagnosis.
 */

import {
  calculateFlightComparison,
  BranchRaceStats,
  LoftRaceInput,
} from '../src/domain/flightComparison';
import { ArrivalWithPigeon } from '../src/db/raceRepository';

describe('Branch Race Comparison Domain Engine (Z-051)', () => {
  const mockBranch: BranchRaceStats = {
    branchName: 'Oddział 0284 Gostyń',
    totalLoftsCount: 45,
    totalBirdsBasketed: 2000,
    prizeLimit: 400, // 20%
    basePercent: 20,
    winnerBird: {
      breederName: 'Jan Kowalski',
      ringNumber: 'PL-0284-22-101',
      speedMPerMin: 1350.0,
      arrivalTimeIso: '2026-05-10T10:15:00.000Z',
      distanceKm: 345.0,
    },
    closingBird: {
      speedMPerMin: 1200.0,
      arrivalTimeIso: '2026-05-10T10:47:30.000Z',
    },
    raceCategory: 'A',
    averageBranchDistanceKm: 345.0,
    windInfo: {
      speedKmh: 20,
      directionDeg: 270, // West wind
      description: 'Umiarkowany wiatr zachodni',
    },
  };

  const createMockArrival = (
    id: string,
    ringNumber: string,
    speed: number,
    timeIso: string
  ): ArrivalWithPigeon => ({
    id,
    raceId: 'race-01',
    pigeonId: `p-${id}`,
    arrivalTime: timeIso,
    distanceMeters: 345000,
    velocityMPerMin: speed,
    scanType: 'esk',
    isManualOverride: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ringNumber,
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski',
  });

  it('evaluates outstanding domination when loft wins 50% prizes', () => {
    const arrivals: ArrivalWithPigeon[] = [
      createMockArrival('1', 'PL-0284-23-1402', 1345.5, '2026-05-10T10:16:00.000Z'),
      createMockArrival('2', 'PL-0284-23-1403', 1330.0, '2026-05-10T10:18:00.000Z'),
      createMockArrival('3', 'PL-0284-23-1404', 1310.0, '2026-05-10T10:20:00.000Z'),
      createMockArrival('4', 'PL-0284-23-1405', 1250.0, '2026-05-10T10:25:00.000Z'),
      createMockArrival('5', 'PL-0284-23-1406', 1210.0, '2026-05-10T10:30:00.000Z'),
      createMockArrival('6', 'PL-0284-23-1407', 1150.0, '2026-05-10T10:45:00.000Z'), // Below closing speed (1200)
    ];

    const loft: LoftRaceInput = {
      loftName: 'Gołębnik Mistrza',
      loftDistanceKm: 345.0,
      basketedCount: 10,
      arrivals,
    };

    const report = calculateFlightComparison(loft, mockBranch);

    // 5 out of 10 birds in prize list (50%)
    expect(report.prizesWonCount).toBe(5);
    expect(report.loftEfficiencyPercent).toBe(50.0);
    expect(report.efficiencyMultiplier).toBe(2.5); // 50 / 20 = 2.5x
    expect(report.performanceTier).toBe('outstanding_domination');
    expect(report.speedDeltaWinnerMPerMin).toBeCloseTo(-4.5, 1); // 1345.5 - 1350 = -4.5 m/min
    expect(report.tacticalDiagnosisTitle).toContain('Dominacja');
  });

  it('correctly assesses flock arrival compactness when 10 birds arrive in 6 minutes', () => {
    const arrivals: ArrivalWithPigeon[] = [];
    const baseTime = new Date('2026-05-10T10:15:00.000Z').getTime();

    for (let i = 0; i < 12; i++) {
      const birdTime = new Date(baseTime + i * 30 * 1000).toISOString(); // Every 30 seconds
      arrivals.push(
        createMockArrival(
          `arr-${i}`,
          `PL-0284-23-14${i.toString().padStart(2, '0')}`,
          1340 - i * 5,
          birdTime
        )
      );
    }

    const loft: LoftRaceInput = {
      loftName: 'Team Sprint',
      loftDistanceKm: 345.0,
      basketedCount: 20,
      arrivals,
    };

    const report = calculateFlightComparison(loft, mockBranch);

    // 10th bird arrived in 4.5 minutes (which is <= 8 minutes)
    expect(report.flockArrivalCompactness.compactnessEvaluation).toBe('very_tight');
    expect(report.flockArrivalCompactness.durationTo10thMinutes).toBeLessThanOrEqual(8);
  });

  it('diagnoses front-short loft handicap and crosswind drift', () => {
    const loft: LoftRaceInput = {
      loftName: 'Przedni Gołębnik',
      loftDistanceKm: 335.0, // 10 km shorter than branch average (345 km)
      basketedCount: 20,
      arrivals: [
        createMockArrival('1', 'PL-0284-23-900', 1210.0, '2026-05-10T10:35:00.000Z'),
      ],
    };

    const report = calculateFlightComparison(loft, mockBranch);

    expect(report.distanceHandicapType).toBe('front_short_loft');
    expect(report.distanceDifferenceKm).toBe(-10.0);
    expect(report.windHandicapAnalysis.crosswindImpact).toBe('favorable_drift');
    expect(report.windHandicapAnalysis.notes).toContain('Wiatr zachodni');
  });

  it('diagnoses warning tier when loft scores below 15% concourse base', () => {
    const loft: LoftRaceInput = {
      loftName: 'Gołębnik w Kryzysie',
      loftDistanceKm: 345.0,
      basketedCount: 30,
      arrivals: [
        createMockArrival('1', 'PL-0284-23-01', 1205.0, '2026-05-10T10:45:00.000Z'),
      ],
    };

    const report = calculateFlightComparison(loft, mockBranch);

    // 1 prize from 30 birds = 3.3% -> critical_failure
    expect(report.prizesWonCount).toBe(1);
    expect(report.loftEfficiencyPercent).toBe(3.3);
    expect(report.performanceTier).toBe('critical_failure');
    expect(report.coachRecommendations.some((r) => r.includes('weterynarii'))).toBe(true);
  });
});

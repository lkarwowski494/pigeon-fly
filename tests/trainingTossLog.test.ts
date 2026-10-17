/**
 * Unit tests for Training Toss Log & Flock Cohesion Engine (Z-078 / DEC-92)
 */

import {
  calculateMinutesElapsed,
  analyzeTrainingToss,
  evaluateFlockSeasonReadiness,
  generateTrainingTossLogSheetHtml,
  TrainingTossLogEntry,
} from '../src/domain/trainingTossLog';

describe('TrainingTossLog Domain (Z-078)', () => {
  const sampleEntry: TrainingTossLogEntry = {
    id: 'toss-1',
    tossDate: '2026-04-12',
    tossName: 'Wywózka Rawicz 35 km',
    squadType: 'youngsters',
    releaseLocation: 'Rawicz - Wiatrak',
    distanceKm: 35.0,
    azimuthDeg: 215,
    releaseTime: '07:30',
    leadArrivalTime: '07:58',
    tailArrivalTime: '08:20',
    basketedCount: 30,
    leadGroupCount: 8,
    returned15MinCount: 25, // 25 / 30 = 83.3%
    totalReturnedSameDayCount: 30,
    ambientTempC: 16,
    windCondition: 'SW 10 km/h (lekki w plecy)',
  };

  test('calculateMinutesElapsed calculates correct interval and handles midnight', () => {
    expect(calculateMinutesElapsed('07:30', '07:58')).toBe(28);
    expect(calculateMinutesElapsed('06:00', '07:30')).toBe(90);
    expect(calculateMinutesElapsed('23:45', '00:15')).toBe(30);
  });

  test('analyzeTrainingToss calculates lead speed, cohesion %, and ratings accurately', () => {
    const analysis = analyzeTrainingToss(sampleEntry);

    expect(analysis.leadDurationMinutes).toBe(28);
    // 35,000 m / 28 min = 1250 m/min
    expect(analysis.speedLeadMPerMin).toBe(1250);
    expect(analysis.flockCohesionPct).toBe(83.3);
    expect(analysis.sameDayReturnPct).toBe(100);
    expect(analysis.lossesCount).toBe(0);
    expect(analysis.cohesionRating).toBe('EXCELLENT_SYNCHRONIZED');
  });

  test('analyzeTrainingToss classifies scattered flock and tracks losses', () => {
    const scatteredEntry: TrainingTossLogEntry = {
      ...sampleEntry,
      basketedCount: 40,
      returned15MinCount: 16, // 40%
      totalReturnedSameDayCount: 35, // 5 lost
    };

    const analysis = analyzeTrainingToss(scatteredEntry);
    expect(analysis.flockCohesionPct).toBe(40.0);
    expect(analysis.lossesCount).toBe(5);
    expect(analysis.cohesionRating).toBe('POOR_DISPERSED');
  });

  test('evaluateFlockSeasonReadiness handles empty input', () => {
    const emptyResult = evaluateFlockSeasonReadiness([]);
    expect(emptyResult.totalTosses).toBe(0);
    expect(emptyResult.readinessScore).toBe(0);
    expect(emptyResult.verdict).toBe('ALERT_NOT_READY');
  });

  test('evaluateFlockSeasonReadiness awards READY_FOR_OFFICIAL_RACE for progressive well-synchronized tosses', () => {
    const progressiveTosses: TrainingTossLogEntry[] = [
      {
        id: 't-1',
        tossDate: '2026-04-05',
        tossName: 'Wywózka 15 km',
        squadType: 'youngsters',
        releaseLocation: 'Borek Wlkp',
        distanceKm: 15.0,
        azimuthDeg: 210,
        releaseTime: '08:00',
        leadArrivalTime: '08:14',
        basketedCount: 40,
        leadGroupCount: 12,
        returned15MinCount: 36, // 90%
        totalReturnedSameDayCount: 40,
      },
      {
        id: 't-2',
        tossDate: '2026-04-09',
        tossName: 'Wywózka 30 km',
        squadType: 'youngsters',
        releaseLocation: 'Gostyń Północ',
        distanceKm: 30.0,
        azimuthDeg: 212,
        releaseTime: '07:30',
        leadArrivalTime: '07:54',
        basketedCount: 40,
        leadGroupCount: 15,
        returned15MinCount: 35, // 87.5%
        totalReturnedSameDayCount: 40,
      },
      {
        id: 't-3',
        tossDate: '2026-04-14',
        tossName: 'Wywózka 45 km',
        squadType: 'youngsters',
        releaseLocation: 'Krobia Południe',
        distanceKm: 45.0,
        azimuthDeg: 210,
        releaseTime: '07:00',
        leadArrivalTime: '07:36',
        basketedCount: 40,
        leadGroupCount: 10,
        returned15MinCount: 34, // 85%
        totalReturnedSameDayCount: 40,
      },
      {
        id: 't-4',
        tossDate: '2026-04-18',
        tossName: 'Wywózka 60 km',
        squadType: 'youngsters',
        releaseLocation: 'Rawicz',
        distanceKm: 60.0,
        azimuthDeg: 215,
        releaseTime: '07:00',
        leadArrivalTime: '07:48',
        basketedCount: 40,
        leadGroupCount: 14,
        returned15MinCount: 33, // 82.5%
        totalReturnedSameDayCount: 39,
      },
      {
        id: 't-5',
        tossDate: '2026-04-22',
        tossName: 'Wywózka 80 km',
        squadType: 'youngsters',
        releaseLocation: 'Trzebnica Wzgórza',
        distanceKm: 80.0,
        azimuthDeg: 214,
        releaseTime: '06:30',
        leadArrivalTime: '07:34',
        basketedCount: 39,
        leadGroupCount: 12,
        returned15MinCount: 32, // 82%
        totalReturnedSameDayCount: 39,
      },
    ];

    const result = evaluateFlockSeasonReadiness(progressiveTosses);
    expect(result.totalTosses).toBe(5);
    expect(result.maxTossDistanceKm).toBe(80);
    expect(result.averageCohesionPct).toBeGreaterThan(80);
    expect(result.readinessScore).toBeGreaterThanOrEqual(80);
    expect(result.verdict).toBe('READY_FOR_OFFICIAL_RACE');
  });

  test('evaluateFlockSeasonReadiness identifies undertrained flock with short tosses', () => {
    const shortTosses: TrainingTossLogEntry[] = [
      {
        id: 't-1',
        tossDate: '2026-04-10',
        tossName: 'Rozruch 15 km',
        squadType: 'youngsters',
        releaseLocation: 'Pola',
        distanceKm: 15.0,
        azimuthDeg: 200,
        releaseTime: '08:00',
        leadArrivalTime: '08:15',
        basketedCount: 20,
        leadGroupCount: 5,
        returned15MinCount: 12, // 60%
        totalReturnedSameDayCount: 19,
      },
    ];

    const result = evaluateFlockSeasonReadiness(shortTosses);
    expect(result.readinessScore).toBeLessThan(60);
    expect(result.verdict).toBe('ALERT_NOT_READY');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('generateTrainingTossLogSheetHtml produces valid HTML with table and header', () => {
    const analysis = evaluateFlockSeasonReadiness([sampleEntry]);
    const html = generateTrainingTossLogSheetHtml(analysis, {
      loftName: 'Gołębnik Mistrza',
      breederName: 'Łukasz',
      seasonYear: 2026,
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Elektroniczny Dziennik Lotów Próbnych i Wywózek');
    expect(html).toContain('Rawicz - Wiatrak');
    expect(html).toContain('1250.0 m/min');
    expect(html).toContain('Gołębnik Mistrza');
  });
});

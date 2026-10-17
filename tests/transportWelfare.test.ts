/**
 * Tests for Pigeon-Fly Transport Welfare and Cabin Log Engine (Z-059)
 */

import {
  calculateCrateDensity,
  calculateCabinThi,
  evaluateTransportWelfare,
  CrateManifest,
  CabinEnvironmentLog,
  WateringEvent,
} from '../src/domain/transportWelfare';

describe('Transport Welfare & Cabin Log Engine (Z-059)', () => {
  describe('Crate Floor Density Calculator', () => {
    it('evaluates standard 100x100 cm crate with 25 birds as optimal for medium distance', () => {
      const result = calculateCrateDensity(100, 100, 25, 'medium');

      expect(result.floorAreaCm2).toBe(10000);
      expect(result.areaPerBirdCm2).toBe(400); // 10000 / 25
      expect(result.minRequiredAreaPerBirdCm2).toBe(380);
      expect(result.densityStatus).toBe('optimal');
      expect(result.overcrowdingDeltaBirds).toBe(0);
    });

    it('flags overcrowding when 35 birds are placed in a 100x100 cm crate on long distance', () => {
      const result = calculateCrateDensity(100, 100, 35, 'long');

      // Min required for long = 440 cm²/bird -> max = floor(10000 / 440) = 22 birds
      expect(result.maxAllowedBirds).toBe(22);
      expect(result.densityStatus).toBe('overcrowded');
      expect(result.overcrowdingDeltaBirds).toBe(13); // 35 - 22
    });

    it('strictly enforces 520 cm² per bird for marathon races (>700 km)', () => {
      const result = calculateCrateDensity(100, 100, 20, 'marathon');

      // Max allowed = floor(10000 / 520) = 19 birds
      expect(result.maxAllowedBirds).toBe(19);
      expect(result.densityStatus).toBe('overcrowded');
    });
  });

  describe('Temperature-Humidity Index (THI) Assessment', () => {
    it('assesses 20°C and 50% RH as normal thermal comfort zone', () => {
      const thi = calculateCabinThi(20, 50);

      expect(thi.thiValue).toBeLessThan(70);
      expect(thi.riskLevel).toBe('normal');
      expect(thi.description).toContain('komfortu');
    });

    it('assesses 28°C and 70% RH as danger level requiring active cooling', () => {
      const thi = calculateCabinThi(28, 70);

      expect(thi.thiValue).toBeGreaterThanOrEqual(78);
      expect(thi.riskLevel).toBe('danger');
      expect(thi.recommendedAction).toContain('rynienek');
    });

    it('assesses 34°C and 80% RH as critical heat stress emergency', () => {
      const thi = calculateCabinThi(34, 80);

      expect(thi.thiValue).toBeGreaterThanOrEqual(83);
      expect(thi.riskLevel).toBe('critical');
      expect(thi.description).toContain('STAN KRYTYCZNY');
    });
  });

  describe('Holistic Transport Welfare Assessment', () => {
    const validCrates: CrateManifest[] = [
      { crateId: 'c1', crateNumber: 1, widthCm: 100, depthCm: 100, birdCount: 22 },
      { crateId: 'c2', crateNumber: 2, widthCm: 100, depthCm: 100, birdCount: 22 },
    ];

    it('grants GO readiness and high score under optimal welfare conditions', () => {
      const env: CabinEnvironmentLog = {
        timestamp: '2026-06-10T18:00:00Z',
        temperatureCelsius: 19,
        relativeHumidityPercent: 55,
        isForcedVentilationActive: true,
        isVehicleMoving: true,
      };

      const watering: WateringEvent[] = [
        {
          timestamp: '2026-06-10T15:00:00Z',
          drinkerTroughsFilled: true,
          waterQuality: 'clean_fresh',
          observedDrinkingIntensity: 'normal',
        },
      ];

      const assessment = evaluateTransportWelfare(
        validCrates,
        env,
        watering,
        'medium',
        '2026-06-10T18:00:00Z'
      );

      expect(assessment.welfareScore).toBeGreaterThanOrEqual(90);
      expect(assessment.overallStatus).toBe('optimal');
      expect(assessment.releaseReadiness).toBe('GO');
      expect(assessment.violations.length).toBe(0);
    });

    it('demands EMERGENCY_VENTILATION when cabin THI reaches critical level', () => {
      const criticalEnv: CabinEnvironmentLog = {
        timestamp: '2026-06-10T12:00:00Z',
        temperatureCelsius: 35,
        relativeHumidityPercent: 85,
        isForcedVentilationActive: false,
        isVehicleMoving: false,
      };

      const assessment = evaluateTransportWelfare(
        validCrates,
        criticalEnv,
        [],
        'medium',
        '2026-06-10T12:00:00Z'
      );

      expect(assessment.welfareScore).toBeLessThan(50);
      expect(assessment.overallStatus).toBe('critical');
      expect(assessment.releaseReadiness).toBe('EMERGENCY_VENTILATION');
      expect(assessment.violations.some((v) => v.includes('THI'))).toBe(true);
    });

    it('requires DELAY_FOR_WATERING when pigeons went unwatered for over 14 hours', () => {
      const env: CabinEnvironmentLog = {
        timestamp: '2026-06-11T08:00:00Z',
        temperatureCelsius: 22,
        relativeHumidityPercent: 60,
        isForcedVentilationActive: true,
        isVehicleMoving: false,
      };

      const overdueWatering: WateringEvent[] = [
        {
          timestamp: '2026-06-10T17:00:00Z', // 15 hours ago
          drinkerTroughsFilled: true,
          waterQuality: 'clean_fresh',
          observedDrinkingIntensity: 'eager',
        },
      ];

      const assessment = evaluateTransportWelfare(
        validCrates,
        env,
        overdueWatering,
        'long',
        '2026-06-11T08:00:00Z'
      );

      expect(assessment.releaseReadiness).toBe('DELAY_FOR_WATERING');
      expect(assessment.violations.some((v) => v.includes('Brak pojenia'))).toBe(true);
    });
  });
});

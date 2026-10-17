/**
 * PIGEON-FLY — Testy Jednostkowe Mikroklimatu i Wentylacji Gołębnika (Z-066)
 */

import {
  calculateDewPoint,
  calculateLoftVentilation,
  LoftDimensions,
  ClimateConditions,
} from '../src/domain/loftVentilation';

describe('Loft Microclimate & Ventilation Engine (Z-066)', () => {
  describe('Magnus-Tetens Dew Point Physics Formula', () => {
    it('accurately computes dew point for standard 20C and 50% humidity', () => {
      const dewPoint = calculateDewPoint(20, 50);
      // Standard thermodynamic tables: 20C at 50% RH gives ~9.3C dew point
      expect(dewPoint).toBeCloseTo(9.3, 1);
    });

    it('computes near-ambient dew point at 95% humidity', () => {
      const dewPoint = calculateDewPoint(10, 95);
      expect(dewPoint).toBeCloseTo(9.2, 1);
    });

    it('matches temperature at 100% saturation', () => {
      const dewPoint = calculateDewPoint(5, 100);
      expect(dewPoint).toBe(5);
    });
  });

  describe('Loft Air Turnover & Condensation Risk Engine', () => {
    const standardLoft: LoftDimensions = {
      lengthM: 6.0,
      widthM: 3.0,
      heightM: 2.2, // V = 39.6 m3
      birdsCount: 50, // ~0.79 m3/bird
    };

    it('confirms SAFE_DRY status under dry spring conditions', () => {
      const dryClimate: ClimateConditions = {
        temperatureCelsius: 18,
        relativeHumidityPct: 50,
        seasonMode: 'BREEDING_SPRING',
        hasHeatedFloor: false,
      };

      const result = calculateLoftVentilation(standardLoft, dryClimate);

      expect(result.loftVolumeM3).toBe(39.6);
      expect(result.volumePerBirdM3).toBe(0.79);
      expect(result.isOvercrowded).toBe(false);
      expect(result.condensationRisk).toBe('SAFE_DRY');
      expect(result.condensationMarginDeltaT).toBeGreaterThan(4.5);
      expect(result.coccidiosisRiskLevel).toBe('LOW');
      expect(result.airChangesPerHourACH).toBeGreaterThanOrEqual(1.0);
    });

    it('detects CRITICAL_CONDENSATION and HIGH coccidiosis risk in cold damp air', () => {
      const dampColdClimate: ClimateConditions = {
        temperatureCelsius: 7,
        relativeHumidityPct: 92, // T_dew ~5.8C, Delta T ~1.2C
        seasonMode: 'MOULT_AUTUMN',
        hasHeatedFloor: false,
      };

      const result = calculateLoftVentilation(standardLoft, dampColdClimate);

      expect(result.condensationRisk).toBe('CRITICAL_CONDENSATION');
      expect(result.condensationMarginDeltaT).toBeLessThanOrEqual(2.0);
      expect(result.coccidiosisRiskLevel).toBe('HIGH');
      expect(result.damperPercentOpen).toBe(75);
      expect(result.actionRecommendations.some((r) => r.includes('punkt rosy'))).toBe(true);
    });

    it('mitigates condensation risk when floor heating is activated', () => {
      const dampClimate: ClimateConditions = {
        temperatureCelsius: 7,
        relativeHumidityPct: 90,
        seasonMode: 'WINTER_REST',
        hasHeatedFloor: true, // +2.5C effective margin
      };

      const resultWithHeat = calculateLoftVentilation(standardLoft, dampClimate);

      expect(resultWithHeat.condensationMarginDeltaT).toBeGreaterThan(2.0);
      expect(resultWithHeat.condensationRisk).not.toBe('CRITICAL_CONDENSATION');
    });

    it('detects overcrowding when bird density exceeds cubic capacity', () => {
      const crowdedLoft: LoftDimensions = {
        lengthM: 3.0,
        widthM: 2.0,
        heightM: 2.0, // V = 12 m3
        birdsCount: 40, // 0.3 m3/bird < 0.45 m3
      };

      const climate: ClimateConditions = {
        temperatureCelsius: 15,
        relativeHumidityPct: 60,
        seasonMode: 'RACING_SUMMER',
        hasHeatedFloor: false,
      };

      const result = calculateLoftVentilation(crowdedLoft, climate);

      expect(result.isOvercrowded).toBe(true);
      expect(result.volumePerBirdM3).toBe(0.3);
      expect(result.actionRecommendations.some((r) => r.includes('Zbyt mała kubatura'))).toBe(true);
    });

    it('recommends MINIMAL_SLIT damper opening during subzero frost', () => {
      const frostClimate: ClimateConditions = {
        temperatureCelsius: -8,
        relativeHumidityPct: 70,
        seasonMode: 'WINTER_REST',
        hasHeatedFloor: false,
      };

      const result = calculateLoftVentilation(standardLoft, frostClimate);

      expect(result.damperRecommendation).toBe('MINIMAL_SLIT');
      expect(result.damperPercentOpen).toBe(20);
    });

    it('recommends MAX_OPEN during summer heat wave', () => {
      const heatClimate: ClimateConditions = {
        temperatureCelsius: 28,
        relativeHumidityPct: 55,
        seasonMode: 'RACING_SUMMER',
        hasHeatedFloor: false,
      };

      const result = calculateLoftVentilation(standardLoft, heatClimate);

      expect(result.damperRecommendation).toBe('MAX_OPEN');
      expect(result.damperPercentOpen).toBe(100);
    });
  });
});

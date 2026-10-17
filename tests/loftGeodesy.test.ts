/**
 * PIGEON-FLY — Testy Jednostkowe Geodezyjnej Kalibracji Koordynat (Z-067)
 */

import {
  convertDDToDMS,
  convertDMSToDD,
  formatDmsString,
  evaluateLoftGeodesy,
  generateGeodeticDeclarationHtml,
  GeodesyCalibrationInput,
} from '../src/domain/loftGeodesy';

describe('Loft Geodesy Calibration Engine (Z-067)', () => {
  const sampleInput: GeodesyCalibrationInput = {
    loftName: 'Gołębnik Mistrza',
    breederName: 'Jan Kowalski',
    loftAddress: 'ul. Lotników 44, 05-500 Piaseczno',
    pzhgpBranch: '0284 Warszawa-Mokotów',
    pzhgpSection: 'Sekcja 2 Piaseczno',
    registeredCoords: {
      latitude: 52.083333,
      longitude: 21.033333,
    },
    measuredCoords: {
      latitude: 52.083500, // przesunięcie o ok. 18.5 m na północ
      longitude: 21.033333,
    },
    simulatedRaceDistanceKm: 350,
    simulatedFlightTimeMinutes: 270, // 4h 30 min
  };

  describe('DD and DMS Coordinate Conversions', () => {
    it('converts DD to DMS and back with sub-second accuracy', () => {
      const dd = { latitude: 52.229676, longitude: 21.012229 };
      const dms = convertDDToDMS(dd);

      expect(dms.latDegrees).toBe(52);
      expect(dms.latMinutes).toBe(13);
      expect(dms.latDirection).toBe('N');
      expect(dms.lonDegrees).toBe(21);
      expect(dms.lonDirection).toBe('E');

      const formatted = formatDmsString(dms);
      expect(formatted).toContain("52°13'");
      expect(formatted).toContain("21°00'");

      const backToDD = convertDMSToDD(dms);
      expect(backToDD.latitude).toBeCloseTo(dd.latitude, 4);
      expect(backToDD.longitude).toBeCloseTo(dd.longitude, 4);
    });
  });

  describe('Geodetic Deviation and Velocity Distortion Assessment', () => {
    it('identifies PERFECT_MATCH when coordinates are identical', () => {
      const identicalInput: GeodesyCalibrationInput = {
        ...sampleInput,
        measuredCoords: { ...sampleInput.registeredCoords },
      };

      const result = evaluateLoftGeodesy(identicalInput);

      expect(result.deviationMeters).toBe(0);
      expect(result.toleranceStatus).toBe('PERFECT_MATCH');
      expect(result.velocityImpactMPerMin).toBe(0);
      expect(result.isOfficialCorrectionRequired).toBe(false);
    });

    it('identifies DISCREPANCY_WARNING when deviation is between 10m and 50m', () => {
      const result = evaluateLoftGeodesy(sampleInput);

      expect(result.deviationMeters).toBeGreaterThan(10);
      expect(result.deviationMeters).toBeLessThan(50);
      expect(result.toleranceStatus).toBe('DISCREPANCY_WARNING');
      expect(result.isOfficialCorrectionRequired).toBe(true);
      expect(result.velocityImpactMPerMin).toBeGreaterThan(0.05);
      expect(result.timeOffsetSeconds).toBeGreaterThan(0.5);
    });

    it('flags CRITICAL_MISMATCH when deviation exceeds 50m', () => {
      const largeDiscrepancyInput: GeodesyCalibrationInput = {
        ...sampleInput,
        measuredCoords: {
          latitude: 52.084500, // przesunięcie o ok. 130 m
          longitude: 21.033333,
        },
      };

      const result = evaluateLoftGeodesy(largeDiscrepancyInput);

      expect(result.deviationMeters).toBeGreaterThan(50);
      expect(result.toleranceStatus).toBe('CRITICAL_MISMATCH');
      expect(result.isOfficialCorrectionRequired).toBe(true);
    });
  });

  describe('A4 Official Geodetic Declaration Generation', () => {
    it('generates official HTML declaration document with WGS-84 coordinates and signature fields', () => {
      const result = evaluateLoftGeodesy(sampleInput);
      const html = generateGeodeticDeclarationHtml(sampleInput, result);

      expect(html).toContain('OŚWIADCZENIE HODOWCY O WSPÓŁRZĘDNYCH GEOGRAFICZNYCH');
      expect(html).toContain('Jan Kowalski');
      expect(html).toContain('Gołębnik Mistrza');
      expect(html).toContain('0284 Warszawa-Mokotów');
      expect(html).toContain('52.083333');
      expect(html).toContain('Czytelny podpis Hodowcy');
      expect(html).toContain('Zarządu Oddziału PZHGP');
    });
  });
});

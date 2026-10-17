/**
 * Test Suite: ESK Clock Data Import Engine (Z-050)
 * Verifies parsing of Tauris, Benzing, Bricon, and Mega/Unikon formats,
 * ring normalization, duplicate antenna filtering, time paradox checks,
 * and basketing matching with velocity calculations.
 */

import {
  normalizeEskRingNumber,
  detectClockBrand,
  parseEskArrivalFile,
  matchEskWithBasketed,
  SAMPLE_ESK_FILES,
} from '../src/domain/eskImport';
import { BasketEntry } from '../src/domain/basketing';

describe('ESK Electronic Clock Data Import Engine (Z-050)', () => {
  describe('normalizeEskRingNumber', () => {
    it('normalizes spaces and underscores into standard hyphenated rings', () => {
      expect(normalizeEskRingNumber('PL 0284 23 1402')).toBe('PL-0284-23-1402');
      expect(normalizeEskRingNumber('pl_0284_23_1402')).toBe('PL-0284-23-1402');
      expect(normalizeEskRingNumber('DV 01234 24 512')).toBe('DV-01234-24-512');
    });

    it('adds hyphen to joined country prefix like PL0284', () => {
      expect(normalizeEskRingNumber('PL0284-23-1402')).toBe('PL-0284-23-1402');
    });

    it('strips redundant leading zeroes in bird serial numbers', () => {
      expect(normalizeEskRingNumber('PL-0284-23-0001402')).toBe('PL-0284-23-1402');
    });
  });

  describe('detectClockBrand', () => {
    it('detects Tauris from header text', () => {
      expect(detectClockBrand('TAURIS WORLD TERMINAL REPORT')).toBe('tauris');
    });

    it('detects Benzing from header text or Benzing Live', () => {
      expect(detectClockBrand('BENZING LIVE - ANKUNFTSLISTE')).toBe('benzing');
    });

    it('detects Bricon from Speedy signature', () => {
      expect(detectClockBrand('BRICON SPEEDY / CLUB MASTER')).toBe('bricon');
    });

    it('detects Mega/Unikon from header', () => {
      expect(detectClockBrand('MEGA SYSTEM V2.4')).toBe('mega');
    });

    it('returns generic_csv or unknown for standard columns', () => {
      expect(detectClockBrand('Ring;Date;Time;Speed')).toBe('generic_csv');
      expect(detectClockBrand('random text without clock keywords')).toBe('unknown');
    });
  });

  describe('parseEskArrivalFile', () => {
    it('correctly parses Tauris printout and detects duplicates on secondary antennas', () => {
      const result = parseEskArrivalFile(SAMPLE_ESK_FILES.tauris);

      expect(result.clockBrand).toBe('tauris');
      expect(result.totalLines).toBeGreaterThan(5);
      // In sample Tauris: PL-0284-23-1402 is clocked twice (at 10:14:22 and 10:22:15)
      expect(result.records).toHaveLength(5);
      expect(result.validCount).toBe(4);
      expect(result.duplicateCount).toBe(1);

      const firstHit = result.records[0];
      expect(firstHit.ringNumber).toBe('PL-0284-23-1402');
      expect(firstHit.arrivalTime).toBe('10:14:22');
      expect(firstHit.status).toBe('valid');
      expect(firstHit.antenna).toBe('A1');
      expect(firstHit.chipCode).toBe('9A2B3C4D');
      expect(firstHit.clockSpeedMPerMin).toBeCloseTo(1342.541, 2);

      const dupHit = result.records[3];
      expect(dupHit.ringNumber).toBe('PL-0284-23-1402');
      expect(dupHit.status).toBe('duplicate');
      expect(dupHit.errorMessage).toContain('Ptak odbity powtórnie');
    });

    it('correctly parses Benzing CSV format with semicolon delimiter', () => {
      const result = parseEskArrivalFile(SAMPLE_ESK_FILES.benzing);

      expect(result.clockBrand).toBe('benzing');
      expect(result.records).toHaveLength(4);
      expect(result.validCount).toBe(4);
      expect(result.duplicateCount).toBe(0);

      const first = result.records[0];
      expect(first.ringNumber).toBe('PL-0284-23-1402');
      expect(first.arrivalDate).toBe('2024-05-12');
      expect(first.arrivalTime).toBe('10:14:22.40');
      expect(first.clockSpeedMPerMin).toBeCloseTo(1342.54, 2);
    });

    it('correctly parses Bricon printout format', () => {
      const result = parseEskArrivalFile(SAMPLE_ESK_FILES.bricon);

      expect(result.clockBrand).toBe('bricon');
      expect(result.records).toHaveLength(3);
      expect(result.validCount).toBe(3);
      expect(result.records[0].ringNumber).toBe('PL-0284-23-1402');
      expect(result.records[1].ringNumber).toBe('DV-01234-24-512');
    });
  });

  describe('matchEskWithBasketed', () => {
    const mockBasket: BasketEntry[] = [
      {
        pigeonId: 'p-01',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski nakrapiany',
        isDesignatedSeries: true,
        basketingOrder: 1,
      },
      {
        pigeonId: 'p-02',
        ringNumber: 'DV-01234-24-512',
        countryCode: 'DV',
        year: 2024,
        sex: 'cock',
        plumageColor: 'Pstry',
        isDesignatedSeries: false,
        basketingOrder: 2,
      },
    ];

    it('matches clocked birds against basketed sheet and calculates speed', () => {
      const parsed = parseEskArrivalFile(SAMPLE_ESK_FILES.tauris);
      const raceParams = {
        releaseTimeIso: '2024-05-12T06:00:00.000Z',
        raceDistanceMeters: 345200,
        raceId: 'race-magdeburg-01',
      };

      const matchResult = matchEskWithBasketed(parsed.records, mockBasket, raceParams);

      expect(matchResult.matchedRecords).toHaveLength(2);
      expect(matchResult.matchedRecords[0].ringNumber).toBe('PL-0284-23-1402');
      expect(matchResult.matchedRecords[0].isMatchedWithBasket).toBe(true);

      // Unbasketed birds (pigeons present in clock but not in mock basket)
      expect(matchResult.unbasketedCount).toBe(2);

      // Check arrival items to save
      expect(matchResult.arrivalsToSave.length).toBeGreaterThan(0);
      const topBird = matchResult.arrivalsToSave[0];
      expect(topBird.ringNumber).toBe('PL-0284-23-1402');
      expect(topBird.scanType).toBe('esk');
      expect(topBird.velocityMPerMin).toBeGreaterThan(1300);
    });

    it('flags time paradox if clock arrival is earlier than release time', () => {
      const records = [
        {
          id: 'esk-1',
          orderIndex: 1,
          rawLine: 'test',
          clockBrand: 'tauris' as const,
          originalRing: 'PL-0284-23-1402',
          ringNumber: 'PL-0284-23-1402',
          countryCode: 'PL',
          arrivalDate: '2024-05-12',
          arrivalTime: '05:30:00',
          arrivalTimeIso: '2024-05-12T05:30:00.000Z',
          status: 'valid' as const,
        },
      ];

      const raceParams = {
        releaseTimeIso: '2024-05-12T06:00:00.000Z', // Release at 06:00, bird arrived at 05:30
        raceDistanceMeters: 300000,
      };

      const matchResult = matchEskWithBasketed(records, mockBasket, raceParams);
      expect(matchResult.matchedRecords).toHaveLength(0);
      expect(matchResult.unmatchedRecords[0].status).toBe('time_paradox');
      expect(matchResult.unmatchedRecords[0].errorMessage).toContain('wcześniejszy niż start lotu');
    });
  });
});

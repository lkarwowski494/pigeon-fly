/**
 * Tests for Pigeon-Fly Basketing Protocol & Clocking List Engine (Z-057)
 */

import {
  formatSexPzhgp,
  summarizeBasketingProtocol,
  validateBasketingProtocol,
  generateBasketingProtocolHtml,
  BasketingProtocol,
} from '../src/domain/basketingProtocol';

describe('Basketing Protocol & Clocking List Generator (Z-057)', () => {
  const sampleProtocol: BasketingProtocol = {
    branchCodeAndName: '0284 Rawicz',
    sectionCodeAndName: '01 Rawicz-Miasto',
    raceNumber: 3,
    raceName: 'Magdeburg 1',
    flightDistanceKm: 345.2,
    basketingDate: '2026-05-23',
    basketingTime: '18:30',
    basketingPoint: 'Punkt Wkładań nr 1 - Dom Hodowcy',
    breederName: 'Jan Kowalski',
    breederCode: '1402',
    loftCoordinates: '51°52\'48.0" N, 17°01\'12.0" E',
    eskSystem: 'Tauris Maxi (Matka: TM-4821)',
    birds: [
      {
        ordinal: 1,
        ringNumber: 'PL-0284-23-1401',
        sex: 'cock',
        color: 'NIEB',
        chipId: 'E14A7089',
        crateNumber: 1,
        isDesignated: true,
        pedigreeNote: 'Syn Olimpijczyka',
      },
      {
        ordinal: 2,
        ringNumber: 'PL-0284-23-1402',
        sex: 'hen',
        color: 'N.NAKR',
        chipId: 'E14A7090',
        crateNumber: 1,
        isDesignated: true,
        pedigreeNote: 'Córka Asa Kat. A',
      },
      {
        ordinal: 3,
        ringNumber: 'PL-0284-24-5511',
        sex: 'cock',
        color: 'CIEM',
        chipId: 'E14A7091',
        crateNumber: 2,
        isDesignated: false,
      },
      {
        ordinal: 4,
        ringNumber: 'PL-0284-24-5512',
        sex: 'hen',
        color: 'PSTR',
        chipId: 'E14A7092',
        crateNumber: 2,
        isDesignated: false,
      },
      {
        ordinal: 5,
        ringNumber: 'DV-0123-22-888',
        sex: 'unknown',
        color: 'PŁOW',
        chipId: '',
        crateNumber: 2,
        isDesignated: false,
      },
    ],
  };

  describe('PZHGP Sex Code Formatting', () => {
    it('correctly maps internal sex enum to official PZHGP sex codes', () => {
      expect(formatSexPzhgp('cock')).toBe('1.0');
      expect(formatSexPzhgp('hen')).toBe('0.1');
      expect(formatSexPzhgp('unknown')).toBe('0.0');
    });
  });

  describe('Protocol Aggregation & Summary', () => {
    it('accurately computes summary metrics for basketed team', () => {
      const summary = summarizeBasketingProtocol(sampleProtocol);

      expect(summary.totalBirds).toBe(5);
      expect(summary.cocksCount).toBe(2);
      expect(summary.hensCount).toBe(2);
      expect(summary.unknownSexCount).toBe(1);
      expect(summary.designatedCount).toBe(2);
      expect(summary.chipsPresentCount).toBe(4);
      expect(summary.chipsMissingCount).toBe(1);
      expect(summary.cratesUsed).toEqual([1, 2]);
      expect(summary.cratesCount).toBe(2);
    });
  });

  describe('Protocol Validation Engine', () => {
    it('detects missing electronic chip and flags warning', () => {
      const val = validateBasketingProtocol(sampleProtocol);

      expect(val.isValid).toBe(true);
      expect(val.missingChips).toContain('DV-0123-22-888');
      expect(val.warnings.length).toBeGreaterThan(0);
      expect(val.errors.length).toBe(0);
    });

    it('rejects protocol with duplicate ring numbers', () => {
      const invalidProtocol: BasketingProtocol = {
        ...sampleProtocol,
        birds: [
          ...sampleProtocol.birds,
          {
            ordinal: 6,
            ringNumber: 'PL-0284-23-1401', // DUPLICATE of bird 1
            sex: 'cock',
            color: 'NIEB',
            chipId: 'E14A9999',
          },
        ],
      };

      const val = validateBasketingProtocol(invalidProtocol);

      expect(val.isValid).toBe(false);
      expect(val.duplicateRings).toContain('PL-0284-23-1401');
      expect(val.errors.some((e) => e.includes('zduplikowane'))).toBe(true);
    });

    it('rejects protocol missing breeder credentials or empty bird list', () => {
      const emptyProtocol: BasketingProtocol = {
        ...sampleProtocol,
        breederName: '',
        breederCode: '',
        birds: [],
      };

      const val = validateBasketingProtocol(emptyProtocol);

      expect(val.isValid).toBe(false);
      expect(val.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('A4 Printable HTML Document Generator', () => {
    it('generates complete official PZHGP basketing protocol HTML document', () => {
      const html = generateBasketingProtocolHtml(sampleProtocol);

      expect(html).toContain('POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH');
      expect(html).toContain('LISTA STARTOWO-ZEGAROWA');
      expect(html).toContain('0284 Rawicz');
      expect(html).toContain('Magdeburg 1');
      expect(html).toContain('Jan Kowalski');
      expect(html).toContain('PL-0284-23-1401');
      expect(html).toContain('1.0');
      expect(html).toContain('0.1');
      expect(html).toContain('RAZEM WKŁADANYCH: <u>5 szt.</u>');
      expect(html).toContain('Przewodniczący Komisji Wkładaniowej');
      expect(html).toContain('Tauris Maxi');
    });
  });
});

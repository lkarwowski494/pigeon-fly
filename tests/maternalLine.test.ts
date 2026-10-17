/**
 * Tests for Pigeon-Fly Maternal Line & Mitochondrial DNA Engine (Z-060)
 */

import {
  traceMaternalLine,
  analyzeMaternalLineage,
  PigeonPedigreeLite,
} from '../src/domain/maternalLine';

describe('Maternal Line & Mitochondrial DNA (mtDNA) Engine (Z-060)', () => {
  const pedigreeDatabase: Record<string, PigeonPedigreeLite> = {
    // Target Hen (Generation 0)
    'PL-0284-24-1001': {
      ringNumber: 'PL-0284-24-1001',
      name: 'Młoda Gwiazda',
      sex: 'hen',
      color: 'NIEB',
      year: 2024,
      motherRingNumber: 'PL-0284-21-402',
    },
    // Mother (Generation 1)
    'PL-0284-21-402': {
      ringNumber: 'PL-0284-21-402',
      name: 'Złota Samica',
      sex: 'hen',
      color: 'N.NAKR',
      year: 2021,
      motherRingNumber: 'BELG-2018-6012',
      raceAchievements: ['1. As Okręgu Kat. A', '3x 1. Konkurs'],
    },
    // Maternal Granddam (Generation 2)
    'BELG-2018-6012': {
      ringNumber: 'BELG-2018-6012',
      name: 'Córka Olimpijki',
      sex: 'hen',
      color: 'CIEM',
      year: 2018,
      motherRingNumber: 'NL-2014-9901',
      raceAchievements: ['2. Nagroda Narodowa Bourges'],
    },
    // Foundation Hen (Generation 3)
    'NL-2014-9901': {
      ringNumber: 'NL-2014-9901',
      name: 'Matka Założycielka Dynastii',
      sex: 'hen',
      color: 'NIEB',
      year: 2014,
      raceAchievements: ['Złoty Medal Olimpiady FCI Kat. Sport'],
    },
  };

  const getPigeon = (ring: string) => pedigreeDatabase[ring];

  describe('Direct Female Line Tracing', () => {
    it('reconstructs complete 3-generation maternal ancestor chain and marks Foundation Hen', () => {
      const target = pedigreeDatabase['PL-0284-24-1001'];
      const ancestors = traceMaternalLine(target, getPigeon);

      expect(ancestors.length).toBe(3);

      expect(ancestors[0].ringNumber).toBe('PL-0284-21-402');
      expect(ancestors[0].relationshipTitle).toContain('Matka');
      expect(ancestors[0].isFoundationHen).toBe(false);

      expect(ancestors[1].ringNumber).toBe('BELG-2018-6012');
      expect(ancestors[1].relationshipTitle).toContain('Babka');
      expect(ancestors[1].isFoundationHen).toBe(false);

      expect(ancestors[2].ringNumber).toBe('NL-2014-9901');
      expect(ancestors[2].relationshipTitle).toContain('Prababka');
      expect(ancestors[2].isFoundationHen).toBe(true); // Oldest in unbroken chain
    });

    it('gracefully handles missing dam record in database', () => {
      const orphanPigeon: PigeonPedigreeLite = {
        ringNumber: 'PL-0284-24-9999',
        sex: 'hen',
        color: 'PSTR',
        year: 2024,
        motherRingNumber: 'UNKNOWN-RING-123',
      };

      const ancestors = traceMaternalLine(orphanPigeon, getPigeon);

      expect(ancestors.length).toBe(1);
      expect(ancestors[0].ringNumber).toBe('UNKNOWN-RING-123');
      expect(ancestors[0].isFoundationHen).toBe(true);
    });
  });

  describe('Mitochondrial DNA (mtDNA) & Aerobic Capacity Analysis', () => {
    it('confirms mtDNA transmission capability for females (hen) with elite score', () => {
      const targetHen = pedigreeDatabase['PL-0284-24-1001'];
      const analysis = analyzeMaternalLineage(targetHen, getPigeon);

      expect(analysis.canTransmitMtDna).toBe(true);
      expect(analysis.transmissionNotice).toContain('100%');
      expect(analysis.depthGenerations).toBe(3);
      expect(analysis.championAncestorCount).toBe(3);
      expect(analysis.foundationHen?.name).toBe('Matka Założycielka Dynastii');

      // 45 pts (depth) + 30 pts (champions) + 10 pts (foundation bonus) = 85 pts -> world_class
      expect(analysis.mitochondrialIntegrityScore).toBeGreaterThanOrEqual(85);
      expect(analysis.aerobicCapacityRating).toBe('world_class');
      expect(analysis.unbrokenChain).toBe(true);
    });

    it('correctly identifies that cocks carry but do NOT transmit maternal mtDNA', () => {
      const targetCock: PigeonPedigreeLite = {
        ringNumber: 'PL-0284-24-2002',
        sex: 'cock',
        color: 'NIEB',
        year: 2024,
        motherRingNumber: 'PL-0284-21-402',
      };

      const analysis = analyzeMaternalLineage(targetCock, getPigeon);

      expect(analysis.canTransmitMtDna).toBe(false);
      expect(analysis.transmissionNotice).toContain('NIE przekaże');
      expect(analysis.breederGuidance.some((g) => g.includes('lotnikiem'))).toBe(true);
    });
  });
});

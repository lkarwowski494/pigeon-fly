/**
 * Tests for Genetics & Wright's Inbreeding Coefficient Engine
 */

import { calculateWrightInbreeding } from '../src/domain/genetics';
import { Pigeon } from '../src/domain/types';

describe('Genetics Engine — Wright Inbreeding Coefficient (F)', () => {
  const pigeons = new Map<string, Pigeon>();

  const createPigeon = (id: string, fatherId?: string, motherId?: string): Pigeon => ({
    id,
    loftId: 'loft-1',
    ringNumber: `RING-${id}`,
    countryCode: 'PL',
    year: 2024,
    sex: 'cock',
    plumageColor: 'Niebieski',
    status: 'racing',
    fatherId: fatherId || null,
    motherId: motherId || null,
    qrCodeUuid: `uuid-${id}`,
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  });

  beforeEach(() => {
    pigeons.clear();
  });

  test('returns F = 0 for unrelated cock and hen', () => {
    // Grandfather & Grandmother unrelated
    pigeons.set('sire1', createPigeon('sire1'));
    pigeons.set('dam1', createPigeon('dam1'));

    const result = calculateWrightInbreeding('sire1', 'dam1', pigeons);
    expect(result.coefficientF).toBe(0.0);
    expect(result.percentage).toBe(0.0);
    expect(result.level).toBe('none');
  });

  test('calculates F = 0.25 (25%) for Parent x Offspring mating (Ojciec x Córka)', () => {
    // Sire 'A'
    pigeons.set('A', createPigeon('A'));
    pigeons.set('B', createPigeon('B')); // unrelated mother
    // Daughter 'C' (father is A)
    pigeons.set('C', createPigeon('C', 'A', 'B'));

    // Mating A (Cock) with C (Hen)
    const result = calculateWrightInbreeding('A', 'C', pigeons);
    expect(result.coefficientF).toBe(0.25);
    expect(result.percentage).toBe(25.0);
    expect(result.level).toBe('high');
  });

  test('calculates F = 0.25 (25%) for Full Siblings mating (Brat x Siostra)', () => {
    // Parents P1 and P2
    pigeons.set('P1', createPigeon('P1'));
    pigeons.set('P2', createPigeon('P2'));

    // Brother S1 and Sister S2 share both P1 and P2
    pigeons.set('S1', createPigeon('S1', 'P1', 'P2'));
    pigeons.set('S2', createPigeon('S2', 'P1', 'P2'));

    const result = calculateWrightInbreeding('S1', 'S2', pigeons);
    // Path through P1: (0.5)^(1 + 1 + 1) = 0.125
    // Path through P2: (0.5)^(1 + 1 + 1) = 0.125
    // Total F = 0.25
    expect(result.coefficientF).toBe(0.25);
    expect(result.percentage).toBe(25.0);
    expect(result.commonAncestorIds).toContain('P1');
    expect(result.commonAncestorIds).toContain('P2');
  });

  test('calculates F = 0.125 (12.5%) for Half Siblings (Półbrat x Półsiostra - wspólny ojciec)', () => {
    // Shared Sire 'A', different dams 'D1' and 'D2'
    pigeons.set('A', createPigeon('A'));
    pigeons.set('D1', createPigeon('D1'));
    pigeons.set('D2', createPigeon('D2'));

    pigeons.set('HS1', createPigeon('HS1', 'A', 'D1'));
    pigeons.set('HS2', createPigeon('HS2', 'A', 'D2'));

    const result = calculateWrightInbreeding('HS1', 'HS2', pigeons);
    // Path through A only: (0.5)^3 = 0.125
    expect(result.coefficientF).toBe(0.125);
    expect(result.percentage).toBe(12.5);
    expect(result.commonAncestorIds).toEqual(['A']);
  });

  test('calculates F = 0.0625 (6.25%) for First Cousins (Kuzyn x Kuzynka)', () => {
    // Common Grandfather 'GF' and Grandmother 'GM'
    pigeons.set('GF', createPigeon('GF'));
    pigeons.set('GM', createPigeon('GM'));

    // Two sibling parents 'P1' and 'P2'
    pigeons.set('P1', createPigeon('P1', 'GF', 'GM'));
    pigeons.set('P2', createPigeon('P2', 'GF', 'GM'));

    // Cousins C1 and C2
    pigeons.set('C1', createPigeon('C1', 'P1', 'other1'));
    pigeons.set('C2', createPigeon('C2', 'P2', 'other2'));

    const result = calculateWrightInbreeding('C1', 'C2', pigeons);
    // Path through GF: n1=2, n2=2 => 0.5^5 = 0.03125
    // Path through GM: n1=2, n2=2 => 0.5^5 = 0.03125
    // Total F = 0.0625 (6.25%)
    expect(result.coefficientF).toBe(0.0625);
    expect(result.percentage).toBe(6.25);
  });
});

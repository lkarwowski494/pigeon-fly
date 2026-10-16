/**
 * Tests for Loft Compartments & Stocking Density Engine (BR-STADO-005)
 */

import {
  calculateCompartmentCapacity,
  evaluateCompartment,
  canAssignPigeonToCompartment,
  movePigeonBetweenCompartments,
  getStandardCompartmentPresets,
  LoftCompartment,
} from '../src/domain/compartments';
import { Pigeon } from '../src/domain/types';

describe('Compartments Engine — Capacity & Stocking Limits', () => {
  test('calculateCompartmentCapacity respects floor area and volume limits', () => {
    // Widowhood Cocks: 7.2 m² area, 16.5 m³ volume
    const cocksCap = calculateCompartmentCapacity(7.2, 16.5, 'cocks');
    expect(cocksCap.recommendedPigeons).toBeGreaterThan(15);
    expect(cocksCap.maxSafePigeons).toBeGreaterThanOrEqual(cocksCap.recommendedPigeons);

    // Breeding compartment: 9.0 m² area, 20.7 m³ volume
    const breedingCap = calculateCompartmentCapacity(9.0, 20.7, 'breeding');
    expect(breedingCap.recommendedPigeons).toBeGreaterThan(15);

    // Quarantine: 3.0 m² area, 7.0 m³ volume
    const quarCap = calculateCompartmentCapacity(3.0, 7.0, 'quarantine');
    expect(quarCap.recommendedPigeons).toBeLessThanOrEqual(6);
  });

  test('evaluates optimal compartment status when within safe limits', () => {
    const compartment: LoftCompartment = {
      id: 'c-1',
      loftId: 'loft-1',
      name: 'Wdowce',
      type: 'cocks',
      floorAreaM2: 7.2,
      volumeM3: 16.5,
      nestBoxCapacity: 16,
      perchCapacity: 20,
      assignedPigeonIds: ['p-01', 'p-02'],
      ventilationRating: 'excellent',
    };

    const pigeons: Pigeon[] = [
      {
        id: 'p-01',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski',
        status: 'racing',
        qrCodeUuid: 'uuid-1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p-02',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-23-1403',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Nakrapiany',
        status: 'racing',
        qrCodeUuid: 'uuid-2',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const stats = evaluateCompartment(compartment, pigeons);

    expect(stats.pigeonCount).toBe(2);
    expect(stats.cocksCount).toBe(2);
    expect(stats.hensCount).toBe(0);
    expect(stats.statusLevel).toBe('optimal');
    expect(stats.isOvercrowded).toBe(false);
    expect(stats.floorAreaPerBirdM2).toBe(3.6);
  });

  test('detects cross-sex contamination in widow cocks compartment', () => {
    const compartment: LoftCompartment = {
      id: 'c-cocks',
      loftId: 'loft-1',
      name: 'Wdowce',
      type: 'cocks',
      floorAreaM2: 7.2,
      volumeM3: 16.5,
      nestBoxCapacity: 16,
      perchCapacity: 20,
      assignedPigeonIds: ['p-01', 'p-hen'],
      ventilationRating: 'excellent',
    };

    const pigeons: Pigeon[] = [
      {
        id: 'p-01',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski',
        status: 'racing',
        qrCodeUuid: 'u1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p-hen',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-23-9999',
        countryCode: 'PL',
        year: 2023,
        sex: 'hen',
        plumageColor: 'Pstra',
        status: 'racing',
        qrCodeUuid: 'u2',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const stats = evaluateCompartment(compartment, pigeons);
    expect(stats.statusLevel).toBe('warning');
    expect(stats.warningMessage).toContain('znajduje się 1 samic');
  });

  test('detects severe overcrowding when birds exceed max safe capacity', () => {
    const smallQuarantine: LoftCompartment = {
      id: 'c-quar',
      loftId: 'loft-1',
      name: 'Mała Izolatka',
      type: 'quarantine',
      floorAreaM2: 1.0,
      volumeM3: 2.2,
      nestBoxCapacity: 1,
      perchCapacity: 2,
      assignedPigeonIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
      ventilationRating: 'poor',
    };

    const pigeons: Pigeon[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id) => ({
      id,
      loftId: 'loft-1',
      ringNumber: `PL-${id}`,
      countryCode: 'PL',
      year: 2024,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: `u-${id}`,
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    }));

    const stats = evaluateCompartment(smallQuarantine, pigeons);
    expect(stats.isOvercrowded).toBe(true);
    expect(stats.statusLevel).toBe('danger');
    expect(stats.warningMessage).toContain('PRZEZAGĘSZCZENIE');
  });
});

describe('Compartments Engine — Assignment & Transfers', () => {
  const presets = getStandardCompartmentPresets('loft-01');
  const cocksComp = presets.find((c) => c.type === 'cocks')!;
  const hensComp = presets.find((c) => c.type === 'hens')!;
  const youngstersComp = presets.find((c) => c.type === 'youngsters')!;

  test('canAssignPigeonToCompartment forbids hen in widow cocks and cock in widow hens', () => {
    const cock: Pigeon = {
      id: 'p-samiec',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-23-1111',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'u-c',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    const hen: Pigeon = {
      id: 'p-samica',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-23-2222',
      countryCode: 'PL',
      year: 2023,
      sex: 'hen',
      plumageColor: 'Płowa',
      status: 'racing',
      qrCodeUuid: 'u-h',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    // Hen in cocks section -> rejected
    const henInCocks = canAssignPigeonToCompartment(cocksComp, hen);
    expect(henInCocks.allowed).toBe(false);
    expect(henInCocks.reason).toContain('Wdowców');

    // Cock in hens section -> rejected
    const cockInHens = canAssignPigeonToCompartment(hensComp, cock);
    expect(cockInHens.allowed).toBe(false);
    expect(cockInHens.reason).toContain('Wdówek');

    // Cock in cocks section -> allowed
    const cockInCocks = canAssignPigeonToCompartment(cocksComp, cock);
    expect(cockInCocks.allowed).toBe(true);
  });

  test('forbids old adult pigeon in youngsters compartment', () => {
    const oldBird: Pigeon = {
      id: 'p-old',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-18-0001',
      countryCode: 'PL',
      year: 2018,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'u-old',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    const check = canAssignPigeonToCompartment(youngstersComp, oldBird);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('ptakiem dorosłym');
  });

  test('movePigeonBetweenCompartments transfers pigeon without duplications', () => {
    const updated = movePigeonBetweenCompartments(
      'p-01',
      cocksComp.id,
      youngstersComp.id,
      presets
    );

    const fromAfter = updated.find((c) => c.id === cocksComp.id)!;
    const toAfter = updated.find((c) => c.id === youngstersComp.id)!;

    expect(fromAfter.assignedPigeonIds).not.toContain('p-01');
    expect(toAfter.assignedPigeonIds).toContain('p-01');
  });
});

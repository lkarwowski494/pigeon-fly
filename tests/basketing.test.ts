/**
 * Tests for Basketing Session & Race Entry Engine (src/domain/basketing.ts)
 */

import {
  validateBasketingEntry,
  toggleSeriesDesignation,
  calculateBasketingSummary,
  BasketEntry,
} from '../src/domain/basketing';

describe('Basketing Engine — Validation & Duplicates', () => {
  const currentBasket: BasketEntry[] = [
    {
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      isDesignatedSeries: true,
      basketingOrder: 1,
    },
  ];

  test('validates valid new pigeon entry', () => {
    const newEntry: BasketEntry = {
      pigeonId: 'p-02',
      ringNumber: 'PL-0284-22-9854',
      countryCode: 'PL',
      year: 2022,
      sex: 'hen',
      plumageColor: 'Pstra',
      isDesignatedSeries: false,
      basketingOrder: 2,
    };

    const res = validateBasketingEntry(newEntry, currentBasket);
    expect(res.isValid).toBe(true);
  });

  test('prevents double-basketing of same ring number', () => {
    const duplicateEntry: BasketEntry = {
      pigeonId: 'p-99',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      isDesignatedSeries: false,
      basketingOrder: 2,
    };

    const res = validateBasketingEntry(duplicateEntry, currentBasket);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('został już włożony');
  });

  test('rejects empty ring number', () => {
    const emptyRing: BasketEntry = {
      pigeonId: 'p-03',
      ringNumber: '  ',
      countryCode: 'PL',
      year: 2024,
      sex: 'cock',
      plumageColor: 'Niebieski',
      isDesignatedSeries: false,
      basketingOrder: 2,
    };

    const res = validateBasketingEntry(emptyRing, currentBasket);
    expect(res.isValid).toBe(false);
  });
});

describe('Basketing Engine — Championship Series Designation (Typka T)', () => {
  const basket: BasketEntry[] = [
    { pigeonId: 'p-1', ringNumber: 'R-1', countryCode: 'PL', year: 2023, sex: 'cock', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 1 },
    { pigeonId: 'p-2', ringNumber: 'R-2', countryCode: 'PL', year: 2023, sex: 'hen', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 2 },
    { pigeonId: 'p-3', ringNumber: 'R-3', countryCode: 'PL', year: 2023, sex: 'cock', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 3 },
    { pigeonId: 'p-4', ringNumber: 'R-4', countryCode: 'PL', year: 2023, sex: 'hen', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 4 },
    { pigeonId: 'p-5', ringNumber: 'R-5', countryCode: 'PL', year: 2023, sex: 'cock', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 5 },
    { pigeonId: 'p-6', ringNumber: 'R-6', countryCode: 'PL', year: 2023, sex: 'hen', plumageColor: 'N', isDesignatedSeries: false, basketingOrder: 6 },
  ];

  test('toggles series off successfully', () => {
    const res = toggleSeriesDesignation('p-1', basket, 5);
    expect(res.success).toBe(true);
    expect(res.updatedBasket.find((b) => b.pigeonId === 'p-1')?.isDesignatedSeries).toBe(false);
  });

  test('blocks designating more than maximum quota (5 birds)', () => {
    const res = toggleSeriesDesignation('p-6', basket, 5);
    expect(res.success).toBe(false);
    expect(res.message).toContain('maksymalny limit');
  });
});

describe('Basketing Engine — Manifest Summary', () => {
  test('computes cocks/hens count, crates used, and average age correctly', () => {
    const entries: BasketEntry[] = [
      { pigeonId: 'p-1', ringNumber: 'R-1', countryCode: 'PL', year: 2023, sex: 'cock', plumageColor: 'N', isDesignatedSeries: true, basketingOrder: 1 },
      { pigeonId: 'p-2', ringNumber: 'R-2', countryCode: 'PL', year: 2021, sex: 'hen', plumageColor: 'N', isDesignatedSeries: false, basketingOrder: 2 },
      { pigeonId: 'p-3', ringNumber: 'R-3', countryCode: 'PL', year: 2024, sex: 'cock', plumageColor: 'N', isDesignatedSeries: false, basketingOrder: 3 },
    ];

    const summary = calculateBasketingSummary(entries, 2026);

    expect(summary.totalBasketed).toBe(3);
    expect(summary.cocksCount).toBe(2);
    expect(summary.hensCount).toBe(1);
    expect(summary.designatedSeriesCount).toBe(1);
    expect(summary.cratesUsed).toBe(1);
    // Ages in 2026: 3, 5, 2 -> sum = 10 / 3 = 3.3
    expect(summary.averageAgeYears).toBe(3.3);
  });
});

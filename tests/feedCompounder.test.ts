/**
 * Unit Tests for Feed Compounder and Biochemical Nutrition Engine (BR-ZDR-006)
 */

import {
  calculateMixNutrients,
  validateMixTotalPercent,
  evaluateMixSuitability,
  GRAIN_DATABASE,
  MASTER_FEED_PRESETS,
} from '../src/domain/feedCompounder';

describe('Feed Compounder & Biochemical Nutrition Engine', () => {
  test('verifies that grain database contains all 20 essential grains', () => {
    const grainKeys = Object.keys(GRAIN_DATABASE);
    expect(grainKeys.length).toBe(20);
    expect(GRAIN_DATABASE['corn_criollo']).toBeDefined();
    expect(GRAIN_DATABASE['hemp']).toBeDefined();
    expect(GRAIN_DATABASE['soy_toasted']).toBeDefined();
    expect(GRAIN_DATABASE['paddy_rice']).toBeDefined();
  });

  test('calculates correct nutrients for a balanced racing mix', () => {
    const mix = [
      { grainId: 'corn_criollo', percentage: 50 },
      { grainId: 'peas_yellow', percentage: 50 },
    ];

    const nutrients = calculateMixNutrients(mix);
    // Corn protein 9.5, peas protein 22.5 -> average = (9.5 + 22.5) / 2 = 16.0
    expect(nutrients.proteinPct).toBe(16.0);
    expect(nutrients.fatPct).toBeCloseTo(2.8, 1);
    expect(nutrients.energyMjKg).toBeCloseTo(12.65, 1);
  });

  test('validates 100% total sum of mix ingredients', () => {
    const validMix = [
      { grainId: 'corn_criollo', percentage: 40 },
      { grainId: 'dari', percentage: 30 },
      { grainId: 'kardi', percentage: 30 },
    ];
    const invalidMix = [
      { grainId: 'corn_criollo', percentage: 40 },
      { grainId: 'dari', percentage: 30 },
    ];

    expect(validateMixTotalPercent(validMix).isValid).toBe(true);
    expect(validateMixTotalPercent(invalidMix).isValid).toBe(false);
    expect(validateMixTotalPercent(invalidMix).totalPercent).toBe(70);
  });

  test('evaluates marathon fat loading mix suitability', () => {
    const marathonPreset = MASTER_FEED_PRESETS.find((p) => p.name.includes('Maraton'))!;
    const nutrients = calculateMixNutrients(marathonPreset.ingredients);
    const suitability = evaluateMixSuitability(nutrients, 'racing_marathon');

    expect(nutrients.fatPct).toBeGreaterThan(12);
    expect(suitability.score).toBeGreaterThanOrEqual(90);
    expect(suitability.verdict).toContain('Rewelacyjne ładowanie tłuszczowe');
  });

  test('evaluates breeding mix suitability', () => {
    const breedingPreset = MASTER_FEED_PRESETS.find((p) => p.name.includes('Wychów'))!;
    const nutrients = calculateMixNutrients(breedingPreset.ingredients);
    const suitability = evaluateMixSuitability(nutrients, 'breeding_rearing');

    expect(nutrients.proteinPct).toBeGreaterThanOrEqual(16);
    expect(suitability.score).toBeGreaterThanOrEqual(90);
    expect(suitability.verdict).toContain('mieszanka lęgowa');
  });

  test('evaluates depurative diet suitability', () => {
    const depurativePreset = MASTER_FEED_PRESETS.find((p) => p.name.includes('Depuratywna'))!;
    const nutrients = calculateMixNutrients(depurativePreset.ingredients);
    const suitability = evaluateMixSuitability(nutrients, 'depurative');

    expect(nutrients.proteinPct).toBeLessThanOrEqual(12);
    expect(suitability.score).toBeGreaterThanOrEqual(90);
    expect(suitability.verdict).toContain('oczyszczająca');
  });
});

/**
 * Tests for Drinker pH, Rehydration Osmolarity & Carbo-Lipid Shift (RD-15, RD-16, RD-17, RD-18)
 */

import {
  calculateDrinkerPh,
  calculateRehydrationOsmolarity,
  calculateCarboLipidShift,
  getStandardRehydrationPreset,
} from '../src/domain/drinkerLab';

describe('Drinker pH & Acidification Engine (RD-17)', () => {
  test('5 ml apple cider vinegar acidifies tap water to safe anti-trichomoniasis range (pH ~4.3)', () => {
    const result = calculateDrinkerPh(7.4, 'apple_cider_vinegar', 5.0);

    expect(result.finalPh).toBeGreaterThanOrEqual(4.1);
    expect(result.finalPh).toBeLessThanOrEqual(4.5);
    expect(result.status).toBe('optimal');
    expect(result.isSterilizingSafe).toBe(true);
    expect(result.trichomonasSurvivalTimeText).toContain('< 15 minut');
  });

  test('unacidified water (pH 7.4) is ineffective and allows trichomonas survival >48h', () => {
    const result = calculateDrinkerPh(7.4, 'none', 0);

    expect(result.finalPh).toBe(7.4);
    expect(result.status).toBe('ineffective');
    expect(result.isSterilizingSafe).toBe(false);
    expect(result.trichomonasSurvivalTimeText).toContain('> 48 godzin');
  });

  test('excessive acidification (e.g. 15 ml vinegar) flags danger of mucous irritation (pH < 4.0)', () => {
    const result = calculateDrinkerPh(7.4, 'apple_cider_vinegar', 15.0);

    expect(result.finalPh).toBeLessThan(4.0);
    expect(result.status).toBe('too_acidic');
    expect(result.isSterilizingSafe).toBe(false);
    expect(result.recommendation.toLowerCase()).toContain('zbyt kwaśna');
  });
});

describe('Post-Flight Rehydration Osmolarity Engine (RD-18)', () => {
  test('standard master electrolyte preset is isotonic (285 - 315 mOsm/L)', () => {
    const preset = getStandardRehydrationPreset(1.0);
    const evaluation = calculateRehydrationOsmolarity(preset);

    expect(evaluation.osmolarityMOsmPerLiter).toBeGreaterThanOrEqual(280);
    expect(evaluation.osmolarityMOsmPerLiter).toBeLessThanOrEqual(325);
    expect(evaluation.tonicCategory).toBe('isotonic');
    expect(evaluation.safetyRating).toBe('safe_optimal');
    expect(evaluation.cellularAbsorptionRateText).toContain('Maksymalne tempo');
  });

  test('excessive sugars/salts triggers hypertonic danger warning (>330 mOsm/L)', () => {
    const dangerousRecipe = {
      waterLiters: 1.0,
      glucoseGrams: 60.0, // excessive honey or glucose
      saltNaclGrams: 8.0,
      potassiumKclGrams: 4.0,
      sodiumCitrateGrams: 4.0,
      magnesiumGrams: 2.0,
    };

    const evaluation = calculateRehydrationOsmolarity(dangerousRecipe);

    expect(evaluation.osmolarityMOsmPerLiter).toBeGreaterThan(340);
    expect(evaluation.tonicCategory).toBe('hypertonic');
    expect(evaluation.safetyRating).toBe('danger_hypertonic_shock');
    expect(evaluation.cellularAbsorptionRateText).toContain('Odciąganie wody');
  });

  test('dilute solution evaluates as safe hypotonic', () => {
    const diluteRecipe = {
      waterLiters: 2.0,
      glucoseGrams: 10.0,
      saltNaclGrams: 1.0,
      potassiumKclGrams: 0.5,
      sodiumCitrateGrams: 0.5,
      magnesiumGrams: 0.2,
    };

    const evaluation = calculateRehydrationOsmolarity(diluteRecipe);

    expect(evaluation.osmolarityMOsmPerLiter).toBeLessThan(270);
    expect(evaluation.tonicCategory).toBe('hypotonic');
    expect(evaluation.safetyRating).toBe('safe_mild_hypotonic');
  });
});

describe('Carbo-Lipid Shift & L-Carnitine Loading (RD-15, RD-16)', () => {
  test('calculates dietary fat percentage scaling with distance', () => {
    // 150 km race: 4.0 + (150/150)*1.8 = 5.8%
    const sprint = calculateCarboLipidShift(150);
    expect(sprint.recommendedFatPercent).toBe(5.8);
    expect(sprint.carnitineDosageMgPerLiter).toBe(0);

    // 300 km race: 4.0 + (300/150)*1.8 = 7.6%
    const middle = calculateCarboLipidShift(300);
    expect(middle.recommendedFatPercent).toBe(7.6);
    expect(middle.carnitineDosageMgPerLiter).toBe(500);

    // 650 km marathon: 4.0 + (650/150)*1.8 = 11.8% -> capped at 11.5%
    const marathon = calculateCarboLipidShift(650);
    expect(marathon.recommendedFatPercent).toBe(11.5);
    expect(marathon.carnitineDosageMgPerLiter).toBe(1000);
    expect(marathon.recommendedGrains).toContain('Orzeszki ziemne łuskane');
  });
});

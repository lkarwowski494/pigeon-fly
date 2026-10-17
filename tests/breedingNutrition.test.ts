import {
  calculateRationNutrition,
  validateBreedingDiet,
  calculateFeederDemand,
  generateBreedingNutritionPdfHtml,
  PREDEFINED_BREEDING_RATIONS,
  BREEDING_GRAINS_DB,
  RationIngredient,
} from '../src/domain/breedingNutrition';

describe('BreedingNutrition Domain (Z-074)', () => {
  test('calculates correct nutrients for Super Protein 19% predefined ration', () => {
    const ration = PREDEFINED_BREEDING_RATIONS.find((r) => r.id === 'ration-super-protein-19')!;
    expect(ration).toBeDefined();

    const nutrients = calculateRationNutrition(ration.ingredients);

    expect(nutrients.crudeProteinPct).toBeGreaterThanOrEqual(18.5);
    expect(nutrients.crudeFatPct).toBeGreaterThanOrEqual(5.0);
    expect(nutrients.lysinePct).toBeGreaterThanOrEqual(0.95);
    expect(nutrients.methioninePct).toBeGreaterThanOrEqual(0.25);
    expect(nutrients.metabolizableEnergyKcalKg).toBeGreaterThan(2900);
  });

  test('calculates pure grain values correctly for single ingredient', () => {
    const singleIngredient: RationIngredient[] = [{ grainId: 'wyka', percentage: 100 }];
    const nutrients = calculateRationNutrition(singleIngredient);

    const wykaProfile = BREEDING_GRAINS_DB['wyka'];
    expect(nutrients.crudeProteinPct).toBe(wykaProfile.crudeProteinPct);
    expect(nutrients.crudeFatPct).toBe(wykaProfile.crudeFatPct);
    expect(nutrients.lysinePct).toBe(wykaProfile.lysinePct);
    expect(nutrients.methioninePct).toBe(wykaProfile.methioninePct);
  });

  test('validates optimal diet during CROP_MILK phase with >= 18% protein', () => {
    const ration = PREDEFINED_BREEDING_RATIONS[0];
    const nutrients = calculateRationNutrition(ration.ingredients);
    const validation = validateBreedingDiet(nutrients, 'CROP_MILK');

    expect(validation.isOptimal).toBe(true);
    expect(validation.score).toBe(100);
    expect(validation.alerts.length).toBe(0);
    expect(validation.adviceList.some((a) => a.includes('grubej kukurydzy'))).toBe(true);
  });

  test('flags critical alert when crude protein is < 18% in CROP_MILK phase', () => {
    // Low protein diet: 80% corn + 20% wheat
    const poorMix: RationIngredient[] = [
      { grainId: 'kukurydza_drobna', percentage: 80 },
      { grainId: 'pszenica', percentage: 20 },
    ];
    const nutrients = calculateRationNutrition(poorMix);
    const validation = validateBreedingDiet(nutrients, 'CROP_MILK');

    expect(validation.isOptimal).toBe(false);
    expect(validation.score).toBeLessThan(80);
    expect(validation.alerts.some((a) => a.nutrient.includes('Białko'))).toBe(true);
  });

  test('flags alerts for lysine and methionine deficit during FEATHERING_GROWTH phase', () => {
    // Mix lacking legumes and oilseeds: 70% wheat, 30% barley
    const deficientMix: RationIngredient[] = [
      { grainId: 'pszenica', percentage: 70 },
      { grainId: 'dari', percentage: 30 },
    ];
    const nutrients = calculateRationNutrition(deficientMix);
    const validation = validateBreedingDiet(nutrients, 'FEATHERING_GROWTH');

    expect(validation.isOptimal).toBe(false);
    expect(validation.alerts.some((a) => a.nutrient.includes('Lizyna'))).toBe(true);
    expect(validation.alerts.some((a) => a.nutrient.includes('Metionina'))).toBe(true);
  });

  test('calculates feeder demand for baseline pair without squabs (Egg formation)', () => {
    const demand = calculateFeederDemand({
      numPairs: 10,
      numSquabs: 0,
      phase: 'EGG_FORMATION',
    });

    expect(demand.dailyFeedPerPairGrams).toBe(85);
    expect(demand.totalDailyFeedGrams).toBe(850);
    expect(demand.totalDailyFeedKg).toBe(0.9);
    expect(demand.dailyWaterPerPairMl).toBeGreaterThanOrEqual(180);
    expect(demand.dailyGritTotalGrams).toBe(60);
    expect(demand.specialSupplements.some((s) => s.includes('Grit wapniowy'))).toBe(true);
  });

  test('calculates feeder demand surge for 15 pairs rearing 28 squabs (Day 16)', () => {
    const demand = calculateFeederDemand({
      numPairs: 15,
      numSquabs: 28,
      squabsAgeDays: 16,
      phase: 'FEATHERING_GROWTH',
    });

    // 85 + (28/15 * 28g) = ~137g per pair/day
    expect(demand.dailyFeedPerPairGrams).toBeGreaterThan(130);
    expect(demand.totalDailyFeedKg).toBeGreaterThan(2.0);
    expect(demand.feedFrequencyTimesPerDay).toBe(2);
    expect(demand.totalDailyWaterLiters).toBeGreaterThan(4.0);
  });

  test('generateBreedingNutritionPdfHtml produces valid printable report', () => {
    const ration = PREDEFINED_BREEDING_RATIONS[0];
    const nutrients = calculateRationNutrition(ration.ingredients);
    const validation = validateBreedingDiet(nutrients, 'CROP_MILK');
    const demand = calculateFeederDemand({
      numPairs: 12,
      numSquabs: 22,
      squabsAgeDays: 4,
      phase: 'CROP_MILK',
    });

    const html = generateBreedingNutritionPdfHtml({
      rationName: ration.name,
      nutrients,
      validation,
      demand,
      loftName: 'Gołębnik Mistrza Polski',
      seasonYear: 2026,
    });

    expect(html).toContain('ASYSTENT ŻYWIENIOWY FAZY LĘGOWEJ');
    expect(html).toContain('Gołębnik Mistrza Polski');
    expect(html).toContain('Mieszanka Lęgowa Super Protein');
    expect(html).toContain('Zapotrzebowanie Karmnika (12 par + 22 młódków)');
    expect(html).toContain(`${nutrients.crudeProteinPct}%`);
  });
});

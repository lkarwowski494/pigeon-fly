import {
  calculateCarboLipidPlan,
  generateCarboLipidPlanHtml,
} from '../src/domain/carboLipidSupercompensation';

describe('carboLipidSupercompensation (Z-083 / DEC-97)', () => {
  it('calculates moderate race conditions correctly', () => {
    const plan = calculateCarboLipidPlan({
      raceDistanceKm: 350,
      predictedSpeedMPerMin: 1200,
      ambientTempC: 20,
      headwindKmh: 0,
    });

    expect(plan.raceDistanceKm).toBe(350);
    expect(plan.estimatedFlightHours).toBe(4.9);
    expect(plan.fatCombustionRateGramsPerHour).toBe(2.8);
    expect(plan.totalFatRequirementPerBirdGrams).toBe(13.7);
    expect(plan.flightIntensityCategory).toBe('moderate');
    expect(plan.fourDaySchedule).toHaveLength(4);
    expect(plan.keyTacticalGuidelines.length).toBeGreaterThanOrEqual(3);
  });

  it('calculates demanding long-distance race with wind and heat adjustments', () => {
    const plan = calculateCarboLipidPlan({
      raceDistanceKm: 550,
      predictedSpeedMPerMin: 1100,
      ambientTempC: 29, // +0.5 g/h
      headwindKmh: 15, // +0.4 g/h
    });

    expect(plan.raceDistanceKm).toBe(550);
    expect(plan.estimatedFlightHours).toBe(8.3);
    expect(plan.fatCombustionRateGramsPerHour).toBe(3.7);
    expect(plan.totalFatRequirementPerBirdGrams).toBe(30.7);
    expect(plan.flightIntensityCategory).toBe('demanding');
    expect(plan.totalEnergyExpenditureKcal).toBeGreaterThan(300);
  });

  it('classifies 750+ km marathon as extreme_marathon with peak lipid requirement', () => {
    const plan = calculateCarboLipidPlan({
      raceDistanceKm: 780,
      predictedSpeedMPerMin: 1000,
      ambientTempC: 30, // +0.5 g/h
      headwindKmh: 22, // +0.8 g/h
    });

    expect(plan.raceDistanceKm).toBe(780);
    expect(plan.estimatedFlightHours).toBe(13.0);
    expect(plan.fatCombustionRateGramsPerHour).toBe(4.1);
    expect(plan.totalFatRequirementPerBirdGrams).toBe(53.3);
    expect(plan.flightIntensityCategory).toBe('extreme_marathon');
  });

  it('validates 4-day supercompensation schedule progression (D-4 to D-1)', () => {
    const plan = calculateCarboLipidPlan({
      raceDistanceKm: 740,
      predictedSpeedMPerMin: 1150,
      ambientTempC: 24,
    });

    const [d4, d3, d2, d1] = plan.fourDaySchedule;

    // D-4: Carbohydrate loading (65% carbo, 8% fat)
    expect(d4.recommendedCarboPercent).toBe(65);
    expect(d4.recommendedFatPercent).toBe(8);

    // D-3: Lipid induction I (14% fat)
    expect(d3.recommendedFatPercent).toBe(14);
    expect(d3.drinkerAdditives.some((a) => a.includes('L-Karnityna'))).toBe(true);

    // D-2: Peak lipid loading II (20% fat, peanuts/sheep fat)
    expect(d2.recommendedFatPercent).toBe(20);
    expect(d2.grainsRecommendation.some((g) => g.toLowerCase().includes('orzeszki'))).toBe(true);

    // D-1: Basketing day readiness (light fat/carbo, digestible)
    expect(d1.recommendedFatPercent).toBe(16);
    expect(d1.grainsRecommendation.some((g) => g.toLowerCase().includes('zakaz'))).toBe(true);
  });

  it('generates valid print-ready HTML report', () => {
    const plan = calculateCarboLipidPlan({
      raceDistanceKm: 720,
      predictedSpeedMPerMin: 1100,
      ambientTempC: 25,
      headwindKmh: 10,
    });

    const html = generateCarboLipidPlanHtml(plan, {
      loftName: 'Mistrzowski Gołębnik PL-0123',
      raceName: 'Maraton Bruksela PZHGP',
      seasonYear: 2026,
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Superkompensacja Metaboliczna Przed Lotem');
    expect(html).toContain('Mistrzowski Gołębnik PL-0123');
    expect(html).toContain('Maraton Bruksela PZHGP');
    expect(html).toContain('D-4 (Wtorek)');
    expect(html).toContain('D-2 (Czwartek)');
  });
});

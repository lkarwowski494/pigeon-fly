import { calculateLoftCosts, LoftCostInputs } from '../src/domain/costCalculator';

describe('Loft Husbandry Cost Calculator', () => {
  const standardLoft: LoftCostInputs = {
    flockSize: 60,
    feedBagPrice: 85, // 85 PLN per 25kg
    feedBagWeightKg: 25,
    dailyGramsPerBird: 32,
    monthlySupplementsCost: 120, // minerals, grit, vitamins, acids
    annualVeterinaryCost: 600, // PMV-1, deworming, lab tests
    raceBasketingFeePerBird: 5,
    numberOfRacesPerSeason: 14,
    racingTeamSize: 35,
  };

  it('accurately calculates daily, monthly and annual grain consumption', () => {
    const res = calculateLoftCosts(standardLoft);

    // 60 birds * 32g = 1920g = 1.92 kg daily
    expect(res.dailyFlockGrainKg).toBe(1.92);

    // Monthly: 1.92 * 30.5 = 58.56 ~ 58.6 kg
    expect(res.monthlyFlockGrainKg).toBe(58.6);

    // Bags: 58.6 / 25 = 2.34 -> 3 bags monthly
    expect(res.monthlyFeedBags).toBe(3);

    // Annual kg: 1.92 * 365 = 700.8 -> 701 kg
    expect(res.annualFlockGrainKg).toBe(701);
    expect(res.annualFeedBags).toBe(29);
  });

  it('computes feed costs correctly based on bag price', () => {
    const res = calculateLoftCosts(standardLoft);

    // Price per kg = 85 / 25 = 3.4 PLN/kg
    // Monthly feed: 58.56 * 3.4 = 199.10 PLN
    expect(res.monthlyFeedCost).toBeCloseTo(199.1, 1);

    // Annual feed: 700.8 * 3.4 = 2382.72 PLN
    expect(res.annualFeedCost).toBeCloseTo(2382.72, 1);
  });

  it('aggregates annual costs including race basketing and supplements', () => {
    const res = calculateLoftCosts(standardLoft);

    // Basketing: 35 birds * 5 PLN * 14 races = 2450 PLN
    expect(res.annualRaceBasketingCost).toBe(2450);
    expect(res.costPerRaceWeekend).toBe(175); // 35 * 5

    // Annual supplements: 120 * 12 = 1440 PLN
    expect(res.annualSupplementsCost).toBe(1440);

    // Annual Vet: 600 PLN
    expect(res.annualVeterinaryCost).toBe(600);

    // Total: 2382.72 + 1440 + 600 + 2450 = 6872.72 PLN
    expect(res.totalAnnualLoftCost).toBeCloseTo(6872.72, 1);

    // Per bird per year: 6872.72 / 60 = ~114.55 PLN/year
    expect(res.costPerBirdPerYear).toBeCloseTo(114.55, 1);

    // Per bird per month: ~9.55 PLN/month
    expect(res.costPerBirdPerMonth).toBeCloseTo(9.55, 1);
  });

  it('handles small backyard flock safely (10 birds, zero racing)', () => {
    const smallLoft: LoftCostInputs = {
      flockSize: 10,
      feedBagPrice: 70,
      monthlySupplementsCost: 20,
      annualVeterinaryCost: 100,
      numberOfRacesPerSeason: 0,
      racingTeamSize: 0,
    };

    const res = calculateLoftCosts(smallLoft);
    expect(res.dailyFlockGrainKg).toBe(0.32);
    expect(res.annualRaceBasketingCost).toBe(0);
    expect(res.totalAnnualLoftCost).toBeGreaterThan(0);
  });
});

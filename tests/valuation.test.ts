/**
 * Test Suite: Commercial Market Valuation Engine (Z-048)
 * Objective market value appraisal for racing and breeding pigeons (PLN / EUR).
 */

import {
  calculateMarketValuation,
  PigeonValuationInput,
  PLN_TO_EUR_EXCHANGE_RATE,
} from '../src/domain/valuation';

describe('Commercial Market Valuation Engine (Z-048)', () => {
  it('evaluates young unraced bird with ordinary bloodline as club level tier', () => {
    const input: PigeonValuationInput = {
      ringNumber: 'PL-0284-26-101',
      role: 'youngster',
      totalPrizes: 0,
      bloodlineTier: 'ordinary',
    };

    const valuation = calculateMarketValuation(input);
    expect(valuation.tier).toBe('club_level');
    expect(valuation.estimatedValuePln.median).toBe(200);
    expect(valuation.estimatedValueEur.median).toBe(Math.round(200 / PLN_TO_EUR_EXCHANGE_RATE));
    expect(valuation.auctionRecommendation.recommendedPlatform).toBe('local_section');
    expect(valuation.auctionRecommendation.startingBidPln).toBeLessThan(valuation.estimatedValuePln.median);
  });

  it('correctly appraises regional ace with solid prizes and top 100 finishes', () => {
    const input: PigeonValuationInput = {
      ringNumber: 'PL-0284-23-1402',
      role: 'racer',
      totalPrizes: 8,
      top100Prizes: 3,
      firstPrizes: 0,
      podiumPrizes: 1,
      bloodlineTier: 'regional_winner',
      conformationScoreFci: 92.5,
    };

    const valuation = calculateMarketValuation(input);
    expect(valuation.tier).toBe('regional_ace');
    expect(valuation.estimatedValuePln.median).toBeGreaterThan(1000);
    expect(valuation.estimatedValuePln.median).toBeLessThan(3000);
    expect(valuation.auctionRecommendation.recommendedPlatform).toBe('national_auction');
    expect(valuation.breakdown.some((b) => b.category.includes('Dorobek'))).toBe(true);
    expect(valuation.breakdown.some((b) => b.category.includes('Premia rodowodowa'))).toBe(true);
  });

  it('elevates 1st-prize winner with national bloodline to national elite tier', () => {
    const input: PigeonValuationInput = {
      ringNumber: 'PL-0284-22-9011',
      role: 'racer',
      totalPrizes: 9,
      top100Prizes: 4,
      firstPrizes: 1,
      podiumPrizes: 2,
      bestFciCoefficient: 22.5,
      bloodlineTier: 'national_ace_bloodline',
      inbreedingCoefficient: 6.25,
      conformationScoreFci: 92.2,
    };

    const valuation = calculateMarketValuation(input);
    expect(valuation.tier).toBe('national_elite');
    expect(valuation.estimatedValuePln.median).toBeGreaterThanOrEqual(2500);
    expect(valuation.estimatedValuePln.median).toBeLessThan(10000);
    expect(valuation.estimatedValueEur.median).toBeGreaterThan(500);
    expect(valuation.auctionRecommendation.buyNowPln).toBeDefined();
    expect(valuation.auctionRecommendation.buyNowPln!).toBeGreaterThan(valuation.estimatedValuePln.median);
  });

  it('recognizes international / olympic tier for pigeons with supreme prizes and dynasty pedigree', () => {
    const input: PigeonValuationInput = {
      ringNumber: 'PL-0284-21-505',
      role: 'breeder',
      totalPrizes: 18,
      top100Prizes: 12,
      firstPrizes: 4,
      bestFciCoefficient: 5.2,
      olympicOrNationalTitles: ['1. As Polski Kat. Sport A (Olimpiada)', 'Złoty Medalista'],
      bloodlineTier: 'olympic_dynasty',
      provenChildrenPrizes: 16,
      conformationScoreFci: 94.2,
    };

    const valuation = calculateMarketValuation(input);
    expect(valuation.tier).toBe('olympic_international');
    expect(valuation.estimatedValuePln.median).toBeGreaterThanOrEqual(10000);
    expect(valuation.auctionRecommendation.recommendedPlatform).toBe('international_pipa_herbots');
    expect(valuation.valuationSummary).toContain('Klasa Międzynarodowa');
  });

  it('applies inbreeding consolidation bonus for moderate F and penalizes extreme inbreeding in racers', () => {
    // Moderate inbreeding in breeder
    const breederWithOptimalInbred = calculateMarketValuation({
      ringNumber: 'PL-0284-24-301',
      role: 'breeder',
      totalPrizes: 5,
      bloodlineTier: 'regional_winner',
      inbreedingCoefficient: 6.25,
    });

    const breederOutcross = calculateMarketValuation({
      ringNumber: 'PL-0284-24-302',
      role: 'breeder',
      totalPrizes: 5,
      bloodlineTier: 'regional_winner',
      inbreedingCoefficient: 0,
    });

    expect(breederWithOptimalInbred.estimatedValuePln.median).toBeGreaterThan(
      breederOutcross.estimatedValuePln.median
    );

    // Extreme inbreeding in racer (>25%)
    const extremeInbredRacer = calculateMarketValuation({
      ringNumber: 'PL-0284-24-303',
      role: 'racer',
      totalPrizes: 6,
      bloodlineTier: 'ordinary',
      inbreedingCoefficient: 28.0,
    });

    expect(extremeInbredRacer.breakdown.some((b) => b.category.includes('Ryzyko lotowe'))).toBe(true);
  });
});

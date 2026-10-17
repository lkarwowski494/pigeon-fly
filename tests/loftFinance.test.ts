/**
 * Tests for Pigeon-Fly Breeding Loft Finance & Cost Assistant (Z-056)
 */

import {
  calculateChickRearingCost,
  calculateRacerSeasonCost,
  calculateSeasonFinancialSummary,
  ExpenseEntry,
  RevenueEntry,
} from '../src/domain/loftFinance';

describe('Breeding Loft Finance & Cost Assistant (Z-056)', () => {
  describe('Youngster Rearing Unit Cost Engine', () => {
    it('accurately computes rearing cost for 10 breeding pairs yielding 35 youngsters', () => {
      const result = calculateChickRearingCost({
        breedingPairCount: 10,
        youngstersWeanedCount: 35,
        breedingSeasonDays: 90,
        dailyFeedGramsPerPair: 85,
        feedPricePerKg: 4.2,
        supplementsTotalCost: 200,
        ringFeePerBird: 4.5,
        pmvVaccineCostPerBird: 6.0,
        additionalSuppliesCost: 70,
      });

      // 10 pairs * 0.085 kg * 90 days = 76.5 kg of feed
      expect(result.totalFeedKg).toBe(76.5);
      // 76.5 kg * 4.20 = 321.30 PLN
      expect(result.totalFeedCost).toBe(321.3);
      // Rings: 35 * 4.50 = 157.50 PLN
      expect(result.totalRingAndAdminCost).toBe(157.5);
      // Health: 35 * 6.00 = 210.00 PLN
      expect(result.totalHealthPreventionCost).toBe(210);

      // Total = 321.30 + 200 + 157.50 + 210 + 70 = 958.80 PLN
      expect(result.totalBreedingCost).toBe(958.8);

      // Cost per youngster: 958.80 / 35 = ~27.39 PLN
      expect(result.costPerYoungster).toBeCloseTo(27.39, 1);
      // Cost per pair: 958.80 / 10 = 95.88 PLN
      expect(result.costPerPair).toBe(95.88);

      // Verify breakdown percentages sum close to 100%
      const totalPct =
        result.breakdownPercent.feed +
        result.breakdownPercent.supplements +
        result.breakdownPercent.rings +
        result.breakdownPercent.health +
        result.breakdownPercent.other;
      expect(totalPct).toBeGreaterThanOrEqual(99.5);
      expect(totalPct).toBeLessThanOrEqual(100.5);
    });

    it('safely handles zero or negative values with fallbacks', () => {
      const result = calculateChickRearingCost({
        breedingPairCount: 0,
        youngstersWeanedCount: 0,
      });

      expect(result.costPerYoungster).toBeGreaterThan(0);
      expect(result.totalBreedingCost).toBeGreaterThan(0);
    });
  });

  describe('Racer Season Cost Engine', () => {
    it('accurately computes cost per racing bird for a team of 40 racers', () => {
      const result = calculateRacerSeasonCost({
        racingTeamSize: 40,
        annualFeedKgPerBird: 12.5,
        feedPricePerKg: 4.0,
        racingSupplementsTotal: 600,
        vetPreventionPerBird: 25.0,
        clubBasketingFeesTotal: 1000,
        trainingTossFuelTotal: 400,
        additionalRacerCosts: 200,
      });

      // Feed: 40 * 12.5 * 4.00 = 2000 PLN
      expect(result.totalFeedCost).toBe(2000);
      expect(result.feedCostPerRacer).toBe(50); // 2000 / 40

      // Vet: 40 * 25 = 1000 PLN
      expect(result.totalVetCost).toBe(1000);
      expect(result.vetCostPerRacer).toBe(25);

      // Basketing: 1000 PLN / 40 = 25 PLN/ptak
      expect(result.basketingCostPerRacer).toBe(25);

      // Training fuel: 400 PLN / 40 = 10 PLN/ptak
      expect(result.trainingFuelCostPerRacer).toBe(10);

      // Total team cost: 2000 + 600 + 1000 + 1000 + 400 + 200 = 5200 PLN
      expect(result.totalRacingTeamCost).toBe(5200);
      // Total per racer: 5200 / 40 = 130 PLN
      expect(result.totalCostPerRacer).toBe(130);

      expect(result.breakdownPercent.feed).toBeGreaterThan(30);
    });
  });

  describe('Season Financial Summary & Budget Variance', () => {
    it('summarizes ledger entries with deficit, category breakdown and budget cap warning', () => {
      const expenses: ExpenseEntry[] = [
        { id: 'e1', date: '2026-03-01', category: 'feed', title: 'Worki karmy lęgowej 10x25kg', amount: 850 },
        { id: 'e2', date: '2026-03-10', category: 'veterinary', title: 'Szczepienie PMV-1 + Ospia', amount: 450 },
        { id: 'e3', date: '2026-04-05', category: 'pzhgp_fees', title: 'Opłata za zegar i obrączki', amount: 600 },
        { id: 'e4', date: '2026-05-01', category: 'supplements', title: 'Elektrolity i witaminy', amount: 200 },
        { id: 'e5', date: '2026-05-15', category: 'logistics', title: 'Paliwo na wywózki', amount: 150 },
      ];

      const revenues: RevenueEntry[] = [
        { id: 'r1', date: '2026-06-01', category: 'youngster_sales', title: 'Sprzedaż 5 młodych', amount: 750 },
        { id: 'r2', date: '2026-07-20', category: 'race_prizes', title: 'Nagroda za lot narodowy', amount: 300 },
      ];

      const summary = calculateSeasonFinancialSummary(expenses, revenues, 2000);

      // Total expenses = 850 + 450 + 600 + 200 + 150 = 2250 PLN
      expect(summary.totalExpenses).toBe(2250);
      // Total revenues = 750 + 300 = 1050 PLN
      expect(summary.totalRevenues).toBe(1050);

      // Net balance = 1050 - 2250 = -1200 PLN
      expect(summary.netBalance).toBe(-1200);

      // Top cost category is feed (850 PLN)
      expect(summary.topCostCategory).toBe('feed');
      expect(summary.categoryBreakdown.feed.total).toBe(850);

      // Budget cap was 2000 PLN, total is 2250 PLN -> isOverBudget = true
      expect(summary.isOverBudget).toBe(true);
      expect(summary.budgetVarianceAmount).toBe(250);

      // Daily cost = 2250 / 365 = ~6.16 PLN/day
      expect(summary.costPerDay).toBeCloseTo(6.16, 1);
    });

    it('calculates positive ROI when prize money and sales exceed operating expenses', () => {
      const expenses: ExpenseEntry[] = [
        { id: 'e1', date: '2026-01-01', category: 'feed', title: 'Pasza roczna', amount: 1000 },
      ];

      const revenues: RevenueEntry[] = [
        { id: 'r1', date: '2026-08-01', category: 'youngster_sales', title: 'Aukcja młodych z wybitnych linii', amount: 2500 },
      ];

      const summary = calculateSeasonFinancialSummary(expenses, revenues);

      expect(summary.netBalance).toBe(1500);
      // ROI = ((2500 - 1000) / 1000) * 100 = 150%
      expect(summary.roiPercent).toBe(150);
      expect(summary.isOverBudget).toBe(false);
    });
  });
});

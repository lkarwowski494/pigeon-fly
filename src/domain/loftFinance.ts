/**
 * PIGEON-FLY — Asystent Kosztów i Budżetu Sezonu Hodowlanego (Breeding Loft Finance - Z-056)
 * Precyzyjny silnik księgowości i rachunku kosztów dla profesjonalnego gołębnika sportowo-hodowlanego:
 * 1. Kategoryzacja wydatków (karma, suplementy/minerały, profilaktyka weterynaryjna, opłaty PZHGP/zegar, sprzęt, logistyka)
 * 2. Przychody (sprzedaż młodych, sprzedaż gołębi rozpłodowych, wygrane z lotów i nagrody)
 * 3. Kluczowe jednostkowe wskaźniki rentowności:
 *    - Koszt jednostkowy odchowania 1 młodego do usamodzielnienia (odsadzenia)
 *    - Koszt jednostkowy utrzymania 1 lotnika w pełnym sezonie sportowym
 *    - Bilans finansowy netto, wskaźnik ROI (%) i analiza odchylenia budżetu
 */

export type ExpenseCategory =
  | 'feed'
  | 'supplements'
  | 'veterinary'
  | 'pzhgp_fees'
  | 'equipment'
  | 'logistics'
  | 'other';

export type RevenueCategory =
  | 'youngster_sales'
  | 'breeding_stock_sales'
  | 'race_prizes'
  | 'other';

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  title: string;
  amount: number;
  targetGroup?: 'breeding' | 'racing' | 'all';
  notes?: string;
}

export interface RevenueEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: RevenueCategory;
  title: string;
  amount: number;
  buyerOrRace?: string;
  notes?: string;
}

export interface BreedingRearingParams {
  breedingPairCount: number;
  youngstersWeanedCount: number;
  breedingSeasonDays?: number; // Domyślnie 90 dni (2 lęgi)
  dailyFeedGramsPerPair?: number; // Domyślnie 85 g (para + młode w misce)
  feedPricePerKg?: number; // PLN/kg, domyślnie 4.20 PLN
  supplementsTotalCost?: number; // Minerały, grit, białko jajeczne, witaminy E+selen
  ringFeePerBird?: number; // Koszt obrączki rodowej PZHGP + karta (domyślnie 4.50 PLN)
  pmvVaccineCostPerBird?: number; // Szczepienie PMV-1 dla młodego (domyślnie 6.00 PLN)
  additionalSuppliesCost?: number; // Miski lęgowe, wkładki gipsowe, dezynfekcja
}

export interface YoungsterRearingResult {
  totalFeedKg: number;
  totalFeedCost: number;
  totalSupplementsCost: number;
  totalRingAndAdminCost: number;
  totalHealthPreventionCost: number;
  totalBreedingCost: number;
  costPerYoungster: number;
  costPerPair: number;
  breakdownPercent: {
    feed: number;
    supplements: number;
    rings: number;
    health: number;
    other: number;
  };
}

export interface RacerSeasonParams {
  racingTeamSize: number;
  annualFeedKgPerBird?: number; // Roczne zużycie karmy na lotnika, domyślnie 12.5 kg
  feedPricePerKg?: number; // Średnia cena karmy lotowej/oczyszczającej, domyślnie 3.90 PLN
  racingSupplementsTotal?: number; // Elektrolity, karnityna, witaminy, olejki, drożdże
  vetPreventionPerBird?: number; // PMV-1, rzęsistek, kokcydioza, odrobaczanie, wymazy (domyślnie 25.00 PLN/ptak)
  clubBasketingFeesTotal?: number; // Opłata roczna za zegar + koszowe oddziałowe za sezon
  trainingTossFuelTotal?: number; // Koszt paliwa na prywatne wywózki treningowe
  additionalRacerCosts?: number; // Koszyki transportowe, chipy elektroniczne
}

export interface RacerSeasonResult {
  totalFeedCost: number;
  feedCostPerRacer: number;
  totalSupplementsCost: number;
  supplementsCostPerRacer: number;
  totalVetCost: number;
  vetCostPerRacer: number;
  totalBasketingCost: number;
  basketingCostPerRacer: number;
  totalTrainingFuelCost: number;
  trainingFuelCostPerRacer: number;
  totalCostPerRacer: number;
  totalRacingTeamCost: number;
  breakdownPercent: {
    feed: number;
    supplements: number;
    veterinary: number;
    basketing: number;
    training: number;
    other: number;
  };
}

export interface SeasonFinancialSummary {
  totalExpenses: number;
  totalRevenues: number;
  netBalance: number; // Revenues - Expenses (ujemny = dopłata do hobby, dodatni = zysk)
  roiPercent: number | null; // ((Revenues - Expenses) / Expenses) * 100
  categoryBreakdown: Record<ExpenseCategory, { total: number; percentage: number }>;
  topCostCategory: ExpenseCategory;
  budgetCap?: number;
  isOverBudget: boolean;
  budgetVarianceAmount: number; // totalExpenses - budgetCap (jeśli budgetCap podano)
  costPerDay: number; // Koszt dzienny gołębnika (365 dni)
}

/**
 * Nazwy kategorii kosztów po polsku
 */
export const EXPENSE_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  feed: 'Karmy i Mieszanki Ziaren',
  supplements: 'Suplementy, Witaminy i Minerały',
  veterinary: 'Profilaktyka i Leczenie Wet.',
  pzhgp_fees: 'Opłaty PZHGP, Zegar i Koszowe',
  equipment: 'Sprzęt, Poidła i Akcesoria',
  logistics: 'Transport i Wywózki Treningowe',
  other: 'Inne Koszty Gołębnika',
};

/**
 * Nazwy kategorii przychodów po polsku
 */
export const REVENUE_CATEGORY_NAMES: Record<RevenueCategory, string> = {
  youngster_sales: 'Sprzedaż Młodych',
  breeding_stock_sales: 'Sprzedaż Gołębi Rozpłodowych',
  race_prizes: 'Nagrody Konkursowe i Lotowe',
  other: 'Inne Przychody',
};

/**
 * Oblicza jednostkowy koszt odchowania młodego gołębia do wieku odsadzenia (ok. 24-28 dni)
 */
export function calculateChickRearingCost(params: BreedingRearingParams): YoungsterRearingResult {
  const pairCount = Math.max(1, params.breedingPairCount);
  const weanedCount = Math.max(1, params.youngstersWeanedCount);
  const days = params.breedingSeasonDays ?? 90;
  const dailyFeedGrams = params.dailyFeedGramsPerPair ?? 85;
  const feedPrice = Math.max(0, params.feedPricePerKg ?? 4.2);
  const supplementsTotal = Math.max(0, params.supplementsTotalCost ?? 180);
  const ringFee = Math.max(0, params.ringFeePerBird ?? 4.5);
  const pmvVaccine = Math.max(0, params.pmvVaccineCostPerBird ?? 6.0);
  const otherSupplies = Math.max(0, params.additionalSuppliesCost ?? 80);

  // Zużycie karmy w okresie lęgowym
  const totalFeedKg = Math.round(((pairCount * dailyFeedGrams * days) / 1000) * 10) / 10;
  const totalFeedCost = Math.round(totalFeedKg * feedPrice * 100) / 100;

  // Koszty obrączek i szczepień na liczbę odchowanych młodych
  const totalRingAndAdminCost = Math.round(weanedCount * ringFee * 100) / 100;
  const totalHealthPreventionCost = Math.round(weanedCount * pmvVaccine * 100) / 100;

  const totalBreedingCost =
    Math.round(
      (totalFeedCost + supplementsTotal + totalRingAndAdminCost + totalHealthPreventionCost + otherSupplies) * 100
    ) / 100;

  const costPerYoungster = Math.round((totalBreedingCost / weanedCount) * 100) / 100;
  const costPerPair = Math.round((totalBreedingCost / pairCount) * 100) / 100;

  const pct = (val: number) =>
    totalBreedingCost > 0 ? Math.round((val / totalBreedingCost) * 1000) / 10 : 0;

  return {
    totalFeedKg,
    totalFeedCost,
    totalSupplementsCost: supplementsTotal,
    totalRingAndAdminCost,
    totalHealthPreventionCost,
    totalBreedingCost,
    costPerYoungster,
    costPerPair,
    breakdownPercent: {
      feed: pct(totalFeedCost),
      supplements: pct(supplementsTotal),
      rings: pct(totalRingAndAdminCost),
      health: pct(totalHealthPreventionCost),
      other: pct(otherSupplies),
    },
  };
}

/**
 * Oblicza jednostkowy koszt utrzymania i przygotowania lotnika w sezonie sportowym
 */
export function calculateRacerSeasonCost(params: RacerSeasonParams): RacerSeasonResult {
  const teamSize = Math.max(1, params.racingTeamSize);
  const annualFeedKgPerBird = params.annualFeedKgPerBird ?? 12.5;
  const feedPrice = Math.max(0, params.feedPricePerKg ?? 3.9);
  const supplementsTotal = Math.max(0, params.racingSupplementsTotal ?? 450);
  const vetPerBird = Math.max(0, params.vetPreventionPerBird ?? 25.0);
  const basketingFeesTotal = Math.max(0, params.clubBasketingFeesTotal ?? 800);
  const trainingFuelTotal = Math.max(0, params.trainingTossFuelTotal ?? 350);
  const otherCosts = Math.max(0, params.additionalRacerCosts ?? 100);

  // Pasza
  const totalFeedKg = teamSize * annualFeedKgPerBird;
  const totalFeedCost = Math.round(totalFeedKg * feedPrice * 100) / 100;
  const feedCostPerRacer = Math.round((totalFeedCost / teamSize) * 100) / 100;

  // Suplementy
  const supplementsCostPerRacer = Math.round((supplementsTotal / teamSize) * 100) / 100;

  // Weterynaria
  const totalVetCost = Math.round(teamSize * vetPerBird * 100) / 100;
  const vetCostPerRacer = vetPerBird;

  // Koszowe i zegar
  const basketingCostPerRacer = Math.round((basketingFeesTotal / teamSize) * 100) / 100;

  // Treningi i paliwo
  const trainingFuelCostPerRacer = Math.round((trainingFuelTotal / teamSize) * 100) / 100;

  // Suma całości
  const totalRacingTeamCost =
    Math.round(
      (totalFeedCost + supplementsTotal + totalVetCost + basketingFeesTotal + trainingFuelTotal + otherCosts) * 100
    ) / 100;

  const totalCostPerRacer = Math.round((totalRacingTeamCost / teamSize) * 100) / 100;

  const pct = (val: number) =>
    totalRacingTeamCost > 0 ? Math.round((val / totalRacingTeamCost) * 1000) / 10 : 0;

  return {
    totalFeedCost,
    feedCostPerRacer,
    totalSupplementsCost: supplementsTotal,
    supplementsCostPerRacer,
    totalVetCost,
    vetCostPerRacer,
    totalBasketingCost: basketingFeesTotal,
    basketingCostPerRacer,
    totalTrainingFuelCost: trainingFuelTotal,
    trainingFuelCostPerRacer,
    totalCostPerRacer,
    totalRacingTeamCost,
    breakdownPercent: {
      feed: pct(totalFeedCost),
      supplements: pct(supplementsTotal),
      veterinary: pct(totalVetCost),
      basketing: pct(basketingFeesTotal),
      training: pct(trainingFuelTotal),
      other: pct(otherCosts),
    },
  };
}

/**
 * Podsumowuje bilans finansowy sezonu hodowlano-lotowego z list wpisów księgowych
 */
export function calculateSeasonFinancialSummary(
  expenses: ExpenseEntry[],
  revenues: RevenueEntry[],
  budgetCap?: number
): SeasonFinancialSummary {
  const totalExpenses = Math.round(expenses.reduce((sum, e) => sum + Math.max(0, e.amount), 0) * 100) / 100;
  const totalRevenues = Math.round(revenues.reduce((sum, r) => sum + Math.max(0, r.amount), 0) * 100) / 100;

  const netBalance = Math.round((totalRevenues - totalExpenses) * 100) / 100;

  let roiPercent: number | null = null;
  if (totalExpenses > 0) {
    roiPercent = Math.round(((totalRevenues - totalExpenses) / totalExpenses) * 1000) / 10;
  }

  // Kategoryzacja wydatków
  const initialCategoryMap: Record<ExpenseCategory, number> = {
    feed: 0,
    supplements: 0,
    veterinary: 0,
    pzhgp_fees: 0,
    equipment: 0,
    logistics: 0,
    other: 0,
  };

  expenses.forEach((e) => {
    const cat = e.category in initialCategoryMap ? e.category : 'other';
    initialCategoryMap[cat] += Math.max(0, e.amount);
  });

  const categoryBreakdown: Record<ExpenseCategory, { total: number; percentage: number }> = {
    feed: { total: 0, percentage: 0 },
    supplements: { total: 0, percentage: 0 },
    veterinary: { total: 0, percentage: 0 },
    pzhgp_fees: { total: 0, percentage: 0 },
    equipment: { total: 0, percentage: 0 },
    logistics: { total: 0, percentage: 0 },
    other: { total: 0, percentage: 0 },
  };

  let maxCategory: ExpenseCategory = 'feed';
  let maxCatAmount = -1;

  (Object.keys(initialCategoryMap) as ExpenseCategory[]).forEach((cat) => {
    const total = Math.round(initialCategoryMap[cat] * 100) / 100;
    const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 1000) / 10 : 0;
    categoryBreakdown[cat] = { total, percentage };

    if (total > maxCatAmount) {
      maxCatAmount = total;
      maxCategory = cat;
    }
  });

  const isOverBudget = budgetCap !== undefined && budgetCap > 0 ? totalExpenses > budgetCap : false;
  const budgetVarianceAmount =
    budgetCap !== undefined && budgetCap > 0 ? Math.round((totalExpenses - budgetCap) * 100) / 100 : 0;

  const costPerDay = Math.round((totalExpenses / 365) * 100) / 100;

  return {
    totalExpenses,
    totalRevenues,
    netBalance,
    roiPercent,
    categoryBreakdown,
    topCostCategory: maxCategory,
    budgetCap,
    isOverBudget,
    budgetVarianceAmount,
    costPerDay,
  };
}

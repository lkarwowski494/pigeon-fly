/**
 * Pigeon-Fly — Kalkulator Kosztów Żywienia i Utrzymania Gołębnika (Cost Calculator)
 * Standard Ekonomiczny Portfolio Apps4Brew:
 * Oblicza realne koszty prowadzenia stada (karma, suplementy, profilaktyka weterynaryjna, opłaty lotowe)
 * w przeliczeniu na ptaka, na miesiąc i na cały 12-miesięczny sezon hodowlano-lotowy.
 */

export interface LoftCostInputs {
  flockSize: number; // liczba ptaków w stadzie (np. 60)
  feedBagPrice: number; // cena worka karmy 25 kg w PLN lub EUR (np. 85 PLN)
  feedBagWeightKg?: number; // domyślnie 25 kg
  dailyGramsPerBird?: number; // domyślnie 32 g na ptaka
  monthlySupplementsCost: number; // grity, minerały, elektrolity, witaminy, kwasy (np. 120 PLN/msc)
  annualVeterinaryCost: number; // szczepionki PMV-1, badania kału, wymazy (np. 600 PLN/rok)
  raceBasketingFeePerBird?: number; // opłata za włożenie do kosza (np. 5 PLN)
  numberOfRacesPerSeason?: number; // liczba lotów konkursowych w sezonie (np. 14)
  racingTeamSize?: number; // liczba ptaków w drużynie lotowej (np. 35)
}

export interface LoftCostBreakdown {
  dailyFlockGrainKg: number;
  monthlyFlockGrainKg: number;
  annualFlockGrainKg: number;
  monthlyFeedBags: number;
  annualFeedBags: number;
  monthlyFeedCost: number;
  annualFeedCost: number;
  monthlySupplementsCost: number;
  annualSupplementsCost: number;
  annualVeterinaryCost: number;
  annualRaceBasketingCost: number;
  totalAnnualLoftCost: number;
  costPerBirdPerMonth: number;
  costPerBirdPerYear: number;
  costPerRaceWeekend: number;
}

export function calculateLoftCosts(inputs: LoftCostInputs): LoftCostBreakdown {
  const flockSize = Math.max(1, inputs.flockSize);
  const bagWeight = inputs.feedBagWeightKg || 25;
  const dailyGrams = inputs.dailyGramsPerBird || 32;
  const bagPrice = Math.max(0, inputs.feedBagPrice);
  const monthlySupplements = Math.max(0, inputs.monthlySupplementsCost);
  const annualVet = Math.max(0, inputs.annualVeterinaryCost);
  const basketingFee = inputs.raceBasketingFeePerBird ?? 5;
  const racesCount = inputs.numberOfRacesPerSeason ?? 14;
  const racingTeam = inputs.racingTeamSize ?? Math.round(flockSize * 0.6);

  // Zużycie ziarna
  const dailyFlockGrainKg = (flockSize * dailyGrams) / 1000;
  const monthlyFlockGrainKg = dailyFlockGrainKg * 30.5;
  const annualFlockGrainKg = dailyFlockGrainKg * 365;

  const monthlyFeedBags = Math.ceil(monthlyFlockGrainKg / bagWeight);
  const annualFeedBags = Math.ceil(annualFlockGrainKg / bagWeight);

  const pricePerKg = bagPrice / bagWeight;
  const monthlyFeedCost = Math.round(monthlyFlockGrainKg * pricePerKg * 100) / 100;
  const annualFeedCost = Math.round(annualFlockGrainKg * pricePerKg * 100) / 100;

  const annualSupplementsCost = Math.round(monthlySupplements * 12 * 100) / 100;
  const annualRaceBasketingCost = Math.round(racingTeam * basketingFee * racesCount * 100) / 100;
  const costPerRaceWeekend = Math.round(racingTeam * basketingFee * 100) / 100;

  const totalAnnualLoftCost =
    Math.round(
      (annualFeedCost + annualSupplementsCost + annualVet + annualRaceBasketingCost) * 100
    ) / 100;

  const costPerBirdPerYear = Math.round((totalAnnualLoftCost / flockSize) * 100) / 100;
  const costPerBirdPerMonth = Math.round((costPerBirdPerYear / 12) * 100) / 100;

  return {
    dailyFlockGrainKg: Math.round(dailyFlockGrainKg * 100) / 100,
    monthlyFlockGrainKg: Math.round(monthlyFlockGrainKg * 10) / 10,
    annualFlockGrainKg: Math.round(annualFlockGrainKg),
    monthlyFeedBags,
    annualFeedBags,
    monthlyFeedCost,
    annualFeedCost,
    monthlySupplementsCost: monthlySupplements,
    annualSupplementsCost,
    annualVeterinaryCost: annualVet,
    annualRaceBasketingCost,
    totalAnnualLoftCost,
    costPerBirdPerMonth,
    costPerBirdPerYear,
    costPerRaceWeekend,
  };
}

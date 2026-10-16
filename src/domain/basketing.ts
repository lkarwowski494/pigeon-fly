/**
 * PIGEON-FLY — Basketing Session & Race Entry Engine (Koszowanie i Lista Wkładaniowa)
 * Validates race basket entries, electronic chip matching, and Championship Series designation (Typowane T).
 */

export interface BasketEntry {
  pigeonId: string;
  ringNumber: string;
  countryCode: string;
  year: number;
  sex: 'cock' | 'hen' | 'unknown';
  plumageColor: string;
  isDesignatedSeries: boolean; // Typka (T) do serii mistrzowskiej (np. seria 5/10)
  electronicChipId?: string; // Kod obrączki elektronicznej (Tauris, Benzing, Bricon itp.)
  basketingOrder: number;
  basketCrateNumber?: number; // Numer kosza transportowego (np. Klatka 1)
}

export interface BasketingSummary {
  totalBasketed: number;
  cocksCount: number;
  hensCount: number;
  designatedSeriesCount: number;
  cratesUsed: number;
  averageAgeYears: number;
}

import { HealthLog } from './types';
import { validateBasketingAntidoping } from './antidoping';

/**
 * Validates whether a pigeon can be added to the current race basket.
 * Prevents double-basketing of the same bird and blocks birds with active FCI doping/withdrawal violations.
 */
export function validateBasketingEntry(
  entry: BasketEntry,
  currentBasket: BasketEntry[],
  options?: {
    healthLogs?: HealthLog[];
    raceDate?: string | Date;
  }
): { isValid: boolean; errorMessage?: string } {
  if (!entry.ringNumber.trim()) {
    return { isValid: false, errorMessage: 'Brak numeru obrączki rodowej.' };
  }

  const alreadyBasketed = currentBasket.some(
    (b) => b.pigeonId === entry.pigeonId || b.ringNumber === entry.ringNumber
  );

  if (alreadyBasketed) {
    return {
      isValid: false,
      errorMessage: `Gołąb ${entry.ringNumber} został już włożony do kosza w tym locie.`,
    };
  }

  if (options?.healthLogs && options?.raceDate) {
    const dopingCheck = validateBasketingAntidoping(
      entry.pigeonId,
      entry.ringNumber,
      options.healthLogs,
      options.raceDate
    );
    if (!dopingCheck.isAllowed) {
      return {
        isValid: false,
        errorMessage: dopingCheck.errorMessage,
      };
    }
  }

  return { isValid: true };
}

/**
 * Ensures designated series quota (e.g. max 5 or 10 birds) is respected.
 */
export function toggleSeriesDesignation(
  pigeonId: string,
  basket: BasketEntry[],
  maxDesignated = 5
): { updatedBasket: BasketEntry[]; success: boolean; message?: string } {
  const currentDesignated = basket.filter((b) => b.isDesignatedSeries).length;
  const target = basket.find((b) => b.pigeonId === pigeonId);

  if (!target) {
    return { updatedBasket: basket, success: false, message: 'Nie znaleziono ptaka w koszu.' };
  }

  if (!target.isDesignatedSeries && currentDesignated >= maxDesignated) {
    return {
      updatedBasket: basket,
      success: false,
      message: `Osiągnięto maksymalny limit serii typowanej (${maxDesignated} ptaków).`,
    };
  }

  const updatedBasket = basket.map((b) =>
    b.pigeonId === pigeonId ? { ...b, isDesignatedSeries: !b.isDesignatedSeries } : b
  );

  return { updatedBasket, success: true };
}

/**
 * Computes aggregate breakdown of all basketed birds for the race transport crate manifest.
 */
export function calculateBasketingSummary(
  basket: BasketEntry[],
  currentYear: number = new Date().getFullYear()
): BasketingSummary {
  const totalBasketed = basket.length;
  if (totalBasketed === 0) {
    return {
      totalBasketed: 0,
      cocksCount: 0,
      hensCount: 0,
      designatedSeriesCount: 0,
      cratesUsed: 0,
      averageAgeYears: 0,
    };
  }

  let cocks = 0;
  let hens = 0;
  let designated = 0;
  let ageSum = 0;
  const crates = new Set<number>();

  for (const b of basket) {
    if (b.sex === 'cock') cocks += 1;
    if (b.sex === 'hen') hens += 1;
    if (b.isDesignatedSeries) designated += 1;
    if (b.basketCrateNumber) crates.add(b.basketCrateNumber);
    ageSum += Math.max(0, currentYear - b.year);
  }

  // Standard transport crate accommodates up to 25-28 birds
  const cratesUsed = crates.size > 0 ? crates.size : Math.ceil(totalBasketed / 25);
  const averageAgeYears = Math.round((ageSum / totalBasketed) * 10) / 10;

  return {
    totalBasketed,
    cocksCount: cocks,
    hensCount: hens,
    designatedSeriesCount: designated,
    cratesUsed,
    averageAgeYears,
  };
}

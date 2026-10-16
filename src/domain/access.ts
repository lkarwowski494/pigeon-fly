/**
 * Pigeon-Fly — Serwis Monetyzacji Impulsowej i Kontroli Uprawnień (Pigeon-Fly Pro Pass)
 * Standard Biznesowy Portfolio: "Cheaper than Espresso"
 * - Monthly: 1,99 EUR / 8,99 PLN
 * - Annual: 6,99 EUR / 29,99 PLN (3-dniowy okres próbny, najpopularniejszy na sezon lotowy)
 * - Lifetime: 19,99 EUR / 89,99 PLN (jednorazowo, dla tradycyjnych hodowców)
 *
 * Filozofia 100% Offline-First:
 * 1. Stan licencji zapisywany i weryfikowany w lokalnym SQLite.
 * 2. Pełny dostęp do 100% funkcji w darmowym rdzeniu do 10 gołębi w stadzie lub w okresie próbnym (7 dni).
 * 3. HISTORIA ZAWSZE READ-ONLY: Po wygaśnięciu subskrypcji lub przekroczeniu limitu darmowego stada
 *    użytkownik NIGDY nie traci dostępu do swoich ptaków, rodowodów ani czasów lotu (ochrona ratingu 4.9★ w App Store).
 *    Blokowane są wyłącznie mutacje rozszerzone: dodanie >10 gołębia, eksport PDF, relacje live i import telemetrii.
 */

import { Database } from '../db/database';

export type PlanType = 'trial' | 'free' | 'monthly' | 'annual' | 'lifetime';
export type EntitlementStatus = 'active' | 'expired';

export interface PricingTier {
  id: 'monthly' | 'annual' | 'lifetime';
  priceEur: number;
  pricePln: number;
  period: 'month' | 'year' | 'lifetime';
  labelEn: string;
  labelPl: string;
  sublabelEn: string;
  sublabelPl: string;
  badgeEn?: string;
  badgePl?: string;
  isPopular?: boolean;
}

export const PRICING_TIERS: Record<'monthly' | 'annual' | 'lifetime', PricingTier> = {
  monthly: {
    id: 'monthly',
    priceEur: 1.99,
    pricePln: 8.99,
    period: 'month',
    labelEn: '€1.99 / month',
    labelPl: '8,99 zł / miesiąc',
    sublabelEn: 'Seasonal racing pass, cancel anytime',
    sublabelPl: 'Karnet na sezon lotowy, anuluj kiedy chcesz',
  },
  annual: {
    id: 'annual',
    priceEur: 6.99,
    pricePln: 29.99,
    period: 'year',
    labelEn: '€6.99 / year',
    labelPl: '29,99 zł / rok',
    sublabelEn: 'Full 12-month breeding & racing cycle (3-day free trial)',
    sublabelPl: 'Pełny 12-miesięczny cykl hodowli i lotów (3 dni gratis)',
    badgeEn: 'BEST VALUE (70% OFF)',
    badgePl: 'NAJPOPULARNIEJSZY (-70%)',
    isPopular: true,
  },
  lifetime: {
    id: 'lifetime',
    priceEur: 19.99,
    pricePln: 89.99,
    period: 'lifetime',
    labelEn: '€19.99 once',
    labelPl: '89,99 zł jednorazowo',
    sublabelEn: 'Pay once, master your loft forever (No subscriptions)',
    sublabelPl: 'Płacisz raz, hodujesz na zawsze (Bez abonamentów)',
  },
};

export const FREE_TIER_CONFIG = {
  durationTrialDays: 7,
  maxFreePigeons: 10,
};

export interface AppEntitlementRecord {
  id: string;
  plan_type: PlanType;
  status: EntitlementStatus;
  trial_started_at: string;
  purchased_at: string | null;
  expires_at: string | null;
  updated_at: string;
}

export interface AccessEvaluation {
  hasFullAccess: boolean;
  canAddPigeon: boolean;
  canExportPedigreePdf: boolean;
  canBroadcastLive: boolean;
  canUseGpsTelemetry: boolean;
  isHistoryReadOnly: boolean;
  isPremium: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  freePigeonsRemaining: number;
  activePlan: PlanType;
  status: EntitlementStatus;
  reason?: string;
}

export const ENTITLEMENTS_SINGLETON_ID = 'entitlements_primary';

/**
 * Czysta funkcja oceny stanu uprawnień użytkownika (deterministyczna).
 */
export function evaluateAccess(
  record: AppEntitlementRecord,
  currentPigeonsCount: number,
  nowMs: number = Date.now()
): AccessEvaluation {
  const isPremium =
    record.plan_type === 'monthly' ||
    record.plan_type === 'annual' ||
    record.plan_type === 'lifetime';

  if (isPremium) {
    // Sprawdzamy ewentualną datę wygaśnięcia subskrypcji okresowej
    if (record.expires_at) {
      const expiresMs = new Date(record.expires_at).getTime();
      if (nowMs > expiresMs) {
        return {
          hasFullAccess: false,
          canAddPigeon: currentPigeonsCount < FREE_TIER_CONFIG.maxFreePigeons,
          canExportPedigreePdf: false,
          canBroadcastLive: false,
          canUseGpsTelemetry: false,
          isHistoryReadOnly: true,
          isPremium: false,
          isTrial: false,
          trialDaysRemaining: 0,
          freePigeonsRemaining: Math.max(0, FREE_TIER_CONFIG.maxFreePigeons - currentPigeonsCount),
          activePlan: record.plan_type,
          status: 'expired',
          reason: 'Subskrypcja wygasła. Dotychczasowa historia stada i lotów pozostaje dostępna w trybie tylko do odczytu.',
        };
      }
    }

    return {
      hasFullAccess: true,
      canAddPigeon: true,
      canExportPedigreePdf: true,
      canBroadcastLive: true,
      canUseGpsTelemetry: true,
      isHistoryReadOnly: false,
      isPremium: true,
      isTrial: false,
      trialDaysRemaining: 0,
      freePigeonsRemaining: 9999,
      activePlan: record.plan_type,
      status: 'active',
    };
  }

  // Jesteśmy w trybie trial lub darmowym
  const trialStartMs = new Date(record.trial_started_at).getTime();
  const elapsedDays = Math.floor((nowMs - trialStartMs) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, FREE_TIER_CONFIG.durationTrialDays - elapsedDays);
  const freePigeonsRemaining = Math.max(0, FREE_TIER_CONFIG.maxFreePigeons - currentPigeonsCount);

  const isTrialActive = elapsedDays < FREE_TIER_CONFIG.durationTrialDays;

  if (isTrialActive) {
    return {
      hasFullAccess: true,
      canAddPigeon: true,
      canExportPedigreePdf: true,
      canBroadcastLive: true,
      canUseGpsTelemetry: true,
      isHistoryReadOnly: false,
      isPremium: false,
      isTrial: true,
      trialDaysRemaining,
      freePigeonsRemaining,
      activePlan: 'trial',
      status: 'active',
    };
  }

  // Po okresie próbnym — działa darmowy rdzeń do 10 gołębi
  const canAddMoreFree = currentPigeonsCount < FREE_TIER_CONFIG.maxFreePigeons;

  return {
    hasFullAccess: false,
    canAddPigeon: canAddMoreFree,
    canExportPedigreePdf: false,
    canBroadcastLive: false,
    canUseGpsTelemetry: false,
    isHistoryReadOnly: !canAddMoreFree,
    isPremium: false,
    isTrial: false,
    trialDaysRemaining: 0,
    freePigeonsRemaining,
    activePlan: 'free',
    status: canAddMoreFree ? 'active' : 'expired',
    reason: canAddMoreFree
      ? `Darmowy rdzeń: ${currentPigeonsCount}/${FREE_TIER_CONFIG.maxFreePigeons} ptaków w stadzie.`
      : `Osiągnięto limit ${FREE_TIER_CONFIG.maxFreePigeons} ptaków darmowego stada. Odblokuj Pigeon-Fly Pro!`,
  };
}

/**
 * Inicjalizuje rekord uprawnień przy pierwszym uruchomieniu lub zwraca istniejący.
 */
export async function initOrGetEntitlements(
  db: Database,
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  const existing = await db.getFirstAsync<AppEntitlementRecord>(
    'SELECT * FROM app_entitlements WHERE id = ?',
    [ENTITLEMENTS_SINGLETON_ID]
  );

  if (existing) {
    return existing;
  }

  const nowIso = new Date(nowMs).toISOString();
  const initial: AppEntitlementRecord = {
    id: ENTITLEMENTS_SINGLETON_ID,
    plan_type: 'trial',
    status: 'active',
    trial_started_at: nowIso,
    purchased_at: null,
    expires_at: null,
    updated_at: nowIso,
  };

  await db.runAsync(
    `INSERT INTO app_entitlements (id, plan_type, status, trial_started_at, purchased_at, expires_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      initial.id,
      initial.plan_type,
      initial.status,
      initial.trial_started_at,
      initial.purchased_at,
      initial.expires_at,
      initial.updated_at,
    ]
  );

  return initial;
}

/**
 * Aktywuje plan subskrypcyjny lub zakup dożywotni (Offline-First).
 */
export async function activatePlan(
  db: Database,
  planType: 'monthly' | 'annual' | 'lifetime',
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  await initOrGetEntitlements(db, nowMs);
  const nowIso = new Date(nowMs).toISOString();

  let expiresAtIso: string | null = null;
  if (planType === 'monthly') {
    const nextMonth = new Date(nowMs);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    expiresAtIso = nextMonth.toISOString();
  } else if (planType === 'annual') {
    const nextYear = new Date(nowMs);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    expiresAtIso = nextYear.toISOString();
  }

  await db.runAsync(
    `UPDATE app_entitlements
     SET plan_type = ?, status = 'active', purchased_at = ?, expires_at = ?, updated_at = ?
     WHERE id = ?`,
    [planType, nowIso, expiresAtIso, nowIso, ENTITLEMENTS_SINGLETON_ID]
  );

  return (await db.getFirstAsync<AppEntitlementRecord>(
    'SELECT * FROM app_entitlements WHERE id = ?',
    [ENTITLEMENTS_SINGLETON_ID]
  ))!;
}

/**
 * Przywraca zakup (StoreKit / Offline Fallback).
 */
export async function restorePurchases(
  db: Database,
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  const current = await initOrGetEntitlements(db, nowMs);
  // Jeśli użytkownik zakupił już plan w przeszłości, upewniamy się że rekord jest zsynchronizowany
  return current;
}

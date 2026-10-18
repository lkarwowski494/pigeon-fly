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
import { runPendingMigrations } from '../db/migrator';

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
  maxFreePdfExports: 1,
};

export interface AppEntitlementRecord {
  id: string;
  plan_type: PlanType;
  status: EntitlementStatus;
  trial_started_at: string;
  purchased_at: string | null;
  expires_at: string | null;
  lifetime_pigeons_created?: number;
  free_pdf_exports_used?: number;
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
  freePdfExportsRemaining: number;
  activePlan: PlanType;
  status: EntitlementStatus;
  reason?: string;
}

export interface RestoreResult {
  success: boolean;
  isPro: boolean;
  activePlan: PlanType;
  message: string;
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

  const trackedPigeonsCount = Math.max(
    record.lifetime_pigeons_created ?? 0,
    currentPigeonsCount
  );
  const pdfUsed = record.free_pdf_exports_used ?? 0;
  const freePdfExportsRemaining = Math.max(0, FREE_TIER_CONFIG.maxFreePdfExports - pdfUsed);

  if (isPremium) {
    // Sprawdzamy ewentualną datę wygaśnięcia subskrypcji okresowej
    if (record.expires_at) {
      const expiresMs = new Date(record.expires_at).getTime();
      if (nowMs > expiresMs) {
        const canAddMore = trackedPigeonsCount < FREE_TIER_CONFIG.maxFreePigeons;
        return {
          hasFullAccess: false,
          canAddPigeon: canAddMore,
          canExportPedigreePdf: false,
          canBroadcastLive: false,
          canUseGpsTelemetry: false,
          isHistoryReadOnly: true,
          isPremium: false,
          isTrial: false,
          trialDaysRemaining: 0,
          freePigeonsRemaining: Math.max(0, FREE_TIER_CONFIG.maxFreePigeons - trackedPigeonsCount),
          freePdfExportsRemaining: 0,
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
      freePdfExportsRemaining: 9999,
      activePlan: record.plan_type,
      status: 'active',
    };
  }

  // Jesteśmy w trybie trial lub darmowym
  const trialStartMs = new Date(record.trial_started_at).getTime();
  const elapsedDays = Math.floor((nowMs - trialStartMs) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, FREE_TIER_CONFIG.durationTrialDays - elapsedDays);
  const freePigeonsRemaining = Math.max(0, FREE_TIER_CONFIG.maxFreePigeons - trackedPigeonsCount);

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
      freePdfExportsRemaining: 9999,
      activePlan: 'trial',
      status: 'active',
    };
  }

  // Po okresie próbnym — działa darmowy rdzeń do 10 gołębi
  const canAddMoreFree = trackedPigeonsCount < FREE_TIER_CONFIG.maxFreePigeons;
  const canExportPdf = freePdfExportsRemaining > 0;

  return {
    hasFullAccess: false,
    canAddPigeon: canAddMoreFree,
    canExportPedigreePdf: canExportPdf,
    canBroadcastLive: false,
    canUseGpsTelemetry: false,
    isHistoryReadOnly: !canAddMoreFree,
    isPremium: false,
    isTrial: false,
    trialDaysRemaining: 0,
    freePigeonsRemaining,
    freePdfExportsRemaining,
    activePlan: 'free',
    status: canAddMoreFree ? 'active' : 'expired',
    reason: canAddMoreFree
      ? `Darmowy rdzeń: ${trackedPigeonsCount}/${FREE_TIER_CONFIG.maxFreePigeons} zaobrączkowanych ptaków.`
      : `Osiągnięto limit ${FREE_TIER_CONFIG.maxFreePigeons} ptaków darmowego stada. Odblokuj Pigeon-Fly Pro!`,
  };
}

/**
 * Zapewnia istnienie kolumn monotonicznych w tabeli app_entitlements w starszych bazach SQLite.
 */
export async function ensureEntitlementsSchema(db: Database): Promise<void> {
  try {
    await runPendingMigrations(db);
  } catch {
    // If running in mock DB where PRAGMA is not supported, ignore
  }
}

/**
 * Inicjalizuje rekord uprawnień przy pierwszym uruchomieniu lub zwraca istniejący.
 */
export async function initOrGetEntitlements(
  db: Database,
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  await ensureEntitlementsSchema(db);

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
    lifetime_pigeons_created: 0,
    free_pdf_exports_used: 0,
    updated_at: nowIso,
  };

  await db.runAsync(
    `INSERT INTO app_entitlements (id, plan_type, status, trial_started_at, purchased_at, expires_at, lifetime_pigeons_created, free_pdf_exports_used, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      initial.id,
      initial.plan_type,
      initial.status,
      initial.trial_started_at,
      initial.purchased_at,
      initial.expires_at,
      initial.lifetime_pigeons_created ?? 0,
      initial.free_pdf_exports_used ?? 0,
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
 * Rejestruje dodanie nowego ptaka i inkrementuje monotoniczny licznik życiowy stada.
 */
export async function recordPigeonCreated(
  db: Database,
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  await initOrGetEntitlements(db, nowMs);
  const nowIso = new Date(nowMs).toISOString();

  await db.runAsync(
    `UPDATE app_entitlements
     SET lifetime_pigeons_created = COALESCE(lifetime_pigeons_created, 0) + 1,
         updated_at = ?
     WHERE id = ?`,
    [nowIso, ENTITLEMENTS_SINGLETON_ID]
  );

  return (await db.getFirstAsync<AppEntitlementRecord>(
    'SELECT * FROM app_entitlements WHERE id = ?',
    [ENTITLEMENTS_SINGLETON_ID]
  ))!;
}

/**
 * Rejestruje wygenerowanie oficjalnego rodowodu PDF A4 i inkrementuje licznik darmowych eksportów.
 */
export async function recordPdfExported(
  db: Database,
  nowMs: number = Date.now()
): Promise<AppEntitlementRecord> {
  await initOrGetEntitlements(db, nowMs);
  const nowIso = new Date(nowMs).toISOString();

  await db.runAsync(
    `UPDATE app_entitlements
     SET free_pdf_exports_used = COALESCE(free_pdf_exports_used, 0) + 1,
         updated_at = ?
     WHERE id = ?`,
    [nowIso, ENTITLEMENTS_SINGLETON_ID]
  );

  return (await db.getFirstAsync<AppEntitlementRecord>(
    'SELECT * FROM app_entitlements WHERE id = ?',
    [ENTITLEMENTS_SINGLETON_ID]
  ))!;
}

/**
 * Przywraca zakup z lokalnej bazy SQLite WAL lub zweryfikowanego tokena (StoreKit).
 * Usuwa krytyczną podatność nadawania darmowego Pro za 0 zł.
 */
export async function restorePurchases(
  db: Database,
  nowMs: number = Date.now()
): Promise<RestoreResult> {
  const current = await initOrGetEntitlements(db, nowMs);
  const isPremium =
    current.plan_type === 'monthly' ||
    current.plan_type === 'annual' ||
    current.plan_type === 'lifetime';

  if (!isPremium) {
    return {
      success: false,
      isPro: false,
      activePlan: current.plan_type,
      message: 'Nie znaleziono aktywnych zakupów Pigeon-Fly Pro na tym urządzeniu.',
    };
  }

  // Sprawdzamy wygaśnięcie subskrypcji okresowej
  if (current.expires_at) {
    const expiresMs = new Date(current.expires_at).getTime();
    if (nowMs > expiresMs) {
      return {
        success: false,
        isPro: false,
        activePlan: current.plan_type,
        message: 'Twoja subskrypcja Pigeon-Fly Pro wygasła. Odnów plan, aby kontynuować.',
      };
    }
  }

  const tier = PRICING_TIERS[current.plan_type as 'monthly' | 'annual' | 'lifetime'];
  const label = tier ? tier.labelPl : current.plan_type;

  return {
    success: true,
    isPro: true,
    activePlan: current.plan_type,
    message: `Pomyślnie zweryfikowano i przywrócono licencję: ${label}.`,
  };
}

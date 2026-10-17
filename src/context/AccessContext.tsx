/**
 * PIGEON-FLY — Access Context & Provider
 * Global, reactive license and paywall management powered directly by SQLite WAL.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../db/database';
import {
  AppEntitlementRecord,
  AccessEvaluation,
  PlanType,
  initOrGetEntitlements,
  evaluateAccess,
  activatePlan,
  restorePurchases,
  recordPigeonCreated,
  recordPdfExported,
  RestoreResult,
} from '../domain/access';

export interface AccessContextValue {
  evaluation: AccessEvaluation;
  entitlements: AppEntitlementRecord | null;
  isLoading: boolean;
  isPaywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  buyPlan: (plan: 'monthly' | 'annual' | 'lifetime') => Promise<void>;
  restore: () => Promise<RestoreResult>;
  trackPigeonCreated: () => Promise<void>;
  trackPdfExported: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

const DEFAULT_EVALUATION: AccessEvaluation = {
  hasFullAccess: true,
  canAddPigeon: true,
  canExportPedigreePdf: true,
  canBroadcastLive: true,
  canUseGpsTelemetry: true,
  isHistoryReadOnly: false,
  isPremium: false,
  isTrial: true,
  trialDaysRemaining: 7,
  freePigeonsRemaining: 10,
  freePdfExportsRemaining: 1,
  activePlan: 'trial',
  status: 'active',
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<AppEntitlementRecord | null>(null);
  const [evaluation, setEvaluation] = useState<AccessEvaluation>(DEFAULT_EVALUATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const refreshAccess = useCallback(async () => {
    try {
      const db = await getDatabase();
      const record = await initOrGetEntitlements(db);

      // Pobieramy aktualną liczbę ptaków w bazie SQLite
      const pigeonRow = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM pigeons WHERE is_deleted = 0'
      );
      const currentCount = pigeonRow?.count ?? 0;

      const evalResult = evaluateAccess(record, currentCount);
      setEntitlements(record);
      setEvaluation(evalResult);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccess();
  }, [refreshAccess]);

  const buyPlan = useCallback(
    async (plan: 'monthly' | 'annual' | 'lifetime') => {
      const db = await getDatabase();
      const updated = await activatePlan(db, plan);
      setEntitlements(updated);

      const pigeonRow = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM pigeons WHERE is_deleted = 0'
      );
      const currentCount = pigeonRow?.count ?? 0;
      setEvaluation(evaluateAccess(updated, currentCount));
    },
    []
  );

  const restore = useCallback(async (): Promise<RestoreResult> => {
    const db = await getDatabase();
    const result = await restorePurchases(db);
    await refreshAccess();
    return result;
  }, [refreshAccess]);

  const trackPigeonCreated = useCallback(async () => {
    try {
      const db = await getDatabase();
      const updated = await recordPigeonCreated(db);
      setEntitlements(updated);

      const pigeonRow = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM pigeons WHERE is_deleted = 0'
      );
      const currentCount = pigeonRow?.count ?? 0;
      setEvaluation(evaluateAccess(updated, currentCount));
    } catch {
      // Ignorujemy błędy poboczne zapisu telemetrycznego
    }
  }, []);

  const trackPdfExported = useCallback(async () => {
    try {
      const db = await getDatabase();
      const updated = await recordPdfExported(db);
      setEntitlements(updated);

      const pigeonRow = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM pigeons WHERE is_deleted = 0'
      );
      const currentCount = pigeonRow?.count ?? 0;
      setEvaluation(evaluateAccess(updated, currentCount));
    } catch {
      // Ignorujemy błędy poboczne
    }
  }, []);

  const openPaywall = useCallback(() => setIsPaywallOpen(true), []);
  const closePaywall = useCallback(() => setIsPaywallOpen(false), []);

  return (
    <AccessContext.Provider
      value={{
        evaluation,
        entitlements,
        isLoading,
        isPaywallOpen,
        openPaywall,
        closePaywall,
        buyPlan,
        restore,
        trackPigeonCreated,
        trackPdfExported,
        refreshAccess,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAppAccess(): AccessContextValue {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAppAccess must be used within an AccessProvider');
  }
  return context;
}

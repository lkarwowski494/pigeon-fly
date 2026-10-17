import {
  evaluateAccess,
  AppEntitlementRecord,
  FREE_TIER_CONFIG,
  PRICING_TIERS,
  initOrGetEntitlements,
  activatePlan,
  recordPigeonCreated,
  recordPdfExported,
  restorePurchases,
} from '../src/domain/access';

describe('App Access & Monetization Domain', () => {
  const baseTrialRecord: AppEntitlementRecord = {
    id: 'entitlements_primary',
    plan_type: 'trial',
    status: 'active',
    trial_started_at: new Date('2026-03-01T00:00:00Z').toISOString(),
    purchased_at: null,
    expires_at: null,
    updated_at: new Date('2026-03-01T00:00:00Z').toISOString(),
  };

  it('allows full access during active 7-day trial', () => {
    // 3 days into trial
    const nowMs = new Date('2026-03-04T12:00:00Z').getTime();
    const evaluation = evaluateAccess(baseTrialRecord, 5, nowMs);

    expect(evaluation.hasFullAccess).toBe(true);
    expect(evaluation.isTrial).toBe(true);
    expect(evaluation.isPremium).toBe(false);
    expect(evaluation.canAddPigeon).toBe(true);
    expect(evaluation.canExportPedigreePdf).toBe(true);
    expect(evaluation.canBroadcastLive).toBe(true);
    expect(evaluation.trialDaysRemaining).toBe(4);
    expect(evaluation.freePigeonsRemaining).toBe(5);
  });

  it('enforces free tier limits after trial expires (<= 10 pigeons allowed, history read-only if full)', () => {
    // 10 days after trial start (expired)
    const nowMs = new Date('2026-03-11T00:00:00Z').getTime();

    // Case A: 6 pigeons in flock (can still add up to 10, has 1 free PDF welcome export)
    const evalCanAdd = evaluateAccess(baseTrialRecord, 6, nowMs);
    expect(evalCanAdd.hasFullAccess).toBe(false);
    expect(evalCanAdd.canAddPigeon).toBe(true);
    expect(evalCanAdd.freePigeonsRemaining).toBe(4);
    expect(evalCanAdd.canExportPedigreePdf).toBe(true); // 1 darmowy eksport powitalny (DEC-MON-03)
    expect(evalCanAdd.freePdfExportsRemaining).toBe(1);
    expect(evalCanAdd.activePlan).toBe('free');

    // Case B: 10 pigeons in flock (limit reached, history read-only guarantee)
    const evalLimitReached = evaluateAccess(baseTrialRecord, 10, nowMs);
    expect(evalLimitReached.canAddPigeon).toBe(false);
    expect(evalLimitReached.freePigeonsRemaining).toBe(0);
    expect(evalLimitReached.isHistoryReadOnly).toBe(true);
  });

  it('enforces monotonic lifetime pigeon counter to prevent flock rotation fraud (DEC-MON-01)', () => {
    const nowMs = new Date('2026-03-11T00:00:00Z').getTime();

    // User deleted birds so current flock is only 4, but lifetime created is 10
    const recordRotated: AppEntitlementRecord = {
      ...baseTrialRecord,
      lifetime_pigeons_created: 10,
    };

    const evalRotated = evaluateAccess(recordRotated, 4, nowMs);
    expect(evalRotated.canAddPigeon).toBe(false);
    expect(evalRotated.freePigeonsRemaining).toBe(0);
    expect(evalRotated.isHistoryReadOnly).toBe(true);
  });

  it('locks PDF pedigree export after 1 free welcome export is consumed (DEC-MON-03)', () => {
    const nowMs = new Date('2026-03-11T00:00:00Z').getTime();

    const recordUsedPdf: AppEntitlementRecord = {
      ...baseTrialRecord,
      free_pdf_exports_used: 1,
    };

    const evalUsedPdf = evaluateAccess(recordUsedPdf, 3, nowMs);
    expect(evalUsedPdf.canAddPigeon).toBe(true);
    expect(evalUsedPdf.canExportPedigreePdf).toBe(false);
    expect(evalUsedPdf.freePdfExportsRemaining).toBe(0);
  });

  it('grants unlimited access for Pro Lifetime plan with no expiration', () => {
    const lifetimeRecord: AppEntitlementRecord = {
      id: 'entitlements_primary',
      plan_type: 'lifetime',
      status: 'active',
      trial_started_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      purchased_at: new Date('2026-01-02T00:00:00Z').toISOString(),
      expires_at: null,
      updated_at: new Date('2026-01-02T00:00:00Z').toISOString(),
    };

    const evaluation = evaluateAccess(lifetimeRecord, 150, Date.now());
    expect(evaluation.hasFullAccess).toBe(true);
    expect(evaluation.isPremium).toBe(true);
    expect(evaluation.canAddPigeon).toBe(true);
    expect(evaluation.canExportPedigreePdf).toBe(true);
    expect(evaluation.canBroadcastLive).toBe(true);
    expect(evaluation.canUseGpsTelemetry).toBe(true);
    expect(evaluation.isHistoryReadOnly).toBe(false);
  });

  it('detects expired monthly subscription and locks write operations safely', () => {
    const expiredMonthlyRecord: AppEntitlementRecord = {
      id: 'entitlements_primary',
      plan_type: 'monthly',
      status: 'active',
      trial_started_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      purchased_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      expires_at: new Date('2026-02-01T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    };

    const nowMs = new Date('2026-02-15T00:00:00Z').getTime();
    const evaluation = evaluateAccess(expiredMonthlyRecord, 25, nowMs);

    expect(evaluation.hasFullAccess).toBe(false);
    expect(evaluation.isPremium).toBe(false);
    expect(evaluation.status).toBe('expired');
    expect(evaluation.isHistoryReadOnly).toBe(true);
    expect(evaluation.canAddPigeon).toBe(false); // 25 > 10
  });

  it('contains valid pricing tier configuration matching BRD specs', () => {
    expect(PRICING_TIERS.monthly.priceEur).toBe(1.99);
    expect(PRICING_TIERS.annual.priceEur).toBe(6.99);
    expect(PRICING_TIERS.annual.isPopular).toBe(true);
    expect(PRICING_TIERS.lifetime.priceEur).toBe(19.99);
  });
});

describe('App Access SQLite Storage & Restore Security', () => {
  class MockAccessDb {
    records: Record<string, any> = {};

    async execAsync(_sql: string): Promise<void> {}

    async runAsync(
      sql: string,
      params: unknown[] = []
    ): Promise<{ lastInsertRowId: number; changes: number }> {
      if (sql.includes('INSERT INTO app_entitlements')) {
        const [
          id,
          plan_type,
          status,
          trial_started_at,
          purchased_at,
          expires_at,
          lifetime_pigeons_created,
          free_pdf_exports_used,
          updated_at,
        ] = params as any[];
        this.records[id] = {
          id,
          plan_type,
          status,
          trial_started_at,
          purchased_at,
          expires_at,
          lifetime_pigeons_created,
          free_pdf_exports_used,
          updated_at,
        };
      } else if (sql.includes('UPDATE app_entitlements\n     SET plan_type = ?') || sql.includes('SET plan_type = ?')) {
        const [plan_type, purchased_at, expires_at, updated_at, id] = params as any[];
        if (this.records[id]) {
          this.records[id].plan_type = plan_type;
          this.records[id].status = 'active';
          this.records[id].purchased_at = purchased_at;
          this.records[id].expires_at = expires_at;
          this.records[id].updated_at = updated_at;
        }
      } else if (sql.includes('lifetime_pigeons_created = COALESCE(lifetime_pigeons_created, 0) + 1')) {
        const [updated_at, id] = params as any[];
        if (this.records[id]) {
          this.records[id].lifetime_pigeons_created = (this.records[id].lifetime_pigeons_created || 0) + 1;
          this.records[id].updated_at = updated_at;
        }
      } else if (sql.includes('free_pdf_exports_used = COALESCE(free_pdf_exports_used, 0) + 1')) {
        const [updated_at, id] = params as any[];
        if (this.records[id]) {
          this.records[id].free_pdf_exports_used = (this.records[id].free_pdf_exports_used || 0) + 1;
          this.records[id].updated_at = updated_at;
        }
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      if (sql.includes('FROM app_entitlements WHERE id = ?')) {
        const [id] = params as [string];
        return (this.records[id] as T) || null;
      }
      return null;
    }
  }

  it('initializes default trial entitlement with 0 created birds and 0 pdf exports', async () => {
    const mockDb = new MockAccessDb();
    const record = await initOrGetEntitlements(mockDb as any);

    expect(record.plan_type).toBe('trial');
    expect(record.status).toBe('active');
    expect(record.lifetime_pigeons_created).toBe(0);
    expect(record.free_pdf_exports_used).toBe(0);
  });

  it('increments monotonic lifetime pigeon count when bird is created (DEC-MON-01)', async () => {
    const mockDb = new MockAccessDb();
    await initOrGetEntitlements(mockDb as any);

    const updated1 = await recordPigeonCreated(mockDb as any);
    expect(updated1.lifetime_pigeons_created).toBe(1);

    const updated2 = await recordPigeonCreated(mockDb as any);
    expect(updated2.lifetime_pigeons_created).toBe(2);
  });

  it('increments free PDF exports used when pedigree is exported (DEC-MON-03)', async () => {
    const mockDb = new MockAccessDb();
    await initOrGetEntitlements(mockDb as any);

    const updated = await recordPdfExported(mockDb as any);
    expect(updated.free_pdf_exports_used).toBe(1);
  });

  it('activates Pro annual plan and validates restorePurchases security (DEC-MON-02)', async () => {
    const mockDb = new MockAccessDb();
    await initOrGetEntitlements(mockDb as any);

    // Initial restore should fail because user has not purchased Pro yet
    const restoreInitial = await restorePurchases(mockDb as any);
    expect(restoreInitial.success).toBe(false);
    expect(restoreInitial.isPro).toBe(false);

    // Purchase Pro annual
    await activatePlan(mockDb as any, 'annual');

    // Restore should now succeed and return active Pro status
    const restoreAfterPurchase = await restorePurchases(mockDb as any);
    expect(restoreAfterPurchase.success).toBe(true);
    expect(restoreAfterPurchase.isPro).toBe(true);
    expect(restoreAfterPurchase.activePlan).toBe('annual');
  });
});

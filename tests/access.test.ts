import {
  evaluateAccess,
  AppEntitlementRecord,
  FREE_TIER_CONFIG,
  PRICING_TIERS,
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

    // Case A: 6 pigeons in flock (can still add up to 10)
    const evalCanAdd = evaluateAccess(baseTrialRecord, 6, nowMs);
    expect(evalCanAdd.hasFullAccess).toBe(false);
    expect(evalCanAdd.canAddPigeon).toBe(true);
    expect(evalCanAdd.freePigeonsRemaining).toBe(4);
    expect(evalCanAdd.canExportPedigreePdf).toBe(false);
    expect(evalCanAdd.activePlan).toBe('free');

    // Case B: 10 pigeons in flock (limit reached, history read-only guarantee)
    const evalLimitReached = evaluateAccess(baseTrialRecord, 10, nowMs);
    expect(evalLimitReached.canAddPigeon).toBe(false);
    expect(evalLimitReached.freePigeonsRemaining).toBe(0);
    expect(evalLimitReached.isHistoryReadOnly).toBe(true);
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

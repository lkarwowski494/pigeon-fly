import { PurchaseService, STORE_PRODUCT_IDS } from '../src/services/purchaseService';
import { evaluateAccess, AppEntitlementRecord, initOrGetEntitlements } from '../src/domain/access';

class MockTestDb {
  public records: Record<string, AppEntitlementRecord> = {};

  async execAsync(sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (sql.includes('INSERT INTO app_entitlements')) {
      const [id, plan_type, status, trial_started_at, purchased_at, expires_at, lifetime_pigeons_created, free_pdf_exports_used, updated_at] = params as any[];
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
    } else if (sql.includes('UPDATE app_entitlements')) {
      const [plan_type, purchased_at, expires_at, updated_at, id] = params as any[];
      if (this.records[id]) {
        this.records[id].plan_type = plan_type;
        this.records[id].status = 'active';
        this.records[id].purchased_at = purchased_at;
        this.records[id].expires_at = expires_at;
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

describe('PurchaseService (StoreKit & Play Billing Entitlement Engine)', () => {
  let mockDb: MockTestDb;

  beforeEach(() => {
    mockDb = new MockTestDb();
    PurchaseService.resetMockStore();
  });

  afterEach(() => {
    PurchaseService.resetMockStore();
  });

  test('returns all three official pricing tiers with metadata', async () => {
    const products = await PurchaseService.getAvailableProducts();
    expect(products).toHaveLength(3);

    const ids = products.map((p) => p.productId);
    expect(ids).toContain(STORE_PRODUCT_IDS.monthly);
    expect(ids).toContain(STORE_PRODUCT_IDS.annual);
    expect(ids).toContain(STORE_PRODUCT_IDS.lifetime);
  });

  test('executes Lifetime purchase and activates permanent access', async () => {
    const entitlement = await PurchaseService.purchaseProduct(mockDb as any, 'lifetime');
    expect(entitlement.plan_type).toBe('lifetime');
    expect(entitlement.status).toBe('active');
    expect(entitlement.expires_at).toBeNull();

    const evaluation = evaluateAccess(entitlement, 50);
    expect(evaluation.isPremium).toBe(true);
    expect(evaluation.hasFullAccess).toBe(true);
    expect(evaluation.canAddPigeon).toBe(true);
    expect(evaluation.freePigeonsRemaining).toBe(9999);
  });

  test('recovers purchase across fresh app installation (wiped database)', async () => {
    // 1. User buys Lifetime on original install
    await PurchaseService.purchaseProduct(mockDb as any, 'lifetime');

    // 2. User deletes and reinstalls app -> completely fresh database
    const freshDb = new MockTestDb();
    const freshEntitlements = await initOrGetEntitlements(freshDb as any);
    expect(freshEntitlements.plan_type).toBe('trial');

    // 3. User taps "Przywróć zakupy"
    const restoreResult = await PurchaseService.restoreVerifiedPurchases(freshDb as any);
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.isPro).toBe(true);
    expect(restoreResult.activePlan).toBe('lifetime');

    // 4. Verify SQLite is updated
    const recovered = await initOrGetEntitlements(freshDb as any);
    expect(recovered.plan_type).toBe('lifetime');
    expect(recovered.status).toBe('active');
  });

  test('returns informative error when no StoreKit transactions exist', async () => {
    const restoreResult = await PurchaseService.restoreVerifiedPurchases(mockDb as any);
    expect(restoreResult.success).toBe(false);
    expect(restoreResult.isPro).toBe(false);
    expect(restoreResult.message).toContain('Nie znaleziono aktywnych zakupów');
  });
});

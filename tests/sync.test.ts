/**
 * Tests for Supabase Offline-First Sync Engine
 */

import { SyncEngine } from '../src/sync/syncEngine';
import { DatabaseConnection } from '../src/db/database';

class MockDatabaseConnection implements DatabaseConnection {
  public rows: any[] = [];

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (sql.includes('INSERT INTO sync_queue')) {
      const [id, clientMutationId, loftId, entityName, recordId, action, payload, createdAt] = params;
      this.rows.push({
        id,
        client_mutation_id: clientMutationId,
        loft_id: loftId,
        entity_name: entityName,
        record_id: recordId,
        action,
        payload,
        created_at: createdAt,
        attempts: 0,
        last_error: null,
      });
    } else if (sql.includes('DELETE FROM sync_queue')) {
      const [id] = params;
      this.rows = this.rows.filter((r) => r.id !== id);
    } else if (sql.includes('UPDATE sync_queue')) {
      const [errMsg, id] = params;
      const r = this.rows.find((row) => row.id === id);
      if (r) {
        r.attempts += 1;
        r.last_error = errMsg;
      }
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T>(_sql: string, _params: unknown[] = []): Promise<T[]> {
    return this.rows as T[];
  }

  async getFirstAsync<T>(_sql: string, _params: unknown[] = []): Promise<T | null> {
    return (this.rows[0] as T) || null;
  }

  async closeAsync(): Promise<void> {}
}

describe('Sync Engine — Offline Mutation Queue', () => {
  let mockDb: MockDatabaseConnection;

  beforeEach(() => {
    mockDb = new MockDatabaseConnection();
  });

  test('enqueues local mutation into SQLite sync_queue table', async () => {
    const engine = new SyncEngine(mockDb, null);

    const cmi = await engine.enqueueMutation(
      'loft-01',
      'pigeons',
      'p-01',
      'INSERT',
      { ring_number: 'PL-0284-23-1402', year: 2023 }
    );

    expect(cmi).toBeDefined();
    expect(mockDb.rows).toHaveLength(1);
    expect(mockDb.rows[0].entity_name).toBe('pigeons');
    expect(mockDb.rows[0].record_id).toBe('p-01');
    expect(mockDb.rows[0].action).toBe('INSERT');

    const pending = await engine.getPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0].payload.ring_number).toBe('PL-0284-23-1402');
  });

  test('flushes queue and deletes synced mutations on success', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any;

    const engine = new SyncEngine(mockDb, mockSupabase);

    await engine.enqueueMutation('loft-01', 'pigeons', 'p-01', 'INSERT', { id: 'p-01' });
    await engine.enqueueMutation('loft-01', 'races', 'r-01', 'INSERT', { id: 'r-01' });

    expect(mockDb.rows).toHaveLength(2);

    const result = await engine.flushQueue();

    expect(result.pushedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(mockDb.rows).toHaveLength(0); // Queue cleaned up
  });

  test('records error and increments attempt counter on sync failure', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: new Error('Network timeout') }),
      }),
    } as any;

    const engine = new SyncEngine(mockDb, mockSupabase);

    await engine.enqueueMutation('loft-01', 'pigeons', 'p-01', 'INSERT', { id: 'p-01' });

    const result = await engine.flushQueue();

    expect(result.pushedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(mockDb.rows).toHaveLength(1); // Row remains in queue for retry
    expect(mockDb.rows[0].attempts).toBe(1);
    expect(mockDb.rows[0].last_error).toContain('Network timeout');
  });
});

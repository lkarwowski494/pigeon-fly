import { HealthRepository } from '../src/db/healthRepository';
import { DatabaseConnection } from '../src/db/database';
import { HealthLog, MoultLog } from '../src/domain/types';

class MockHealthDb implements DatabaseConnection {
  public healthLogs: any[] = [];
  public moultLogs: any[] = [];

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (sql.includes('INSERT INTO health_logs')) {
      const [
        id, loftId, pigeonId, eventType, date, productName,
        batchNumber, withdrawalDays, nextDueDate, notes, createdAt, updatedAt
      ] = params;
      this.healthLogs.push({
        id,
        loft_id: loftId,
        pigeon_id: pigeonId,
        event_type: eventType,
        date,
        product_name: productName,
        batch_number: batchNumber,
        withdrawal_days: withdrawalDays,
        next_due_date: nextDueDate,
        notes,
        created_at: createdAt,
        updated_at: updatedAt,
      });
    } else if (sql.includes('DELETE FROM health_logs WHERE id = ?')) {
      const [id] = params;
      this.healthLogs = this.healthLogs.filter((l) => l.id !== id);
    } else if (sql.includes('INSERT OR REPLACE INTO moult_logs')) {
      const [
        id, pigeonId, checkDate, primaryFeatherNumber,
        status, lengthPct, createdAt, updatedAt
      ] = params;
      this.moultLogs = this.moultLogs.filter(
        (m) => !(m.pigeon_id === pigeonId && m.primary_feather_number === primaryFeatherNumber)
      );
      this.moultLogs.push({
        id,
        pigeon_id: pigeonId,
        check_date: checkDate,
        primary_feather_number: primaryFeatherNumber,
        status,
        length_pct: lengthPct,
        created_at: createdAt,
        updated_at: updatedAt,
      });
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes('FROM health_logs WHERE loft_id = ?')) {
      const [loftId] = params;
      return this.healthLogs.filter((l) => l.loft_id === loftId) as T[];
    }
    if (sql.includes('FROM health_logs WHERE pigeon_id = ? OR pigeon_id IS NULL')) {
      const [pigeonId] = params;
      return this.healthLogs.filter((l) => l.pigeon_id === pigeonId || !l.pigeon_id) as T[];
    }
    if (sql.includes('FROM moult_logs')) {
      const [pigeonId] = params;
      return this.moultLogs.filter((m) => m.pigeon_id === pigeonId) as T[];
    }
    return [];
  }

  async getFirstAsync<T>(_sql: string, _params: unknown[] = []): Promise<T | null> {
    return null;
  }

  async withTransactionAsync<T>(action: () => Promise<T>): Promise<T> {
    return action();
  }

  async closeAsync(): Promise<void> {}
}

describe('HealthRepository', () => {
  let db: MockHealthDb;
  let repo: HealthRepository;

  beforeEach(() => {
    db = new MockHealthDb();
    repo = new HealthRepository(db);
  });

  it('inserts and retrieves flock health logs', async () => {
    const log: HealthLog = {
      id: 'hl-1',
      loftId: 'loft-1',
      eventType: 'vaccine',
      date: '2026-02-15',
      productName: 'Pharmavac Columbi 2',
      batchNumber: 'LOT-9921',
      withdrawalDays: 0,
      nextDueDate: '2027-02-15',
      notes: 'Szczepienie stada',
      createdAt: '2026-02-15T10:00:00Z',
      updatedAt: '2026-02-15T10:00:00Z',
    };

    await repo.insertHealthLog(log);
    const logs = await repo.getAllHealthLogs('loft-1');
    expect(logs).toHaveLength(1);
    expect(logs[0].productName).toBe('Pharmavac Columbi 2');
    expect(logs[0].batchNumber).toBe('LOT-9921');
    expect(logs[0].withdrawalDays).toBe(0);
  });

  it('deletes a health log by id', async () => {
    const log: HealthLog = {
      id: 'hl-2',
      loftId: 'loft-1',
      eventType: 'deworming',
      date: '2026-03-01',
      productName: 'Levamisole',
      withdrawalDays: 7,
      createdAt: '',
      updatedAt: '',
    };

    await repo.insertHealthLog(log);
    let logs = await repo.getAllHealthLogs('loft-1');
    expect(logs).toHaveLength(1);

    await repo.deleteHealthLog('hl-2');
    logs = await repo.getAllHealthLogs('loft-1');
    expect(logs).toHaveLength(0);
  });

  it('records and retrieves wing feather moult inspection', async () => {
    const feather1: MoultLog = {
      id: 'm-1',
      pigeonId: 'p-1',
      checkDate: '2026-10-01',
      primaryFeatherNumber: 1,
      status: 'full',
      lengthPct: 100,
      createdAt: '',
      updatedAt: '',
    };

    const feather2: MoultLog = {
      id: 'm-2',
      pigeonId: 'p-1',
      checkDate: '2026-10-01',
      primaryFeatherNumber: 2,
      status: 'dropped',
      lengthPct: 0,
      createdAt: '',
      updatedAt: '',
    };

    await repo.recordMoultInspection(feather1);
    await repo.recordMoultInspection(feather2);

    const feathers = await repo.getLatestMoultForPigeon('p-1');
    expect(feathers).toHaveLength(2);
    expect(feathers.find((f) => f.primaryFeatherNumber === 2)?.status).toBe('dropped');
  });
});

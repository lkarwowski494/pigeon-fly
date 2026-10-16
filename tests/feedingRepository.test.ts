import { FeedingRepository } from '../src/db/feedingRepository';
import { DatabaseConnection } from '../src/db/database';
import { FeedingLog } from '../src/domain/types';

class MockFeedingDb implements DatabaseConnection {
  public feedingLogs: any[] = [];

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (sql.includes('INSERT INTO feeding_logs')) {
      const [
        id, loftId, date, phase, mixName,
        waterSupplements, feedSupplements, createdAt
      ] = params;
      this.feedingLogs.push({
        id,
        loft_id: loftId,
        date,
        phase,
        mix_name: mixName,
        water_supplements: waterSupplements,
        feed_supplements: feedSupplements,
        created_at: createdAt,
      });
    } else if (sql.includes('DELETE FROM feeding_logs WHERE id = ?')) {
      const [id] = params;
      this.feedingLogs = this.feedingLogs.filter((l) => l.id !== id);
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes('FROM feeding_logs WHERE loft_id = ?')) {
      const [loftId] = params;
      return this.feedingLogs.filter((l) => l.loft_id === loftId) as T[];
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

describe('FeedingRepository', () => {
  let db: MockFeedingDb;
  let repo: FeedingRepository;

  beforeEach(() => {
    db = new MockFeedingDb();
    repo = new FeedingRepository(db);
  });

  it('inserts and retrieves feeding logs', async () => {
    const log: FeedingLog = {
      id: 'fl-1',
      loftId: 'loft-1',
      date: '2026-05-12',
      phase: 'racing_widowhood',
      mixName: 'Dieta energetyczna (kardi + orzeszki)',
      waterSupplements: 'Elektrolity + Aminokwasy',
      feedSupplements: 'Drożdże piwne na oleju z oregano',
      createdAt: '2026-05-12T07:00:00Z',
    };

    await repo.insertFeedingLog(log);
    const logs = await repo.getAllFeedingLogs('loft-1');
    expect(logs).toHaveLength(1);
    expect(logs[0].mixName).toContain('Dieta energetyczna');
    expect(logs[0].waterSupplements).toBe('Elektrolity + Aminokwasy');
  });

  it('deletes feeding log by id', async () => {
    const log: FeedingLog = {
      id: 'fl-2',
      loftId: 'loft-1',
      date: '2026-05-13',
      phase: 'racing_widowhood',
      mixName: 'Mieszanka oczyszczająca (depurative)',
      createdAt: '',
    };

    await repo.insertFeedingLog(log);
    let logs = await repo.getAllFeedingLogs('loft-1');
    expect(logs).toHaveLength(1);

    await repo.deleteFeedingLog('fl-2');
    logs = await repo.getAllFeedingLogs('loft-1');
    expect(logs).toHaveLength(0);
  });
});

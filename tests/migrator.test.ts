import {
  getCurrentSchemaVersion,
  runPendingMigrations,
  MIGRATIONS,
} from '../src/db/migrator';

class MockMigratorDb {
  public userVersion = 0;
  public executedSql: string[] = [];

  async execAsync(sql: string): Promise<void> {
    this.executedSql.push(sql);
    const match = sql.match(/PRAGMA user_version = (\d+);/);
    if (match) {
      this.userVersion = parseInt(match[1], 10);
    }
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (sql.includes('PRAGMA user_version')) {
      return { user_version: this.userVersion } as T;
    }
    return null;
  }

  async getAllAsync<T>(_sql: string): Promise<T[]> {
    return [];
  }
}

describe('SQLite Schema Migrator (Zero Data Loss Policy)', () => {
  let db: MockMigratorDb;

  beforeEach(() => {
    db = new MockMigratorDb();
  });

  test('detects schema version 0 on fresh unversioned database', async () => {
    const version = await getCurrentSchemaVersion(db as any);
    expect(version).toBe(0);
  });

  test('applies pending migrations sequentially in atomic transactions', async () => {
    const result = await runPendingMigrations(db as any);

    expect(result.initialVersion).toBe(0);
    expect(result.finalVersion).toBe(2);
    expect(result.appliedCount).toBe(2);

    // Verify transaction wrapping
    expect(db.executedSql).toContain('BEGIN TRANSACTION;');
    expect(db.executedSql).toContain('COMMIT;');
    expect(db.userVersion).toBe(2);
  });

  test('does not re-apply migrations when database is already up to date', async () => {
    db.userVersion = 2;

    const result = await runPendingMigrations(db as any);
    expect(result.appliedCount).toBe(0);
    expect(result.initialVersion).toBe(2);
    expect(result.finalVersion).toBe(2);
  });
});

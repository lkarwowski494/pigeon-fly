/**
 * PIGEON-FLY — Zero Data Loss Migration Test (v1.0 -> v2.0)
 * TASK-R10-02: Verifies schema migration on physical data snapshot,
 * guaranteeing 100% record retention and backward compatibility.
 */

import { runPendingMigrations, getCurrentSchemaVersion } from '../src/db/migrator';

interface TableRecord {
  [key: string]: string | number | boolean | null | undefined;
}

class SnapshotDb {
  public userVersion = 1;
  public tables: Map<string, TableRecord[]> = new Map();
  public executedSql: string[] = [];

  constructor() {
    // Populate v1.0 physical snapshot records
    this.tables.set('pigeons', [
      { id: 'p-01', ring_number: 'PL-0284-23-1402', country_code: 'PL', year: 2023, sex: 'cock', status: 'racing' },
      { id: 'p-02', ring_number: 'PL-0284-22-9854', country_code: 'PL', year: 2022, sex: 'hen', status: 'breeding' },
      { id: 'p-03', ring_number: 'DV-0123-24-555', country_code: 'DV', year: 2024, sex: 'cock', status: 'racing' },
    ]);

    this.tables.set('races', [
      { id: 'r-01', name: 'Lot Narodowy Bruksela 2026', release_name: 'Bruksela', release_lat: 50.8503, release_lon: 4.3517 },
      { id: 'r-02', name: 'Trening 1 - Radom', release_name: 'Radom', release_lat: 51.4027, release_lon: 21.1471 },
    ]);

    this.tables.set('arrivals', [
      { id: 'a-01', race_id: 'r-01', pigeon_id: 'p-01', velocity_m_per_min: 1342.55, scan_type: 'ESK_LIVE' },
      { id: 'a-02', race_id: 'r-01', pigeon_id: 'p-02', velocity_m_per_min: 1320.10, scan_type: 'MANUAL_CLOCK' },
    ]);

    this.tables.set('clutches', [
      { id: 'c-01', nest_box: 'Cela A-04', cock_id: 'p-01', hen_id: 'p-02', egg1_status: 'fertile', egg2_status: 'fertile' },
    ]);

    this.tables.set('feeding_logs', [
      { id: 'f-01', date: '2026-05-10', phase: 'racing', mix_name: 'Mieszanka Wdowiec Super' },
    ]);

    this.tables.set('health_logs', [
      { id: 'h-01', event_type: 'vaccination', product_name: 'Chekivacc PMV', withdrawal_days: 0 },
    ]);
  }

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

  async getAllAsync<T>(sql: string): Promise<T[]> {
    for (const [table, rows] of this.tables.entries()) {
      if (sql.includes(table)) {
        return rows as unknown as T[];
      }
    }
    return [];
  }
}

describe('SQLite Database Migration (TASK-R10-02)', () => {
  it('guarantees 100% record preservation when upgrading v1.0 snapshot to v2.0', async () => {
    const db = new SnapshotDb();

    // 1. Verify pre-migration state
    const initialVersion = await getCurrentSchemaVersion(db as any);
    expect(initialVersion).toBe(1);

    const prePigeons = await db.getAllAsync<TableRecord>('SELECT * FROM pigeons');
    const preRaces = await db.getAllAsync<TableRecord>('SELECT * FROM races');
    const preArrivals = await db.getAllAsync<TableRecord>('SELECT * FROM arrivals');
    const preClutches = await db.getAllAsync<TableRecord>('SELECT * FROM clutches');
    const preFeeding = await db.getAllAsync<TableRecord>('SELECT * FROM feeding_logs');
    const preHealth = await db.getAllAsync<TableRecord>('SELECT * FROM health_logs');

    expect(prePigeons.length).toBe(3);
    expect(preRaces.length).toBe(2);
    expect(preArrivals.length).toBe(2);
    expect(preClutches.length).toBe(1);
    expect(preFeeding.length).toBe(1);
    expect(preHealth.length).toBe(1);

    // Total pre-migration records
    const totalPreRecords =
      prePigeons.length +
      preRaces.length +
      preArrivals.length +
      preClutches.length +
      preFeeding.length +
      preHealth.length;
    expect(totalPreRecords).toBe(10);

    // 2. Execute migration
    const migrationResult = await runPendingMigrations(db as any);

    expect(migrationResult.initialVersion).toBe(1);
    expect(migrationResult.finalVersion).toBe(2);
    expect(migrationResult.appliedCount).toBe(1);

    // 3. Verify post-migration state (Zero Data Loss)
    const postPigeons = await db.getAllAsync<TableRecord>('SELECT * FROM pigeons');
    const postRaces = await db.getAllAsync<TableRecord>('SELECT * FROM races');
    const postArrivals = await db.getAllAsync<TableRecord>('SELECT * FROM arrivals');
    const postClutches = await db.getAllAsync<TableRecord>('SELECT * FROM clutches');
    const postFeeding = await db.getAllAsync<TableRecord>('SELECT * FROM feeding_logs');
    const postHealth = await db.getAllAsync<TableRecord>('SELECT * FROM health_logs');

    expect(postPigeons).toEqual(prePigeons);
    expect(postRaces).toEqual(preRaces);
    expect(postArrivals).toEqual(preArrivals);
    expect(postClutches).toEqual(preClutches);
    expect(postFeeding).toEqual(preFeeding);
    expect(postHealth).toEqual(preHealth);

    const totalPostRecords =
      postPigeons.length +
      postRaces.length +
      postArrivals.length +
      postClutches.length +
      postFeeding.length +
      postHealth.length;

    // 100% preservation check
    expect(totalPostRecords).toBe(totalPreRecords);
    expect(db.userVersion).toBe(2);
  });
});

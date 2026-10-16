/**
 * PIGEON-FLY — Local SQLite Database Driver & Connection
 * Wraps expo-sqlite with safe statement execution and schema migration.
 */

import * as SQLite from 'expo-sqlite';
import { SQLITE_INIT_PRAGMAS, SQLITE_SCHEMA_V1 } from './schema';
import { resolveDatabaseDirectory } from './dbPath';

export type Database = SQLite.SQLiteDatabase;

export interface DatabaseConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  closeAsync(): Promise<void>;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;


export async function getDatabase(dbName = 'pigeon_fly.db'): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(dbName);

  // Apply performance & integrity pragmas
  await db.execAsync(SQLITE_INIT_PRAGMAS);

  // Apply schema
  await db.execAsync(SQLITE_SCHEMA_V1);

  dbInstance = db;
  return dbInstance;
}

export async function resetDatabase(dbName = 'pigeon_fly.db'): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
  const db = await SQLite.openDatabaseAsync(dbName);
  await db.execAsync(`
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS moult_logs;
    DROP TABLE IF EXISTS health_logs;
    DROP TABLE IF EXISTS pairings;
    DROP TABLE IF EXISTS arrivals;
    DROP TABLE IF EXISTS races;
    DROP TABLE IF EXISTS pigeons;
    DROP TABLE IF EXISTS lofts;
  `);
  await db.execAsync(SQLITE_INIT_PRAGMAS);
  await db.execAsync(SQLITE_SCHEMA_V1);
  dbInstance = db;
}

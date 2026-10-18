/**
 * PIGEON-FLY — Health & Moult Repository
 * Local SQLite storage for flock medical treatments, PMV-1 vaccinations,
 * withdrawal periods (karencja), and 10-feather wing moult inspections.
 */

import { HealthLog, MoultLog } from '../domain/types';
import { DatabaseConnection } from './database';

export interface HealthDbRow {
  id: string;
  loft_id: string;
  pigeon_id: string | null;
  event_type: HealthLog['eventType'];
  date: string;
  product_name: string;
  batch_number: string | null;
  withdrawal_days: number;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoultDbRow {
  id: string;
  pigeon_id: string;
  check_date: string;
  primary_feather_number: number;
  status: MoultLog['status'];
  length_pct: number;
  created_at: string;
  updated_at: string;
}

export class HealthRepository {
  constructor(private db: DatabaseConnection) {}

  async getAllHealthLogs(loftId: string): Promise<HealthLog[]> {
    const rows = await this.db.getAllAsync<HealthDbRow>(
      `SELECT * FROM health_logs WHERE loft_id = ? ORDER BY date DESC, created_at DESC`,
      [loftId]
    );
    return rows.map(this.mapRowToHealthLog);
  }

  async getHealthLogsForPigeon(pigeonId: string): Promise<HealthLog[]> {
    const rows = await this.db.getAllAsync<HealthDbRow>(
      `SELECT * FROM health_logs WHERE pigeon_id = ? OR pigeon_id IS NULL ORDER BY date DESC`,
      [pigeonId]
    );
    return rows.map(this.mapRowToHealthLog);
  }

  async insertHealthLog(log: HealthLog): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO health_logs (
        id, loft_id, pigeon_id, event_type, date, product_name,
        batch_number, withdrawal_days, next_due_date, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.loftId,
        log.pigeonId || null,
        log.eventType,
        log.date,
        log.productName,
        log.batchNumber || null,
        log.withdrawalDays,
        log.nextDueDate || null,
        log.notes || null,
        log.createdAt,
        log.updatedAt,
      ]
    );
  }

  async deleteHealthLog(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM health_logs WHERE id = ?`, [id]);
  }

  async getLatestMoultForPigeon(pigeonId: string): Promise<MoultLog[]> {
    const rows = await this.db.getAllAsync<MoultDbRow>(
      `SELECT * FROM moult_logs
       WHERE pigeon_id = ?
       GROUP BY primary_feather_number
       HAVING check_date = MAX(check_date)
       ORDER BY primary_feather_number ASC`,
      [pigeonId]
    );
    return rows.map(this.mapRowToMoultLog);
  }

  async recordMoultInspection(log: MoultLog): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO moult_logs (
        id, pigeon_id, check_date, primary_feather_number,
        status, length_pct, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.pigeonId,
        log.checkDate,
        log.primaryFeatherNumber,
        log.status,
        log.lengthPct,
        log.createdAt,
        log.updatedAt,
      ]
    );
  }

  private mapRowToHealthLog(row: HealthDbRow): HealthLog {
    return {
      id: row.id,
      loftId: row.loft_id,
      pigeonId: row.pigeon_id || undefined,
      eventType: row.event_type,
      date: row.date,
      productName: row.product_name,
      batchNumber: row.batch_number || undefined,
      withdrawalDays: row.withdrawal_days,
      nextDueDate: row.next_due_date || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToMoultLog(row: MoultDbRow): MoultLog {
    return {
      id: row.id,
      pigeonId: row.pigeon_id,
      checkDate: row.check_date,
      primaryFeatherNumber: row.primary_feather_number,
      status: row.status,
      lengthPct: row.length_pct,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * PIGEON-FLY — Feeding & Nutrition Repository
 * Local SQLite storage for feeding protocols, daily grain logs, and supplements.
 */

import { FeedingLog } from '../domain/types';
import { DatabaseConnection } from './database';

export class FeedingRepository {
  constructor(private db: DatabaseConnection) {}

  async getAllFeedingLogs(loftId: string): Promise<FeedingLog[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM feeding_logs WHERE loft_id = ? ORDER BY date DESC, created_at DESC`,
      [loftId]
    );
    return rows.map(this.mapRowToFeedingLog);
  }

  async insertFeedingLog(log: FeedingLog): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO feeding_logs (
        id, loft_id, date, phase, mix_name,
        water_supplements, feed_supplements, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.loftId,
        log.date,
        log.phase,
        log.mixName,
        log.waterSupplements || null,
        log.feedSupplements || null,
        log.createdAt,
      ]
    );
  }

  async deleteFeedingLog(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM feeding_logs WHERE id = ?`, [id]);
  }

  private mapRowToFeedingLog(row: any): FeedingLog {
    return {
      id: row.id,
      loftId: row.loft_id,
      date: row.date,
      phase: row.phase,
      mixName: row.mix_name,
      waterSupplements: row.water_supplements || undefined,
      feedSupplements: row.feed_supplements || undefined,
      createdAt: row.created_at,
    };
  }
}

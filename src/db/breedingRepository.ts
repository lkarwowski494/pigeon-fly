/**
 * PIGEON-FLY — Breeding & Clutch Repository
 * Local SQLite storage for pairs, clutches, egg candling, and young bird banding.
 */

import { ClutchRecord, EggStatus } from '../domain/breeding';
import { DatabaseConnection } from './database';

export interface ClutchWithParents extends ClutchRecord {
  cockRingNumber: string;
  henRingNumber: string;
}

export interface ClutchDbRow {
  id: string;
  loft_id: string;
  round_number: number;
  nest_box: string;
  cock_id: string;
  hen_id: string;
  paired_date: string;
  egg1_date: string | null;
  egg2_date: string | null;
  egg1_status: string;
  egg2_status: string;
  hatch_date: string | null;
  chick1_ring_number: string | null;
  chick2_ring_number: string | null;
  chick1_banded: number;
  chick2_banded: number;
  weaned_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  cock_ring: string | null;
  hen_ring: string | null;
}

export class BreedingRepository {
  constructor(private db: DatabaseConnection) {}

  async getAllClutches(loftId: string): Promise<ClutchWithParents[]> {
    const rows = await this.db.getAllAsync<ClutchDbRow>(
      `SELECT
        c.*,
        cock.ring_number AS cock_ring,
        hen.ring_number AS hen_ring
      FROM clutches c
      LEFT JOIN pigeons cock ON cock.id = c.cock_id
      LEFT JOIN pigeons hen ON hen.id = c.hen_id
      WHERE c.loft_id = ?
      ORDER BY c.paired_date DESC`,
      [loftId]
    );

    return rows.map(this.mapRowToClutch);
  }

  async getClutchById(id: string): Promise<ClutchWithParents | null> {
    const row = await this.db.getFirstAsync<ClutchDbRow>(
      `SELECT
        c.*,
        cock.ring_number AS cock_ring,
        hen.ring_number AS hen_ring
      FROM clutches c
      LEFT JOIN pigeons cock ON cock.id = c.cock_id
      LEFT JOIN pigeons hen ON hen.id = c.hen_id
      WHERE c.id = ?`,
      [id]
    );

    return row ? this.mapRowToClutch(row) : null;
  }

  async insertClutch(clutch: ClutchRecord): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO clutches (
        id, loft_id, round_number, nest_box, cock_id, hen_id, paired_date,
        egg1_date, egg2_date, egg1_status, egg2_status, hatch_date,
        chick1_ring_number, chick2_ring_number, chick1_banded, chick2_banded,
        weaned_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clutch.id,
        clutch.loftId,
        clutch.roundNumber,
        clutch.nestBox,
        clutch.cockId,
        clutch.henId,
        clutch.pairedDate,
        clutch.egg1Date || null,
        clutch.egg2Date || null,
        clutch.egg1Status,
        clutch.egg2Status,
        clutch.hatchDate || null,
        clutch.chick1RingNumber || null,
        clutch.chick2RingNumber || null,
        clutch.chick1Banded ? 1 : 0,
        clutch.chick2Banded ? 1 : 0,
        clutch.weanedDate || null,
        clutch.notes || null,
        clutch.createdAt,
        clutch.updatedAt,
      ]
    );
  }

  async updateClutch(clutch: ClutchRecord): Promise<void> {
    await this.db.runAsync(
      `UPDATE clutches SET
        round_number = ?, nest_box = ?, cock_id = ?, hen_id = ?, paired_date = ?,
        egg1_date = ?, egg2_date = ?, egg1_status = ?, egg2_status = ?, hatch_date = ?,
        chick1_ring_number = ?, chick2_ring_number = ?, chick1_banded = ?, chick2_banded = ?,
        weaned_date = ?, notes = ?, updated_at = ?
      WHERE id = ?`,
      [
        clutch.roundNumber,
        clutch.nestBox,
        clutch.cockId,
        clutch.henId,
        clutch.pairedDate,
        clutch.egg1Date || null,
        clutch.egg2Date || null,
        clutch.egg1Status,
        clutch.egg2Status,
        clutch.hatchDate || null,
        clutch.chick1RingNumber || null,
        clutch.chick2RingNumber || null,
        clutch.chick1Banded ? 1 : 0,
        clutch.chick2Banded ? 1 : 0,
        clutch.weanedDate || null,
        clutch.notes || null,
        clutch.updatedAt,
        clutch.id,
      ]
    );
  }

  async deleteClutch(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM clutches WHERE id = ?`, [id]);
  }

  private mapRowToClutch(row: ClutchDbRow): ClutchWithParents {
    return {
      id: row.id,
      loftId: row.loft_id,
      roundNumber: row.round_number,
      nestBox: row.nest_box,
      cockId: row.cock_id,
      henId: row.hen_id,
      pairedDate: row.paired_date,
      egg1Date: row.egg1_date || undefined,
      egg2Date: row.egg2_date || undefined,
      egg1Status: row.egg1_status as EggStatus,
      egg2Status: row.egg2_status as EggStatus,
      hatchDate: row.hatch_date || undefined,
      chick1RingNumber: row.chick1_ring_number || undefined,
      chick2RingNumber: row.chick2_ring_number || undefined,
      chick1Banded: Boolean(row.chick1_banded),
      chick2Banded: Boolean(row.chick2_banded),
      weanedDate: row.weaned_date || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cockRingNumber: row.cock_ring || 'Brak',
      henRingNumber: row.hen_ring || 'Brak',
    };
  }
}

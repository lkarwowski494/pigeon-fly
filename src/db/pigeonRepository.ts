/**
 * PIGEON-FLY — Pigeon Repository
 * Local SQLite CRUD operations with in-memory caching and pedigree building.
 */

import { Pigeon, PedigreeNode } from '../domain/types';
import { DatabaseConnection } from './database';

export interface PigeonDbRow {
  id: string;
  loft_id: string;
  ring_number: string;
  country_code: string;
  year: number;
  sex: Pigeon['sex'];
  plumage_color: string;
  eye_sign: string | null;
  status: Pigeon['status'];
  father_id: string | null;
  mother_id: string | null;
  photo_url: string | null;
  eye_photo_url: string | null;
  wing_photo_url: string | null;
  qr_code_uuid: string;
  notes: string | null;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export class PigeonRepository {
  constructor(private db: DatabaseConnection) {}

  async getAllPigeons(loftId: string): Promise<Pigeon[]> {
    const rows = await this.db.getAllAsync<PigeonDbRow>(
      `SELECT * FROM pigeons WHERE loft_id = ? AND is_deleted = 0 ORDER BY ring_number ASC`,
      [loftId]
    );
    return rows.map(this.mapRowToPigeon);
  }

  async getPigeonById(id: string): Promise<Pigeon | null> {
    const row = await this.db.getFirstAsync<PigeonDbRow>(
      `SELECT * FROM pigeons WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? this.mapRowToPigeon(row) : null;
  }

  async getPigeonByRing(loftId: string, ringNumber: string): Promise<Pigeon | null> {
    const row = await this.db.getFirstAsync<PigeonDbRow>(
      `SELECT * FROM pigeons WHERE loft_id = ? AND ring_number = ? AND is_deleted = 0`,
      [loftId, ringNumber]
    );
    return row ? this.mapRowToPigeon(row) : null;
  }

  async getPigeonByQrUuid(qrCodeUuid: string): Promise<Pigeon | null> {
    const row = await this.db.getFirstAsync<PigeonDbRow>(
      `SELECT * FROM pigeons WHERE qr_code_uuid = ? AND is_deleted = 0`,
      [qrCodeUuid]
    );
    return row ? this.mapRowToPigeon(row) : null;
  }

  async insertPigeon(pigeon: Pigeon): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO pigeons (
        id, loft_id, ring_number, country_code, year, sex, plumage_color, eye_sign,
        status, father_id, mother_id, photo_url, eye_photo_url, wing_photo_url,
        qr_code_uuid, notes, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pigeon.id,
        pigeon.loftId,
        pigeon.ringNumber,
        pigeon.countryCode,
        pigeon.year,
        pigeon.sex,
        pigeon.plumageColor,
        pigeon.eyeSign || null,
        pigeon.status,
        pigeon.fatherId || null,
        pigeon.motherId || null,
        pigeon.photoUrl || null,
        pigeon.eyePhotoUrl || null,
        pigeon.wingPhotoUrl || null,
        pigeon.qrCodeUuid,
        pigeon.notes || null,
        pigeon.isDeleted ? 1 : 0,
        pigeon.createdAt,
        pigeon.updatedAt,
      ]
    );
  }

  async updatePigeon(pigeon: Pigeon): Promise<void> {
    await this.db.runAsync(
      `UPDATE pigeons SET
        ring_number = ?, country_code = ?, year = ?, sex = ?, plumage_color = ?,
        eye_sign = ?, status = ?, father_id = ?, mother_id = ?, photo_url = ?,
        eye_photo_url = ?, wing_photo_url = ?, notes = ?, is_deleted = ?, updated_at = ?
      WHERE id = ?`,
      [
        pigeon.ringNumber,
        pigeon.countryCode,
        pigeon.year,
        pigeon.sex,
        pigeon.plumageColor,
        pigeon.eyeSign || null,
        pigeon.status,
        pigeon.fatherId || null,
        pigeon.motherId || null,
        pigeon.photoUrl || null,
        pigeon.eyePhotoUrl || null,
        pigeon.wingPhotoUrl || null,
        pigeon.notes || null,
        pigeon.isDeleted ? 1 : 0,
        pigeon.updatedAt,
        pigeon.id,
      ]
    );
  }

  async deletePigeon(id: string): Promise<void> {
    // Soft delete
    const now = new Date().toISOString();
    await this.db.runAsync(`UPDATE pigeons SET is_deleted = 1, updated_at = ? WHERE id = ?`, [now, id]);
  }

  /**
   * Recursively builds pedigree tree up to maxGenerations.
   */
  async buildPedigreeTree(
    pigeonId: string,
    maxGenerations = 4,
    currentGeneration = 0
  ): Promise<PedigreeNode | null> {
    const pigeon = await this.getPigeonById(pigeonId);
    if (!pigeon) return null;

    const node: PedigreeNode = {
      pigeon,
      generation: currentGeneration,
    };

    if (currentGeneration < maxGenerations) {
      if (pigeon.fatherId) {
        node.father = await this.buildPedigreeTree(
          pigeon.fatherId,
          maxGenerations,
          currentGeneration + 1
        );
      }
      if (pigeon.motherId) {
        node.mother = await this.buildPedigreeTree(
          pigeon.motherId,
          maxGenerations,
          currentGeneration + 1
        );
      }
    }

    return node;
  }

  private mapRowToPigeon(row: PigeonDbRow): Pigeon {
    return {
      id: row.id,
      loftId: row.loft_id,
      ringNumber: row.ring_number,
      countryCode: row.country_code,
      year: row.year,
      sex: row.sex,
      plumageColor: row.plumage_color,
      eyeSign: row.eye_sign || undefined,
      status: row.status,
      fatherId: row.father_id || undefined,
      motherId: row.mother_id || undefined,
      photoUrl: row.photo_url || undefined,
      eyePhotoUrl: row.eye_photo_url || undefined,
      wingPhotoUrl: row.wing_photo_url || undefined,
      qrCodeUuid: row.qr_code_uuid,
      notes: row.notes || undefined,
      isDeleted: Boolean(row.is_deleted),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

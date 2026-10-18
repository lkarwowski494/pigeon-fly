/**
 * PIGEON-FLY — Race & Arrival Repository
 * Local SQLite storage for training tosses, official races, and live arrival leaderboards.
 */

import { Race, Arrival } from '../domain/types';
import { DatabaseConnection } from './database';

export interface ArrivalWithPigeon extends Arrival {
  ringNumber: string;
  countryCode: string;
  year: number;
  sex: string;
  plumageColor: string;
}

export interface RaceDbRow {
  id: string;
  loft_id: string;
  name: string;
  release_name: string;
  release_lat: number;
  release_lon: number;
  release_time: string;
  category: Race['category'];
  is_training: number;
  neutral_start_time: string | null;
  neutral_end_time: string | null;
  is_live_broadcast: number;
  broadcast_slug: string | null;
  status: Race['status'];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArrivalDbRow {
  id: string;
  race_id: string;
  pigeon_id: string;
  arrival_time: string;
  distance_meters: number;
  velocity_m_per_min: number;
  scan_type: Arrival['scanType'];
  is_manual_override: number;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
  ring_number: string;
  country_code: string;
  year: number;
  sex: string;
  plumage_color: string;
}

export class RaceRepository {
  constructor(private db: DatabaseConnection) {}

  async getAllRaces(loftId: string): Promise<Race[]> {
    const rows = await this.db.getAllAsync<RaceDbRow>(
      `SELECT * FROM races WHERE loft_id = ? ORDER BY release_time DESC`,
      [loftId]
    );
    return rows.map(this.mapRowToRace);
  }

  async getRaceById(id: string): Promise<Race | null> {
    const row = await this.db.getFirstAsync<RaceDbRow>(
      `SELECT * FROM races WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToRace(row) : null;
  }

  async insertRace(race: Race): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO races (
        id, loft_id, name, release_name, release_lat, release_lon,
        release_time, category, is_training, neutral_start_time,
        neutral_end_time, is_live_broadcast, broadcast_slug, status,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        race.id,
        race.loftId,
        race.name,
        race.releaseName,
        race.releaseLat,
        race.releaseLon,
        race.releaseTime,
        race.category,
        race.isTraining ? 1 : 0,
        race.neutralStartTime || null,
        race.neutralEndTime || null,
        race.isLiveBroadcast ? 1 : 0,
        race.broadcastSlug || null,
        race.status,
        race.notes || null,
        race.createdAt,
        race.updatedAt,
      ]
    );
  }

  async recordArrival(arrival: Arrival): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO arrivals (
        id, race_id, pigeon_id, arrival_time, distance_meters,
        velocity_m_per_min, scan_type, is_manual_override,
        override_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        arrival.id,
        arrival.raceId,
        arrival.pigeonId,
        arrival.arrivalTime,
        arrival.distanceMeters,
        arrival.velocityMPerMin,
        arrival.scanType,
        arrival.isManualOverride ? 1 : 0,
        arrival.overrideReason || null,
        arrival.createdAt,
        arrival.updatedAt,
      ]
    );
  }

  async getRaceArrivals(raceId: string): Promise<ArrivalWithPigeon[]> {
    const rows = await this.db.getAllAsync<ArrivalDbRow>(
      `SELECT
        a.*,
        p.ring_number,
        p.country_code,
        p.year,
        p.sex,
        p.plumage_color
      FROM arrivals a
      JOIN pigeons p ON p.id = a.pigeon_id
      WHERE a.race_id = ?
      ORDER BY a.velocity_m_per_min DESC, a.arrival_time ASC`,
      [raceId]
    );

    return rows.map((r) => ({
      id: r.id,
      raceId: r.race_id,
      pigeonId: r.pigeon_id,
      arrivalTime: r.arrival_time,
      distanceMeters: r.distance_meters,
      velocityMPerMin: r.velocity_m_per_min,
      scanType: r.scan_type,
      isManualOverride: Boolean(r.is_manual_override),
      overrideReason: r.override_reason || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      ringNumber: r.ring_number,
      countryCode: r.country_code,
      year: r.year,
      sex: r.sex,
      plumageColor: r.plumage_color,
    }));
  }

  private mapRowToRace(row: RaceDbRow): Race {
    return {
      id: row.id,
      loftId: row.loft_id,
      name: row.name,
      releaseName: row.release_name,
      releaseLat: row.release_lat,
      releaseLon: row.release_lon,
      releaseTime: row.release_time,
      category: row.category,
      isTraining: Boolean(row.is_training),
      neutralStartTime: row.neutral_start_time || undefined,
      neutralEndTime: row.neutral_end_time || undefined,
      isLiveBroadcast: Boolean(row.is_live_broadcast),
      broadcastSlug: row.broadcast_slug || undefined,
      status: row.status,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

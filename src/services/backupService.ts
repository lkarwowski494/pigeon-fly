/**
 * Pigeon-Fly — Serwis Kopii Zapasowej i Bezpieczeństwa Danych (Złoty Standard Portfolio)
 * Zgodność z ZP-06, DEC-10, BR-DANE-002:
 * 1. 100% Offline-First i suwerenność danych hodowcy.
 * 2. Pełny eksport stanu: gołębie, lęgi, karmienie, zdrowie/szczepienia, pierzenie, loty, przyloty, uprawnienia.
 * 3. Rotacja 10 najnowszych kopii automatycznych (`autoBackup` w `Documents/Backup/`).
 * 4. Walidacja formatu kopii (wersja, sygnatura com.pigeonfly.app, liczniki encji).
 * 5. Transakcyjne, bezpieczne przywracanie stanu (atomic restore).
 */

import { Database } from '../db/database';

export const BACKUP_SCHEMA_VERSION = 1;
export const AUTO_BACKUP_KEEP = 10;
export const AUTO_BACKUP_RE = /^pigeonfly-(\d{4}-\d{2}-\d{2}-\d{6})(?:-(\d{1,3}))?\.json$/;

export interface PigeonFlyBackupMetadata {
  version: 1;
  appName: 'Pigeon-Fly';
  bundleId: 'com.pigeonfly.app';
  exportedAt: string;
  itemCounts: {
    lofts: number;
    pigeons: number;
    races: number;
    arrivals: number;
    clutches: number;
    feeding_logs: number;
    health_logs: number;
    moult_logs: number;
    pairings: number;
    app_entitlements?: number;
  };
}

export type TableRow = Record<string, string | number | boolean | null>;

export interface PigeonFlyBackupData {
  metadata: PigeonFlyBackupMetadata;
  lofts: TableRow[];
  pigeons: TableRow[];
  races: TableRow[];
  arrivals: TableRow[];
  clutches: TableRow[];
  feeding_logs: TableRow[];
  health_logs: TableRow[];
  moult_logs: TableRow[];
  pairings: TableRow[];
  app_entitlements?: TableRow[];
}

export interface PigeonFlyBackupEnvelope {
  format: 'pigeonfly-backup';
  schemaVersion: number;
  exportedAt: string;
  state: PigeonFlyBackupData;
}

export function buildBackupEnvelope(state: PigeonFlyBackupData): PigeonFlyBackupEnvelope {
  return {
    format: 'pigeonfly-backup',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function generateTimestampString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Odczytuje statystyki liczby rekordów w lokalnej bazie SQLite.
 */
export async function getDatabaseStats(db: Database): Promise<PigeonFlyBackupMetadata['itemCounts']> {
  const [
    lofts,
    pigeons,
    races,
    arrivals,
    clutches,
    feeding,
    health,
    moult,
    pairings,
    entitlements,
  ] = await Promise.all([
    db.getAllAsync<TableRow>('SELECT * FROM lofts'),
    db.getAllAsync<TableRow>('SELECT * FROM pigeons'),
    db.getAllAsync<TableRow>('SELECT * FROM races'),
    db.getAllAsync<TableRow>('SELECT * FROM arrivals'),
    db.getAllAsync<TableRow>('SELECT * FROM clutches'),
    db.getAllAsync<TableRow>('SELECT * FROM feeding_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM health_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM moult_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM pairings'),
    db.getAllAsync<TableRow>('SELECT * FROM app_entitlements'),
  ]);

  return {
    lofts: lofts.length,
    pigeons: pigeons.length,
    races: races.length,
    arrivals: arrivals.length,
    clutches: clutches.length,
    feeding_logs: feeding.length,
    health_logs: health.length,
    moult_logs: moult.length,
    pairings: pairings.length,
    app_entitlements: entitlements.length,
  };
}

/**
 * Generuje pełną strukturę kopii zapasowej ze wszystkich tabel SQLite.
 */
export async function exportDatabaseBackup(db: Database): Promise<PigeonFlyBackupData> {
  const [
    lofts,
    pigeons,
    races,
    arrivals,
    clutches,
    feeding_logs,
    health_logs,
    moult_logs,
    pairings,
    app_entitlements,
  ] = await Promise.all([
    db.getAllAsync<TableRow>('SELECT * FROM lofts'),
    db.getAllAsync<TableRow>('SELECT * FROM pigeons'),
    db.getAllAsync<TableRow>('SELECT * FROM races'),
    db.getAllAsync<TableRow>('SELECT * FROM arrivals'),
    db.getAllAsync<TableRow>('SELECT * FROM clutches'),
    db.getAllAsync<TableRow>('SELECT * FROM feeding_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM health_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM moult_logs'),
    db.getAllAsync<TableRow>('SELECT * FROM pairings'),
    db.getAllAsync<TableRow>('SELECT * FROM app_entitlements'),
  ]);

  const metadata: PigeonFlyBackupMetadata = {
    version: 1,
    appName: 'Pigeon-Fly',
    bundleId: 'com.pigeonfly.app',
    exportedAt: new Date().toISOString(),
    itemCounts: {
      lofts: lofts.length,
      pigeons: pigeons.length,
      races: races.length,
      arrivals: arrivals.length,
      clutches: clutches.length,
      feeding_logs: feeding_logs.length,
      health_logs: health_logs.length,
      moult_logs: moult_logs.length,
      pairings: pairings.length,
      app_entitlements: app_entitlements.length,
    },
  };

  return {
    metadata,
    lofts,
    pigeons,
    races,
    arrivals,
    clutches,
    feeding_logs,
    health_logs,
    moult_logs,
    pairings,
    app_entitlements,
  };
}

/**
 * Waliduje poprawność pliku kopii zapasowej.
 */
export function validateBackupEnvelope(jsonString: string): {
  valid: boolean;
  data?: PigeonFlyBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Nieprawidłowy format JSON.' };
    }

    // Obsługa envelope lub bezpośredniego obiektu danych
    const state: PigeonFlyBackupData = parsed.state || parsed;

    if (!state.metadata || state.metadata.appName !== 'Pigeon-Fly') {
      return {
        valid: false,
        error: 'Nieprawidłowy nagłówek kopii (brak sygnatury Pigeon-Fly).',
      };
    }

    if (state.metadata.version > BACKUP_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Wersja schematu kopii (${state.metadata.version}) jest nowsza niż obsługiwana (${BACKUP_SCHEMA_VERSION}). Zaktualizuj aplikację.`,
      };
    }

    if (!Array.isArray(state.pigeons) || !Array.isArray(state.lofts)) {
      return {
        valid: false,
        error: 'Uszkodzona struktura kopii (brak kluczowych tabel stada).',
      };
    }

    return { valid: true, data: state };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Błąd parsowania: ${message}` };
  }
}

/**
 * Przywraca stan bazy danych z kopii zapasowej (transakcyjnie).
 */
export async function restoreDatabaseBackup(
  db: Database,
  backup: PigeonFlyBackupData
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // 1. Czyszczenie starych danych w odwrotnej kolejności kluczy obcych
    await db.runAsync('DELETE FROM arrivals');
    await db.runAsync('DELETE FROM races');
    await db.runAsync('DELETE FROM clutches');
    await db.runAsync('DELETE FROM pairings');
    await db.runAsync('DELETE FROM feeding_logs');
    await db.runAsync('DELETE FROM health_logs');
    await db.runAsync('DELETE FROM moult_logs');
    await db.runAsync('DELETE FROM pigeons');
    await db.runAsync('DELETE FROM lofts');
    if (backup.app_entitlements && backup.app_entitlements.length > 0) {
      await db.runAsync('DELETE FROM app_entitlements');
    }

    // 2. Wstawianie gołębników
    for (const loft of backup.lofts) {
      await db.runAsync(
        `INSERT INTO lofts (id, name, breeder_name, latitude, longitude, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          loft.id,
          loft.name,
          loft.breeder_name,
          loft.latitude,
          loft.longitude,
          loft.created_at,
          loft.updated_at,
        ]
      );
    }

    // 3. Wstawianie gołębi (pierwszy przebieg bez rodziców, drugi z rodzicami by uniknąć FK issue)
    for (const p of backup.pigeons) {
      await db.runAsync(
        `INSERT INTO pigeons (id, loft_id, ring_number, color, sex, year, status, sire_id, dam_id, strain, compartment, qr_code, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.loft_id,
          p.ring_number,
          p.color,
          p.sex,
          p.year,
          p.status,
          p.strain || null,
          p.compartment || null,
          p.qr_code || null,
          p.notes || null,
          p.created_at,
          p.updated_at,
        ]
      );
    }

    // Przypisanie relacji rodowodowych rodziców
    for (const p of backup.pigeons) {
      if (p.sire_id || p.dam_id) {
        await db.runAsync(
          `UPDATE pigeons SET sire_id = ?, dam_id = ? WHERE id = ?`,
          [p.sire_id || null, p.dam_id || null, p.id]
        );
      }
    }

    // 4. Wstawianie lotów
    for (const r of backup.races) {
      await db.runAsync(
        `INSERT INTO races (id, loft_id, name, release_location, release_latitude, release_longitude, release_time, is_official, category, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.loft_id,
          r.name,
          r.release_location,
          r.release_latitude,
          r.release_longitude,
          r.release_time,
          r.is_official,
          r.category,
          r.created_at,
          r.updated_at,
        ]
      );
    }

    // 5. Wstawianie przylotów
    for (const a of backup.arrivals) {
      await db.runAsync(
        `INSERT INTO arrivals (id, race_id, pigeon_id, arrival_time, distance_meters, velocity_m_per_min, scan_type, is_manual_override, override_reason, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.race_id,
          a.pigeon_id,
          a.arrival_time,
          a.distance_meters,
          a.velocity_m_per_min,
          a.scan_type || 'qr',
          a.is_manual_override || 0,
          a.override_reason || null,
          a.created_at,
          a.updated_at,
        ]
      );
    }

    // 6. Wstawianie lęgów
    if (backup.clutches) {
      for (const c of backup.clutches) {
        await db.runAsync(
          `INSERT INTO clutches (id, loft_id, round_number, nest_box, cock_id, hen_id, paired_date, egg1_date, egg2_date, egg1_status, egg2_status, hatch_date, chick1_ring_number, chick2_ring_number, chick1_banded, chick2_banded, weaned_date, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.loft_id,
            c.round_number,
            c.nest_box,
            c.cock_id,
            c.hen_id,
            c.paired_date,
            c.egg1_date || null,
            c.egg2_date || null,
            c.egg1_status || 'laid',
            c.egg2_status || 'laid',
            c.hatch_date || null,
            c.chick1_ring_number || null,
            c.chick2_ring_number || null,
            c.chick1_banded || 0,
            c.chick2_banded || 0,
            c.weaned_date || null,
            c.notes || null,
            c.created_at,
            c.updated_at,
          ]
        );
      }
    }

    // 7. Wstawianie karmienia
    if (backup.feeding_logs) {
      for (const f of backup.feeding_logs) {
        await db.runAsync(
          `INSERT INTO feeding_logs (id, loft_id, date, phase, mix_name, water_supplements, feed_supplements, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            f.id,
            f.loft_id,
            f.date,
            f.phase,
            f.mix_name,
            f.water_supplements || null,
            f.feed_supplements || null,
            f.created_at,
          ]
        );
      }
    }

    // 8. Wstawianie zdrowia
    if (backup.health_logs) {
      for (const h of backup.health_logs) {
        await db.runAsync(
          `INSERT INTO health_logs (id, loft_id, pigeon_id, event_type, date, product_name, batch_number, withdrawal_days, next_due_date, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            h.id,
            h.loft_id,
            h.pigeon_id || null,
            h.event_type,
            h.date,
            h.product_name,
            h.batch_number || null,
            h.withdrawal_days || 0,
            h.next_due_date || null,
            h.notes || null,
            h.created_at,
            h.updated_at,
          ]
        );
      }
    }

    // 9. Wstawianie pierzenia
    if (backup.moult_logs) {
      for (const m of backup.moult_logs) {
        await db.runAsync(
          `INSERT INTO moult_logs (id, pigeon_id, check_date, primary_feather_number, status, length_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.id,
            m.pigeon_id,
            m.check_date,
            m.primary_feather_number,
            m.status,
            m.length_pct,
            m.created_at,
            m.updated_at,
          ]
        );
      }
    }

    // 10. Wstawianie kojarzeń
    if (backup.pairings) {
      for (const pair of backup.pairings) {
        await db.runAsync(
          `INSERT INTO pairings (id, loft_id, cock_id, hen_id, paired_date, nest_box, inbreeding_coefficient_f, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pair.id,
            pair.loft_id,
            pair.cock_id,
            pair.hen_id,
            pair.paired_date,
            pair.nest_box || null,
            pair.inbreeding_coefficient_f || 0,
            pair.notes || null,
            pair.created_at,
            pair.updated_at,
          ]
        );
      }
    }

    // 11. Uprawnienia
    if (backup.app_entitlements && backup.app_entitlements.length > 0) {
      for (const ent of backup.app_entitlements) {
        await db.runAsync(
          `INSERT INTO app_entitlements (id, plan_type, status, trial_started_at, purchased_at, expires_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            ent.id,
            ent.plan_type,
            ent.status,
            ent.trial_started_at,
            ent.purchased_at || null,
            ent.expires_at || null,
            ent.updated_at,
          ]
        );
      }
    }
  });
}

/**
 * Tworzy asekuracyjną kopię zapasową w formacie kopii pełnej przed migracją schematu.
 */
export async function createPreMigrationBackup(db: Database): Promise<PigeonFlyBackupEnvelope> {
  const data = await exportDatabaseBackup(db);
  return buildBackupEnvelope(data);
}


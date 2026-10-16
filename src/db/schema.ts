/**
 * PIGEON-FLY — Local SQLite Database Schema
 * Embedded relational database for zero-latency 100% offline field operation in the loft.
 */

export const SQLITE_INIT_PRAGMAS = `
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`;

export const SQLITE_SCHEMA_V1 = `
  -- 1. Lofts
  CREATE TABLE IF NOT EXISTS lofts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'PL',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 2. Pigeons (Stado i Rodowody)
  CREATE TABLE IF NOT EXISTS pigeons (
    id TEXT PRIMARY KEY,
    loft_id TEXT NOT NULL,
    ring_number TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'PL',
    year INTEGER NOT NULL,
    sex TEXT NOT NULL DEFAULT 'unknown',
    plumage_color TEXT NOT NULL DEFAULT 'niebieski',
    eye_sign TEXT,
    status TEXT NOT NULL DEFAULT 'racing',
    father_id TEXT,
    mother_id TEXT,
    photo_url TEXT,
    eye_photo_url TEXT,
    wing_photo_url TEXT,
    qr_code_uuid TEXT NOT NULL UNIQUE,
    notes TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
    FOREIGN KEY (father_id) REFERENCES pigeons(id) ON DELETE SET NULL,
    FOREIGN KEY (mother_id) REFERENCES pigeons(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pigeons_loft ON pigeons(loft_id);
  CREATE INDEX IF NOT EXISTS idx_pigeons_ring ON pigeons(ring_number);
  CREATE INDEX IF NOT EXISTS idx_pigeons_qr ON pigeons(qr_code_uuid);
  CREATE INDEX IF NOT EXISTS idx_pigeons_parents ON pigeons(father_id, mother_id);

  -- 3. Races (Treningi i Loty Konkursowe)
  CREATE TABLE IF NOT EXISTS races (
    id TEXT PRIMARY KEY,
    loft_id TEXT NOT NULL,
    name TEXT NOT NULL,
    release_name TEXT NOT NULL,
    release_lat REAL NOT NULL,
    release_lon REAL NOT NULL,
    release_time TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'short',
    is_training INTEGER NOT NULL DEFAULT 0,
    neutral_start_time TEXT,
    neutral_end_time TEXT,
    is_live_broadcast INTEGER NOT NULL DEFAULT 0,
    broadcast_slug TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_races_loft ON races(loft_id);

  -- 4. Arrivals (Przyloty i Wyliczone Prędkości)
  CREATE TABLE IF NOT EXISTS arrivals (
    id TEXT PRIMARY KEY,
    race_id TEXT NOT NULL,
    pigeon_id TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    distance_meters REAL NOT NULL,
    velocity_m_per_min REAL NOT NULL,
    scan_type TEXT NOT NULL DEFAULT 'qr',
    is_manual_override INTEGER NOT NULL DEFAULT 0,
    override_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(race_id, pigeon_id),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_arrivals_race_speed ON arrivals(race_id, velocity_m_per_min DESC);

  -- 5. Pairings (Rozpłód i Inbred)
  CREATE TABLE IF NOT EXISTS pairings (
    id TEXT PRIMARY KEY,
    loft_id TEXT NOT NULL,
    cock_id TEXT NOT NULL,
    hen_id TEXT NOT NULL,
    paired_date TEXT NOT NULL,
    nest_box TEXT,
    inbreeding_coefficient_f REAL NOT NULL DEFAULT 0.0,
    egg1_date TEXT,
    egg2_date TEXT,
    owoscopy_date TEXT,
    ring_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
    FOREIGN KEY (cock_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    FOREIGN KEY (hen_id) REFERENCES pigeons(id) ON DELETE CASCADE
  );

  -- 6. Health Logs (Profilaktyka, Szczepienia i Karencja)
  CREATE TABLE IF NOT EXISTS health_logs (
    id TEXT PRIMARY KEY,
    loft_id TEXT NOT NULL,
    pigeon_id TEXT,
    event_type TEXT NOT NULL,
    date TEXT NOT NULL,
    product_name TEXT NOT NULL,
    batch_number TEXT,
    withdrawal_days INTEGER NOT NULL DEFAULT 0,
    next_due_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_health_loft_date ON health_logs(loft_id, date);

  -- 7. Moult Logs (Cykl Pierzenia — 10 Lotek)
  CREATE TABLE IF NOT EXISTS moult_logs (
    id TEXT PRIMARY KEY,
    pigeon_id TEXT NOT NULL,
    check_date TEXT NOT NULL,
    primary_feather_number INTEGER NOT NULL CHECK (primary_feather_number BETWEEN 1 AND 10),
    status TEXT NOT NULL DEFAULT 'intact',
    length_pct INTEGER NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(pigeon_id, primary_feather_number, check_date),
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE
  );

  -- 8. Offline Mutation Sync Queue (Delta Sync z Supabase)
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    client_mutation_id TEXT NOT NULL UNIQUE,
    loft_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload TEXT NOT NULL, -- JSON
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
`;

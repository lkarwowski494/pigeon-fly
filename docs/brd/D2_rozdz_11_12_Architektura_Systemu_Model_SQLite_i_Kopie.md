# Rozdziały 11–12: Architektura Hybrydowa, Schemat DDL Supabase PostgreSQL, SQLite i Protokół Synchronizacji (D2)
## Pigeon-Fly · Pełna Architektura Bazy Danych i Silnika Chmurowego

---

# Rozdział 11: Architektura Hybrydowa i Schemat PostgreSQL dla Supabase

### 11.1. Model Hybrydowy: SQLite WAL $\leftrightarrow$ Supabase PostgreSQL 16
Aplikacja Pigeon-Fly łączy suwerenność danych i odporność polową bazy **SQLite 3 (tryb WAL)** z globalną skalowalnością i funkcjami czasu rzeczywistego platformy **Supabase**:

```
                       ARCHITEKTURA HYBRYDOWA PIGEON-FLY
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         URZĄDZENIE MOBILNE (KLIENT)                         │
 │                                                                             │
 │  ┌─────────────────────────┐          ┌──────────────────────────────────┐  │
 │  │ Interfejs Użytkownika   │          │ Silnik Synchronizacji w Tle      │  │
 │  │ (React Native / Field)  │          │ (Delta Sync Engine + SyncQueue)  │  │
 │  └────────────┬────────────┘          └─────────────────┬────────────────┘  │
 │               │ (Zapis natychmiastowy)                  │                   │
 │  ┌────────────▼─────────────────────────────────────────▼────────────────┐  │
 │  │                 LOKALNA BAZA DANYCH SQLITE 3 (TRYB WAL)               │  │
 │  │  birds · races · race_arrivals · moulting_records · sync_queue        │  │
 │  └──────────────────────────────────────────────────────┬────────────────┘  │
 └─────────────────────────────────────────────────────────┼───────────────────┘
                                                           │ (Asynchroniczna replikacja)
                                                           │ (HTTPS PostgREST / WSS Realtime)
 ┌─────────────────────────────────────────────────────────▼───────────────────┐
 │                           CHMURA SUPABASE (BACKEND)                         │
 │                                                                             │
 │  ┌───────────────────────────────────────────────────────────────────────┐  │
 │  │                      POSTGRESQL 16 Z ROW LEVEL SECURITY (RLS)         │  │
 │  │  lofts · loft_members · birds · races · race_arrivals · pedigrees     │  │
 │  └───────────────────────────────────┬───────────────────────────────────┘  │
 │                                      │                                      │
 │  ┌───────────────────┬───────────────┴───┬───────────────────────────────┐  │
 │  │ SUPABASE REALTIME │ SUPABASE STORAGE  │     SUPABASE EDGE FUNCTIONS   │  │
 │  │ (Live Broadcast   │ (Zdjęcia 4K Oka   │ (Powiadomienia Push APNs      │  │
 │  │  WebSockets)      │  i Certyfikaty)   │  dla Lost & Found, Brama IoT) │  │
 │  └───────────────────┴───────────────────┴───────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

### 11.2. Kompletny Schemat DDL PostgreSQL dla Supabase (Tabele i RLS)

```sql
-- Włączenie rozszerzeń kryptograficznych i UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela Gołębników (Lofts)
CREATE TABLE IF NOT EXISTS public.lofts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    loft_name TEXT NOT NULL DEFAULT 'Mój Gołębnik',
    breeder_name TEXT NOT NULL DEFAULT 'Mistrz',
    club_name TEXT,
    section_code TEXT,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 52.229676,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 21.012229,
    official_distance_m DOUBLE PRECISION,
    is_public_live_enabled BOOLEAN NOT NULL DEFAULT false,
    live_channel_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Włączenie RLS
ALTER TABLE public.lofts ENABLE ROW LEVEL SECURITY;

-- 2. Tabela Członków Tandemu Hodowlanego (Loft Members)
CREATE TABLE IF NOT EXISTS public.loft_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MEMBER', 'VIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(loft_id, user_id)
);

ALTER TABLE public.loft_members ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla Gołębników i Członków Tandemu
CREATE POLICY "Właściciel i członkowie mają dostęp do swojego gołębnika"
    ON public.lofts FOR ALL
    USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM public.loft_members 
            WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Zarządzanie członkami tandemu tylko przez właściciela"
    ON public.loft_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = loft_members.loft_id AND lofts.owner_id = auth.uid()
        )
    );

-- 3. Tabela Główna Gołębi (Birds)
CREATE TABLE IF NOT EXISTS public.birds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    ring_country TEXT NOT NULL DEFAULT 'PL',
    ring_branch TEXT NOT NULL DEFAULT '0123',
    ring_year INTEGER NOT NULL,
    ring_number TEXT NOT NULL,
    auxiliary_ring_code TEXT,
    marker_color TEXT,
    sex TEXT NOT NULL CHECK (sex IN ('MALE', 'FEMALE', 'UNKNOWN')),
    color_code TEXT NOT NULL DEFAULT 'NIEBIESKA',
    status TEXT NOT NULL DEFAULT 'LOTOWY' CHECK (
        status IN ('ROZPLODOWY', 'LOTOWY', 'MLODY', 'W_GNIEZDZIE', 'SPRZEDANY', 'ZAGINIONY', 'ZSZEDL')
    ),
    sire_id UUID REFERENCES public.birds(id) ON DELETE SET NULL,
    dam_id UUID REFERENCES public.birds(id) ON DELETE SET NULL,
    compartment_name TEXT,
    nest_box_number INTEGER,
    photo_profile_url TEXT,
    photo_eye_url TEXT,
    photo_wing_url TEXT,
    eye_sign_notes TEXT,
    inbreeding_coeff DOUBLE PRECISION DEFAULT 0.0,
    structural_score INTEGER DEFAULT 0,
    is_public_pedigree BOOLEAN DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(loft_id, ring_country, ring_year, ring_number)
);

ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do ptaków dla uprawnionych członków gołębnika"
    ON public.birds FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = birds.loft_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

-- 4. Tabela Zawodów i Treningów (Races)
CREATE TABLE IF NOT EXISTS public.races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    race_type TEXT NOT NULL CHECK (race_type IN ('TRENING', 'ZAWODY_OFICJALNE')),
    fci_category TEXT NOT NULL DEFAULT 'A' CHECK (fci_category IN ('A', 'B', 'C', 'M', 'E', 'F')),
    release_point_name TEXT NOT NULL,
    release_latitude DOUBLE PRECISION NOT NULL,
    release_longitude DOUBLE PRECISION NOT NULL,
    release_timestamp TIMESTAMPTZ NOT NULL,
    neutralization_start TIMESTAMPTZ,
    neutralization_end TIMESTAMPTZ,
    wind_speed_kmh DOUBLE PRECISION DEFAULT 0.0,
    wind_direction_deg DOUBLE PRECISION DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_live_broadcast BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do zawodów dla członków gołębnika"
    ON public.races FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = races.loft_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

-- 5. Tabela Rejestracji Przylotów z Obsługą Realtime (Race Arrivals)
CREATE TABLE IF NOT EXISTS public.race_arrivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
    bird_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
    arrival_timestamp TIMESTAMPTZ NOT NULL,
    duration_minutes DOUBLE PRECISION NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    speed_mpm DOUBLE PRECISION NOT NULL,
    aero_speed_mpm DOUBLE PRECISION,
    coeff DOUBLE PRECISION,
    arrival_source TEXT NOT NULL CHECK (arrival_source IN ('QR_CAMERA', 'APPLE_WATCH', 'MANUAL', 'BLE_IOT')),
    position_in_loft INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(race_id, bird_id)
);

ALTER TABLE public.race_arrivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do przylotów dla członków gołębnika"
    ON public.race_arrivals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.races 
            JOIN public.lofts ON lofts.id = races.loft_id
            WHERE races.id = race_arrivals.race_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

-- Publiczny odczyt dla transmisji Live Broadcast (jeśli włączona)
CREATE POLICY "Publiczny podgląd przylotów dla aktywnych transmisji live"
    ON public.race_arrivals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.races 
            WHERE races.id = race_arrivals.race_id AND races.is_live_broadcast = true
        )
    );

-- Włączenie publikacji Realtime dla przylotów
ALTER PUBLICATION supabase_realtime ADD TABLE public.race_arrivals;

-- 6. Tabela Zweryfikowanych Certyfikatów Rodowodów Online (Anti-Counterfeit Registry)
CREATE TABLE IF NOT EXISTS public.verified_pedigrees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    bird_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
    public_token TEXT UNIQUE NOT NULL, -- Krótki identyfikator pod kodem QR
    pedigree_hash_sha256 TEXT NOT NULL,
    pedigree_data_json JSONB NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.verified_pedigrees ENABLE ROW LEVEL SECURITY;

-- Każdy może odczytać publiczny certyfikat rodowodu pod tokenem QR
CREATE POLICY "Każdy może zweryfikować rodowód pod publicznym tokenem"
    ON public.verified_pedigrees FOR SELECT
    USING (is_revoked = false);

-- 7. Tabela Globalnej Sieci Pomocy Zagubionym Ptakom (Lost & Found)
CREATE TABLE IF NOT EXISTS public.lost_pigeon_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_country TEXT NOT NULL,
    ring_year INTEGER NOT NULL,
    ring_number TEXT NOT NULL,
    finder_phone TEXT NOT NULL,
    finder_email TEXT,
    finder_location_name TEXT,
    finder_latitude DOUBLE PRECISION,
    finder_longitude DOUBLE PRECISION,
    photo_url TEXT,
    is_contact_made BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lost_pigeon_reports ENABLE ROW LEVEL SECURITY;

-- Znalazca może zgłosić ptaka anonimowo
CREATE POLICY "Znalazca może dodać zgłoszenie ptaka"
    ON public.lost_pigeon_reports FOR INSERT
    WITH CHECK (true);

-- Właściciel ptaka widzi zgłoszenie
CREATE POLICY "Właściciel ptaka widzi zgłoszenia swoich zagubionych gołębi"
    ON public.lost_pigeon_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.birds 
            JOIN public.lofts ON lofts.id = birds.loft_id
            WHERE birds.ring_country = lost_pigeon_reports.ring_country
              AND birds.ring_year = lost_pigeon_reports.ring_year
              AND birds.ring_number = lost_pigeon_reports.ring_number
              AND lofts.owner_id = auth.uid()
        )
    );
-- 8. Tabela Lęgów, Jaj i Piskląt (Clutches)
CREATE TABLE IF NOT EXISTS public.clutches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL DEFAULT 1,
    nest_box TEXT NOT NULL,
    cock_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
    hen_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
    paired_date TIMESTAMPTZ NOT NULL,
    egg1_date TIMESTAMPTZ,
    egg2_date TIMESTAMPTZ,
    egg1_status TEXT NOT NULL DEFAULT 'laid' CHECK (egg1_status IN ('laid', 'fertile', 'infertile', 'broken', 'dead_in_shell')),
    egg2_status TEXT NOT NULL DEFAULT 'laid' CHECK (egg2_status IN ('laid', 'fertile', 'infertile', 'broken', 'dead_in_shell')),
    hatch_date TIMESTAMPTZ,
    chick1_ring_number TEXT,
    chick2_ring_number TEXT,
    chick1_banded BOOLEAN NOT NULL DEFAULT false,
    chick2_banded BOOLEAN NOT NULL DEFAULT false,
    weaned_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clutches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do lęgów dla członków gołębnika"
    ON public.clutches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = clutches.loft_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE INDEX IF NOT EXISTS idx_clutches_loft ON public.clutches(loft_id);
CREATE INDEX IF NOT EXISTS idx_clutches_parents ON public.clutches(cock_id, hen_id);

-- 9. Tabela Żywienia i Suplementacji (Feeding Logs)
CREATE TABLE IF NOT EXISTS public.feeding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('racing_widowhood', 'breeding_reproduction', 'autumn_moult', 'winter_rest')),
    mix_name TEXT NOT NULL,
    water_supplements JSONB,
    feed_supplements JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do żywienia dla członków gołębnika"
    ON public.feeding_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = feeding_logs.loft_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE INDEX IF NOT EXISTS idx_feeding_loft_date ON public.feeding_logs(loft_id, date);

-- 10. Tabela Zdrowia, Szczepień i E-Książki Leczenia PIW (Health Logs)
CREATE TABLE IF NOT EXISTS public.health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
    bird_id UUID REFERENCES public.birds(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('vaccination', 'treatment', 'deworming', 'lab_test', 'supplement')),
    date DATE NOT NULL,
    product_name TEXT NOT NULL,
    batch_number TEXT,
    withdrawal_days INTEGER NOT NULL DEFAULT 0,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp do dokumentacji weterynaryjnej dla członków gołębnika"
    ON public.health_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lofts 
            WHERE lofts.id = health_logs.loft_id AND (
                lofts.owner_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.loft_members 
                    WHERE loft_members.loft_id = lofts.id AND loft_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE INDEX IF NOT EXISTS idx_health_loft_date ON public.health_logs(loft_id, date);
```

---

# Rozdział 12: Pełny Model Relacyjny SQLite i Protokół Delta Sync

### 12.1. Zunifikowany Schemat Relacyjny SQLite (10 Tabel Wzorcowych)
Lokalna baza SQLite na urządzeniu mobilnym (iOS/Android) działa w trybie **Write-Ahead Logging (WAL)** i zawiera wierne odwzorowanie struktur domenowych:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. Lofts
CREATE TABLE IF NOT EXISTS lofts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  breeder_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Pigeons (Stado)
CREATE TABLE IF NOT EXISTS pigeons (
  id TEXT PRIMARY KEY,
  loft_id TEXT NOT NULL,
  ring_number TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('cock', 'hen')),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'breeder', 'racer', 'young', 'sold', 'lost', 'deceased')),
  sire_id TEXT,
  dam_id TEXT,
  strain TEXT,
  compartment TEXT,
  qr_code TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
  FOREIGN KEY (sire_id) REFERENCES pigeons(id) ON DELETE SET NULL,
  FOREIGN KEY (dam_id) REFERENCES pigeons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pigeons_ring ON pigeons(ring_number);
CREATE INDEX IF NOT EXISTS idx_pigeons_loft ON pigeons(loft_id);

-- 3. Races (Loty)
CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  loft_id TEXT NOT NULL,
  name TEXT NOT NULL,
  release_location TEXT NOT NULL,
  release_latitude REAL NOT NULL,
  release_longitude REAL NOT NULL,
  release_time TEXT NOT NULL,
  is_official INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'A' CHECK (category IN ('A', 'B', 'C', 'M', 'marathon')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE
);

-- 4. Arrivals (Przyloty i Prędkość m/min)
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

-- 5. Clutches (Lęgi, Jaja i Odchów Piskląt)
CREATE TABLE IF NOT EXISTS clutches (
  id TEXT PRIMARY KEY,
  loft_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  nest_box TEXT NOT NULL,
  cock_id TEXT NOT NULL,
  hen_id TEXT NOT NULL,
  paired_date TEXT NOT NULL,
  egg1_date TEXT,
  egg2_date TEXT,
  egg1_status TEXT NOT NULL DEFAULT 'laid',
  egg2_status TEXT NOT NULL DEFAULT 'laid',
  hatch_date TEXT,
  chick1_ring_number TEXT,
  chick2_ring_number TEXT,
  chick1_banded INTEGER NOT NULL DEFAULT 0,
  chick2_banded INTEGER NOT NULL DEFAULT 0,
  weaned_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
  FOREIGN KEY (cock_id) REFERENCES pigeons(id) ON DELETE CASCADE,
  FOREIGN KEY (hen_id) REFERENCES pigeons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clutches_loft ON clutches(loft_id);
CREATE INDEX IF NOT EXISTS idx_clutches_parents ON clutches(cock_id, hen_id);

-- 6. Feeding Logs (Dziennik Karmy i Suplementacji)
CREATE TABLE IF NOT EXISTS feeding_logs (
  id TEXT PRIMARY KEY,
  loft_id TEXT NOT NULL,
  date TEXT NOT NULL,
  phase TEXT NOT NULL,
  mix_name TEXT NOT NULL,
  water_supplements TEXT,
  feed_supplements TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feeding_loft_date ON feeding_logs(loft_id, date);

-- 7. Health Logs (Zdrowie, Szczepienia i Karencja)
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

-- 8. Moult Logs (Cykl Pierzenia — 10 Lotek)
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

-- 9. Pairings (Kojarzenie Par i Symulacja Inbredu Wrighta)
CREATE TABLE IF NOT EXISTS pairings (
  id TEXT PRIMARY KEY,
  loft_id TEXT NOT NULL,
  cock_id TEXT NOT NULL,
  hen_id TEXT NOT NULL,
  paired_date TEXT NOT NULL,
  nest_box TEXT,
  inbreeding_coefficient_f REAL NOT NULL DEFAULT 0.0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE,
  FOREIGN KEY (cock_id) REFERENCES pigeons(id) ON DELETE CASCADE,
  FOREIGN KEY (hen_id) REFERENCES pigeons(id) ON DELETE CASCADE
);

-- 10. Sync Queue (Kolejka Mutacji Delta Offline)
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
```

### 12.2. Protokół Asynchronicznej Replikacji Delta (Offline-First $\leftrightarrow$ Supabase)
1. **Zasada Niezmienności Zapisu Lokalnego:**
   Każda zmiana w aplikacji (dodanie jaja, przylot ze skanera QR, zmiana diety) natychmiast zapisuje się w SQLite i wstawia rekord do `sync_queue`. Interfejs odblokowuje się w ułamku milisekundy.
2. **Mechanizm Wypychania (Push):**
   Gdy urządzenie odzyskuje łączność, kolejka mutacji `sync_queue` jest przetwarzana w transakcyjnych paczkach do 50 elementów przez `POST /rest/v1/rpc/sync_push_batch`. Po potwierdzeniu `HTTP 200 OK` przetworzone mutacje są usuwane.
3. **Mechanizm Pobierania (Pull) i Rozstrzyganie Konfliktów:**
   Pobierane są wyłącznie rekordy o `updated_at > last_sync_time`. Konflikty rozstrzygane są deterministycznie w oparciu o regułę **Last-Write-Wins (LWW)** według zweryfikowanego serwerowego znacznika czasu, zapobiegając nadpisaniu danych przez zegary urządzeń mobilnych o błędnej dacie.


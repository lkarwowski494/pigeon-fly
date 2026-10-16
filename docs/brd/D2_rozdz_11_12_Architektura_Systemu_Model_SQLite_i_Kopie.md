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
 │  │ (SwiftUI / Field Mode)  │          │ (Delta Sync Engine + SyncQueue)  │  │
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
```

---

# Rozdział 12: Protokół Synchronizacji Dwukierunkowej (Delta Sync)

### 12.1. Architektura Kolejki Mutacji (`sync_queue` w SQLite)
Na urządzeniu mobilnym każda operacja zapisu wykonuje w jednej transakcji lokalny zapis oraz wstawienie rekordu do tabeli `sync_queue`:

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name TEXT NOT NULL,       -- 'birds', 'races', 'race_arrivals'
    entity_id TEXT NOT NULL,         -- UUID
    operation TEXT NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 12.2. Algorytm Wypychania i Pobierania (Push / Pull Engine w Swift)
1. **Faza PUSH (Wypychanie lokalnych zmian do Supabase):**
   - Po wykryciu sieci (`NWPathMonitor.currentPath.status == .satisfied`), silnik pobiera do 50 oczekujących rekordów z `sync_queue`.
   - Wysyła paczkę do procedury składowanej RPC w PostgreSQL: `sync_push_batch(payload)`.
   - Po otrzymaniu statusu HTTP 200, przetworzone rekordy są usuwane z lokalnej `sync_queue`.
2. **Faza PULL (Pobieranie zmian z chmury):**
   - Silnik wysyła zapytanie:
     ```
     GET /rest/v1/birds?updated_at=gt.[LAST_SYNC_TIMESTAMP]&loft_id=eq.[LOFT_ID]
     ```
   - Pobrane rekordy aktualizują lokalną bazę SQLite z rozstrzyganiem konfliktów według zasady Last-Write-Wins (LWW) w oparciu o `updated_at`.

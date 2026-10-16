-- ============================================================================
-- PIGEON-FLY (Cyfrowy Notes Mistrza) — Initial Supabase PostgreSQL Schema
-- Migration: 20261016000001_pigeon_fly_initial.sql
-- Architecture: Hybrid Offline-First (SQLite Local <-> Supabase PostgreSQL 16)
-- Security: Row Level Security (RLS) with Multi-tenant Tandem Loft Support
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enum Types
DO $$ BEGIN
  CREATE TYPE sex_type AS ENUM ('cock', 'hen', 'unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pigeon_status AS ENUM ('racing', 'breeding', 'retired', 'sold', 'lost', 'deceased');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE loft_role AS ENUM ('owner', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE race_category AS ENUM ('short', 'middle', 'long', 'marathon', 'young_birds');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE feather_status AS ENUM ('intact', 'dropped', 'regrowing', 'full');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Lofts (Gołębniki)
CREATE TABLE IF NOT EXISTS public.lofts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL DEFAULT 'PL',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Loft Members (Zespoły hodowlane / Tandemy)
CREATE TABLE IF NOT EXISTS public.loft_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role loft_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(loft_id, user_id)
);

-- Helper security functions for RLS
CREATE OR REPLACE FUNCTION public.is_loft_member(check_loft_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lofts WHERE id = check_loft_id AND owner_id = check_user_id
    UNION
    SELECT 1 FROM public.loft_members WHERE loft_id = check_loft_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_loft(check_loft_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lofts WHERE id = check_loft_id AND owner_id = check_user_id
    UNION
    SELECT 1 FROM public.loft_members WHERE loft_id = check_loft_id AND user_id = check_user_id AND role IN ('owner', 'member')
  );
$$;

-- 3. Pigeons (Ptaki / Stado)
CREATE TABLE IF NOT EXISTS public.pigeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  ring_number TEXT NOT NULL,
  country_code VARCHAR(4) NOT NULL DEFAULT 'PL',
  year INTEGER NOT NULL,
  sex sex_type NOT NULL DEFAULT 'unknown',
  plumage_color TEXT NOT NULL DEFAULT 'niebieski',
  eye_sign TEXT,
  status pigeon_status NOT NULL DEFAULT 'racing',
  father_id UUID REFERENCES public.pigeons(id) ON DELETE SET NULL,
  mother_id UUID REFERENCES public.pigeons(id) ON DELETE SET NULL,
  photo_url TEXT,
  eye_photo_url TEXT,
  wing_photo_url TEXT,
  qr_code_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(loft_id, ring_number, year)
);

-- 4. Races (Treningi i Loty Konkursowe)
CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  release_name TEXT NOT NULL,
  release_lat DOUBLE PRECISION NOT NULL,
  release_lon DOUBLE PRECISION NOT NULL,
  release_time TIMESTAMPTZ NOT NULL,
  category race_category NOT NULL DEFAULT 'short',
  is_training BOOLEAN NOT NULL DEFAULT false,
  neutral_start_time TIME,
  neutral_end_time TIME,
  is_live_broadcast BOOLEAN NOT NULL DEFAULT false,
  broadcast_slug TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Arrivals (Przyloty i Prędkości w m/min)
CREATE TABLE IF NOT EXISTS public.arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  pigeon_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  arrival_time TIMESTAMPTZ NOT NULL,
  distance_meters DOUBLE PRECISION NOT NULL,
  velocity_m_per_min DOUBLE PRECISION NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'qr',
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(race_id, pigeon_id)
);

-- 6. Pairings (Pary i Rozpłód)
CREATE TABLE IF NOT EXISTS public.pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  cock_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  hen_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  paired_date DATE NOT NULL,
  nest_box TEXT,
  inbreeding_coefficient_f DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  egg1_date DATE,
  egg2_date DATE,
  owoscopy_date DATE,
  ring_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Health Logs (Kalendarz Profilaktyki i Leki)
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  pigeon_id UUID REFERENCES public.pigeons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'vaccine', 'deworming', 'antibiotic', 'supplement'
  date DATE NOT NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT,
  withdrawal_days INTEGER NOT NULL DEFAULT 0,
  next_due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Moult Logs (Cykl Pierzenia — 10 Lotek)
CREATE TABLE IF NOT EXISTS public.moult_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pigeon_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  primary_feather_number INTEGER NOT NULL CHECK (primary_feather_number BETWEEN 1 AND 10),
  status feather_status NOT NULL DEFAULT 'intact',
  length_pct INTEGER NOT NULL DEFAULT 100 CHECK (length_pct BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(pigeon_id, primary_feather_number, check_date)
);

-- 9. Lost Pigeon Reports (Publiczna Sieć Zgłoszeń)
CREATE TABLE IF NOT EXISTS public.lost_pigeon_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_uuid UUID NOT NULL,
  ring_number TEXT NOT NULL,
  finder_name TEXT,
  finder_phone TEXT NOT NULL,
  finder_email TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address_hint TEXT,
  finder_notes TEXT,
  photo_url TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Sync Audit Log (Delta Sync i LWW)
CREATE TABLE IF NOT EXISTS public.sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  client_mutation_id TEXT NOT NULL UNIQUE,
  entity_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast lookups & delta sync
CREATE INDEX IF NOT EXISTS idx_lofts_owner ON public.lofts(owner_id);
CREATE INDEX IF NOT EXISTS idx_loft_members_lookup ON public.loft_members(loft_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pigeons_loft_updated ON public.pigeons(loft_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_pigeons_ring ON public.pigeons(ring_number);
CREATE INDEX IF NOT EXISTS idx_pigeons_qr ON public.pigeons(qr_code_uuid);
CREATE INDEX IF NOT EXISTS idx_pigeons_pedigree ON public.pigeons(father_id, mother_id);
CREATE INDEX IF NOT EXISTS idx_races_loft_updated ON public.races(loft_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_races_broadcast ON public.races(broadcast_slug) WHERE is_live_broadcast = true;
CREATE INDEX IF NOT EXISTS idx_arrivals_race_speed ON public.arrivals(race_id, velocity_m_per_min DESC);
CREATE INDEX IF NOT EXISTS idx_health_loft_date ON public.health_logs(loft_id, date);
CREATE INDEX IF NOT EXISTS idx_moult_pigeon ON public.moult_logs(pigeon_id, check_date);
CREATE INDEX IF NOT EXISTS idx_lost_pigeons_qr ON public.lost_pigeon_reports(qr_code_uuid);

-- Automated updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['lofts', 'pigeons', 'races', 'arrivals', 'pairings', 'health_logs', 'moult_logs'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', t);
  END LOOP;
END;
$$;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.lofts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loft_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pigeons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moult_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_pigeon_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Lofts RLS
CREATE POLICY "Users can view lofts they own or are members of"
  ON public.lofts FOR SELECT
  USING (owner_id = auth.uid() OR public.is_loft_member(id, auth.uid()));

CREATE POLICY "Users can create lofts"
  ON public.lofts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their lofts"
  ON public.lofts FOR UPDATE
  USING (owner_id = auth.uid());

-- 2. Loft Members RLS
CREATE POLICY "Members can view membership of their lofts"
  ON public.loft_members FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft owners can manage members"
  ON public.loft_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.lofts WHERE id = loft_members.loft_id AND owner_id = auth.uid()));

-- 3. Pigeons RLS
CREATE POLICY "Loft members can view pigeons"
  ON public.pigeons FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft editors can insert pigeons"
  ON public.pigeons FOR INSERT
  WITH CHECK (public.can_edit_loft(loft_id, auth.uid()));

CREATE POLICY "Loft editors can update pigeons"
  ON public.pigeons FOR UPDATE
  USING (public.can_edit_loft(loft_id, auth.uid()));

CREATE POLICY "Loft editors can soft delete pigeons"
  ON public.pigeons FOR DELETE
  USING (public.can_edit_loft(loft_id, auth.uid()));

-- 4. Races RLS
CREATE POLICY "Loft members can view races"
  ON public.races FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()) OR (is_live_broadcast = true));

CREATE POLICY "Loft editors can insert races"
  ON public.races FOR INSERT
  WITH CHECK (public.can_edit_loft(loft_id, auth.uid()));

CREATE POLICY "Loft editors can update races"
  ON public.races FOR UPDATE
  USING (public.can_edit_loft(loft_id, auth.uid()));

-- 5. Arrivals RLS
CREATE POLICY "Loft members or public broadcast can view arrivals"
  ON public.arrivals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = arrivals.race_id
      AND (public.is_loft_member(races.loft_id, auth.uid()) OR races.is_live_broadcast = true)
    )
  );

CREATE POLICY "Loft editors can manage arrivals"
  ON public.arrivals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = arrivals.race_id
      AND public.can_edit_loft(races.loft_id, auth.uid())
    )
  );

-- 6. Pairings RLS
CREATE POLICY "Loft members can view pairings"
  ON public.pairings FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft editors can manage pairings"
  ON public.pairings FOR ALL
  USING (public.can_edit_loft(loft_id, auth.uid()));

-- 7. Health Logs RLS
CREATE POLICY "Loft members can view health logs"
  ON public.health_logs FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft editors can manage health logs"
  ON public.health_logs FOR ALL
  USING (public.can_edit_loft(loft_id, auth.uid()));

-- 8. Moult Logs RLS
CREATE POLICY "Loft members can view moult logs"
  ON public.moult_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pigeons
      WHERE pigeons.id = moult_logs.pigeon_id
      AND public.is_loft_member(pigeons.loft_id, auth.uid())
    )
  );

CREATE POLICY "Loft editors can manage moult logs"
  ON public.moult_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pigeons
      WHERE pigeons.id = moult_logs.pigeon_id
      AND public.can_edit_loft(pigeons.loft_id, auth.uid())
    )
  );

-- 9. Lost Pigeon Reports RLS
CREATE POLICY "Anyone can report a lost pigeon"
  ON public.lost_pigeon_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Loft owners can view reports matching their pigeons"
  ON public.lost_pigeon_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pigeons
      WHERE pigeons.qr_code_uuid = lost_pigeon_reports.qr_code_uuid
      AND public.is_loft_member(pigeons.loft_id, auth.uid())
    )
  );

-- 10. Sync Audit Log RLS
CREATE POLICY "Loft members can view and write sync audit logs"
  ON public.sync_audit_log FOR ALL
  USING (public.is_loft_member(loft_id, auth.uid()));

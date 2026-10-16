-- ============================================================================
-- PIGEON-FLY — Migration 002: Advanced Breeding, Clutches & Feeding Logs
-- Migration: 20261016000002_breeding_and_feeding.sql
-- ============================================================================

-- 1. Clutches (Lęgi, Jaja, Owoskopia i Wychów Młodzieży)
CREATE TABLE IF NOT EXISTS public.clutches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  nest_box TEXT NOT NULL,
  cock_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  hen_id UUID NOT NULL REFERENCES public.pigeons(id) ON DELETE CASCADE,
  paired_date DATE NOT NULL,
  egg1_date DATE,
  egg2_date DATE,
  egg1_status TEXT NOT NULL DEFAULT 'laid',
  egg2_status TEXT NOT NULL DEFAULT 'laid',
  hatch_date DATE,
  chick1_ring_number TEXT,
  chick2_ring_number TEXT,
  chick1_banded BOOLEAN NOT NULL DEFAULT false,
  chick2_banded BOOLEAN NOT NULL DEFAULT false,
  weaned_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Feeding Logs (Dziennik Żywienia i Suplementacji)
CREATE TABLE IF NOT EXISTS public.feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loft_id UUID NOT NULL REFERENCES public.lofts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phase TEXT NOT NULL,
  mix_name TEXT NOT NULL,
  water_supplements TEXT,
  feed_supplements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clutches_loft ON public.clutches(loft_id);
CREATE INDEX IF NOT EXISTS idx_clutches_parents ON public.clutches(cock_id, hen_id);
CREATE INDEX IF NOT EXISTS idx_feeding_loft_date ON public.feeding_logs(loft_id, date);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_updated_at ON public.clutches;
CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.clutches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.clutches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loft members can view clutches"
  ON public.clutches FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft editors can manage clutches"
  ON public.clutches FOR ALL
  USING (public.can_edit_loft(loft_id, auth.uid()));

CREATE POLICY "Loft members can view feeding logs"
  ON public.feeding_logs FOR SELECT
  USING (public.is_loft_member(loft_id, auth.uid()));

CREATE POLICY "Loft editors can manage feeding logs"
  ON public.feeding_logs FOR ALL
  USING (public.can_edit_loft(loft_id, auth.uid()));

-- ============================================================
-- Migration: 20260419_profiles_erp_lite
-- Descrição: Adiciona camada ERP-lite com tabela profiles,
--            view profiles_with_email, RLS em surveys e trigger
--            para auto-criar profile ao registrar usuário.
-- Seguro para re-executar: usa IF NOT EXISTS / OR REPLACE / ON CONFLICT
-- ============================================================

-- 1. Enum de roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'analista', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  moodle_id   TEXT UNIQUE,
  role        public.app_role NOT NULL DEFAULT 'viewer',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS profiles_role_idx      ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS profiles_moodle_id_idx ON public.profiles(moodle_id);

-- 4. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
  DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
END $$;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 6. Trigger: auto-criar profile ao inserir usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger: updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Função helper get_user_email (security definer, sem search_path)
CREATE OR REPLACE FUNCTION public.get_user_email(uid UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = uid;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_email(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

-- 9. View profiles_with_email (security_invoker — respeita RLS dos profiles)
CREATE OR REPLACE VIEW public.profiles_with_email
WITH (security_invoker = true)
AS
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.moodle_id,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at,
    public.get_user_email(p.id) AS email
  FROM public.profiles p;

-- 10. RLS em surveys (tabela do pipeline analítico — não altera dados)
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surveys_select_authenticated" ON public.surveys;
CREATE POLICY "surveys_select_authenticated"
  ON public.surveys FOR SELECT TO authenticated
  USING (true);

-- 11. Seed: garantir que usuários existentes tenham profile (role padrão: admin para o 1º)
INSERT INTO public.profiles (id, full_name, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'admin'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

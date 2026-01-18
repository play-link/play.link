/* -----------------------------------------------------------------------
  MASTER MIGRATION: PLAY.LINK
  Stack: Hono + Drizzle + Supabase (Service Role Architecture)
  -----------------------------------------------------------------------
*/

-- 1. EXTENSIONES
-- Necesario para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 

-- LIMPIEZA PREVIA (Solo si necesitas reiniciar todo, ten cuidado)
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS game_credits CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS org_role CASCADE;
DROP TYPE IF EXISTS credit_role CASCADE;

-- 2. ENUMS (Tipos Estrictos para Lógica de Negocio)
CREATE TYPE game_status AS ENUM ('DRAFT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED');
CREATE TYPE org_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE credit_role AS ENUM ('DEVELOPER', 'PUBLISHER', 'PORTING', 'MARKETING', 'SUPPORT');

-- 3. TABLAS PRINCIPALES

-- A. PROFILES
-- Se borra si el usuario borra su cuenta de Auth (Cascade)
CREATE TABLE public.profiles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- 'timestamptz' es mejor práctica que 'timestamp'
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
    CONSTRAINT profiles_username_key UNIQUE (username)
);

-- B. ORGANIZATIONS
-- Entidad central. Si se borra, arrastra miembros y juegos (Cascade configurado en hijos).
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Más rápido que uuid_generate_v4()
    slug VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    stripe_customer_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false NOT NULL,
    avatar_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT organizations_slug_key UNIQUE (slug)
);

-- C. ORGANIZATION MEMBERS
-- Tabla intermedia (Many-to-Many).
-- Si borras Usuario -> Se va. Si borras Org -> Se va.
CREATE TABLE public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role org_role DEFAULT 'MEMBER'::org_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT organization_members_pkey PRIMARY KEY (organization_id, user_id)
);

-- D. GAMES
-- Si borras la Organización dueña, se borran sus juegos (CASCADE).
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, 
    
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    description JSONB, -- Flexible content
    
    -- Metadata
    status game_status DEFAULT 'DRAFT'::game_status NOT NULL,
    release_date TIMESTAMPTZ,
    genres TEXT[] DEFAULT '{}'::TEXT[], -- Array nativo eficiente
    
    -- Assets
    cover_url TEXT,
    header_url TEXT,
    trailer_url TEXT,
    theme_color VARCHAR(20),
    
    -- Datos Técnicos
    platforms JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT games_slug_key UNIQUE (slug)
);

-- E. GAME CREDITS
-- Roles externos.
-- Si borras el juego -> El crédito desaparece (CASCADE).
-- Si borras la Organización -> El crédito se queda pero ID es NULL (SET NULL). VITAL PARA HISTÓRICO.
CREATE TABLE public.game_credits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL, 
    custom_name VARCHAR(200),
    role credit_role NOT NULL,
    
    CONSTRAINT check_credit_entity CHECK (organization_id IS NOT NULL OR custom_name IS NOT NULL)
);

-- F. INVITES
-- Invitaciones pendientes. Si la org muere, la invitación muere.
CREATE TABLE public.invites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role org_role NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    accepted_at TIMESTAMPTZ
);

-- 4. ÍNDICES DE RENDIMIENTO (Performance Tuning)
-- Postgres NO crea índices en Foreign Keys automáticamente. Esto es obligatorio para velocidad.

CREATE INDEX idx_profiles_username ON public.profiles(username); -- Para búsquedas de perfil
CREATE INDEX idx_org_members_user ON public.organization_members(user_id); -- "Mis Organizaciones"
CREATE INDEX idx_games_owner ON public.games(owner_organization_id); -- "Juegos de esta Org"
CREATE INDEX idx_game_credits_game ON public.game_credits(game_id); -- "Créditos de este juego"
CREATE INDEX idx_games_status ON public.games(status); -- "Filtrar por Released"
CREATE INDEX idx_games_genres ON public.games USING GIN (genres); -- Búsqueda ultra-rápida en Arrays

-- 5. SEGURIDAD (RLS - Zero Trust)
-- Bloqueamos todo acceso público. Solo tu API Hono (con Service Role Key) podrá tocar esto.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON profiles FOR ALL USING (false);
CREATE POLICY "No public access" ON organizations FOR ALL USING (false);
CREATE POLICY "No public access" ON organization_members FOR ALL USING (false);
CREATE POLICY "No public access" ON games FOR ALL USING (false);
CREATE POLICY "No public access" ON game_credits FOR ALL USING (false);
CREATE POLICY "No public access" ON invites FOR ALL USING (false);

-- 6. AUTOMATIZACIÓN (Trigger de Registro)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Generar username base limpio
  username_val := SPLIT_PART(NEW.email, '@', 1);
  username_val := regexp_replace(username_val, '[^a-zA-Z0-9_-]', '', 'g');

  -- Evitar colisiones o nombres muy cortos
  IF length(username_val) < 3 OR EXISTS (SELECT 1 FROM public.profiles WHERE username = username_val) THEN
    username_val := username_val || floor(random() * 10000)::text;
  END IF;

  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, username_val);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

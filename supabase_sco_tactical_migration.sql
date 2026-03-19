-- SUPABASE MIGRATION - SCO ADVANCED (TACTICAL DASHBOARD)
-- This migration adds the necessary tables for the tactical organogram, resources and tasks.

-- 0. Update Contingency Plans table with necessary fields
ALTER TABLE IF EXISTS public.planos_contingencia
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS relatorio_final TEXT;

-- 1. Create table for Tactical Sectors
CREATE TABLE IF NOT EXISTS public.sco_setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES public.planos_contingencia(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.sco_setores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    color_class TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create unique constraint for SCO Assignments (Structure)
-- This ensures that only one chief is assigned per sector in the database
ALTER TABLE IF EXISTS public.sco_estrutura
DROP CONSTRAINT IF EXISTS sco_estrutura_sessao_funcao_unique;

ALTER TABLE IF EXISTS public.sco_estrutura
ADD CONSTRAINT sco_estrutura_sessao_funcao_unique UNIQUE (plano_id, sessao, funcao);

-- 3. Create table for Tasks
CREATE TABLE IF NOT EXISTS public.sco_tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES public.sco_setores(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create table for Resources (Equipment/Vehicles)
CREATE TABLE IF NOT EXISTS public.sco_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES public.planos_contingencia(id) ON DELETE CASCADE,
    setor_id UUID REFERENCES public.sco_setores(id) ON DELETE SET NULL,
    tarefa_id UUID REFERENCES public.sco_tarefas(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Veículo',
    status TEXT DEFAULT 'Disponível',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create table for Tactical Communications (Messages)
CREATE TABLE IF NOT EXISTS public.sco_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID REFERENCES public.sco_setores(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    text TEXT NOT NULL,
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create table for Tactical Logs (Board Diary)
CREATE TABLE IF NOT EXISTS public.sco_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES public.planos_contingencia(id) ON DELETE CASCADE,
    time TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable RLS and add basic policies
ALTER TABLE public.sco_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_logs ENABLE ROW LEVEL SECURITY;

-- Creating simple policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON public.sco_setores FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.sco_tarefas FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.sco_recursos FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.sco_mensagens FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.sco_logs FOR ALL TO authenticated USING (true);

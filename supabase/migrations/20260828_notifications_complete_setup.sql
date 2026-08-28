-- =============================================================================
-- Migration: 20260828_notifications_complete_setup.sql
-- Sistema Centralizado de Notificações Operacionais SIGERD Mobile
-- EXECUTE ESTE SCRIPT COMPLETO NO SQL EDITOR DO SUPABASE
-- =============================================================================

-- 1. Criar Tabela Principal de Notificações (se não existir)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ DEFAULT NULL,
    urgency VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    link TEXT DEFAULT '/',
    icon VARCHAR(50) DEFAULT 'bell',
    expires_at TIMESTAMPTZ DEFAULT NULL,
    group_key VARCHAR(255) UNIQUE,
    target_role VARCHAR(50) DEFAULT NULL,
    user_id TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Garantir que as colunas target_role e user_id existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT NULL;

-- 2. Criar Tabela de Rastreamento de Leitura Individual por Usuário
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT TRUE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_notification UNIQUE(notification_id, user_id)
);

-- 3. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON public.notifications(group_key);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_urgency ON public.notifications(urgency);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_targeting ON public.notifications(target_role, user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_lookup ON public.user_notifications(user_id, notification_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para public.notifications
DROP POLICY IF EXISTS "Permitir leitura de notificações para todos" ON public.notifications;
CREATE POLICY "Permitir leitura de notificações para todos" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de notificações para todos" ON public.notifications;
CREATE POLICY "Permitir inserção de notificações para todos" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de notificações para todos" ON public.notifications;
CREATE POLICY "Permitir atualização de notificações para todos" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de notificações para todos" ON public.notifications;
CREATE POLICY "Permitir exclusão de notificações para todos" ON public.notifications FOR DELETE USING (true);

-- Políticas RLS para public.user_notifications
DROP POLICY IF EXISTS "Permitir leitura de user_notifications para todos" ON public.user_notifications;
CREATE POLICY "Permitir leitura de user_notifications para todos" ON public.user_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de user_notifications para todos" ON public.user_notifications;
CREATE POLICY "Permitir inserção de user_notifications para todos" ON public.user_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de user_notifications para todos" ON public.user_notifications;
CREATE POLICY "Permitir atualização de user_notifications para todos" ON public.user_notifications FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Habilitar Supabase Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

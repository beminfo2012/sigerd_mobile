-- Migration: 20260828_notifications_system.sql
-- Description: Sistema Centralizado de Notificações Operacionais SIGERD Mobile

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
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Indexing for high-performance queries & deduplication
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON public.notifications(group_key);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_urgency ON public.notifications(urgency);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Permitir leitura de notificações para todos" ON public.notifications;
CREATE POLICY "Permitir leitura de notificações para todos"
ON public.notifications FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir inserção de notificações para autenticados e anon" ON public.notifications;
CREATE POLICY "Permitir inserção de notificações para autenticados e anon"
ON public.notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de notificações (leitura)" ON public.notifications;
CREATE POLICY "Permitir atualização de notificações (leitura)"
ON public.notifications FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de notificações" ON public.notifications;
CREATE POLICY "Permitir exclusão de notificações"
ON public.notifications FOR DELETE
USING (true);

-- Enable Supabase Realtime for notifications table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

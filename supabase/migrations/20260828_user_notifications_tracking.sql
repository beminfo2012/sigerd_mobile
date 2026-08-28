-- Migration: 20260828_user_notifications_tracking.sql
-- Description: Tabela de rastreamento de leitura individual e direcionamento por usuário/perfil

-- Add targeting columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT NULL;

-- Create user_notifications table for individual read state tracking
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT TRUE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_notification UNIQUE(notification_id, user_id)
);

-- Indexing for per-user query performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_lookup 
ON public.user_notifications(user_id, notification_id);

CREATE INDEX IF NOT EXISTS idx_notifications_targeting 
ON public.notifications(target_role, user_id);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Permitir leitura de rastreamento para todos" ON public.user_notifications;
CREATE POLICY "Permitir leitura de rastreamento para todos"
ON public.user_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercao de rastreamento para todos" ON public.user_notifications;
CREATE POLICY "Permitir insercao de rastreamento para todos"
ON public.user_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de rastreamento para todos" ON public.user_notifications;
CREATE POLICY "Permitir atualizacao de rastreamento para todos"
ON public.user_notifications FOR UPDATE USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for user_notifications table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

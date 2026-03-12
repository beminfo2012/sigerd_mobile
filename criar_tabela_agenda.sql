-- Instruções: Execute este script no SQL Editor do seu painel Supabase. 
-- Ele criará a tabela para armazenar os agendamentos de vistoria.

CREATE TABLE IF NOT EXISTS public.agenda_vistorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_processo TEXT NOT NULL,
    data_abertura TIMESTAMPTZ NOT NULL,
    data_limite TIMESTAMPTZ,
    categoria_risco TEXT,
    solicitante TEXT,
    endereco TEXT,
    status TEXT DEFAULT 'Protocolada',
    vistoria_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    synced BOOLEAN DEFAULT true
);

-- Ativar segurança
ALTER TABLE public.agenda_vistorias ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Leitura liberada, escrita via app local baseada no role - mas na prática o RLS no frontend é via token)
CREATE POLICY "Enable read access for all users" ON "public"."agenda_vistorias"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."agenda_vistorias"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."agenda_vistorias"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."agenda_vistorias"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

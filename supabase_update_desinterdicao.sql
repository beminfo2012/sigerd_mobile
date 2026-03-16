-- 1. Create desinterdicoes table
CREATE TABLE IF NOT EXISTS public.desinterdicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interdicao_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    data_nova_vistoria DATE NOT NULL,
    agente TEXT NOT NULL,
    matricula TEXT,
    responsavel_nome TEXT,
    endereco TEXT,
    bairro TEXT,
    medidas_corretivas_executadas TEXT,
    situacao_verificada TEXT,
    observacoes_tecnicas TEXT,
    fotos JSONB DEFAULT '[]'::jsonb,
    documentos JSONB DEFAULT '[]'::jsonb,
    status_anterior TEXT
);

-- 2. Add status column to interdicoes if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='interdicoes' AND COLUMN_NAME='status') THEN
        ALTER TABLE public.interdicoes ADD COLUMN status TEXT DEFAULT 'Interditado';
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.desinterdicoes ENABLE ROW LEVEL SECURITY;

-- Note: Ensure policies are set correctly for your authentication flow.
-- Example for public access (not recommended for production):
-- CREATE POLICY "Enable read for all users" ON "public"."desinterdicoes" FOR SELECT USING (true);

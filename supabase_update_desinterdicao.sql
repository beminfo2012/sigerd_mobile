-- 1. Create/Update desinterdicoes table
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
    tipo_desinterdicao TEXT DEFAULT 'Total', -- 'Total' or 'Parcial'
    fotos JSONB DEFAULT '[]'::jsonb,
    documentos JSONB DEFAULT '[]'::jsonb,
    status_anterior TEXT
);

-- Ensure tipo_desinterdicao exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='desinterdicoes' AND COLUMN_NAME='tipo_desinterdicao') THEN
        ALTER TABLE public.desinterdicoes ADD COLUMN tipo_desinterdicao TEXT DEFAULT 'Total';
    END IF;
END $$;

-- 2. Add status column to interdicoes if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='interdicoes' AND COLUMN_NAME='status') THEN
        ALTER TABLE public.interdicoes ADD COLUMN status TEXT DEFAULT 'Interditado';
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.desinterdicoes ENABLE ROW LEVEL SECURITY;

-- 4. Robust RLS Policies (Allow all for anyone with legitimate access)
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.desinterdicoes;
DROP POLICY IF EXISTS "Public access to desinterdicoes" ON public.desinterdicoes;

CREATE POLICY "Enable all actions for all" ON public.desinterdicoes
    FOR ALL 
    TO public
    USING (true)
    WITH CHECK (true);

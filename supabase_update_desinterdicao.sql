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

-- 2. Add status column to interdicoes if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='interdicoes' AND COLUMN_NAME='status') THEN
        ALTER TABLE public.interdicoes ADD COLUMN status TEXT DEFAULT 'Interditado';
    END IF;
END $$;

-- 3. Enable RLS and add policies
ALTER TABLE public.desinterdicoes ENABLE ROW LEVEL SECURITY;

-- Drop existing if any to avoid conflicts during re-run
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.desinterdicoes;
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.desinterdicoes;

CREATE POLICY "Enable all actions for authenticated users" ON public.desinterdicoes
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ====================================================================
-- MÓDULO REDAP - RELATÓRIO DE DANOS E PREJUÍZOS DO MUNICÍPIO
-- SQL DE INSTALAÇÃO NO SUPABASE (IDEMPOTENTE)
-- ====================================================================

-- 1. TABELA DE EVENTOS (DESASTRES)
CREATE TABLE IF NOT EXISTS public.redap_eventos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome_evento text NOT NULL,
    cobrade text NULL,
    data_inicio timestamp with time zone NOT NULL DEFAULT now(),
    data_fim timestamp with time zone NULL,
    status_evento text NOT NULL DEFAULT 'Aberto às Secretarias',
    criado_por uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_eventos_pkey PRIMARY KEY (id)
);

-- 2. TABELA DE REGISTROS (DANOS SETORIAIS)
CREATE TABLE IF NOT EXISTS public.redap_registros (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL,
    secretaria_responsavel text NOT NULL,
    classificacao_dano text NOT NULL,
    instalacao_afetada text NOT NULL,
    descricao_detalhada text NULL,
    valor_estimado numeric(12, 2) NULL DEFAULT 0.00,
    latitude double precision NULL,
    longitude double precision NULL,
    fotos jsonb NULL DEFAULT '[]'::jsonb,
    status_validacao text NOT NULL DEFAULT 'Enviado',
    usuario_id uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT redap_registros_pkey PRIMARY KEY (id),
    CONSTRAINT fk_redap_evento FOREIGN KEY (evento_id) REFERENCES redap_eventos (id) ON DELETE CASCADE
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_redap_eventos_data ON public.redap_eventos (data_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_redap_registros_evento ON public.redap_registros (evento_id);
CREATE INDEX IF NOT EXISTS idx_redap_registros_sec ON public.redap_registros (secretaria_responsavel);

-- 4. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('redap_fotos', 'redap_fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS POLICIES (Eventos)
ALTER TABLE public.redap_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redap Eventos: Defesa Civil Tudo" ON public.redap_eventos;
CREATE POLICY "Redap Eventos: Defesa Civil Tudo" ON public.redap_eventos 
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'))
);

DROP POLICY IF EXISTS "Redap Eventos: Secretarias Ver" ON public.redap_eventos;
CREATE POLICY "Redap Eventos: Secretarias Ver" ON public.redap_eventos 
FOR SELECT USING (true);

-- 6. RLS POLICIES (Registros)
ALTER TABLE public.redap_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redap Registros: Defesa Civil Tudo" ON public.redap_registros;
CREATE POLICY "Redap Registros: Defesa Civil Tudo" ON public.redap_registros 
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'))
);

DROP POLICY IF EXISTS "Redap Registros: Secretarias Gerenciar Próprios" ON public.redap_registros;
CREATE POLICY "Redap Registros: Secretarias Gerenciar Próprios" ON public.redap_registros 
FOR ALL USING (
    (auth.uid() = usuario_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.role LIKE 'Redap_%')
);

-- 7. STORAGE RLS (Bucket redap_fotos)
DROP POLICY IF EXISTS "Redap Fotos: Acesso Público" ON storage.objects;
CREATE POLICY "Redap Fotos: Acesso Público" ON storage.objects 
FOR SELECT USING (bucket_id = 'redap_fotos');

DROP POLICY IF EXISTS "Redap Fotos: Upload Autenticado" ON storage.objects;
CREATE POLICY "Redap Fotos: Upload Autenticado" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'redap_fotos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Redap Fotos: Delete Próprio" ON storage.objects;
CREATE POLICY "Redap Fotos: Delete Próprio" ON storage.objects 
FOR DELETE USING (bucket_id = 'redap_fotos' AND auth.uid() = owner);

-- 8. TRIGGER UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_redap_eventos_updated_at ON public.redap_eventos;
CREATE TRIGGER update_redap_eventos_updated_at BEFORE UPDATE ON public.redap_eventos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_redap_registros_updated_at ON public.redap_registros;
CREATE TRIGGER update_redap_registros_updated_at BEFORE UPDATE ON public.redap_registros FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

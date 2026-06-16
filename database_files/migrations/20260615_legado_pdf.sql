-- MIGRATION: 20260615_legado_pdf.sql
-- Tabela para associar arquivos PDF às vistorias legadas (2015-2025)

CREATE TABLE IF NOT EXISTS public.laudos_legados_pdf (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    vistoria_id integer NOT NULL, -- ID numérico do item no legacy_vistorias.json
    pdf_url text NOT NULL, -- URL pública do PDF no bucket vistorias_fotos
    nome_arquivo text NOT NULL, -- Nome original do arquivo PDF
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT laudos_legados_pdf_pkey PRIMARY KEY (id),
    CONSTRAINT unique_vistoria_id UNIQUE (vistoria_id)
);

-- Habilitar RLS
ALTER TABLE public.laudos_legados_pdf ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Permitir select para autenticados" ON public.laudos_legados_pdf;
CREATE POLICY "Permitir select para autenticados" ON public.laudos_legados_pdf
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir write para autenticados" ON public.laudos_legados_pdf;
CREATE POLICY "Permitir write para autenticados" ON public.laudos_legados_pdf
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

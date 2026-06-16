-- Migration: Tabela de Orthofotos Globais do Sistema SIGERD
-- Execute este script no editor SQL do Supabase

CREATE TABLE IF NOT EXISTS public.sigerd_orthofotos (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        text NOT NULL,
    descricao   text,
    url         text NOT NULL,
    storage_path text,
    tipo        text DEFAULT 'PNG',  -- PNG, JPG, TIFF, etc.
    bounds      text,               -- JSON: [[south, west], [north, east]]
    opacidade   float DEFAULT 0.7,
    ativo       boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.sigerd_orthofotos ENABLE ROW LEVEL SECURITY;

-- Leitura para todos autenticados
CREATE POLICY "orthofotos_select" ON public.sigerd_orthofotos
    FOR SELECT TO authenticated USING (true);

-- Escrita/exclusão apenas para admins e coordenadores
CREATE POLICY "orthofotos_insert" ON public.sigerd_orthofotos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
        )
    );

CREATE POLICY "orthofotos_update" ON public.sigerd_orthofotos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
        )
    );

CREATE POLICY "orthofotos_delete" ON public.sigerd_orthofotos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
        )
    );

-- Criação da tabela NOPRER (Notificação Preliminar de Risco)
CREATE TABLE IF NOT EXISTS public.noprer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_noprer TEXT NOT NULL,
    origem_tipo TEXT NOT NULL, -- 'vistoria' ou 'ocorrencia'
    origem_id TEXT NOT NULL, -- O número formatado da origem (ex: VIST-2026.000312)
    data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risco TEXT NOT NULL,
    tipo_risco TEXT NOT NULL,
    descricao TEXT NOT NULL,
    medidas_mitigatorias JSONB DEFAULT '[]'::jsonb,
    prazo_dias INTEGER NOT NULL DEFAULT 30,
    data_limite TIMESTAMPTZ NOT NULL,
    revistoria_data TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'EMITIDA',
    endereco TEXT,
    solicitante TEXT,
    coordenadas JSONB,
    assinatura TEXT, -- Base64 da assinatura
    testemunhas JSONB, -- Objeto contendo nome e doc das testemunhas
    recusou_assinatura BOOLEAN DEFAULT false,
    criado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativa o RLS (Row Level Security)
ALTER TABLE public.noprer ENABLE ROW LEVEL SECURITY;

-- Criação de Políticas de Acesso
-- Permitir que usuários autenticados selecionem registros
CREATE POLICY "Permitir leitura de NOPRER para usuários autenticados" 
ON public.noprer FOR SELECT 
TO authenticated 
USING (true);

-- Permitir que usuários autenticados insiram registros
CREATE POLICY "Permitir inserção de NOPRER para usuários autenticados" 
ON public.noprer FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permitir que usuários autenticados atualizem registros
CREATE POLICY "Permitir atualização de NOPRER para usuários autenticados" 
ON public.noprer FOR UPDATE 
TO authenticated 
USING (true);

-- Permitir exclusão de registros
CREATE POLICY "Permitir exclusão de NOPRER para usuários autenticados" 
ON public.noprer FOR DELETE 
TO authenticated 
USING (true);

-- Trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_noprer_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_noprer_updated_at
    BEFORE UPDATE ON public.noprer
    FOR EACH ROW
    EXECUTE FUNCTION public.update_noprer_updated_at_column();

-- Índices de otimização
CREATE INDEX IF NOT EXISTS idx_noprer_numero ON public.noprer(numero_noprer);
CREATE INDEX IF NOT EXISTS idx_noprer_origem ON public.noprer(origem_id);
CREATE INDEX IF NOT EXISTS idx_noprer_status ON public.noprer(status);

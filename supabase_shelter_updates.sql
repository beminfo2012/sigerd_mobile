-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para garantir as colunas de operacao_id 
-- e criar a tabela de histórico de ativação de abrigos.

-- 1. Garante que operacao_id exista nas tabelas de assistência humanitária
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_occupants' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_occupants ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_donations' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_donations ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_distributions' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_distributions ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shelter_inventory' AND column_name='operacao_id') THEN 
        ALTER TABLE shelter_inventory ADD COLUMN operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 2. Cria a tabela de Histórico de Ativação de Abrigos
CREATE TABLE IF NOT EXISTS shelter_activation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    operacao_id UUID REFERENCES operacao_assistencia_humanitaria(id) ON DELETE SET NULL,
    activation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inactivation_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Ativa RLS para a nova tabela
ALTER TABLE shelter_activation_history ENABLE ROW LEVEL SECURITY;

-- Cria política simples para leitura/escrita autenticada (ajuste conforme necessário para seu sistema de RLS)
CREATE POLICY "Enable read/write for authenticated users" ON shelter_activation_history 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

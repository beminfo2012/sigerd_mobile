-- Criação da tabela de Programas de Voluntariado
CREATE TABLE IF NOT EXISTS programas_voluntariado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    cor TEXT DEFAULT 'blue', -- Para guardar a cor base (ex: blue, emerald, amber)
    icone TEXT DEFAULT 'Shield', -- Nome do ícone Lucide
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionando a coluna programa_id na tabela voluntarios
ALTER TABLE voluntarios ADD COLUMN IF NOT EXISTS programa_id UUID REFERENCES programas_voluntariado(id) ON DELETE SET NULL;

-- Inserindo os programas padrões
INSERT INTO programas_voluntariado (nome, descricao, cor, icone) VALUES
('REMER', 'Rede Estadual de Emergência de Radioamadores', 'emerald', 'Radio'),
('Mãos Que Protegem', 'Programa de capacitação comunitária e ação conjunta em desastres', 'amber', 'HeartHandshake')
ON CONFLICT (nome) DO NOTHING;

-- RLS (Row Level Security) para a nova tabela
ALTER TABLE programas_voluntariado ENABLE ROW LEVEL SECURITY;

-- Políticas para programas_voluntariado (leitura para todos autenticados, escrita para admin/coordenador, por enquanto aberto para autenticados)
CREATE POLICY "Programas são visíveis para usuários autenticados" 
ON programas_voluntariado FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Programas podem ser criados por usuários autenticados" 
ON programas_voluntariado FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Programas podem ser atualizados por usuários autenticados" 
ON programas_voluntariado FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Programas podem ser deletados por usuários autenticados" 
ON programas_voluntariado FOR DELETE 
TO authenticated 
USING (true);

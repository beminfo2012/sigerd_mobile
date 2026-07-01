-- Atualização de Esquema: Adicionar suporte a Soft Delete no módulo de Abrigos 
-- (necessário para a nova funcionalidade de Exclusão Lógica de Doações e Inventário)

-- Tabela shelter_donations
ALTER TABLE shelter_donations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE shelter_donations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_donations_status ON shelter_donations(status);

-- Tabela shelter_inventory
ALTER TABLE shelter_inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE shelter_inventory ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_inventory_status ON shelter_inventory(status);

-- Tabela shelter_distributions
ALTER TABLE shelter_distributions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE shelter_distributions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_distributions_status ON shelter_distributions(status);

-- Atualiza os registros existentes para 'active'
UPDATE shelter_donations SET status = 'active' WHERE status IS NULL;
UPDATE shelter_inventory SET status = 'active' WHERE status IS NULL;
UPDATE shelter_distributions SET status = 'active' WHERE status IS NULL;

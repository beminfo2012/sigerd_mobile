-- ============================================
-- SIGERD Mobile - Shelter Management Module
-- Database Migration Script
-- ============================================

-- 1. Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'defesa_civil' 
CHECK (role IN ('defesa_civil', 'assistencia_social', 'admin'));

-- Update existing users to defesa_civil
UPDATE profiles SET role = 'defesa_civil' WHERE role IS NULL;

COMMENT ON COLUMN profiles.role IS 'User role: defesa_civil (full access), assistencia_social (shelter management only), admin (full access + admin features)';

-- 2. Create shelters table
CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelter_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    bairro TEXT,
    coordenadas TEXT,
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    responsible_name TEXT,
    responsible_phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
    observations TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE shelters IS 'Emergency shelters registry';

-- 3. Create shelter_occupants table
CREATE TABLE IF NOT EXISTS shelter_occupants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occupant_id TEXT UNIQUE NOT NULL,
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cpf TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'nao_informado')),
    family_group TEXT,
    special_needs TEXT,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'exited')),
    observations TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE shelter_occupants IS 'People sheltered in emergency shelters';

-- 4. Create shelter_donations table
CREATE TABLE IF NOT EXISTS shelter_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id TEXT UNIQUE NOT NULL,
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    donor_name TEXT,
    donor_phone TEXT,
    donation_type TEXT NOT NULL CHECK (donation_type IN ('alimento', 'roupa', 'higiene', 'medicamento', 'outro')),
    item_description TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observations TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE shelter_donations IS 'Donations received by shelters';

-- 5. Create shelter_inventory table
CREATE TABLE IF NOT EXISTS shelter_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id TEXT UNIQUE NOT NULL,
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('alimento', 'roupa', 'higiene', 'medicamento', 'limpeza', 'outro')),
    quantity DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    expiration_date DATE,
    location TEXT,
    minimum_stock DECIMAL DEFAULT 0,
    observations TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE shelter_inventory IS 'Inventory control for shelter supplies';

-- 6. Create shelter_distributions table
CREATE TABLE IF NOT EXISTS shelter_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id TEXT UNIQUE NOT NULL,
    shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES shelter_inventory(id),
    item_name TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    recipient_name TEXT,
    family_group TEXT,
    distribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distributed_by UUID REFERENCES profiles(id),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE shelter_distributions IS 'Distribution history of shelter supplies';

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shelters_status ON shelters(status);
CREATE INDEX IF NOT EXISTS idx_shelters_created_at ON shelters(created_at);
CREATE INDEX IF NOT EXISTS idx_occupants_shelter ON shelter_occupants(shelter_id);
CREATE INDEX IF NOT EXISTS idx_occupants_status ON shelter_occupants(status);
CREATE INDEX IF NOT EXISTS idx_occupants_family ON shelter_occupants(family_group);
CREATE INDEX IF NOT EXISTS idx_donations_shelter ON shelter_donations(shelter_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON shelter_donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_inventory_shelter ON shelter_inventory(shelter_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON shelter_inventory(category);
CREATE INDEX IF NOT EXISTS idx_distributions_shelter ON shelter_distributions(shelter_id);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON shelter_distributions(distribution_date);

-- 8. Enable Row Level Security
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_distributions ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies - Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read shelters"
    ON shelters FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read occupants"
    ON shelter_occupants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read donations"
    ON shelter_donations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read inventory"
    ON shelter_inventory FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read distributions"
    ON shelter_distributions FOR SELECT
    TO authenticated
    USING (true);

-- 10. RLS Policies - Allow shelter managers to insert/update
CREATE POLICY "Allow shelter managers to insert shelters"
    ON shelters FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to update shelters"
    ON shelters FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to insert occupants"
    ON shelter_occupants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to update occupants"
    ON shelter_occupants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to insert donations"
    ON shelter_donations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to insert inventory"
    ON shelter_inventory FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to update inventory"
    ON shelter_inventory FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow shelter managers to insert distributions"
    ON shelter_distributions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

-- 11. Create view for shelter statistics
CREATE OR REPLACE VIEW shelter_stats AS
SELECT 
    s.id,
    s.shelter_id,
    s.name,
    s.capacity,
    s.current_occupancy,
    s.status,
    COUNT(DISTINCT so.id) FILTER (WHERE so.status = 'active') as active_occupants,
    COUNT(DISTINCT si.id) as inventory_items,
    COALESCE(SUM(si.quantity), 0) as total_inventory_quantity,
    COUNT(DISTINCT sd.id) as total_donations,
    COUNT(DISTINCT sdi.id) as total_distributions
FROM shelters s
LEFT JOIN shelter_occupants so ON s.id = so.shelter_id
LEFT JOIN shelter_inventory si ON s.id = si.shelter_id
LEFT JOIN shelter_donations sd ON s.id = sd.shelter_id
LEFT JOIN shelter_distributions sdi ON s.id = sdi.shelter_id
GROUP BY s.id, s.shelter_id, s.name, s.capacity, s.current_occupancy, s.status;

COMMENT ON VIEW shelter_stats IS 'Aggregated statistics for each shelter';

-- 12. Create function to update shelter occupancy
CREATE OR REPLACE FUNCTION update_shelter_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shelters
    SET current_occupancy = (
        SELECT COUNT(*) 
        FROM shelter_occupants 
        WHERE shelter_id = COALESCE(NEW.shelter_id, OLD.shelter_id) 
        AND status = 'active'
    ),
    status = CASE
        WHEN (SELECT COUNT(*) FROM shelter_occupants WHERE shelter_id = COALESCE(NEW.shelter_id, OLD.shelter_id) AND status = 'active') >= capacity THEN 'full'
        ELSE 'active'
    END,
    updated_at = NOW()
    WHERE id = COALESCE(NEW.shelter_id, OLD.shelter_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger to auto-update shelter occupancy
DROP TRIGGER IF EXISTS trigger_update_shelter_occupancy ON shelter_occupants;
CREATE TRIGGER trigger_update_shelter_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON shelter_occupants
    FOR EACH ROW
    EXECUTE FUNCTION update_shelter_occupancy();

-- 14. Create function to update inventory on distribution
CREATE OR REPLACE FUNCTION update_inventory_on_distribution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.inventory_id IS NOT NULL THEN
        UPDATE shelter_inventory
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.inventory_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to auto-update inventory
DROP TRIGGER IF EXISTS trigger_update_inventory_on_distribution ON shelter_distributions;
CREATE TRIGGER trigger_update_inventory_on_distribution
    AFTER INSERT ON shelter_distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_distribution();

-- Migration complete!

-- ============================================
-- SIGERD Mobile - Emergency Contracts Module
-- ============================================

-- 1. Create emergency_contracts table
CREATE TABLE IF NOT EXISTS emergency_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id TEXT UNIQUE NOT NULL,
    contract_number TEXT NOT NULL,
    object_description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    synced BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE emergency_contracts IS 'Emergency supply contracts registry';

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_status ON emergency_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON emergency_contracts(start_date, end_date);

-- 3. Enable RLS
ALTER TABLE emergency_contracts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Allow authenticated users to read contracts"
    ON emergency_contracts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authorized users to insert contracts"
    ON emergency_contracts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

CREATE POLICY "Allow authorized users to update contracts"
    ON emergency_contracts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('assistencia_social', 'defesa_civil', 'admin')
        )
    );

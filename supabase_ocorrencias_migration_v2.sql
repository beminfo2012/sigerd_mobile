-- Add unidade_consumidora and update status length if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ocorrencias_operacionais' AND column_name='unidade_consumidora') THEN
        ALTER TABLE ocorrencias_operacionais ADD COLUMN unidade_consumidora TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ocorrencias_operacionais' AND column_name='status') THEN
        ALTER TABLE ocorrencias_operacionais ADD COLUMN status TEXT DEFAULT 'Pendente';
    ELSE
        -- Update default value for existing status column
        ALTER TABLE ocorrencias_operacionais ALTER COLUMN status SET DEFAULT 'Pendente';
    END IF;
END $$;

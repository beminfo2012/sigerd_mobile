-- =====================================================================
-- SIGERD Mobile - Correção de constraints de perfis (profiles.role)
-- Permite vincular usuários a perfis personalizados ou renomeados
-- criados na tabela role_definitions sem erro de CHECK constraint.
-- =====================================================================

-- 1. Remove qualquer CHECK constraint antiga na coluna "role" de public.profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

-- 2. Garante que a tabela role_definitions permita leitura para autenticados
-- e gerenciamento completo para Admin e Coordenador
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'role_definitions'
    ) THEN
        ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "role_definitions_select_authenticated" ON public.role_definitions;
        CREATE POLICY "role_definitions_select_authenticated"
            ON public.role_definitions FOR SELECT
            TO authenticated
            USING (true);

        DROP POLICY IF EXISTS "role_definitions_manage_admins" ON public.role_definitions;
        CREATE POLICY "role_definitions_manage_admins"
            ON public.role_definitions FOR ALL
            TO authenticated
            USING (
                public.get_current_user_role() IN (
                    'Admin', 'Administrador', 'administrador',
                    'Coordenador', 'Coordenador de Proteção e Defesa Civil'
                )
            )
            WITH CHECK (
                public.get_current_user_role() IN (
                    'Admin', 'Administrador', 'administrador',
                    'Coordenador', 'Coordenador de Proteção e Defesa Civil'
                )
            );
    END IF;
END $$;

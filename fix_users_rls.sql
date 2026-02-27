-- Correção de Permissões RLS (Row Level Security) para a Tabela 'profiles'
-- Para permitir que os Coordenadores Municipais consigam ler o painel de usuários SEGURO contra recursão infinita

-- 1. Removemos as políticas de segurança de leitura que possam causar conflito
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by admins." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Leitura irrestrita para Admin e Coordenador" ON profiles;

-- 2. Criamos uma função especial (SECURITY DEFINER) que o Supabase usará para contornar
-- a falha de "infinite recursion" quando a política da própria tabela tenta ler dados dela.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recriamos a política sem o SELECT aninhado, usando a função segura criada acima:
CREATE POLICY "Leitura irrestrita para Admin e Coordenador" 
    ON profiles FOR SELECT 
    USING (
        auth.uid() = id -- LER a si mesmo SEMPRE
        OR 
        public.get_current_user_role() IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Secretário')
    );

-- 4. Inserção / Criação de Usuários:
DROP POLICY IF EXISTS "Admins podem criar novos perfis" ON profiles;
CREATE POLICY "Admins podem criar novos perfis" 
    ON profiles FOR INSERT
    WITH CHECK (
        public.get_current_user_role() IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
    );

-- 5. Atualização de Outros Usuários (Edição de Perfil):
DROP POLICY IF EXISTS "Admins podem alterar qualquer perfil" ON profiles;
CREATE POLICY "Admins podem alterar qualquer perfil" 
    ON profiles FOR UPDATE
    USING (
        public.get_current_user_role() IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
    );

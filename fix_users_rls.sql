-- Correção de Permissões RLS (Row Level Security) para a Tabela 'profiles'
-- Para permitir que os Coordenadores Municipais consigam ler o painel de usuários

-- 1. Removemos as políticas de segurança de leitura que possam estar defasadas na tabela profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by admins." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Leitura irrestrita para Admin e Coordenador" ON profiles;

-- 2. Recriamos a política que autoriza o Coordenador e Admin a ler TODOS os usuários da tabela
CREATE POLICY "Leitura irrestrita para Admin e Coordenador" 
    ON profiles FOR SELECT 
    USING (
        auth.uid() = id -- próprio usuário
        OR 
        EXISTS (
            SELECT 1 FROM profiles AS admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Secretário')
        )
    );

-- Nota: Continua sendo necessário que novas políticas sejam aplicadas para UPDATES, se o usuário não tiver permissão de editar. 
-- Se a inserção de usuários ou atualizações também estiver falhando pela frontend, aplique esta política de update:

DROP POLICY IF EXISTS "Admins podem alterar qualquer perfil" ON profiles;
CREATE POLICY "Admins podem alterar qualquer perfil" 
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles AS admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
        )
    );

DROP POLICY IF EXISTS "Admins podem criar novos perfis" ON profiles;
CREATE POLICY "Admins podem criar novos perfis" 
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles AS admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.role IN ('Admin', 'Administrador', 'administrador', 'Coordenador', 'Coordenador de Proteção e Defesa Civil')
        )
    );

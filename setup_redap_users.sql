CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    usr RECORD;
    new_id UUID;
    existing_id UUID;
BEGIN
    FOR usr IN SELECT * FROM json_populate_recordset(null::record, 
    '[
        {"e": "saude@redap.com", "r": "Redap_Saude", "n": "Secretaria de Saúde"},
        {"e": "securb@redap.com", "r": "Redap_Obras", "n": "Secretaria de Serviços Urbanos"},
        {"e": "social@redap.com", "r": "Redap_Social", "n": "Secretaria de Assistência Social"},
        {"e": "educacao@redap.com", "r": "Redap_Educacao", "n": "Secretaria de Educação"},
        {"e": "agricultura@redap.com", "r": "Redap_Agricultura", "n": "Secretaria de Agricultura"},
        {"e": "interior@redap.com", "r": "Redap_Interior", "n": "Secretaria de Interior"},
        {"e": "administracao@redap.com", "r": "Redap_Administracao", "n": "Secretaria de Administração"},
        {"e": "cdl@redap.com", "r": "Redap_CDL", "n": "CDL - Comércio e Serviços"},
        {"e": "cesan@redap.com", "r": "Redap_Cesan", "n": "CESAN - Água e Esgoto"},
        {"e": "defesasocial@redap.com", "r": "Redap_DefesaSocial", "n": "Secretaria de Defesa Social"},
        {"e": "esporte@redap.com", "r": "Redap_EsporteTurismo", "n": "Secretaria de Esporte e Turismo"},
        {"e": "transportes@redap.com", "r": "Redap_Transportes", "n": "Secretaria de Transportes"},
        {"e": "defesa@redap.com", "r": "Agente de Defesa Civil", "n": "Agente de Teste"},
        {"e": "admin@redap.com", "r": "Admin", "n": "Administrador de Teste"}
    ]'::json) AS (e text, r text, n text)
    LOOP
        
        -- Verificar se o email já existe
        SELECT id INTO existing_id FROM auth.users WHERE email = usr.e;
        
        IF existing_id IS NULL THEN
            new_id := gen_random_uuid();
            
            -- Inserir do lado Auth de forma forçada, já confirmando o E-mail e Hasheando a Senha
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
                recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
                created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 
                usr.e, crypt('redap123', gen_salt('bf')), now(), now(), now(), 
                '{"provider":"email","providers":["email"]}', 
                json_build_object('full_name', usr.n, 'role', usr.r)::jsonb, 
                now(), now(), '', '', '', ''
            );
            
            -- Inserir/Atualizar perfil na tabela profiles pública
            INSERT INTO public.profiles (id, full_name, role, is_active, updated_at)
            VALUES (new_id, usr.n, usr.r, true, now())
            ON CONFLICT (id) DO UPDATE SET role = usr.r, full_name = usr.n;
        ELSE
            -- Se a conta já existe, apenas garantir que o Perfil de permissão na tabela profiles confere
            UPDATE public.profiles SET role = usr.r, full_name = usr.n WHERE id = existing_id;
        END IF;

    END LOOP;
END;
$$;

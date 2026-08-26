-- Migração: Função de Pesquisa Global para o SIGERD Web
-- Permite consultar unificadamente vistorias, ocorrências, interdições, noprer, alertas, voluntários, ofícios e redap

CREATE OR REPLACE FUNCTION public.global_search(
    p_query TEXT,
    p_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    record_type TEXT,
    title TEXT,
    identifier TEXT,
    description TEXT,
    responsible TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    latitude NUMERIC,
    longitude NUMERIC,
    fonte_geolocalizacao TEXT,
    link_route TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_search_pattern TEXT;
BEGIN
    v_search_pattern := '%' || LOWER(TRIM(p_query)) || '%';

    RETURN QUERY
    WITH search_results AS (
        -- 1. Vistorias
        SELECT 
            v.id::TEXT AS id,
            'vistoria'::TEXT AS record_type,
            COALESCE(v.vistoria_id, 'Vistoria ' || v.id::TEXT) AS title,
            v.vistoria_id::TEXT AS identifier,
            COALESCE(v.endereco, '') || ' - ' || COALESCE(v.bairro, '') || ' (' || COALESCE(v.solicitante, '') || ')' AS description,
            v.responsavel_tecnico::TEXT AS responsible,
            v.status::TEXT AS status,
            v.created_at AS created_at,
            v.latitude::NUMERIC AS latitude,
            v.longitude::NUMERIC AS longitude,
            v.fonte_geolocalizacao::TEXT AS fonte_geolocalizacao,
            '/vistorias'::TEXT AS link_route
        FROM public.vistorias v
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'vistoria')
          AND (
            LOWER(COALESCE(v.vistoria_id, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.solicitante, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.endereco, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.bairro, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.responsavel_tecnico, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 2. Ocorrências
        SELECT 
            o.id::TEXT AS id,
            'ocorrencia'::TEXT AS record_type,
            COALESCE(o.protocolo, o.numero_protocolo, 'Ocorrência ' || o.id::TEXT) AS title,
            COALESCE(o.protocolo, o.numero_protocolo, '')::TEXT AS identifier,
            COALESCE(o.tipo, '') || ' - ' || COALESCE(o.descricao, '') AS description,
            o.solicitante::TEXT AS responsible,
            o.status::TEXT AS status,
            o.created_at AS created_at,
            o.latitude::NUMERIC AS latitude,
            o.longitude::NUMERIC AS longitude,
            o.fonte_geolocalizacao::TEXT AS fonte_geolocalizacao,
            '/ocorrencias'::TEXT AS link_route
        FROM public.ocorrencias o
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'ocorrencia')
          AND (
            LOWER(COALESCE(o.protocolo, o.numero_protocolo, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.tipo, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.descricao, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.solicitante, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.bairro, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 3. Interdições
        SELECT 
            i.id::TEXT AS id,
            'interdicao'::TEXT AS record_type,
            COALESCE(i.numero_interdicao, i.numero, 'Interdição ' || i.id::TEXT) AS title,
            COALESCE(i.numero_interdicao, i.numero, '')::TEXT AS identifier,
            COALESCE(i.motivo, i.endereco, '') AS description,
            i.responsavel::TEXT AS responsible,
            i.status::TEXT AS status,
            i.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/interdicao'::TEXT AS link_route
        FROM public.interdicoes i
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'interdicao')
          AND (
            LOWER(COALESCE(i.numero_interdicao, i.numero, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(i.motivo, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(i.endereco, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(i.responsavel, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 4. NOPRER
        SELECT 
            n.id::TEXT AS id,
            'noprer'::TEXT AS record_type,
            COALESCE(n.numero_noprer, n.numero, 'NOPRER ' || n.id::TEXT) AS title,
            COALESCE(n.numero_noprer, n.numero, '')::TEXT AS identifier,
            COALESCE(n.descricao, '') AS description,
            COALESCE(n.responsavel, n.solicitante, '') AS responsible,
            n.status::TEXT AS status,
            n.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/noprer'::TEXT AS link_route
        FROM public.noprer n
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'noprer')
          AND (
            LOWER(COALESCE(n.numero_noprer, n.numero, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(n.descricao, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(n.solicitante, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(n.responsavel, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 5. Alertas CEMADEN
        SELECT 
            ac.id::TEXT AS id,
            'alerta_cemaden'::TEXT AS record_type,
            COALESCE(ac.titulo, 'Alerta CEMADEN ' || ac.id::TEXT) AS title,
            ac.id::TEXT AS identifier,
            COALESCE(ac.descricao, ac.municipio, '') AS description,
            'CEMADEN'::TEXT AS responsible,
            ac.nivel::TEXT AS status,
            ac.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/alertas-cemaden'::TEXT AS link_route
        FROM public.alertas_cemaden ac
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'alerta')
          AND (
            LOWER(COALESCE(ac.titulo, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(ac.descricao, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(ac.municipio, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 6. Credenciamentos / Voluntários
        SELECT 
            v.id::TEXT AS id,
            'credenciamento'::TEXT AS record_type,
            COALESCE(v.nome, 'Voluntário ' || v.id::TEXT) AS title,
            COALESCE(v.cpf, v.id::TEXT) AS identifier,
            COALESCE(v.area_atuacao, 'Credenciamento de Voluntário') AS description,
            v.nome::TEXT AS responsible,
            v.status::TEXT AS status,
            v.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/voluntarios'::TEXT AS link_route
        FROM public.voluntarios v
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'credenciamento')
          AND (
            LOWER(COALESCE(v.nome, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.cpf, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(v.area_atuacao, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 7. Ofícios (Legado)
        SELECT 
            o.id::TEXT AS id,
            'oficio'::TEXT AS record_type,
            COALESCE(o.numero_oficio, o.numero, 'Ofício ' || o.id::TEXT) AS title,
            COALESCE(o.numero_oficio, o.numero, '')::TEXT AS identifier,
            COALESCE(o.assunto, o.destinatario, '') AS description,
            o.responsavel::TEXT AS responsible,
            'Ativo'::TEXT AS status,
            o.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/legado'::TEXT AS link_route
        FROM public.legado_oficios o
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'oficio')
          AND (
            LOWER(COALESCE(o.numero_oficio, o.numero, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.assunto, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(o.destinatario, '')) LIKE v_search_pattern
          )

        UNION ALL

        -- 8. REDAP
        SELECT 
            r.id::TEXT AS id,
            'redap'::TEXT AS record_type,
            COALESCE(r.nome_evento, 'REDAP ' || r.id::TEXT) AS title,
            COALESCE(r.cobrade, r.id::TEXT) AS identifier,
            COALESCE(r.descricao, 'Relatório de Danos e Prejuízos') AS description,
            'Defesa Civil'::TEXT AS responsible,
            r.status::TEXT AS status,
            r.created_at AS created_at,
            NULL::NUMERIC AS latitude,
            NULL::NUMERIC AS longitude,
            NULL::TEXT AS fonte_geolocalizacao,
            '/redap'::TEXT AS link_route
        FROM public.redap_eventos r
        WHERE (p_type IS NULL OR p_type = 'all' OR p_type = 'redap')
          AND (
            LOWER(COALESCE(r.nome_evento, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(r.cobrade, '')) LIKE v_search_pattern OR
            LOWER(COALESCE(r.descricao, '')) LIKE v_search_pattern
          )
    )
    SELECT * 
    FROM search_results
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

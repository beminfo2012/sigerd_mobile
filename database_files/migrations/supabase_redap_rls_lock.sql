-- ====================================================================
-- MÓDULO REDAP - SEGURANÇA E IMUTABILIDADE DO FLUXO "LOCKED PASTA"
-- SQL DE MIGRAÇÃO DE RLS NO SUPABASE (IDEMPOTENTE)
-- ====================================================================

-- 1. POLÍTICAS PARA A TABELA redap_records (FIDE Consolidado Master)
ALTER TABLE public.redap_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redap Records: Select" ON public.redap_records;
DROP POLICY IF EXISTS "Redap Records: Insert" ON public.redap_records;
DROP POLICY IF EXISTS "Redap Records: Update" ON public.redap_records;
DROP POLICY IF EXISTS "Redap Records: Delete" ON public.redap_records;

-- Qualquer usuário autenticado pode visualizar os consolidados
CREATE POLICY "Redap Records: Select" ON public.redap_records
    FOR SELECT USING (true);

-- Apenas a Defesa Civil pode criar novos registros consolidados
CREATE POLICY "Redap Records: Insert" ON public.redap_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
        )
    );

-- Atualização: Bloqueada se status for 'submitted' (finalizado),
-- exceto se o usuário for Defesa Civil e estiver reabrindo a pasta (mudando para 'draft')
CREATE POLICY "Redap Records: Update" ON public.redap_records
    FOR UPDATE USING (
        (status <> 'submitted') OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
        )
    )
    WITH CHECK (
        (status <> 'submitted') OR
        (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
            ) AND (
                -- Permite alteração caso o novo estado seja 'draft' (reabertura de pasta)
                status = 'draft'
            )
        )
    );

-- Exclusão: Totalmente bloqueada se a pasta estiver finalizada ('submitted')
CREATE POLICY "Redap Records: Delete" ON public.redap_records
    FOR DELETE USING (
        (status <> 'submitted') AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
        )
    );


-- 2. POLÍTICAS PARA A TABELA redap_registros (Lançamentos de Danos Setoriais)
ALTER TABLE public.redap_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redap Registros: Select" ON public.redap_registros;
DROP POLICY IF EXISTS "Redap Registros: Insert" ON public.redap_registros;
DROP POLICY IF EXISTS "Redap Registros: Update" ON public.redap_registros;
DROP POLICY IF EXISTS "Redap Registros: Delete" ON public.redap_registros;

-- Todos podem visualizar os registros setoriais
CREATE POLICY "Redap Registros: Select" ON public.redap_registros
    FOR SELECT USING (true);

-- Permite inserção apenas se o evento correspondente não estiver com status 'Finalizado'
CREATE POLICY "Redap Registros: Insert" ON public.redap_registros
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.redap_eventos 
            WHERE id = evento_id AND status_evento <> 'Finalizado'
        ) AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
            ) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND (profiles.role LIKE 'Redap_%' OR profiles.role LIKE 'S2id_%')
            )
        )
    );

-- Atualização: Bloqueada se o evento estiver 'Finalizado' ou se o registro já tiver validação ('Aprovado'/'Rejeitado')
-- no caso das secretarias. A Defesa Civil pode alterar até que o evento seja finalizado.
CREATE POLICY "Redap Registros: Update" ON public.redap_registros
    FOR UPDATE USING (
        -- O evento não pode estar finalizado
        EXISTS (
            SELECT 1 FROM public.redap_eventos 
            WHERE id = evento_id AND status_evento <> 'Finalizado'
        ) AND (
            -- Defesa Civil tem acesso total (desde que o evento não esteja finalizado)
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
            ) OR
            -- Usuários de secretaria só alteram registros que ainda estão sob análise ('Enviado')
            (
                (status_validacao = 'Enviado') AND
                (usuario_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND (profiles.role LIKE 'Redap_%' OR profiles.role LIKE 'S2id_%')
                ))
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.redap_eventos 
            WHERE id = evento_id AND status_evento <> 'Finalizado'
        )
    );

-- Exclusão: Mesma regra de segurança aplicada à atualização
CREATE POLICY "Redap Registros: Delete" ON public.redap_registros
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.redap_eventos 
            WHERE id = evento_id AND status_evento <> 'Finalizado'
        ) AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
            ) OR
            (
                (status_validacao = 'Enviado') AND
                (usuario_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND (profiles.role LIKE 'Redap_%' OR profiles.role LIKE 'S2id_%')
                ))
            )
        )
    );


-- 3. POLÍTICAS PARA A TABELA redap_eventos (Eventos/Desastres)
ALTER TABLE public.redap_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Redap Eventos: Select" ON public.redap_eventos;
DROP POLICY IF EXISTS "Redap Eventos: Defesa Civil Tudo" ON public.redap_eventos;

-- Qualquer um visualiza
CREATE POLICY "Redap Eventos: Select" ON public.redap_eventos
    FOR SELECT USING (true);

-- Defesa Civil gerencia
CREATE POLICY "Redap Eventos: Defesa Civil Tudo" ON public.redap_eventos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND profiles.role IN ('Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil')
        )
    );

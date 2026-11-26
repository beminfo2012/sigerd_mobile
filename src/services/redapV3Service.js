import { supabase } from './supabase';
import { generateRedapDocumentIa } from './ai';
import {
    DEFAULT_REDAP_MODELS,
    SECRETARIA_CATALOG,
    getModelForSecretaria,
    calculateReportProgress,
} from '../utils/redapModelsConfig';

/**
 * Serviço REDAP V3 — Alinhado ao Manual de Implementação REDAP v1.0.
 *
 * Opera diretamente sobre as tabelas relacionais `redap_relatorios`, `redap_danos`,
 * `redap_prejuizos`, `redap_equipes`, `redap_recursos`, `redap_despesas`,
 * `redap_anexos`, `redap_pendencias`, `redap_historico` e `redap_modelos`.
 *
 * Inclui fallback transparente em localStorage caso a migration SQL v3 ainda
 * não tenha sido executada no Supabase, permitindo uso imediato sem erros.
 */

const LOCAL_STORE_KEY = 'sigerd_redap_v3_fallback_v1';

const getLocalStore = () => {
    try {
        const raw = localStorage.getItem(LOCAL_STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        relatorios: [],
        danos: [],
        prejuizos: [],
        equipes: [],
        recursos: [],
        despesas: [],
        anexos: [],
        pendencias: [],
        historico: [],
        modelos: Object.values(DEFAULT_REDAP_MODELS),
    };
};

const saveLocalStore = (store) => {
    try {
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
    } catch (e) {
        console.warn('[redapV3] localStorage quota warning:', e);
    }
};

const isMissingTableError = (error) => {
    if (!error) return false;
    const msg = String(error.message || error.details || '').toLowerCase();
    return (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        msg.includes('does not exist') ||
        msg.includes('could not find the table') ||
        msg.includes('schema cache')
    );
};

export const isDefesaCivilRole = (role) => {
    return [
        'Admin',
        'Administrador',
        'administrador',
        'admin',
        'Coordenador',
        'Coordenador de Proteção e Defesa Civil',
        'Agente de Defesa Civil',
        'Redap_Geral',
    ].includes(role);
};

// ─────────────────────────────────────────────────────────────────────────────
// MODELOS PARAMETRIZÁVEIS
// ─────────────────────────────────────────────────────────────────────────────

export const listRedapModels = async () => {
    try {
        const { data, error } = await supabase
            .from('redap_modelos')
            .select('*')
            .order('secretaria_nome', { ascending: true });

        if (error) {
            if (isMissingTableError(error)) {
                return Object.values(DEFAULT_REDAP_MODELS);
            }
            throw error;
        }

        if (!data || data.length === 0) {
            return Object.values(DEFAULT_REDAP_MODELS);
        }

        // Mescla modelos do banco com padrões faltantes
        const map = new Map(Object.values(DEFAULT_REDAP_MODELS).map(m => [m.secretaria_key, m]));
        data.forEach(m => map.set(m.secretaria_key, m));
        return Array.from(map.values());
    } catch (err) {
        console.warn('[redapV3] Fallback listRedapModels:', err.message);
        return Object.values(DEFAULT_REDAP_MODELS);
    }
};

export const saveRedapModel = async (modelData) => {
    const payload = {
        secretaria_key: modelData.secretaria_key,
        secretaria_nome: modelData.secretaria_nome,
        nome: modelData.nome,
        versao: Number(modelData.versao) || 1,
        configuracao_json: modelData.configuracao_json || {},
        ativo: modelData.ativo !== false,
        updated_at: new Date().toISOString(),
    };

    try {
        const { data, error } = await supabase
            .from('redap_modelos')
            .upsert(payload, { onConflict: 'tenant_id,secretaria_key,versao' })
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                const saved = { id: modelData.id || crypto.randomUUID(), ...payload };
                const idx = store.modelos.findIndex(m => m.secretaria_key === saved.secretaria_key);
                if (idx >= 0) store.modelos[idx] = saved;
                else store.modelos.push(saved);
                saveLocalStore(store);
                return saved;
            }
            throw error;
        }
        return data;
    } catch (err) {
        console.error('[redapV3] saveRedapModel:', err);
        throw err;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIOS SETORIAIS (DISTRIBUIÇÃO E LISTAGEM)
// ─────────────────────────────────────────────────────────────────────────────

export const getRelatoriosByEvento = async (eventoId) => {
    try {
        const { data, error } = await supabase
            .from('redap_relatorios')
            .select('*')
            .eq('evento_id', eventoId)
            .order('secretaria_nome', { ascending: true });

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                return store.relatorios.filter(r => r.evento_id === eventoId);
            }
            throw error;
        }
        return data || [];
    } catch (err) {
        console.warn('[redapV3] Fallback getRelatoriosByEvento:', err.message);
        const store = getLocalStore();
        return store.relatorios.filter(r => r.evento_id === eventoId);
    }
};

export const getAllRelatorios = async () => {
    try {
        const { data, error } = await supabase
            .from('redap_relatorios')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            if (isMissingTableError(error)) {
                return getLocalStore().relatorios;
            }
            throw error;
        }
        return data || [];
    } catch {
        return getLocalStore().relatorios;
    }
};

export const getRelatorioCompleto = async (relatorioId) => {
    try {
        const { data: report, error } = await supabase
            .from('redap_relatorios')
            .select('*')
            .eq('id', relatorioId)
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                const localRep = store.relatorios.find(r => r.id === relatorioId);
                if (!localRep) return null;
                return {
                    report: localRep,
                    danos: store.danos.filter(d => d.relatorio_id === relatorioId),
                    prejuizos: store.prejuizos.filter(p => p.relatorio_id === relatorioId),
                    equipes: store.equipes.filter(e => e.relatorio_id === relatorioId),
                    recursos: store.recursos.filter(r => r.relatorio_id === relatorioId),
                    despesas: store.despesas.filter(d => d.relatorio_id === relatorioId),
                    anexos: store.anexos.filter(a => a.relatorio_id === relatorioId),
                    pendencias: store.pendencias.filter(p => p.relatorio_id === relatorioId),
                    historico: store.historico.filter(h => h.relatorio_id === relatorioId),
                };
            }
            throw error;
        }

        const [danosRes, prejRes, eqRes, recRes, despRes, anexRes, pendRes, histRes] = await Promise.all([
            supabase.from('redap_danos').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_prejuizos').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_equipes').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_recursos').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_despesas').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_anexos').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: true }),
            supabase.from('redap_pendencias').select('*').eq('relatorio_id', relatorioId).order('created_at', { ascending: false }),
            supabase.from('redap_historico').select('*').eq('relatorio_id', relatorioId).order('criado_em', { ascending: false }),
        ]);

        return {
            report,
            danos: danosRes.data || [],
            prejuizos: prejRes.data || [],
            equipes: eqRes.data || [],
            recursos: recRes.data || [],
            despesas: despRes.data || [],
            anexos: anexRes.data || [],
            pendencias: pendRes.data || [],
            historico: histRes.data || [],
        };
    } catch (err) {
        console.warn('[redapV3] Fallback getRelatorioCompleto:', err.message);
        const store = getLocalStore();
        const localRep = store.relatorios.find(r => r.id === relatorioId);
        if (!localRep) return null;
        return {
            report: localRep,
            danos: store.danos.filter(d => d.relatorio_id === relatorioId),
            prejuizos: store.prejuizos.filter(p => p.relatorio_id === relatorioId),
            equipes: store.equipes.filter(e => e.relatorio_id === relatorioId),
            recursos: store.recursos.filter(r => r.relatorio_id === relatorioId),
            despesas: store.despesas.filter(d => d.relatorio_id === relatorioId),
            anexos: store.anexos.filter(a => a.relatorio_id === relatorioId),
            pendencias: store.pendencias.filter(p => p.relatorio_id === relatorioId),
            historico: store.historico.filter(h => h.relatorio_id === relatorioId),
        };
    }
};

/**
 * RF02 & RF03: Distribui um evento para as secretarias selecionadas,
 * evitando duplicidade para a mesma combinação evento + secretaria ativa.
 */
export const distributeEventToSecretarias = async (eventoId, secretariaKeys, prazoEnvio = null, user = null) => {
    const existing = await getRelatoriosByEvento(eventoId);
    const activeKeys = new Set(
        existing.filter(r => r.status !== 'CANCELADO').map(r => r.secretaria_key)
    );

    const toCreate = secretariaKeys.filter(k => !activeKeys.has(k));
    if (toCreate.length === 0) return [];

    const nowIso = new Date().toISOString();
    const created = [];

    for (const secKey of toCreate) {
        const cat = SECRETARIA_CATALOG.find(s => s.key === secKey);
        const model = getModelForSecretaria(secKey);
        const row = {
            evento_id: eventoId,
            secretaria_key: secKey,
            secretaria_nome: cat?.nome || model.secretaria_nome || secKey,
            modelo_versao: model.versao || 1,
            status: 'NAO_INICIADO',
            progresso: 0,
            prazo_envio: prazoEnvio || null,
            dados_complementares: {},
            created_at: nowIso,
            updated_at: nowIso,
        };

        try {
            const { data, error } = await supabase
                .from('redap_relatorios')
                .insert([row])
                .select()
                .single();

            if (error) {
                if (isMissingTableError(error)) {
                    const store = getLocalStore();
                    const localRow = { id: crypto.randomUUID(), ...row };
                    store.relatorios.push(localRow);
                    store.historico.unshift({
                        id: crypto.randomUUID(),
                        relatorio_id: localRow.id,
                        evento_id: eventoId,
                        usuario_id: user?.id || null,
                        usuario_nome: user?.full_name || 'Defesa Civil',
                        acao: 'DISTRIBUICAO',
                        status_anterior: null,
                        status_novo: 'NAO_INICIADO',
                        observacao: `Relatório disponibilizado para ${localRow.secretaria_nome}.`,
                        criado_em: nowIso,
                    });
                    saveLocalStore(store);
                    created.push(localRow);
                    continue;
                }
                throw error;
            }

            created.push(data);
            await addHistoricoEntry({
                relatorio_id: data.id,
                evento_id: eventoId,
                usuario_id: user?.id || null,
                usuario_nome: user?.full_name || 'Defesa Civil',
                acao: 'DISTRIBUICAO',
                status_anterior: null,
                status_novo: 'NAO_INICIADO',
                observacao: `Relatório disponibilizado para ${data.secretaria_nome}.`,
            });
        } catch (err) {
            console.error('[redapV3] Error creating report for', secKey, err);
            throw err;
        }
    }

    return created;
};

// ─────────────────────────────────────────────────────────────────────────────
// SALVAMENTO DO RELATÓRIO E TABELAS FILHAS (RASCUNHO / AUTO-SAVE)
// ─────────────────────────────────────────────────────────────────────────────

export const saveRelatorioDraft = async (relatorioId, bundle, modelConfig = {}) => {
    const {
        report,
        danos = [],
        prejuizos = [],
        equipes = [],
        recursos = [],
        despesas = [],
        anexos = [],
    } = bundle;

    const progresso = calculateReportProgress({
        report,
        danos,
        prejuizos,
        equipes,
        recursos,
        despesas,
        anexos,
        modelConfig,
    });

    const nextStatus = report.status === 'NAO_INICIADO' ? 'EM_PREENCHIMENTO' : report.status;
    const nowIso = new Date().toISOString();

    const reportUpdate = {
        status: nextStatus,
        progresso,
        responsavel_nome: report.responsavel_nome || null,
        responsavel_cargo: report.responsavel_cargo || null,
        responsavel_telefone: report.responsavel_telefone || null,
        responsavel_email: report.responsavel_email || null,
        introducao_texto: report.introducao_texto || null,
        introducao_ia_gerada: Boolean(report.introducao_ia_gerada),
        introducao_confirmada_por: report.introducao_confirmada_por || null,
        introducao_confirmada_em: report.introducao_confirmada_em || null,
        consideracoes_texto: report.consideracoes_texto || null,
        consideracoes_ia_gerada: Boolean(report.consideracoes_ia_gerada),
        consideracoes_confirmada_por: report.consideracoes_confirmada_por || null,
        consideracoes_confirmada_em: report.consideracoes_confirmada_em || null,
        declaracao_responsabilidade: Boolean(report.declaracao_responsabilidade),
        dados_complementares: report.dados_complementares || {},
        updated_at: nowIso,
    };

    const syncChildTable = async (tableName, items, mapper) => {
        await supabase.from(tableName).delete().eq('relatorio_id', relatorioId);
        if (items.length > 0) {
            const rows = items.map(item => mapper(item, relatorioId));
            const { error } = await supabase.from(tableName).insert(rows);
            if (error) throw error;
        }
    };

    try {
        const { data: updatedReport, error } = await supabase
            .from('redap_relatorios')
            .update(reportUpdate)
            .eq('id', relatorioId)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return saveDraftLocal(relatorioId, reportUpdate, { danos, prejuizos, equipes, recursos, despesas, anexos });
            }
            throw error;
        }

        await Promise.all([
            syncChildTable('redap_danos', danos, (d, rid) => ({
                relatorio_id: rid,
                secao: d.secao || 'DANOS_INFRAESTRUTURA',
                categoria: d.categoria || null,
                item: d.item || 'Item',
                quantidade: d.quantidade === '' || d.quantidade === undefined ? null : (d.quantidade === null ? null : parseInt(d.quantidade, 10)),
                quantidade_danificada: d.quantidade_danificada === '' || d.quantidade_danificada === undefined ? null : (d.quantidade_danificada === null ? null : parseInt(d.quantidade_danificada, 10)),
                quantidade_destruida: d.quantidade_destruida === '' || d.quantidade_destruida === undefined ? null : (d.quantidade_destruida === null ? null : parseInt(d.quantidade_destruida, 10)),
                valor_estimado: d.valor_estimado === '' || d.valor_estimado === undefined ? null : (d.valor_estimado === null ? null : Number(d.valor_estimado)),
                localidade: d.localidade || null,
                endereco: d.endereco || null,
                latitude: d.latitude || null,
                longitude: d.longitude || null,
                descricao: d.descricao || null,
                situacao_informacao: d.situacao_informacao || 'INFORMADO',
            })),
            syncChildTable('redap_prejuizos', prejuizos, (p, rid) => ({
                relatorio_id: rid,
                servico: p.servico || 'Serviço Público',
                valor_estimado: p.valor_estimado === '' || p.valor_estimado === undefined ? null : (p.valor_estimado === null ? null : Number(p.valor_estimado)),
                localidade: p.localidade || null,
                descricao: p.descricao || null,
                situacao_informacao: p.situacao_informacao || 'INFORMADO',
            })),
            syncChildTable('redap_equipes', equipes, (e, rid) => ({
                relatorio_id: rid,
                tipo_acao: e.tipo_acao || 'Atuação Operacional',
                quantidade_servidores: parseInt(e.quantidade_servidores, 10) || 0,
                descricao_atividade: e.descricao_atividade || null,
                local: e.local || null,
                data_inicio: e.data_inicio || null,
                data_fim: e.data_fim || null,
                status_acao: e.status_acao || 'REALIZADA',
            })),
            syncChildTable('redap_recursos', recursos, (r, rid) => ({
                relatorio_id: rid,
                tipo: r.tipo || 'Equipamento',
                nome: r.nome || 'Recurso',
                quantidade: Number(r.quantidade) || 0,
                unidade: r.unidade || 'un.',
                local: r.local || null,
                finalidade: r.finalidade || null,
                periodo: r.periodo || null,
            })),
            syncChildTable('redap_despesas', despesas, (d, rid) => ({
                relatorio_id: rid,
                fonte: d.fonte || 'Recursos Próprios',
                tipo_despesa: d.tipo_despesa || 'Despesa Emergencial',
                valor: Number(d.valor) || 0,
                descricao: d.descricao || null,
                documento_ref: d.documento_ref || null,
            })),
            syncChildTable('redap_anexos', anexos, (a, rid) => ({
                relatorio_id: rid,
                registro_relacionado_id: a.registro_relacionado_id || null,
                secao: a.secao || 'GERAL',
                storage_path: a.storage_path || null,
                url_preview: a.url_preview || a.data || null,
                nome_arquivo: a.nome_arquivo || 'evidencia.jpg',
                tipo_mime: a.tipo_mime || 'image/jpeg',
                tamanho_bytes: a.tamanho_bytes || null,
                data_foto: a.data_foto || new Date().toISOString(),
                latitude: a.latitude || null,
                longitude: a.longitude || null,
                descricao: a.descricao || null,
            })),
        ]);

        return updatedReport;
    } catch (err) {
        if (isMissingTableError(err)) {
            return saveDraftLocal(relatorioId, reportUpdate, { danos, prejuizos, equipes, recursos, despesas, anexos });
        }
        console.error('[redapV3] saveRelatorioDraft:', err);
        throw err;
    }
};

const saveDraftLocal = (relatorioId, reportUpdate, children) => {
    const store = getLocalStore();
    const idx = store.relatorios.findIndex(r => r.id === relatorioId);
    if (idx < 0) return null;
    store.relatorios[idx] = { ...store.relatorios[idx], ...reportUpdate };

    const replace = (key, list) => {
        store[key] = [
            ...store[key].filter(i => i.relatorio_id !== relatorioId),
            ...list.map(i => ({ id: i.id || crypto.randomUUID(), ...i, relatorio_id: relatorioId })),
        ];
    };
    replace('danos', children.danos);
    replace('prejuizos', children.prejuizos);
    replace('equipes', children.equipes);
    replace('recursos', children.recursos);
    replace('despesas', children.despesas);
    replace('anexos', children.anexos);
    saveLocalStore(store);
    return store.relatorios[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW DE STATUS, PENDÊNCIAS E AUDITORIA IMUTÁVEL
// ─────────────────────────────────────────────────────────────────────────────

export const addHistoricoEntry = async (entry) => {
    const row = {
        relatorio_id: entry.relatorio_id || null,
        evento_id: entry.evento_id || null,
        usuario_id: entry.usuario_id || null,
        usuario_nome: entry.usuario_nome || 'Sistema',
        acao: entry.acao,
        status_anterior: entry.status_anterior || null,
        status_novo: entry.status_novo || null,
        observacao: entry.observacao || null,
        criado_em: new Date().toISOString(),
    };
    try {
        const { error } = await supabase.from('redap_historico').insert([row]);
        if (error && isMissingTableError(error)) {
            const store = getLocalStore();
            store.historico.unshift({ id: crypto.randomUUID(), ...row });
            saveLocalStore(store);
        }
    } catch {
        const store = getLocalStore();
        store.historico.unshift({ id: crypto.randomUUID(), ...row });
        saveLocalStore(store);
    }
};

export const transitionRelatorioStatus = async ({
    relatorioId,
    eventoId,
    statusAnterior,
    statusNovo,
    acao,
    observacao = '',
    user = null,
    extraFields = {},
}) => {
    const nowIso = new Date().toISOString();
    const updatePayload = {
        status: statusNovo,
        updated_at: nowIso,
        ...extraFields,
    };

    if (statusNovo === 'ENVIADO') {
        updatePayload.enviado_em = nowIso;
        updatePayload.enviado_por = user?.full_name || 'Secretaria';
        updatePayload.declaracao_responsabilidade = true;
    }
    if (statusNovo === 'APROVADO') {
        updatePayload.aprovado_em = nowIso;
        updatePayload.aprovado_por = user?.full_name || 'Defesa Civil';
    }

    try {
        const { data, error } = await supabase
            .from('redap_relatorios')
            .update(updatePayload)
            .eq('id', relatorioId)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                const idx = store.relatorios.findIndex(r => r.id === relatorioId);
                if (idx >= 0) {
                    store.relatorios[idx] = { ...store.relatorios[idx], ...updatePayload };
                }
                store.historico.unshift({
                    id: crypto.randomUUID(),
                    relatorio_id: relatorioId,
                    evento_id: eventoId,
                    usuario_id: user?.id || null,
                    usuario_nome: user?.full_name || 'Sistema',
                    acao,
                    status_anterior: statusAnterior,
                    status_novo: statusNovo,
                    observacao,
                    criado_em: nowIso,
                });
                saveLocalStore(store);
                return store.relatorios[idx];
            }
            throw error;
        }

        await addHistoricoEntry({
            relatorio_id: relatorioId,
            evento_id: eventoId || data?.evento_id,
            usuario_id: user?.id || null,
            usuario_nome: user?.full_name || 'Sistema',
            acao,
            status_anterior: statusAnterior,
            status_novo: statusNovo,
            observacao,
        });

        return data;
    } catch (err) {
        console.error('[redapV3] transitionRelatorioStatus:', err);
        throw err;
    }
};

export const addPendencia = async ({ relatorioId, secao, campoOuRegistroId = null, descricao, user = null }) => {
    const row = {
        relatorio_id: relatorioId,
        secao,
        campo_ou_registro_id: campoOuRegistroId,
        descricao,
        situacao: 'ABERTA',
        criado_por: user?.id || null,
        criado_por_nome: user?.full_name || 'Defesa Civil',
        created_at: new Date().toISOString(),
    };

    try {
        const { data, error } = await supabase
            .from('redap_pendencias')
            .insert([row])
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                const local = { id: crypto.randomUUID(), ...row };
                store.pendencias.unshift(local);
                saveLocalStore(store);
                return local;
            }
            throw error;
        }
        return data;
    } catch (err) {
        console.error('[redapV3] addPendencia:', err);
        throw err;
    }
};

export const resolvePendencia = async (pendenciaId, user = null) => {
    const update = {
        situacao: 'RESOLVIDA',
        resolvido_em: new Date().toISOString(),
        resolvido_por: user?.full_name || 'Responsável',
    };

    try {
        const { data, error } = await supabase
            .from('redap_pendencias')
            .update(update)
            .eq('id', pendenciaId)
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const store = getLocalStore();
                const idx = store.pendencias.findIndex(p => p.id === pendenciaId);
                if (idx >= 0) store.pendencias[idx] = { ...store.pendencias[idx], ...update };
                saveLocalStore(store);
                return store.pendencias[idx];
            }
            throw error;
        }
        return data;
    } catch (err) {
        console.error('[redapV3] resolvePendencia:', err);
        throw err;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GERAÇÃO ASSISTIDA POR IA (SEÇÃO 9 DO MANUAL)
// ─────────────────────────────────────────────────────────────────────────────

export const generateRedapSectionWithIA = async (sectionType, { event, report, danos, prejuizos, equipes, recursos, despesas }) => {
    const hasSomeData =
        danos.length > 0 ||
        prejuizos.length > 0 ||
        equipes.length > 0 ||
        recursos.length > 0 ||
        despesas.length > 0;

    if (!hasSomeData) {
        return {
            error: 'Não há dados estruturados preenchidos suficientes (danos, prejuízos ou atuação) para gerar o texto com segurança.',
            text: null,
        };
    }

    const totalDanosValor = danos.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);
    const totalPrejValor = prejuizos.reduce((acc, p) => acc + (Number(p.valor_estimado) || 0), 0);
    const totalDespValor = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

    const summary = {
        evento: event?.nome_evento || 'Desastre Municipal',
        cobrade: event?.cobrade || 'Não informado',
        data_inicio: event?.data_inicio || '',
        secretaria: report?.secretaria_nome || '',
        danos_registrados: danos.map(d => ({
            secao: d.secao,
            categoria: d.categoria,
            item: d.item,
            quantidade: d.quantidade,
            danificada: d.quantidade_danificada,
            destruida: d.quantidade_destruida,
            valor_estimado: d.valor_estimado,
            localidade: d.localidade,
            descricao: d.descricao,
        })),
        prejuizos_registrados: prejuizos.map(p => ({
            servico: p.servico,
            valor_estimado: p.valor_estimado,
            descricao: p.descricao,
        })),
        atuacao_equipes: equipes.map(e => ({
            acao: e.tipo_acao,
            servidores: e.quantidade_servidores,
            local: e.local,
            status: e.status_acao,
        })),
        atuacao_recursos: recursos.map(r => ({
            tipo: r.tipo,
            nome: r.nome,
            quantidade: r.quantidade,
            unidade: r.unidade,
        })),
        totais: {
            valor_danos_brl: totalDanosValor,
            valor_prejuizos_brl: totalPrejValor,
            valor_despesas_brl: totalDespValor,
        },
    };

    const goal =
        sectionType === 'introducao'
            ? 'Redija a INTRODUÇÃO técnica formal de um relatório setorial REDAP (2 parágrafos objetivos).'
            : 'Redija as CONSIDERAÇÕES FINAIS técnicas de um relatório setorial REDAP (2 parágrafos objetivos), ressaltando as ações realizadas ou em andamento.';

    const prompt = `${goal}
REGRAS OBRIGATÓRIAS (Manual REDAP SIGERD):
- Utilize EXCLUSIVAMENTE os dados JSON fornecidos abaixo.
- NUNCA invente números, causas, datas, localidades ou ações que não estejam nos dados.
- NUNCA transforme campos nulos ou vazios em zero.
- NUNCA afirme que uma ação foi concluída se o status indicar EM_ANDAMENTO.
- Use linguagem técnica, institucional, impessoal e objetiva em português do Brasil.

DADOS ESTRUTURADOS DO RELATÓRIO:
${JSON.stringify(summary, null, 2)}`;

    const generated = await generateRedapDocumentIa(prompt);
    if (!generated) {
        return { error: 'Serviço de IA indisponível no momento. Você pode redigir o texto manualmente.', text: null };
    }
    return { error: null, text: generated.trim() };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSOLIDAÇÃO MUNICIPAL (SEÇÃO 11 & RF12)
// ─────────────────────────────────────────────────────────────────────────────

export const getEventoConsolidado = async (eventoId, includePreview = false) => {
    const relatorios = await getRelatoriosByEvento(eventoId);
    const filtrados = includePreview
        ? relatorios.filter(r => r.status !== 'CANCELADO')
        : relatorios.filter(r => r.status === 'APROVADO');

    const completos = await Promise.all(filtrados.map(r => getRelatorioCompleto(r.id)));
    const valid = completos.filter(Boolean);

    const danos = [];
    const prejuizos = [];
    const equipes = [];
    const recursos = [];
    const despesas = [];
    const anexos = [];

    valid.forEach(item => {
        const origin = {
            relatorio_id: item.report.id,
            secretaria_nome: item.report.secretaria_nome,
            secretaria_key: item.report.secretaria_key,
            status: item.report.status,
        };
        item.danos.forEach(d => danos.push({ ...d, _origem: origin }));
        item.prejuizos.forEach(p => prejuizos.push({ ...p, _origem: origin }));
        item.equipes.forEach(e => equipes.push({ ...e, _origem: origin }));
        item.recursos.forEach(r => recursos.push({ ...r, _origem: origin }));
        item.despesas.forEach(d => despesas.push({ ...d, _origem: origin }));
        item.anexos.forEach(a => anexos.push({ ...a, _origem: origin }));
    });

    const totalValorDanos = danos.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);
    const totalValorPrejuizos = prejuizos.reduce((acc, p) => acc + (Number(p.valor_estimado) || 0), 0);
    const totalValorDespesas = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const totalServidores = equipes.reduce((acc, e) => acc + (parseInt(e.quantidade_servidores, 10) || 0), 0);

    return {
        relatoriosTotal: relatorios.filter(r => r.status !== 'CANCELADO').length,
        relatoriosIncluidos: valid.map(v => v.report),
        danos,
        prejuizos,
        equipes,
        recursos,
        despesas,
        anexos,
        totais: {
            totalValorDanos,
            totalValorPrejuizos,
            totalValorDespesas,
            totalGeral: totalValorDanos + totalValorPrejuizos,
            totalServidores,
        },
    };
};

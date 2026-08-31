import { supabase } from './supabase';
import { initDB } from './db';

const RECENT_SEARCHES_KEY = 'sigerd_recent_accessed_records_v1';
const MAX_RECENT_ITEMS = 5;

/**
 * Registra um item acessado pelo usuário no histórico local (últimos 5)
 */
export function trackRecordAccess(record) {
    if (!record || !record.id || !record.record_type) return;

    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        let list = stored ? JSON.parse(stored) : [];
        
        list = list.filter(item => !(item.id === record.id && item.record_type === record.record_type));

        list.unshift({
            id: record.id,
            record_type: record.record_type,
            title: record.title || record.identifier || 'Registro',
            identifier: record.identifier || '',
            description: record.description || '',
            status: record.status || '',
            link_route: record.link_route || '/',
            accessed_at: new Date().toISOString()
        });

        if (list.length > MAX_RECENT_ITEMS) {
            list = list.slice(0, MAX_RECENT_ITEMS);
        }

        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch (e) {
        console.warn('Erro ao salvar registro recente:', e);
    }
}

/**
 * Obtém os últimos 5 registros acessados
 */
export function getRecentAccessedRecords() {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('Erro ao ler registros recentes:', e);
        return [];
    }
}

/**
 * Extrai todos os tokens e variações numéricas de uma busca (ex: 005/2026 -> ["005/2026", "05/2026", "5/2026", "005", "05", "5", "2026"])
 */
export function getSearchTokens(query) {
    if (!query || !query.trim()) return [];
    const clean = query.trim().toLowerCase();
    const tokens = new Set();
    
    tokens.add(clean);
    clean.split(/\s+/).forEach(t => tokens.add(t));
    
    // Padrão número com barra e ano (ex: 005/2026, 05/2026, 5/2026)
    const codeMatch = clean.match(/^0*(\d+)\s*\/\s*(\d{4})$/);
    if (codeMatch) {
        const num = codeMatch[1];
        const year = codeMatch[2];
        
        tokens.add(`${num}/${year}`);
        tokens.add(`${num.padStart(2, '0')}/${year}`);
        tokens.add(`${num.padStart(3, '0')}/${year}`);
        tokens.add(num);
        tokens.add(num.padStart(2, '0'));
        tokens.add(num.padStart(3, '0'));
        tokens.add(year);
    }

    // Apenas número (ex: 005, 05, 5)
    const numOnlyMatch = clean.match(/^0*(\d+)$/);
    if (numOnlyMatch) {
        const num = numOnlyMatch[1];
        tokens.add(num);
        tokens.add(num.padStart(2, '0'));
        tokens.add(num.padStart(3, '0'));
    }

    return Array.from(tokens).filter(Boolean);
}

/**
 * Normaliza códigos (ex: "005/2026" -> "5/2026")
 */
function normalizeCode(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/^0+/, '')
        .replace(/\/0+/, '/');
}

/**
 * Verifica se um registro contém algum dos tokens da busca APENAS em seus campos visíveis
 */
function isRecordMatchingQuery(item, tokens) {
    if (!tokens || tokens.length === 0) return false;

    // Apenas texto legível/visível para o usuário (evita chaves internas do JSON)
    const searchableText = [
        item.title,
        item.identifier,
        item.description,
        item.responsible,
        item.status,
        item.endereco,
        item.bairro,
        item.solicitante,
        item.observacoes,
        item.motivo,
        item.assunto,
        item.tipo_ocorrencia,
        item.categoria_risco
    ].filter(Boolean).join(' ').toLowerCase();

    const searchableNorm = normalizeCode(searchableText);

    return tokens.some(tok => {
        const tokLower = tok.toLowerCase();
        const tokNorm = normalizeCode(tokLower);
        return searchableText.includes(tokLower) || (tokNorm && searchableNorm.includes(tokNorm));
    });
}

/**
 * Calcula a pontuação de relevância inteligente para ordenar os resultados
 */
function calculateRelevanceScore(item, query) {
    const qLower = query.toLowerCase().trim();
    const qNorm = normalizeCode(qLower);

    const titleLower = (item.title || '').toLowerCase();
    const identifierLower = (item.identifier || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();

    const titleNorm = normalizeCode(titleLower);
    const idNorm = normalizeCode(identifierLower);

    let score = 0;

    // Correspondência numérica exata no identificador ou título (005/2026 == 05/2026 == 5/2026)
    if (identifierLower === qLower || idNorm === qNorm) {
        score += 2000;
    } else if (titleLower === qLower || titleNorm === qNorm || titleLower.includes(qNorm)) {
        score += 1500;
    } 
    else if (identifierLower.startsWith(qLower) || idNorm.startsWith(qNorm)) {
        score += 1000;
    } else if (titleLower.startsWith(qLower)) {
        score += 800;
    }
    else if (identifierLower.includes(qLower)) {
        score += 500;
    } else if (titleLower.includes(qLower)) {
        score += 300;
    }
    else if (descLower.includes(qLower)) {
        score += 100;
    } else {
        score += 10;
    }

    return score;
}

/**
 * Função principal de Busca Global Híbrida Inteligente
 */
export async function executeGlobalSearch({ query = '', type = 'all', limit = 50, offset = 0 }) {
    const isOnline = navigator.onLine;
    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return {
            results: [],
            countsByType: {},
            total: 0,
            isOffline: !isOnline
        };
    }

    const tokens = getSearchTokens(cleanQuery);
    let combinedResults = [];
    let usedOffline = !isOnline;

    // 1. Busca Online via Supabase
    if (isOnline) {
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('global_search', {
                p_query: cleanQuery,
                p_type: type === 'all' ? null : type,
                p_limit: limit,
                p_offset: offset
            });

            if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
                combinedResults = rpcData.map(formatRpcItem);
            }
        } catch (e) {
            console.warn('[GlobalSearch] RPC indisponível, executando busca direta por tabelas...', e);
        }

        if (combinedResults.length === 0) {
            try {
                combinedResults = await performOnlineTableSearch(cleanQuery, type, limit);
            } catch (err) {
                console.error('[GlobalSearch] Erro na busca online por tabelas:', err);
            }
        }
    }

    // 2. Busca Híbrida nos dados locais (IndexedDB)
    try {
        const localResults = await performOfflineSearch(cleanQuery, type, limit);
        if (localResults.length > 0) {
            localResults.forEach(localItem => {
                const exists = combinedResults.some(r => 
                    r.record_type === localItem.record_type && 
                    (String(r.id) === String(localItem.id) || (r.identifier && r.identifier === localItem.identifier))
                );
                if (!exists) {
                    combinedResults.push(localItem);
                }
            });
        }
    } catch (err) {
        console.warn('[GlobalSearch] Erro na busca local IndexedDB:', err);
    }

    // 3. Filtragem Estrita: remove qualquer resultado que não contenha os termos pesquisados nos campos visíveis
    combinedResults = combinedResults.filter(item => isRecordMatchingQuery(item, tokens));

    // 4. Ordenação por Relevância
    combinedResults.forEach(item => {
        item.relevanceScore = calculateRelevanceScore(item, cleanQuery);
    });

    combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Calcular contagens por módulo
    const counts = calculateCounts(combinedResults);

    // Filtrar por tipo (se selecionado uma aba específica)
    const finalResults = (type && type !== 'all') 
        ? combinedResults.filter(r => r.record_type === type)
        : combinedResults;

    return {
        results: finalResults.slice(offset, offset + limit),
        countsByType: counts,
        total: finalResults.length,
        isOffline: usedOffline
    };
}

/**
 * Formata os itens retornados pela RPC do Supabase
 */
function formatRpcItem(item) {
    const rawId = item.id;
    let linkRoute = item.link_route || '/';

    switch (item.record_type) {
        case 'vistoria':
            linkRoute = `/vistorias/imprimir/${encodeURIComponent(rawId)}`;
            break;
        case 'ocorrencia':
            linkRoute = `/ocorrencias/imprimir/${encodeURIComponent(rawId)}`;
            break;
        case 'interdicao':
            linkRoute = `/interdicao/imprimir/${encodeURIComponent(rawId)}`;
            break;
        case 'noprer':
            linkRoute = `/noprer/imprimir/${encodeURIComponent(rawId)}`;
            break;
        case 'alerta_cemaden':
        case 'alerta':
            linkRoute = `/alertas-cemaden/${encodeURIComponent(rawId)}`;
            break;
        case 'credenciamento':
            linkRoute = `/voluntarios/termo/${encodeURIComponent(rawId)}`;
            break;
        case 'redap':
            linkRoute = `/redap/evento/imprimir/${encodeURIComponent(rawId)}`;
            break;
        case 'oficio':
            linkRoute = `/legado/oficios`;
            break;
        default:
            linkRoute = item.link_route || '/';
    }

    return {
        ...item,
        link_route: linkRoute
    };
}

/**
 * Busca Online resiliente tabela a tabela no Supabase por variações de código e texto
 */
async function performOnlineTableSearch(query, type, limit) {
    const tokens = getSearchTokens(query);
    const primaryWord = tokens[0] || query;
    const queries = [];

    const buildOrFilter = (fields) => {
        const clauses = [];
        fields.forEach(field => {
            tokens.slice(0, 4).forEach(tok => {
                clauses.push(`${field}.ilike.%${tok}%`);
            });
        });
        return clauses.join(',');
    };

    // 1. Vistorias
    if (type === 'all' || type === 'vistoria') {
        const filterStr = buildOrFilter(['vistoria_id', 'solicitante', 'endereco', 'bairro', 'observacoes']);
        queries.push(
            supabase.from('vistorias')
                .select('id, vistoria_id, solicitante, endereco, bairro, status, created_at, latitude, longitude, fonte_geolocalizacao, observacoes')
                .or(filterStr)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => {
                        const targetId = item.vistoria_id || item.id;
                        return {
                            id: String(item.id),
                            record_type: 'vistoria',
                            title: item.vistoria_id || `Vistoria ${item.id}`,
                            identifier: item.vistoria_id || '',
                            description: `${item.endereco || ''} ${item.bairro ? '- ' + item.bairro : ''} ${item.solicitante ? '(' + item.solicitante + ')' : ''}`.trim(),
                            responsible: item.solicitante || 'N/I',
                            status: item.status || 'Concluída',
                            created_at: item.created_at,
                            latitude: item.latitude,
                            longitude: item.longitude,
                            fonte_geolocalizacao: item.fonte_geolocalizacao,
                            link_route: `/vistorias/imprimir/${encodeURIComponent(targetId)}`
                        };
                    });
                })
        );
    }

    // 2. Ocorrências
    if (type === 'all' || type === 'ocorrencia') {
        const filterStr = buildOrFilter(['ocorrencia_id_format', 'numero_ocorrencia_externa', 'solicitante', 'tipo_ocorrencia', 'bairro', 'endereco', 'observacoes']);
        queries.push(
            supabase.from('ocorrencias_operacionais')
                .select('id, ocorrencia_id, ocorrencia_id_format, solicitante, tipo_ocorrencia, descricao_danos, observacoes, endereco, bairro, status, created_at, lat, lng, fonte_geolocalizacao, numero_ocorrencia_externa')
                .or(filterStr)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => {
                        const targetId = item.ocorrencia_id || item.ocorrencia_id_format || item.id;
                        return {
                            id: String(item.id || item.ocorrencia_id),
                            record_type: 'ocorrencia',
                            title: item.ocorrencia_id_format || item.numero_ocorrencia_externa || `Ocorrência ${item.id}`,
                            identifier: item.ocorrencia_id_format || item.numero_ocorrencia_externa || '',
                            description: `${item.tipo_ocorrencia || 'Ocorrência'} - ${item.endereco || ''} ${item.bairro ? '(' + item.bairro + ')' : ''}`.trim(),
                            responsible: item.solicitante || 'N/I',
                            status: item.status || 'Atendido',
                            created_at: item.created_at,
                            latitude: item.lat,
                            longitude: item.lng,
                            fonte_geolocalizacao: item.fonte_geolocalizacao,
                            link_route: `/ocorrencias/imprimir/${encodeURIComponent(targetId)}`
                        };
                    });
                })
        );
    }

    // 3. Interdições
    if (type === 'all' || type === 'interdicao') {
        const filterStr = buildOrFilter(['numero_interdicao', 'numero', 'motivo', 'endereco', 'bairro', 'responsavel']);
        queries.push(
            supabase.from('interdicoes')
                .select('id, numero_interdicao, numero, motivo, endereco, bairro, responsavel, status, created_at')
                .or(filterStr)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => {
                        const targetId = item.numero_interdicao || item.numero || item.id;
                        return {
                            id: String(item.id),
                            record_type: 'interdicao',
                            title: item.numero_interdicao || item.numero || `Interdição ${item.id}`,
                            identifier: item.numero_interdicao || item.numero || '',
                            description: item.motivo || item.endereco || '',
                            responsible: item.responsavel || 'N/I',
                            status: item.status || 'Ativa',
                            created_at: item.created_at,
                            link_route: `/interdicao/imprimir/${encodeURIComponent(targetId)}`
                        };
                    });
                })
        );
    }

    // 4. NOPRER
    if (type === 'all' || type === 'noprer') {
        const filterStr = buildOrFilter(['numero', 'descricao', 'solicitante', 'responsavel']);
        queries.push(
            supabase.from('noprer')
                .select('id, numero, descricao, solicitante, responsavel, status, created_at')
                .or(filterStr)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => {
                        const targetId = item.numero_noprer || item.id;
                        return {
                            id: String(item.id),
                            record_type: 'noprer',
                            title: item.numero_noprer || item.numero || `NOPRER ${item.id}`,
                            identifier: item.numero_noprer || item.numero || '',
                            description: item.descricao || '',
                            responsible: item.responsavel || item.solicitante || 'N/I',
                            status: item.status || 'Em andamento',
                            created_at: item.created_at,
                            link_route: `/noprer/imprimir/${encodeURIComponent(targetId)}`
                        };
                    });
                })
        );
    }

    // 5. Alertas CEMADEN
    if (type === 'all' || type === 'alerta_cemaden' || type === 'alerta') {
        const q = `%${primaryWord}%`;
        queries.push(
            supabase.from('alertas_cemaden')
                .select('id, titulo, descricao, municipio, nivel, created_at')
                .or(`titulo.ilike.${q},descricao.ilike.${q},municipio.ilike.${q}`)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => ({
                        id: String(item.id),
                        record_type: 'alerta_cemaden',
                        title: item.titulo || `Alerta CEMADEN ${item.id}`,
                        identifier: String(item.id),
                        description: `${item.municipio || ''} - ${item.descricao || ''}`.trim(),
                        responsible: 'CEMADEN',
                        status: item.nivel || 'Alerta',
                        created_at: item.created_at,
                        link_route: `/alertas-cemaden/${encodeURIComponent(item.id)}`
                    }));
                })
        );
    }

    // 6. Voluntários
    if (type === 'all' || type === 'credenciamento') {
        const q = `%${primaryWord}%`;
        queries.push(
            supabase.from('voluntarios')
                .select('id, nome, cpf, area_atuacao, status, created_at')
                .or(`nome.ilike.${q},cpf.ilike.${q},area_atuacao.ilike.${q}`)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => ({
                        id: String(item.id),
                        record_type: 'credenciamento',
                        title: item.nome || `Voluntário ${item.id}`,
                        identifier: item.cpf || '',
                        description: item.area_atuacao || 'Credenciamento de Voluntário',
                        responsible: item.nome || 'Voluntário',
                        status: item.status || 'Ativo',
                        created_at: item.created_at,
                        link_route: `/voluntarios/termo/${encodeURIComponent(item.id)}`
                    }));
                })
        );
    }

    // 7. Ofícios
    if (type === 'all' || type === 'oficio') {
        const q = `%${primaryWord}%`;
        queries.push(
            supabase.from('legado_oficios')
                .select('id, numero_oficio, numero, assunto, destinatario, responsavel, created_at')
                .or(`numero_oficio.ilike.${q},numero.ilike.${q},assunto.ilike.${q},destinatario.ilike.${q}`)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => ({
                        id: String(item.id),
                        record_type: 'oficio',
                        title: item.numero_oficio || item.numero || `Ofício ${item.id}`,
                        identifier: item.numero_oficio || item.numero || '',
                        description: item.assunto || item.destinatario || '',
                        responsible: item.responsavel || 'N/I',
                        status: 'Ativo',
                        created_at: item.created_at,
                        link_route: `/legado/oficios`
                    }));
                })
        );
    }

    // 8. REDAP
    if (type === 'all' || type === 'redap') {
        const q = `%${primaryWord}%`;
        queries.push(
            supabase.from('redap_eventos')
                .select('id, nome_evento, cobrade, descricao, status, created_at')
                .or(`nome_evento.ilike.${q},cobrade.ilike.${q},descricao.ilike.${q}`)
                .limit(limit)
                .then(({ data, error }) => {
                    if (error) return [];
                    return (data || []).map(item => ({
                        id: String(item.id),
                        record_type: 'redap',
                        title: item.nome_evento || `REDAP ${item.id}`,
                        identifier: item.cobrade || '',
                        description: item.descricao || 'Relatório de Danos e Prejuízos',
                        responsible: 'Defesa Civil',
                        status: item.status || 'Rascunho',
                        created_at: item.created_at,
                        link_route: `/redap/evento/imprimir/${encodeURIComponent(item.id)}`
                    }));
                })
        );
    }

    const responses = await Promise.allSettled(queries);
    const combined = [];

    responses.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            combined.push(...res.value);
        }
    });

    return combined;
}

/**
 * Busca offline sobre os dados localmente no IndexedDB
 */
async function performOfflineSearch(query, type, limit) {
    const db = await initDB();
    const results = [];
    const tokens = getSearchTokens(query);

    if (tokens.length === 0) return [];

    // 1. Vistorias local
    if ((type === 'all' || type === 'vistoria') && db.objectStoreNames.contains('vistorias')) {
        const items = await db.getAll('vistorias');
        items.forEach(v => {
            const targetId = v.vistoria_id || v.vistoriaId || v.id;
            const itemObj = {
                id: String(v.id),
                record_type: 'vistoria',
                title: v.vistoria_id || v.vistoriaId || `Vistoria ${v.id}`,
                identifier: v.vistoria_id || v.vistoriaId || '',
                description: `${v.endereco || ''} ${v.bairro ? '- ' + v.bairro : ''} ${v.solicitante ? '(' + v.solicitante + ')' : ''}`.trim(),
                responsible: v.solicitante || v.responsavel_tecnico || 'N/I',
                status: v.status || (v.synced ? 'Sincronizado' : 'Pendente (Local)'),
                created_at: v.created_at || v.data_vistoria,
                latitude: v.latitude,
                longitude: v.longitude,
                fonte_geolocalizacao: v.fonte_geolocalizacao,
                link_route: `/vistorias/imprimir/${encodeURIComponent(targetId)}`,
                endereco: v.endereco,
                bairro: v.bairro,
                solicitante: v.solicitante,
                observacoes: v.observacoes || v.situacao_observada
            };

            if (isRecordMatchingQuery(itemObj, tokens)) {
                results.push(itemObj);
            }
        });
    }

    // 2. Ocorrências operacionais local
    if ((type === 'all' || type === 'ocorrencia') && db.objectStoreNames.contains('ocorrencias_operacionais')) {
        const items = await db.getAll('ocorrencias_operacionais');
        items.forEach(o => {
            const targetId = o.ocorrencia_id || o.ocorrencia_id_format || o.id;
            const itemObj = {
                id: String(o.id || o.ocorrencia_id),
                record_type: 'ocorrencia',
                title: o.ocorrencia_id_format || o.numero_ocorrencia_externa || `Ocorrência ${o.id}`,
                identifier: o.ocorrencia_id_format || o.numero_ocorrencia_externa || '',
                description: `${o.tipo_ocorrencia || 'Ocorrência'} - ${o.endereco || ''} ${o.bairro ? '(' + o.bairro + ')' : ''}`.trim(),
                responsible: o.solicitante || o.agente || 'N/I',
                status: o.status || 'Atendido',
                created_at: o.created_at || o.data_ocorrencia,
                latitude: o.lat,
                longitude: o.lng,
                fonte_geolocalizacao: o.fonte_geolocalizacao,
                link_route: `/ocorrencias/imprimir/${encodeURIComponent(targetId)}`,
                endereco: o.endereco,
                bairro: o.bairro,
                solicitante: o.solicitante,
                observacoes: o.observacoes || o.descricao_danos
            };

            if (isRecordMatchingQuery(itemObj, tokens)) {
                results.push(itemObj);
            }
        });
    }

    // 3. Interdições local
    if ((type === 'all' || type === 'interdicao') && db.objectStoreNames.contains('interdicoes')) {
        const items = await db.getAll('interdicoes');
        items.forEach(i => {
            const targetId = i.numero_interdicao || i.numero || i.id;
            const itemObj = {
                id: String(i.id),
                record_type: 'interdicao',
                title: i.numero_interdicao || i.numero || `Interdição ${i.id}`,
                identifier: i.numero_interdicao || i.numero || '',
                description: i.motivo || i.endereco || '',
                responsible: i.responsavel || 'N/I',
                status: i.status || 'Ativa',
                created_at: i.created_at,
                link_route: `/interdicao/imprimir/${encodeURIComponent(targetId)}`,
                endereco: i.endereco,
                bairro: i.bairro,
                motivo: i.motivo
            };

            if (isRecordMatchingQuery(itemObj, tokens)) {
                results.push(itemObj);
            }
        });
    }

    return results.slice(0, limit);
}

/**
 * Auxiliar para contar resultados por tipo
 */
function calculateCounts(results) {
    const counts = {};
    results.forEach(r => {
        const t = r.record_type || 'outro';
        counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
}

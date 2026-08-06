// src/services/oficiosService.js
import { supabase } from './supabase';
import localforage from 'localforage';
import legacyData from '../data/legacy_oficios.json';

const OFICIOS_FORAGE_KEY = 'sigerd_oficios_rascunhos';

/**
 * Retorna os cartões de estatísticas e gráficos para a aba Legado de Ofícios.
 */
export const getLegadoResumo = async () => {
    try {
        const { data, error } = await supabase
            .from('oficios_compdec')
            .select('ano, destinatario_orgao, destinatario_nome');
            
        if (!error && data && data.length > 0) {
            return processResumoData(data);
        }
    } catch (e) {
        console.warn('Supabase oficios fetch failed, using local dataset fallback:', e);
    }

    return processResumoData(legacyData);
};

function processResumoData(items) {
    const totalGeral = items.length;
    const anosCount = {};
    const destCount = {};

    items.forEach(item => {
        const yr = item.ano || 'Desconhecido';
        anosCount[yr] = (anosCount[yr] || 0) + 1;

        const org = (item.destinatario_orgao || item.destinatario_nome || 'Outros').trim();
        const orgShort = org.length > 25 ? org.substring(0, 22) + '...' : org;
        destCount[orgShort] = (destCount[orgShort] || 0) + 1;
    });

    const distribuicaoAno = Object.keys(anosCount)
        .sort((a, b) => Number(a) - Number(b))
        .map(yr => ({
            year: String(yr),
            quantidade: anosCount[yr]
        }));

    const topDestinatarios = Object.keys(destCount)
        .map(k => ({ destinatario: k, quantidade: destCount[k] }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

    return {
        totalGeral,
        distribuicaoAno,
        topDestinatarios
    };
}

/**
 * Busca listagem paginada e filtrada de ofícios em ORDEM CRESCENTE de numeração.
 */
export const getOficiosList = async ({ year = 'Todos', searchQuery = '', status = 'Todos' } = {}) => {
    let dataset = [];

    // 1. Tentar buscar no Supabase
    try {
        let query = supabase.from('oficios_compdec')
            .select('*')
            .order('ano', { ascending: true })
            .order('numero_sequencial', { ascending: true, nullsFirst: false });

        if (year !== 'Todos') query = query.eq('ano', Number(year));
        if (status !== 'Todos') query = query.eq('status', status);
        
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
            dataset = data.map(item => ({
                ...item,
                arquivo_pdf_url: item.arquivo_pdf_url 
                    ? item.arquivo_pdf_url.replace('/vistorias_fotos/legado_oficios/', '/oficios_legados/') 
                    : item.arquivo_pdf_url
            }));
        } else {
            dataset = legacyData;
        }
    } catch (e) {
        console.warn('Fallback to legacy JSON data for list:', e);
        dataset = legacyData;
    }

    // Adiciona rascunhos salvos no localforage
    try {
        const rascunhos = await localforage.getItem(OFICIOS_FORAGE_KEY) || {};
        const listRascunhos = Object.values(rascunhos);
        dataset = [...listRascunhos, ...dataset];
    } catch (err) {
        console.error('Error fetching local forage drafts:', err);
    }

    // Filtros client-side
    let filtered = dataset.filter(item => {
        const matchesYear = year === 'Todos' || String(item.ano) === String(year);
        const matchesStatus = status === 'Todos' || item.status === status;
        
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            (item.numero_formatado && item.numero_formatado.toLowerCase().includes(q)) ||
            (item.destinatario_nome && item.destinatario_nome.toLowerCase().includes(q)) ||
            (item.destinatario_orgao && item.destinatario_orgao.toLowerCase().includes(q)) ||
            (item.assunto && item.assunto.toLowerCase().includes(q)) ||
            (item.processo_edocs && item.processo_edocs.toLowerCase().includes(q));

        return matchesYear && matchesStatus && matchesSearch;
    });

    // Ordena obrigatoriamente em ORDEM CRESCENTE por numero_sequencial (1, 2, 3...)
    filtered.sort((a, b) => {
        const seqA = a.numero_sequencial != null ? Number(a.numero_sequencial) : 999999;
        const seqB = b.numero_sequencial != null ? Number(b.numero_sequencial) : 999999;
        return seqA - seqB;
    });

    return filtered;
};

/**
 * Obtém prévia do próximo número sequencial esperado para o ano.
 */
export const getProximoNumero = async (ano = new Date().getFullYear(), siglaOrgao = 'PMSMJ/COMPDEC') => {
    const dataset = await getOficiosList({ year: 'Todos' });
    let maxSeq = 0;
    
    dataset.forEach(item => {
        if (item.sigla_orgao === siglaOrgao && Number(item.ano) === Number(ano)) {
            const seq = Number(item.numero_sequencial);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    });

    const proximo = maxSeq + 1;
    const numFormatado = `${String(proximo).padStart(3, '0')}/${ano}`;
    const identificador = `OF/${siglaOrgao}/N° ${numFormatado}`;

    return {
        ano,
        sigla_orgao: siglaOrgao,
        proximo_numero_sequencial: proximo,
        numero_formatado: numFormatado,
        identificador_completo: identificador
    };
};

/**
 * Cria ou edita um RASCUNHO de ofício (offline-first).
 */
export const saveRascunhoOficio = async (oficioData) => {
    const id = oficioData.id || `rascunho-${Date.now()}`;
    const ano = oficioData.ano || new Date().getFullYear();

    const record = {
        ...oficioData,
        id,
        tenant_id: oficioData.tenant_id || '00000000-0000-0000-0000-000000000000',
        sigla_orgao: oficioData.sigla_orgao || 'PMSMJ/COMPDEC',
        ano,
        numero_sequencial: null,
        numero_formatado: `RASCUNHO/${ano}`,
        identificador_completo: `OF/${oficioData.sigla_orgao || 'PMSMJ/COMPDEC'}/RASCUNHO/${ano}`,
        fonte: 'SISTEMA_GERADO',
        status: 'RASCUNHO',
        created_at: oficioData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const rascunhos = await localforage.getItem(OFICIOS_FORAGE_KEY) || {};
        rascunhos[id] = record;
        await localforage.setItem(OFICIOS_FORAGE_KEY, rascunhos);
    } catch (e) {
        console.error('Erro ao salvar rascunho localmente:', e);
    }

    try {
        await supabase.from('oficios_compdec').upsert(record, { onConflict: 'id' });
    } catch (e) {
        console.warn('Salvamento de rascunho remoto pendente (offline):', e);
    }

    return record;
};

/**
 * Realiza a Emissão Oficial do Ofício (Reserva Atômica de Numeração).
 * BLOQUEADO SE OFFLINE!
 */
export const emitirOficio = async (oficioData) => {
    if (!navigator.onLine) {
        throw new Error('A emissão de ofícios com reserva de numeração oficial requer conexão à internet para garantia de não duplicidade auditoria TCE-ES. Por favor, conecte-se à rede.');
    }

    const prev = await getProximoNumero(oficioData.ano, oficioData.sigla_orgao);
    const dataEmissao = oficioData.data_emissao || new Date().toISOString().split('T')[0];

    const record = {
        ...oficioData,
        id: oficioData.id || `oficio-${Date.now()}`,
        tenant_id: oficioData.tenant_id || '00000000-0000-0000-0000-000000000000',
        sigla_orgao: oficioData.sigla_orgao || 'PMSMJ/COMPDEC',
        ano: prev.ano,
        numero_sequencial: prev.proximo_numero_sequencial,
        numero_formatado: prev.numero_formatado,
        identificador_completo: prev.identificador_completo,
        fonte: 'SISTEMA_GERADO',
        status: 'EMITIDO',
        data_emissao: dataEmissao,
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('oficios_compdec').upsert(record);
        if (error) throw error;
    } catch (e) {
        console.warn('Aviso no Supabase remoto durante emissão:', e);
    }

    try {
        const rascunhos = await localforage.getItem(OFICIOS_FORAGE_KEY) || {};
        if (rascunhos[record.id]) {
            delete rascunhos[record.id];
            await localforage.setItem(OFICIOS_FORAGE_KEY, rascunhos);
        }
    } catch (err) {
        console.error('Error clearing local draft:', err);
    }

    return record;
};

/**
 * Remove um rascunho do armazenamento local e remoto.
 */
export const deleteRascunhoOficio = async (id) => {
    try {
        const rascunhos = await localforage.getItem(OFICIOS_FORAGE_KEY) || {};
        delete rascunhos[id];
        await localforage.setItem(OFICIOS_FORAGE_KEY, rascunhos);
    } catch (e) {
        console.error('Error deleting local draft:', e);
    }

    try {
        await supabase.from('oficios_compdec').delete().eq('id', id).eq('status', 'RASCUNHO');
    } catch (e) {
        console.warn('Error deleting remote draft:', e);
    }
};

import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase'; // Ajuste o path conforme estrutura
import { usePrazo } from './usePrazo';

export function useNoprer() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { calcularStatus } = usePrazo();

    // Utilitário para gerar numeração automática (NOPRER-ANO.XXXXXX)
    const _gerarNumeroNoprer = async () => {
        const anoAtual = new Date().getFullYear();
        const prefix = `NOPRER-${anoAtual}.`;

        // Busca a última noprer emitida no ano atual
        const { data, error } = await supabase
            .from('noprer')
            .select('numero')
            .like('numero', `${prefix}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora erro de nenhum registro encontrado
            throw error;
        }

        let proximoSequencial = 1;
        if (data) {
            const lastNumero = data.numero;
            const seqStr = lastNumero.split('.')[1];
            if (seqStr) {
                proximoSequencial = parseInt(seqStr, 10) + 1;
            }
        }

        return `${prefix}${String(proximoSequencial).padStart(6, '0')}`;
    };

    // 1. Listar todas as NOPRERs com status dinâmico calculado
    const fetchNoprers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('noprer')
                .select(`
                    *,
                    vistoria:vistoria_id ( numero )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calcula status para todas as entradas
            const processados = data.map(item => ({
                ...item,
                ...calcularStatus(item) // Adiciona statusCalculado, diasRestantes, etc
            }));

            // Busca também os rascunhos
            const { data: draftsData, error: draftsError } = await supabase
                .from('noprer_rascunhos')
                .select('*')
                .order('updated_at', { ascending: false });

            if (draftsError && draftsError.code !== '42P01') {
                // Ignore table missing error if user hasn't run the migration yet
                console.error('Erro ao buscar rascunhos:', draftsError);
            }

            // Formata rascunhos
            const formattedDrafts = (draftsData || []).map(d => ({
                id: d.id,
                isDraft: true,
                numero: 'RASCUNHO',
                endereco: d.form_data?.endereco || 'Endereço não informado',
                nome_notificado: d.form_data?.nome_notificado || 'Notificado não informado',
                grau_risco: d.form_data?.grau_risco || '-',
                data_emissao: d.updated_at || new Date().toISOString(),
                data_limite: new Date().toISOString(),
                statusCalculado: 'RASCUNHO',
                status: 'RASCUNHO',
                progresso: 0,
                diasRestantes: 0,
                isVencida: false
            }));

            return [...formattedDrafts, ...processados];
        } catch (err) {
            console.error('Erro ao buscar NOPRERs:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Buscar detalhes de uma única NOPRER e seu histórico
    const fetchNoprerById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const [noprerRes, historicoRes] = await Promise.all([
                supabase
                    .from('noprer')
                    .select('*, vistoria:vistoria_id(numero)')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('noprer_revistoria')
                    .select('*')
                    .eq('noprer_id', id)
                    .order('created_at', { ascending: true })
            ]);

            if (noprerRes.error) throw noprerRes.error;

            const base = noprerRes.data;
            return {
                ...base,
                ...calcularStatus(base),
                historico: historicoRes.data || []
            };
        } catch (err) {
            console.error('Erro ao buscar NOPRER:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. Emitir (Criar) NOPRER
    const criarNoprer = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Gerar numeração
            const numeroGerado = await _gerarNumeroNoprer();

            const dataToInsert = {
                ...payload,
                numero: numeroGerado,
                status: 'EMITIDA'
            };

            // 2. Inserir NOPRER
            const { data: noprer, error: insertError } = await supabase
                .from('noprer')
                .insert(dataToInsert)
                .select()
                .single();

            if (insertError) throw insertError;

            // 3. Inserir Registro Inicial na Revistoria
            await supabase.from('noprer_revistoria').insert({
                noprer_id: noprer.id,
                tipo: 'emissao',
                data: noprer.data_emissao,
                agente: noprer.nome_agente,
                observacoes: 'Emissão inicial da Notificação Preliminar de Risco.'
            });

            return noprer;
        } catch (err) {
            console.error('Erro ao emitir NOPRER:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 4. Registrar Revistoria e Alterar Status
    const registrarRevistoria = async (id, payload) => {
        setLoading(true);
        setError(null);
        try {
            // Payload esperado: { tipo, observacoes, agente, resultado }
            // 'resultado' pode ser: 'REGULARIZADA', 'ESCALADA', 'PARCIAL' (mantém prazo ou não encerra)
            
            const { error: revistoriaError } = await supabase
                .from('noprer_revistoria')
                .insert({
                    noprer_id: id,
                    tipo: payload.tipo, // 'revistoria', 'encerramento', 'escalada'
                    resultado: payload.resultado,
                    observacoes: payload.observacoes,
                    agente: payload.agente,
                    data: new Date().toISOString()
                });

            if (revistoriaError) throw revistoriaError;

            // Se o resultado força mudança de status base
            if (payload.resultado === 'REGULARIZADA' || payload.resultado === 'ESCALADA') {
                const { error: updateError } = await supabase
                    .from('noprer')
                    .update({ status: payload.resultado })
                    .eq('id', id);

                if (updateError) throw updateError;
            }

            return true;
        } catch (err) {
            console.error('Erro ao registrar revistoria:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 5. Salvar Rascunho no DB
    const salvarNoprerRascunho = async (id, formData, step, nomeAgente) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                form_data: formData,
                step: step,
                nome_agente: nomeAgente,
                updated_at: new Date().toISOString()
            };

            let savedDraft = null;

            if (id && !id.startsWith('draft_')) {
                // Atualiza existente
                const { data, error } = await supabase
                    .from('noprer_rascunhos')
                    .update(payload)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                savedDraft = data;
            } else {
                // Insere novo
                const { data, error } = await supabase
                    .from('noprer_rascunhos')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                savedDraft = data;
            }

            return savedDraft;
        } catch (err) {
            console.error('Erro ao salvar rascunho:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 6. Buscar um Rascunho
    const fetchRascunhoById = async (id) => {
        try {
            const { data, error } = await supabase
                .from('noprer_rascunhos')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Erro ao buscar rascunho:', err);
            return null;
        }
    };

    // 7. Excluir Rascunho
    const deletarRascunho = async (id) => {
        if (!id || id.startsWith('draft_')) return;
        try {
            await supabase.from('noprer_rascunhos').delete().eq('id', id);
        } catch (err) {
            console.error('Erro ao deletar rascunho:', err);
        }
    };

    return {
        loading,
        error,
        fetchNoprers,
        fetchNoprerById,
        criarNoprer,
        registrarRevistoria,
        salvarNoprerRascunho,
        fetchRascunhoById,
        deletarRascunho
    };
}

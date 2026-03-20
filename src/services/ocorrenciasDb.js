import { initDB, syncSingleItem } from './db'
import { supabase } from './supabase'

/**
 * Operational Occurrences Database Service
 * Handles CRUD and Sync for the dedicated 'ocorrencias_operacionais' table.
 */
// ... (Initial state remains same)
export const INITIAL_OCORRENCIA_STATE = {
    ocorrencia_id_format: '', // format: 001/2026
    agente: '',              // Responsável Técnico
    matricula: '',
    solicitante: '',
    cpf: '',
    telefone: '',
    temSolicitanteEspecifico: false,
    endereco: '',
    bairro: '',
    unidade_consumidora: '',
    informacoes_complementares: '',
    data_ocorrencia: new Date().toLocaleDateString('pt-BR'),
    horario_ocorrencia: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    lat: null,
    lng: null,
    accuracy: null,
    gps_timestamp: null,
    mortos: 0,
    feridos: 0,
    enfermos: 0,
    desalojados: 0,
    desabrigados: 0,
    desaparecidos: 0,
    outros_afetados: 0,
    tem_danos_humanos: false,
    categoriaRisco: '',
    nivelRisco: '',
    subtiposRisco: [],
    subtipoRiscoOutros: '',
    checklistRespostas: {},
    descricao_danos: '',
    observacoes: '',
    medidasTomadas: [],
    unidade_consumidora: '',
    fotos: [],               // Photos array [ { id, data, legenda } ]
    assinaturaAgente: null,
    assinaturaAssistido: null,
    temApoioTecnico: false,
    apoioTecnico: {
        nome: '',
        crea: '',
        matricula: '',
        assinatura: null
    },
    status: 'Pendente',
    synced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

/**
 * Delete Ocorrencia local (soft delete)
 */
export const deleteOcorrenciaLocal = async (id) => {
    const db = await initDB();
    const record = await db.get('ocorrencias_operacionais', parseInt(id));
    if (record) {
        if (navigator.onLine && record.ocorrencia_id) {
            try {
                // 1. LIMPEZA TOTAL DA PASTA NO STORAGE (Arraste todos os arquivos da ocorrência)
                console.log(`Limpando pasta do storage para ocorrência: ${record.ocorrencia_id}`);
                const { data: listData } = await supabase.storage
                    .from('ocorrencias_fotos')
                    .list(record.ocorrencia_id);
                
                if (listData && listData.length > 0) {
                    const filesToRemove = listData.map(f => `${record.ocorrencia_id}/${f.name}`);
                    await supabase.storage.from('ocorrencias_fotos').remove(filesToRemove);
                }

                // 2. EXCLUSÃO DA LINHA NO BANCO DE DADOS
                if (record.synced) {
                    const { error } = await supabase
                        .from('ocorrencias_operacionais')
                        .delete()
                        .eq('ocorrencia_id', record.ocorrencia_id);
                    if (error) console.error('Error deleting from supabase:', error);
                }
            } catch (err) {
                console.error('Failed to cleanup and delete occurrence remotely:', err);
            }
        }
        await db.delete('ocorrencias_operacionais', parseInt(id));
    }
};

/**
 * Save Ocorrencia locally (IndexedDB)
 */
export const saveOcorrenciaLocal = async (data, skipSync = false) => {
    const db = await initDB();
    const toSave = {
        ...data,
        ocorrencia_id: data.ocorrencia_id || data.id_ocorrencia || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        synced: data.synced || false
    };

    // [FIX] Robustly prevent unique constraint violation on ocorrencia_id
    // We search by ocorrencia_id UNCONDITIONALLY if it exists
    if (toSave.ocorrencia_id && toSave.ocorrencia_id.trim() !== '') {
        const existing = await db.getFromIndex('ocorrencias_operacionais', 'ocorrencia_id', toSave.ocorrencia_id);
        if (existing) {
            toSave.id = existing.id; // Ensure we overwrite the local record matching this business key
        } else if (!toSave.id || isNaN(parseInt(toSave.id))) {
            // If it's a new business key but has a non-integer local ID (e.g. from a pull), clear ID to let autoIncrement handle it
            delete toSave.id;
        }
    } else if (!toSave.id || isNaN(parseInt(toSave.id))) {
        delete toSave.id;
    }

    const id = await db.put('ocorrencias_operacionais', toSave);

    if (navigator.onLine && !skipSync) {
        triggerOcorrenciaSync(toSave.ocorrencia_id).catch(err => console.error('Sync failed:', err));
    }
    return id;
};

/**
 * Get all local occurrences
 */
export const getOcorrenciasLocal = async () => {
    const db = await initDB();
    const records = await db.getAll('ocorrencias_operacionais');

    // Custom deduplication by ocorrencia_id_format / ocorrencia_id to avoid local double entries
    const dedupMap = new Map();
    records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort ascending so newest overrides oldest in Map
        .forEach(r => {
            const key = r.ocorrencia_id || r.id;
            dedupMap.set(key, r);
        });

    const finalRecords = Array.from(dedupMap.values());
    return finalRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

/**
 * Get single occurrence (local and fallback to cloud)
 */
export const getOcorrenciaById = async (id) => {
    const db = await initDB();
    // Tenta primeiro no DB local (pode ser id numérico gerado pelo indexedDB ou uuid salvo como id)
    let localRecord = null;
    if (!isNaN(parseInt(id)) && String(parseInt(id)) === String(id)) {
        localRecord = await db.get('ocorrencias_operacionais', parseInt(id));
    }
    if (!localRecord) {
        // Tenta achar buscando de outra forma no DB local
        const allLocal = await db.getAll('ocorrencias_operacionais');
        localRecord = allLocal.find(r => 
            String(r.id) === String(id) || 
            r.ocorrencia_id === id || 
            r.ocorrencia_id_format === id
        );
    }

    // Se não encontrou ou onLine, vamos sempre tentar puxar o online para garantir dados completos se não for registro 100% não syncado
    if (navigator.onLine && (!localRecord || localRecord.synced)) {
        try {
            const { supabase } = await import('./supabase');
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
            
            let query = supabase.from('ocorrencias_operacionais').select('*');
            if (isUuid) {
                query = query.or(`id.eq.${id},ocorrencia_id.eq.${id}`);
            } else {
                query = query.eq('ocorrencia_id_format', id);
            }
            
            const { data } = await query.single();
            if (data) return data;
        } catch (e) {
            console.warn('Erro ao buscar ocorrencia remotamente, usando fallback', e);
        }
    }

    return localRecord;
};

/**
 * Sync single occurrence to Supabase using centralized syncSingleItem
 */
export const triggerOcorrenciaSync = async (id) => {
    const db = await initDB();
    const record = await db.get('ocorrencias_operacionais', id);
    if (!record) return false;

    try {
        const success = await syncSingleItem('ocorrencias_operacionais', record, db);
        return success;
    } catch (err) {
        console.error('Ocorrencia Sync Error:', err);
        return false;
    }
};

/**
 * Sync all pending occurrences
 */
export const syncAllOcorrencias = async () => {
    const db = await initDB();
    const records = await db.getAll('ocorrencias_operacionais');
    const pending = records.filter(r => !r.synced);

    for (const r of pending) {
        await triggerOcorrenciaSync(r.ocorrencia_id);
    }
};
/**
 * Função Blindada para Salvar Ocorrências Operacionais
 * @param {Object} ocorrencia - O objeto da ocorrência preenchido no formulário do celular
 */
export async function salvarOcorrenciaOperacional(ocorrencia) {
    try {
        console.log("Iniciando salvamento blindado da ocorrência...");
        const fotosProcessadas = [];
        
        // 1. UPLOAD DE FOTOS PARA O STORAGE
        if (ocorrencia.fotos && ocorrencia.fotos.length > 0) {
            for (const foto of ocorrencia.fotos) {
                // Se a foto tiver o prefixo gigante "data:image/...", ela precisa ir pro Storage
                if (foto.data && String(foto.data).startsWith('data:image')) {
                    console.log(`Enviando foto ${foto.id} para a nuvem...`);
                    
                    // Converte o texto Base64 em um Arquivo Binário (Blob)
                    const base64Response = await fetch(foto.data);
                    const blob = await base64Response.blob();
                    
                    // Caminho no bucket: pasta com o ID da ocorrência para manter organizado
                    const caminhoStorage = `${ocorrencia.ocorrencia_id || ocorrencia.id}/${foto.id}.jpg`;
                    
                    // Bate na porta do Supabase Storage
                    const { error: uploadError } = await supabase
                        .storage
                        .from('ocorrencias_fotos') // <-- NOME DO SEU BUCKET
                        .upload(caminhoStorage, blob, {
                            contentType: blob.type,
                            upsert: true // Se a foto já existir lá, apenas substitui para evitar erros
                        });
                    
                    if (uploadError) {
                        throw new Error(`Falha no upload da foto ${foto.id}: ${uploadError.message}`);
                    }
                    
                    // Puxa o Link (URL) limpo gerado
                    const { data: linkInfo } = supabase
                        .storage
                        .from('ocorrencias_fotos')
                        .getPublicUrl(caminhoStorage);
                    
                    // Salva apenas o Link no array novo!
                    fotosProcessadas.push({
                        id: foto.id,
                        data: linkInfo.publicUrl // Ex: https://..../foto.jpg
                    });
                } else {
                    // Se não for Base64 (ex: já era um Link de uma foto antiga editada), mantém como está
                    fotosProcessadas.push(foto);
                }
            }
        }
        
        // 2. HIGIENIZAÇÃO DE DADOS MATEMÁTICOS PARA O SUPABASE
        const ocorrenciaHigienizada = {
            ...ocorrencia,
            
            // Substitui as imagens gigantes pelas fotos tratadas acima
            fotos: fotosProcessadas, 
            
            // Limpa textos vazios que virariam Crach de Syntax no Banco e converte pra Null ou 0
            mortos: !ocorrencia.mortos || ocorrencia.mortos === "" ? 0 : Number(ocorrencia.mortos),
            feridos: !ocorrencia.feridos || ocorrencia.feridos === "" ? 0 : Number(ocorrencia.feridos),
            desalojados: !ocorrencia.desalojados || ocorrencia.desalojados === "" ? 0 : Number(ocorrencia.desalojados),
            desabrigados: !ocorrencia.desabrigados || ocorrencia.desabrigados === "" ? 0 : Number(ocorrencia.desabrigados),
            enfermos: !ocorrencia.enfermos || ocorrencia.enfermos === "" ? 0 : Number(ocorrencia.enfermos),
            desaparecidos: !ocorrencia.desaparecidos || ocorrencia.desaparecidos === "" ? 0 : Number(ocorrencia.desaparecidos),
            outros_afetados: !ocorrencia.outros_afetados || ocorrencia.outros_afetados === "" ? 0 : Number(ocorrencia.outros_afetados),
            
            // Trata as posições GPS para evitar o Erro Decimal Vazio
            lat: ocorrencia.lat === "" || ocorrencia.lat === undefined ? null : Number(ocorrencia.lat),
            lng: ocorrencia.lng === "" || ocorrencia.lng === undefined ? null : Number(ocorrencia.lng),
            id_local: ocorrencia.id_local === "" || ocorrencia.id_local === undefined ? null : Number(ocorrencia.id_local)
        };
        
        // Ensure some snake_case mapping for database compatibility
        const payload = {
            ...ocorrenciaHigienizada,
            categoria_risco: ocorrenciaHigienizada.categoriaRisco || ocorrenciaHigienizada.categoria_risco,
            subtipos_risco: ocorrenciaHigienizada.subtiposRisco || ocorrenciaHigienizada.subtipos_risco,
            subtipo_risco_outros: ocorrenciaHigienizada.subtipoRiscoOutros || ocorrenciaHigienizada.subtipo_risco_outros,
            nivel_risco: ocorrenciaHigienizada.nivelRisco || ocorrenciaHigienizada.nivel_risco,
            tem_apoio_tecnico: ocorrenciaHigienizada.temApoioTecnico || ocorrenciaHigienizada.tem_apoio_tecnico,
            apoio_tecnico: ocorrenciaHigienizada.apoioTecnico || ocorrenciaHigienizada.apoio_tecnico,
            tem_solicitante_especifico: ocorrenciaHigienizada.temSolicitanteEspecifico || ocorrenciaHigienizada.tem_solicitante_especifico,
            checklist_respostas: ocorrenciaHigienizada.checklistRespostas || ocorrenciaHigienizada.checklist_respostas,
            medidas_tomadas: ocorrenciaHigienizada.medidasTomadas || ocorrenciaHigienizada.medidas_tomadas,
            assinatura_agente: ocorrenciaHigienizada.assinaturaAgente || ocorrenciaHigienizada.assinatura_agente,
            assinatura_assistido: ocorrenciaHigienizada.assinaturaAssistido || ocorrenciaHigienizada.assinatura_assistido,
        };
        
        // Delete all camelCase extra keys to keep DB clean and prevent schema errors
        const keysToDelete = [
            'categoriaRisco', 'subtiposRisco', 'subtipoRiscoOutros', 'nivelRisco', 
            'temApoioTecnico', 'apoioTecnico', 'temSolicitanteEspecifico', 
            'checklistRespostas', 'medidasTomadas', 'assinaturaAgente', 
            'assinaturaAssistido', 'id'
        ];
        
        keysToDelete.forEach(key => delete payload[key]);

        // 3. O INSERT / UPSERT FINAL NO BANCO DE DADOS
        console.log("Salvando formulário no banco de dados...");
        
        const { data: dbData, error: dbError } = await supabase
            .from('ocorrencias_operacionais')
            .upsert(payload, {
                // onConflict barra o Erro de "Ocorrência Duplicada" se o Agente clicar 2x sem querer!
                onConflict: 'ocorrencia_id' 
            })
            .select();
        
        if (dbError) {
            throw new Error(`Erro fatal no Supabase Database: ${dbError.message}`);
        }
        
        console.log("Ocorrência salva com Sucesso Absoluto!");
        return { sucesso: true, mensagem: "Salvo com sucesso", dados: dbData };
    } catch (erro) {
        // Se a Internet cair em qualquer etapa, a foto ou a ocorrência paralisam aqui de forma segura
        console.error("Operação abortada. Erro encontrado:", erro.message);
        return { sucesso: false, mensagem: erro.message };
    }
}

/**
 * Exclui uma foto permanentemente do Storage para liberar espaço
 * @param {string} ocorrencia_id - UUID da ocorrência
 * @param {string} foto_id - ID único da foto
 */
export async function deletarFotoStorage(ocorrencia_id, foto_id) {
    if (!navigator.onLine || !ocorrencia_id || !foto_id) return { sucesso: false, erro: "offline ou dados insuficientes" };
    
    try {
        const caminhoStorage = `${ocorrencia_id}/${foto_id}.jpg`;
        console.log(`Deletando foto ${caminhoStorage} do Storage para liberar espaço...`);
        
        const { error } = await supabase.storage
            .from('ocorrencias_fotos')
            .remove([caminhoStorage]);

        if (error) throw error;
        return { sucesso: true };
    } catch (err) {
        console.error("Erro ao deletar foto do storage:", err.message);
        return { sucesso: false, erro: err.message };
    }
}

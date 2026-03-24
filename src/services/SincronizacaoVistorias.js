import { supabase } from './supabase';
import { initDB, getPendingVistorias } from './db';

/**
 * 🚀 Função Blindada para Sincronizar Vistorias Offline com o Supabase
 * @param {Array} vistoriasLoteOffline - Lista de vistorias ("synced": false) no celular
 * @returns {Object} Relatório
 */
export async function sincronizarVistoriasPendentes(vistoriasLoteOffline) {
    console.log(`Iniciando sincronização de ${vistoriasLoteOffline.length} vistorias...`);
    const relatorio = { sincronizadas: 0, falhas: 0, erros: [] };
    const db = await initDB();

    for (const vistoria of vistoriasLoteOffline) {
        try {
            console.log(`Processando a Vistoria ID Local: ${vistoria.id}...`);

            // Garantir que temos um vistoria_id oficial seguindo o padrão do sistema (XXX/YYYY)
            let officialId = vistoria.vistoria_id || vistoria.vistoriaId;

            if (!officialId) {
                const currentYear = new Date().getFullYear();
                console.log(`[Sync] Gerando novo ID oficial para o ano ${currentYear}...`);
                
                // Buscar o último ID do ano atual no banco remoto
                const { data: recentData, error: maxError } = await supabase
                    .from('vistorias')
                    .select('vistoria_id')
                    .filter('vistoria_id', 'like', `%/${currentYear}`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (maxError) console.warn(`[Sync] Erro ao buscar último ID: ${maxError.message}`);

                let maxNum = 0;
                if (recentData && recentData.length > 0) {
                    recentData.forEach(r => {
                        if (r.vistoria_id && r.vistoria_id.includes('/')) {
                            const num = parseInt(r.vistoria_id.split('/')[0]);
                            if (!isNaN(num)) maxNum = Math.max(maxNum, num);
                        }
                    });
                }

                // Verificar também o banco local para evitar colisões antes mesmo do sync
                const localItems = await db.getAll('vistorias');
                localItems.forEach(vi => {
                    const vid = vi.vistoria_id || vi.vistoriaId;
                    if (vid && vid.includes(`/${currentYear}`)) {
                        const n = parseInt(vid.split('/')[0]);
                        if (!isNaN(n)) maxNum = Math.max(maxNum, n);
                    }
                });

                officialId = `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;
                console.log(`[Sync] Atribuído novo Vistoria ID: ${officialId}`);
            }

            const NOME_BUCKET = 'vistorias_fotos'; // Bucket central que receberá Fotos e Assinaturas

            // ==========================================
            // 1.A UPLOAD DAS FOTOS PARA O BUCKET
            // ==========================================
            const fotosProcessadas = [];
            if (vistoria.fotos && vistoria.fotos.length > 0) {
                for (const foto of vistoria.fotos) {
                    const imageData = foto.data || foto.url;
                    if (imageData && String(imageData).startsWith('data:image')) {
                        console.log(`[Sync] Fazendo upload da foto ${foto.id || 'nova'}...`);
                        const respostaBlob = await fetch(imageData);
                        const blob = await respostaBlob.blob();
                        const extension = blob.type.split('/')[1] || 'jpg';
                        const caminhoStorage = `${officialId}/foto_${foto.id || Math.random().toString(36).substring(2, 7)}.${extension}`;

                        const { error: uploadError } = await supabase.storage
                            .from(NOME_BUCKET)
                            .upload(caminhoStorage, blob, { 
                                contentType: blob.type, 
                                upsert: true 
                            });

                        if (uploadError) throw new Error(`Falha no bucket (Fotos): ${uploadError.message}`);

                        const { data: linkAtivo } = supabase.storage.from(NOME_BUCKET).getPublicUrl(caminhoStorage);
                        fotosProcessadas.push({ ...foto, data: linkAtivo.publicUrl });
                    } else {
                        fotosProcessadas.push(foto); // Se já era Link de um upload anterior, mantém.
                    }
                }
            }

            // ==========================================
            // 1.B UPLOAD DA ASSINATURA DO AGENTE
            // ==========================================
            let linkAssinaturaAgente = vistoria.assinatura_agente || vistoria.assinaturaAgente;
            if (linkAssinaturaAgente && String(linkAssinaturaAgente).startsWith('data:image')) {
                console.log(`[Sync] Fazendo upload da assinatura do agente...`);
                const res = await fetch(linkAssinaturaAgente);
                const assBlob = await res.blob();
                const caminhoAssinatura = `${officialId}/assinatura_agente.png`;

                const { error: errAss } = await supabase.storage
                    .from(NOME_BUCKET)
                    .upload(caminhoAssinatura, assBlob, { 
                        contentType: 'image/png', 
                        upsert: true 
                    });

                if (errAss) throw new Error(`Falha na Assinatura Agente: ${errAss.message}`);

                const { data: urlAssinatura } = supabase.storage.from(NOME_BUCKET).getPublicUrl(caminhoAssinatura);
                linkAssinaturaAgente = urlAssinatura.publicUrl; // Troca Base64 por Link
            }

            // ==========================================
            // 1.C UPLOAD DA ASSINATURA DO APOIO TÉCNICO
            // ==========================================
            let apoioTecnicoProcessado = vistoria.apoio_tecnico || vistoria.apoioTecnico ? { ...(vistoria.apoio_tecnico || vistoria.apoioTecnico) } : null;

            if (apoioTecnicoProcessado && apoioTecnicoProcessado.assinatura && String(apoioTecnicoProcessado.assinatura).startsWith('data:image')) {
                console.log(`[Sync] Fazendo upload da assinatura do apoio técnico...`);
                const res = await fetch(apoioTecnicoProcessado.assinatura);
                const apoioBlob = await res.blob();
                const caminhoApoio = `${officialId}/assinatura_apoio.png`;

                const { error: errApoio } = await supabase.storage
                    .from(NOME_BUCKET)
                    .upload(caminhoApoio, apoioBlob, { 
                        contentType: 'image/png', 
                        upsert: true 
                    });

                if (errApoio) throw new Error(`Falha na Assinatura Apoio Técnico: ${errApoio.message}`);

                const { data: urlApoio } = supabase.storage.from(NOME_BUCKET).getPublicUrl(caminhoApoio);
                apoioTecnicoProcessado.assinatura = urlApoio.publicUrl; // Troca Base64 por Link
            }

            // ==========================================
            // 2. HIGIENIZAÇÃO DE DADOS (POSTGRES PREP)
            // ==========================================
            const vistoriaProntaParaDB = {
                ...vistoria,
                vistoria_id: officialId,
                fotos: fotosProcessadas, // Array Livre de Base64
                assinatura_agente: linkAssinaturaAgente, // Assinatura Livre de Base64
                apoio_tecnico: apoioTecnicoProcessado, // Objeto JSON Livre de Base64
                
                // Normalização de campos legados ou camelCase para snake_case esperado pelo DB
                tipo_info: vistoria.tipo_info || vistoria.tipoInfo || vistoria.categoriaRisco || 'Vistoria Geral',
                categoria_risco: vistoria.categoria_risco || vistoria.categoriaRisco || 'Outros',
                subtipos_risco: Array.isArray(vistoria.subtipos_risco) ? vistoria.subtipos_risco : (Array.isArray(vistoria.subtiposRisco) ? vistoria.subtiposRisco : []),
                nivel_risco: vistoria.nivel_risco || vistoria.nivelRisco || 'Baixo',
                situacao_observada: vistoria.situacao_observada || vistoria.situacaoObservada || 'Estabilizado',
                populacao_estimada: vistoria.populacao_estimada || vistoria.populacaoEstimada || '',
                grupos_vulneraveis: Array.isArray(vistoria.grupos_vulneraveis) ? vistoria.grupos_vulneraveis : (Array.isArray(vistoria.gruposVulneraveis) ? vistoria.gruposVulneraveis : []),
                medidas_tomadas: Array.isArray(vistoria.medidas_tomadas) ? vistoria.medidas_tomadas : (Array.isArray(vistoria.medidasTomadas) ? vistoria.medidasTomadas : []),
                encaminhamentos: Array.isArray(vistoria.encaminhamentos) ? vistoria.encaminhamentos : [],
                checklist_respostas: vistoria.checklist_respostas || vistoria.checklistRespostas || {},
                created_at: vistoria.created_at || vistoria.createdAt || new Date().toISOString(),

                // Anti-Travamento (Força GPS não-preenchido para Null em vez de "")
                latitude: vistoria.latitude === "" || vistoria.latitude == null ? null : parseFloat(vistoria.latitude),
                longitude: vistoria.longitude === "" || vistoria.longitude == null ? null : parseFloat(vistoria.longitude),
                
                synced: true // Quando bater no Postgres, será confirmada
            };

            // Remover campos que não devem ir para o Postgres (ID local e chaves camelCase redundantes)
            const internalId = vistoriaProntaParaDB.id;
            delete vistoriaProntaParaDB.id;
            
            // Limpeza de campos legados do payload remoto
            const cleanPayload = { ...vistoriaProntaParaDB };
            delete cleanPayload.vistoriaId;
            delete cleanPayload.tipoInfo;
            delete cleanPayload.categoriaRisco;
            delete cleanPayload.subtiposRisco;
            delete cleanPayload.nivelRisco;
            delete cleanPayload.situacaoObservada;
            delete cleanPayload.populacaoEstimada;
            delete cleanPayload.gruposVulneraveis;
            delete cleanPayload.medidasTomadas;
            delete cleanPayload.checklistRespostas;
            delete cleanPayload.assinaturaAgente;
            delete cleanPayload.apoioTecnico;
            delete cleanPayload.createdAt;

            // ==========================================
            // 3. ENVIO FINAL PARA O BANCO (UPSERT)
            // ==========================================
            const { error: dbError } = await supabase
                .from('vistorias')
                .upsert(cleanPayload, { onConflict: 'vistoria_id' }); 

            if (dbError) throw new Error(`Erro Fatal no PostgreSQL: ${dbError.message}`);

            // ***** SUCESSO DESTA VISTORIA *****
            // Atualizar o banco local marcando como sincronizado
            await db.put('vistorias', {
                ...vistoria,
                vistoria_id: officialId,
                synced: true,
                fotos: fotosProcessadas,
                assinatura_agente: linkAssinaturaAgente,
                apoio_tecnico: apoioTecnicoProcessado
            });

            relatorio.sincronizadas++;
            console.log(`Vistoria ${officialId} salva na nuvem com 100% dos anexos e assinaturas!`);

        } catch (erro) {
            console.error(`Falha isolada na Vistoria Local ID ${vistoria.id}: ${erro.message}`);
            relatorio.falhas++;
            relatorio.erros.push({ id: vistoria.vistoria_id || vistoria.id, motivo: erro.message });
        }
    }

    console.log("Fila de sincronização offline finalizada:", relatorio);
    return relatorio;
}

/**
 * 📡 Gatilho Automático (Listener) de Sincronização de Rede
 * Coloque este código no seu App.tsx ou main.js
 */
export function ativarSincronizacaoOfflineAutomatica() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
        console.log("📱 Sinal de Internet Restaurado! Verificando gaveta offline...");
        
        try {
            const vistoriasNaFila = await getPendingVistorias(); 
            
            if (vistoriasNaFila && vistoriasNaFila.length > 0) {
               await sincronizarVistoriasPendentes(vistoriasNaFila);
            }
        } catch (error) {
            console.error("Erro no processo de sincronização automática:", error);
        }
    });
}

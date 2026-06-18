import { supabase } from './supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Categoria mapping
export const getCategoriaRisco = (tipoEvento) => {
    const texto = tipoEvento.toLowerCase();
    if (texto.includes('movimentos de massa') || texto.includes('deslizamento')) {
        return 'GEOLOGICO';
    }
    if (texto.includes('enxurrada') || texto.includes('alagamento') || texto.includes('inundação') || texto.includes('inundacao') || texto.includes('transbordamento') || texto.includes('extravasamento')) {
        return 'HIDROLOGICO';
    }
    return 'OUTRO';
};

const ROTULOS_EM_ORDEM = [
    'ALERTA N°', 'ABERTO EM', 'ATUALIZADO EM', 'MUNICÍPIO', 'UF',
    'TIPO DE EVENTO/NÍVEL:', 'Cenário de Risco:', 'Situação Atual:',
    'Tendência:', 'Recomendações:',
    'Ações de Proteção e Defesa Civil recomendadas pelo CENAD:',
    'FORMULÁRIO DE OCORRÊNCIAS:'
];

function extrairEntreRotulos(texto, rotuloInicio, todosRotulos) {
    // Normaliza os espaços para facilitar a busca
    const normalizar = (str) => str.replace(/\s+/g, ' ').toLowerCase();
    
    const textoNorm = normalizar(texto);
    const rotuloNorm = normalizar(rotuloInicio);
    
    const inicio = textoNorm.indexOf(rotuloNorm);
    if (inicio === -1) return null;
    
    // Calcula o offset no texto original mapeando os caracteres
    // Mas para simplificar, já que a posição exata pode mudar, 
    // vamos buscar com RegExp flexível no texto original:
    const escapedRotulo = rotuloInicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    const regexInicio = new RegExp(escapedRotulo, 'i');
    const matchInicio = texto.match(regexInicio);
    
    if (!matchInicio) return null;
    
    const posInicioConteudo = matchInicio.index + matchInicio[0].length;

    let fimMaisProximo = texto.length;
    for (const rotulo of todosRotulos) {
        if (rotulo === rotuloInicio) continue;
        const escapedProximo = rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
        const regexProximo = new RegExp(escapedProximo, 'i');
        
        // Busca do posInicioConteudo pra frente
        const substr = texto.substring(posInicioConteudo);
        const matchProximo = substr.match(regexProximo);
        
        if (matchProximo) {
            const pos = posInicioConteudo + matchProximo.index;
            if (pos < fimMaisProximo) fimMaisProximo = pos;
        }
    }
    return texto.slice(posInicioConteudo, fimMaisProximo).replace(/\s+/g, ' ').trim();
}

// Config worker for pdfjs in browser using Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const parseAlertaCemaden = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        text += pageText + '\n';
    }

    const numeroAlertaMatch = text.match(/(\d{3,6}\/\d{4})/);
    const numeroAlerta = numeroAlertaMatch ? numeroAlertaMatch[1] : '';

    const tipoEventoNivel = extrairEntreRotulos(text, 'TIPO DE EVENTO/NÍVEL:', ROTULOS_EM_ORDEM) || '';
    const partes = tipoEventoNivel.split('/');
    const tipoEvento = partes[0] ? partes[0].trim().toUpperCase() : '';
    const nivel = partes[1] ? partes[1].trim().toUpperCase() : '';

    const abertoEmRaw = extrairEntreRotulos(text, 'ABERTO EM', ROTULOS_EM_ORDEM) || '';
    const atualizadoEmRaw = extrairEntreRotulos(text, 'ATUALIZADO EM', ROTULOS_EM_ORDEM) || '';
    
    // Tenta extrair Município e UF de forma mais robusta (fallback caso a tabela bagunce a extração normal)
    let municipio = extrairEntreRotulos(text, 'MUNICÍPIO', ROTULOS_EM_ORDEM) || '';
    let uf = extrairEntreRotulos(text, 'UF', ROTULOS_EM_ORDEM) || '';

    if (municipio.includes('Abertura') || uf.includes('Abertura') || municipio.includes(numeroAlerta) || !municipio) {
        // Formato tabela bagunçado: "... MUNICÍPIO UF 1253/2026 27/02/2026 SANTA MARIA DE JETIBÁ ES Abertura 17h43 ..."
        const regexMunicipio = new RegExp(`${numeroAlerta}.*?\\d{2}/\\d{2}/\\d{4}(?:\\s+\\d{2}[h:]\\d{2})?\\s+(.*?)\\s+(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)`, 'i');
        const matchTabela = text.replace(/\s+/g, ' ').match(regexMunicipio);
        if (matchTabela) {
            municipio = matchTabela[1].trim();
            uf = matchTabela[2].trim().toUpperCase();
        }
    }

    const cenarioRisco   = extrairEntreRotulos(text, 'Cenário de Risco:', ROTULOS_EM_ORDEM);
    const situacaoAtual  = extrairEntreRotulos(text, 'Situação Atual:', ROTULOS_EM_ORDEM);
    const tendencia      = extrairEntreRotulos(text, 'Tendência:', ROTULOS_EM_ORDEM);
    const recomendacoes  = extrairEntreRotulos(text, 'Recomendações:', ROTULOS_EM_ORDEM);
    const acoesDefesaCivil = extrairEntreRotulos(
        text, 'Ações de Proteção e Defesa Civil recomendadas pelo CENAD:', ROTULOS_EM_ORDEM
    );

    const expostos = (recomendacoes || '').match(/([\d.,]+)\s*pessoas\s*em\s*([\d.,]+)\s*moradias/i);

    const tipoDocumento =
        nivel === 'CESSAR' ? 'CESSAR' :
        atualizadoEmRaw.trim() ? 'ATUALIZACAO' : 'ABERTURA';

    return {
        numero_alerta: numeroAlerta,
        municipio: municipio.trim(),
        uf: uf.trim(),
        tipo_evento: tipoEvento,
        nivel,
        tipo_documento: tipoDocumento,
        data_abertura_raw: abertoEmRaw,
        data_atualizacao_raw: atualizadoEmRaw,
        cenario_risco: cenarioRisco,
        situacao_atual: situacaoAtual,
        tendencia,
        recomendacoes,
        acoes_defesa_civil: acoesDefesaCivil,
        pessoas_expostas: expostos ? Number(expostos[1].replace(/\./g, '')) : null,
        moradias_expostas: expostos ? Number(expostos[2].replace(/\./g, '')) : null
    };
};

function parseCemadenDate(dateStr) {
    if (!dateStr) return null;
    // Example format: 14/06/2026 12:00 or 27/02/2026 17h43
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})[h:](\d{2})/i);
    if (match) {
        return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:00Z`).toISOString();
    }
    // Attempt to extract just the date if time is missing or separated
    const matchDateOnly = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchDateOnly) {
         return new Date(`${matchDateOnly[3]}-${matchDateOnly[2]}-${matchDateOnly[1]}T00:00:00Z`).toISOString();
    }
    return new Date().toISOString(); // fallback
}

export const processarUploadCemaden = async (file, parsedData, user) => {
    try {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${parsedData.numero_alerta.replace('/', '_')}_${Date.now()}.${fileExt}`;
        const filePath = `alertas_cemaden/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('alertas_cemaden')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
            .from('alertas_cemaden')
            .getPublicUrl(filePath);

        const arquivoPath = publicUrlData.publicUrl;

        // Check if active alert exists
        const { data: activeAlert, error: alertError } = await supabase
            .from('alertas_cemaden')
            .select('*')
            .eq('numero_alerta', parsedData.numero_alerta)
            .eq('status', 'ATIVO')
            .maybeSingle();

        if (alertError) throw alertError;

        let alertaId;
        const categoria = getCategoriaRisco(parsedData.tipo_evento);
        const dataDoc = parsedData.tipo_documento === 'ABERTURA' ? parseCemadenDate(parsedData.data_abertura_raw) : parseCemadenDate(parsedData.data_atualizacao_raw);
        
        let pendencia = false;
        let logAcao = '';

        if (parsedData.nivel === 'CESSAR') {
            if (activeAlert) {
                // Cessar automático
                const { error: updateError } = await supabase
                    .from('alertas_cemaden')
                    .update({ 
                        status: 'CESSADO', 
                        data_cessar: dataDoc || new Date().toISOString(),
                        atualizado_em: new Date().toISOString()
                    })
                    .eq('id', activeAlert.id);
                if (updateError) throw updateError;
                alertaId = activeAlert.id;
                logAcao = 'CESSAR_AUTOMATICO';
            } else {
                // Cessar órfão
                // Create a temporary dummy alert so we can link the version, marked as pendencia
                const { data: newAlert, error: insertError } = await supabase
                    .from('alertas_cemaden')
                    .insert([{
                        numero_alerta: parsedData.numero_alerta,
                        municipio: parsedData.municipio,
                        uf: parsedData.uf,
                        tipo_evento: parsedData.tipo_evento,
                        categoria_risco: categoria,
                        nivel_atual: parsedData.nivel,
                        status: 'CESSADO',
                        data_abertura: dataDoc || new Date().toISOString(),
                        pendencia_vinculo: true
                    }])
                    .select()
                    .single();
                if (insertError) throw insertError;
                alertaId = newAlert.id;
                pendencia = true;
                logAcao = 'UPLOAD_CESSAR_ORFAO';
            }
        } else {
            // Abertura ou Atualização
            if (activeAlert) {
                // Atualização
                const { error: updateError } = await supabase
                    .from('alertas_cemaden')
                    .update({ 
                        nivel_atual: parsedData.nivel,
                        data_atualizacao: dataDoc || new Date().toISOString(),
                        atualizado_em: new Date().toISOString()
                    })
                    .eq('id', activeAlert.id);
                if (updateError) throw updateError;
                alertaId = activeAlert.id;
                logAcao = 'UPLOAD_ATUALIZACAO';
            } else {
                // Abertura
                const { data: newAlert, error: insertError } = await supabase
                    .from('alertas_cemaden')
                    .insert([{
                        numero_alerta: parsedData.numero_alerta,
                        municipio: parsedData.municipio,
                        uf: parsedData.uf,
                        tipo_evento: parsedData.tipo_evento,
                        categoria_risco: categoria,
                        nivel_atual: parsedData.nivel,
                        data_abertura: dataDoc || new Date().toISOString()
                    }])
                    .select()
                    .single();
                if (insertError) throw insertError;
                alertaId = newAlert.id;
                logAcao = 'UPLOAD_ABERTURA';
            }
        }

        // Insert versao
        const { error: versaoError } = await supabase
            .from('alertas_cemaden_versoes')
            .insert([{
                alerta_id: alertaId,
                tipo_documento: parsedData.tipo_documento,
                nivel: parsedData.nivel,
                data_emissao_doc: parseCemadenDate(parsedData.data_abertura_raw),
                data_atualizacao_doc: parseCemadenDate(parsedData.data_atualizacao_raw),
                cenario_risco: parsedData.cenario_risco,
                situacao_atual: parsedData.situacao_atual,
                tendencia: parsedData.tendencia,
                recomendacoes: parsedData.recomendacoes,
                acoes_defesa_civil: parsedData.acoes_defesa_civil,
                arquivo_path: arquivoPath,
                arquivo_nome_original: file.name,
                dados_extraidos_json: parsedData,
                confirmado_manualmente: true,
                uploaded_by: user?.id
            }]);

        if (versaoError) throw versaoError;

        // Insert log
        await supabase.from('alertas_cemaden_log').insert([{
            alerta_id: alertaId,
            acao: logAcao,
            usuario_id: user?.id,
            detalhes: `Upload versão: ${parsedData.tipo_documento}`
        }]);

        return alertaId;
    } catch (error) {
        console.error('Erro detalhado ao processar alerta:', error);
        throw new Error(error.message || JSON.stringify(error));
    }
};

export const getAlertasCemaden = async (filters = {}) => {
    let query = supabase.from('alertas_cemaden').select('*').order('criado_em', { ascending: false });

    if (filters.status && filters.status !== 'TODOS') {
        query = query.eq('status', filters.status);
    }
    if (filters.categoria && filters.categoria !== 'TODAS') {
        query = query.eq('categoria_risco', filters.categoria);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getAlertaCemadenById = async (id) => {
    const { data, error } = await supabase
        .from('alertas_cemaden')
        .select(`
            *,
            versoes:alertas_cemaden_versoes(*)
        `)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Suporta múltiplas chaves separadas por vírgula no .env
const apiKeys = (import.meta.env.VITE_GOOGLE_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
let currentKeyIndex = 0;

// Circuit Breaker State
let consecutiveFailures = 0;
let circuitOpenUntil = null;
const CIRCUIT_OPEN_DURATION_MS = 2 * 60 * 1000; // 2 minutos
const MAX_FAILURES = 5;
const LLM_TIMEOUT_MS = 3000; // 3 segundos

function isEconomiaIAAtiva() {
  return localStorage.getItem('NORTIS_ECONOMIA_IA') === 'true' || import.meta.env.VITE_NORTIS_ECONOMIA_IA === 'true';
}

function getFallbackResponse(documentos, motivo) {
  return {
    modo: "busca_direta",
    motivo_fallback: motivo,
    casos_similares: [],
    normas_tecnicas_aplicaveis: [],
    legislacao_aplicavel: documentos.map(d => ({
        origem_id: d.id,
        referencia: `${d.tipo || 'Documento'} Nº ${d.numero || 'S/N'}/${d.ano || ''}`,
        situacao: d.situacao || 'vigente',
        trecho_destacado: d.ementa || 'Sem ementa disponível',
        justificativa: "Recuperado por busca direta (Assistente de IA indisponível).",
        confianca: "media",
        link_interno: `/nortis/visualizar/${d.id}`,
        meta_tipo: d.tipo,
        meta_numero: d.numero,
        meta_ano: d.ano,
        meta_orgao: d.orgao_emissor,
        meta_ementa: d.ementa
    })),
    observacao: "Modo de busca direta ativado. Os resultados refletem a correspondência local sem síntese de IA.",
    aviso: "Busca direta — assistente de IA indisponível no momento."
  };
}

function getGenAI() {
  if (apiKeys.length === 0) throw new Error("Chave de API do Google não configurada.");
  return new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
}

// Wrapper para rodízio automático de chaves em caso de erro 429
async function executeWithKeyRotation(apiCallFunction) {
  let attempt = 0;
  let lastError;
  
  while (attempt < Math.max(1, apiKeys.length)) {
    try {
      const genAI = getGenAI();
      return await apiCallFunction(genAI);
    } catch (error) {
      lastError = error;
      if (error?.message?.includes('429') && apiKeys.length > 1) {
        console.warn(`[NORTIS] Chave ${currentKeyIndex + 1} bloqueada (429). Trocando para a próxima chave...`);
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export const nortisIaService = {
  classificarFonte(url) {
    if (!url) return 'NIVEL_C';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(gov\.br|jus\.br|leg\.br|mp\.br|defesacivil)/)) return 'NIVEL_A';
    if (lowerUrl.match(/\.(edu\.br|org\.br)|scielo/)) return 'NIVEL_B';
    return 'NIVEL_C';
  },
  
  async getEmbedding(text) {
    return executeWithKeyRotation(async (genAI) => {
      try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
      } catch (error) {
        if (error?.message?.includes('429')) throw error;
        console.error('Erro ao gerar embedding:', error);
        return null;
      }
    });
  },

  async buscarContexto(relato) {
    const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const stopWords = ['sobre', 'entre', 'quando', 'onde', 'qual', 'quem', 'este', 'esse', 'isso', 'aquilo', 'muito', 'pouco', 'mais', 'menos', 'ainda', 'assim', 'apenas', 'mesmo', 'tambem', 'entao', 'hoje', 'ontem', 'amanha', 'aqui', 'ali', 'agora', 'deve', 'pode', 'estado', 'devido', 'causados', 'estava', 'sendo'];
    
    // Extrair até 5 palavras-chave mais significativas do relato
    const words = normalize(relato)
      .split(/[^a-z0-9]/)
      .filter(w => w.length > 4 && !stopWords.includes(w))
      .slice(0, 5);

    if (words.length === 0) return [];

    // Busca de fallback usando ilike para garantir que a IA tenha algum contexto para cruzar
    const orConditions = words.map(w => `ementa.ilike.%${w}%,texto_integral.ilike.%${w}%`).join(',');

    const { data, error } = await supabase
      .from('nortis_normas')
      .select('id, tipo, numero, ano, ementa, texto_integral, orgao_emissor, situacao')
      .or(orConditions)
      .order('ano', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro NORTIS IA buscarContexto:', error);
      return [];
    }

    return data || [];
  },

  async registrarTrilhaSugestoes(respostaGerada, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa) {
    if (!tenantId || !userId) return;
    
    const dbPayload = {
      tenant_id: tenantId,
      usuario_id: userId,
      contexto_modulo: contextoModulo,
      relato_entrada: relato,
      documentos_recuperados: documentos.map(d => d.id),
      resposta_gerada: respostaGerada, // jsonb will hold modo and motivo_fallback
      modelo_llm: "gemini-2.5-flash",
      tipo_pesquisa: tipoPesquisa
    };
    
    const { data: sugestao } = await supabase.from('nortis_ia_sugestoes').insert([dbPayload]).select('id').single();

    respostaGerada._sugestao_id = sugestao?.id;

    // Se houver normas externas de NIVEL_A ou NIVEL_B, envia para curadoria
    if (respostaGerada.legislacao_aplicavel && respostaGerada.modo !== "busca_direta") {
        for (let item of respostaGerada.legislacao_aplicavel) {
            if (item.link_externo && (item.nivel_fonte === 'NIVEL_A' || item.nivel_fonte === 'NIVEL_B')) {
                await supabase.from('nortis_sugestoes_curadoria').insert([{
                    tenant_id: tenantId,
                    usuario_id: userId,
                    tipo_sugestao: 'LEGISLACAO_WEB',
                    titulo: item.referencia,
                    url_origem: item.link_externo,
                    justificativa: item.justificativa,
                    nivel_confiabilidade: item.nivel_fonte
                }]);
            }
        }
    }
  },

  async analisarRelato(relato, contextoModulo, registroOrigemId = null, tenantId = null, userId = null, tipoPesquisa = 'interno') {
    try {
      // 1. Busca contexto interno SEMPRE, para saber o que já temos
      const documentos = await this.buscarContexto(relato);

      // Verificação do modo economia de IA
      if (isEconomiaIAAtiva()) {
         const fallback = getFallbackResponse(documentos, 'modo_economia_ativo');
         await this.registrarTrilhaSugestoes(fallback, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);
         return fallback;
      }

      // Verificação do Circuit Breaker
      if (circuitOpenUntil && Date.now() < circuitOpenUntil) {
         const fallback = getFallbackResponse(documentos, 'circuito_aberto');
         await this.registrarTrilhaSugestoes(fallback, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);
         return fallback;
      } else if (circuitOpenUntil) {
         // Circuito fechou (tempo expirou), resetamos
         circuitOpenUntil = null;
         consecutiveFailures = 0;
      }

      if (documentos.length === 0 && tipoPesquisa === 'interno') {
        const fallbackVazio = { 
          modo: "busca_direta",
          casos_similares: [], 
          normas_tecnicas_aplicaveis: [], 
          legislacao_aplicavel: [], 
          observacao: "Nenhum documento encontrado no acervo interno do NORTIS que corresponda aos temas descritos. Tente expandir para 'Fontes Externas'.",
          aviso: "Pesquisa restrita ao acervo local."
        };
        await this.registrarTrilhaSugestoes(fallbackVazio, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);
        return fallbackVazio;
      }

      // 2. Prepara o contexto injetado para o LLM
      const contextText = documentos.map((d, i) => `
DOCUMENTO [${i}]
ID_ORIGEM: ${d.id}
TIPO: ${d.tipo}
NUMERO: ${d.numero}/${d.ano}
ORGAO: ${d.orgao_emissor}
SITUACAO: ${d.situacao}
EMENTA: ${d.ementa}
TEXTO: ${d.texto_integral ? d.texto_integral.substring(0, 3000) : ''}...
`).join('\n---\n');

      // 3. Monta o Prompt do Sistema
      let systemPrompt = `Você é o Agente NORTIS, assistente de pesquisa jurídico-técnica do SIGERD.

Sua função é ORGANIZAR, EXPLICAR e CALIBRAR A CONFIANÇA dos documentos recuperados ou encontrados na web.

REGRAS INVIOLÁVEIS
1. Se basear nas informações recuperadas (contexto local ou resultados de busca web).
2. O "trecho_destacado" deve ser uma paráfrase ou citação direta curta (evite reproduzir blocos imensos de forma massiva para não sofrer bloqueio de plágio/recitation).
3. Repasse a situação das leis se informado.
4. Nunca decida sozinho que uma sugestão é aprovada.`;

      if (tipoPesquisa === 'externo') {
        systemPrompt += `
5. ATENÇÃO: Esta é uma pesquisa puramente EXTERNA (WEB). NÃO retorne nenhuma das normativas listadas no CONTEXTO RECUPERADO INTERNAMENTE. Traga APENAS novidades e links externos oficiais que não possuímos. Responda APENAS em JSON bruto.`;
      } else if (tipoPesquisa === 'ambos') {
        systemPrompt += `
5. ATENÇÃO: Esta é uma pesquisa HÍBRIDA. Você tem acesso à pesquisa web do Google. Priorize o CONTEXTO RECUPERADO INTERNAMENTE, mas complemente com fontes oficiais externas (ex: planalto.gov.br) se faltar embasamento. Responda APENAS em JSON bruto.`;
      }

      systemPrompt += `

FORMATO DE SAÍDA OBRIGATORIAMENTE EM JSON VÁLIDO (retorne apenas as chaves exatas e nenhum texto extra, sem crases markdown):
{
  "casos_similares": [],
  "normas_tecnicas_aplicaveis": [],
  "legislacao_aplicavel": [
    {
      "origem_id": "uuid se local",
      "referencia": "Lei Federal nº X, Art. Y",
      "situacao": "vigente",
      "trecho_destacado": "cópia literal",
      "justificativa": "como embasa o relato",
      "confianca": "alta | media | baixa",
      "link_interno": "/nortis/visualizar/uuid",
      "link_externo": "url se externa",
      "meta_tipo": "lei | decreto | portaria",
      "meta_numero": "X",
      "meta_ano": 2012,
      "meta_orgao": "Orgao emissor",
      "meta_ementa": "ementa resumida"
    }
  ],
  "observacao": "preencher apenas se algum campo ficou vazio",
  "aviso": "Sugestão gerada por IA — validação humana obrigatória."
}

--- CONTEXTO RECUPERADO INTERNAMENTE ---
${contextText}
`;

      const userPrompt = `Analise o seguinte relato e forneça as fundamentações baseadas APENAS no contexto recuperado ou na pesquisa web permitida.
RELATO DO USUÁRIO (${contextoModulo}):
"${relato}"`;

      // 4. Chamada ao Gemini com Timeout (Circuit Breaker)
      const modelConfig = { 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.2,
        }
      };

      if (tipoPesquisa === 'interno') {
          modelConfig.generationConfig.responseMimeType = "application/json";
      } else {
          modelConfig.tools = [{ googleSearch: {} }];
      }

      let result;
      try {
        const timeoutPromise = new Promise((_, reject) => {
           setTimeout(() => reject(new Error('TIMEOUT_LLM')), LLM_TIMEOUT_MS);
        });

        result = await Promise.race([
          executeWithKeyRotation(async (genAI) => {
              const model = genAI.getGenerativeModel(modelConfig);
              return await model.generateContent([
                { text: systemPrompt },
                { text: userPrompt }
              ]);
          }),
          timeoutPromise
        ]);
        
        // Sucesso, zera falhas
        consecutiveFailures = 0;
      } catch (err) {
        // Tratar falha da Camada 2 (timeout ou erro)
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
           circuitOpenUntil = Date.now() + CIRCUIT_OPEN_DURATION_MS;
        }
        
        const motivo = err.message === 'TIMEOUT_LLM' ? 'timeout' : 'erro_provedor';
        console.warn(`[NORTIS] Fallback ativado (${motivo}). Falhas consecutivas: ${consecutiveFailures}`);
        
        const fallback = getFallbackResponse(documentos, motivo);
        await this.registrarTrilhaSugestoes(fallback, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);
        return fallback;
      }

      let responseText = result.response.text();
      
      // Extract JSON se veio com markdown
      if (responseText.includes('\`\`\`json')) {
        responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      } else if (responseText.includes('\`\`\`')) {
        responseText = responseText.replace(/\`\`\`/g, '').trim();
      }

      let respostaGerada = {};
      try {
        respostaGerada = JSON.parse(responseText);
        respostaGerada.modo = "completo";
      } catch(e) {
        // Erro de parse = fallback
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
           circuitOpenUntil = Date.now() + CIRCUIT_OPEN_DURATION_MS;
        }
        console.warn(`[NORTIS] Fallback ativado (parse error). Falhas consecutivas: ${consecutiveFailures}`);
        const fallback = getFallbackResponse(documentos, 'erro_provedor');
        await this.registrarTrilhaSugestoes(fallback, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);
        return fallback;
      }

      // Analisar metadados do Grounding (Links visitados)
      const grounding = result.response.candidates?.[0]?.groundingMetadata;
      if (grounding && grounding.groundingChunks) {
          const linksWeb = grounding.groundingChunks.filter(c => c.web).map(c => c.web.uri);
          
          if (linksWeb.length > 0 && respostaGerada.legislacao_aplicavel) {
              respostaGerada.legislacao_aplicavel.forEach(item => {
                  if (!item.link_interno && !item.link_externo) {
                      const melhorLink = linksWeb.find(l => this.classificarFonte(l) === 'NIVEL_A') || linksWeb[0];
                      item.link_externo = melhorLink;
                  }
                  if (item.link_externo) {
                      item.nivel_fonte = this.classificarFonte(item.link_externo);
                  } else {
                      item.nivel_fonte = 'INTERNO';
                  }
              });
          }
      } else if (respostaGerada.legislacao_aplicavel) {
         respostaGerada.legislacao_aplicavel.forEach(item => { item.nivel_fonte = 'INTERNO'; });
      }

      // 5. Salva na trilha de auditoria (nortis_ia_sugestoes)
      await this.registrarTrilhaSugestoes(respostaGerada, documentos, relato, contextoModulo, tenantId, userId, tipoPesquisa);

      return respostaGerada;

    } catch (error) {
      // Falhas não esperadas na orquestração inteira (ex: falha do supabase no buscarContexto)
      console.error('Erro na análise NORTIS IA:', error);
      throw error;
    }
  },

  async registrarRevisao(sugestaoId, status, userId, motivo = null) {
    const { error } = await supabase
      .from('nortis_ia_sugestoes')
      .update({
        status_revisao: status,
        revisado_por: userId,
        revisado_em: new Date().toISOString(),
        motivo_rejeicao: motivo
      })
      .eq('id', sugestaoId);
      
    if (error) throw error;
    return true;
  },

  async salvarNormativaDireta(item, tenantId, userId) {
    if (!item.meta_numero || !item.meta_ementa) {
        throw new Error('A IA não conseguiu extrair os metadados necessários para salvamento automático.');
    }

    const { data: norma, error: errNorma } = await supabase
      .from('nortis_normas')
      .insert({
        tenant_id: tenantId,
        tipo: item.meta_tipo?.substring(0, 30) || 'outros',
        numero: item.meta_numero?.substring(0, 50) || 'S/N',
        ano: item.meta_ano || new Date().getFullYear(),
        ambito: 'federal',
        orgao_emissor: item.meta_orgao?.substring(0, 150) || 'Fonte Externa',
        ementa: item.meta_ementa,
        url_fonte_oficial: item.link_externo,
        criado_por: userId,
        situacao: 'vigente'
      })
      .select('id')
      .single();

    if (errNorma) throw errNorma;

    const { error: errDisp } = await supabase
      .from('nortis_dispositivos')
      .insert({
        norma_id: norma.id,
        tenant_id: tenantId,
        tipo: 'Artigo', 
        numero: item.referencia?.substring(0, 50) || 'Art. 1',
        texto_integral: item.trecho_destacado,
        criado_por: userId
      });

    if (errDisp) throw errDisp;
    return norma.id;
  }
};

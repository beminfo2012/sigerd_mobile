import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

export const nortisIaService = {
  classificarFonte(url) {
    if (!url) return 'NIVEL_C';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(gov\.br|jus\.br|leg\.br|mp\.br|defesacivil)/)) return 'NIVEL_A';
    if (lowerUrl.match(/\.(edu\.br|org\.br)|scielo/)) return 'NIVEL_B';
    return 'NIVEL_C';
  },
  /**
   * Obtém o embedding para um texto usando o modelo text-embedding-004 do Gemini
   */
  async getEmbedding(text) {
    try {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      return null;
    }
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

  /**
   * Chama o Gemini 2.5 Flash para atuar como Assistente NORTIS
   * Agora suporta Pesquisa em Fontes Externas (Grounding)
   */
  async analisarRelato(relato, contextoModulo, registroOrigemId = null, tenantId = null, userId = null, tipoPesquisa = 'interno') {
    try {
      // 1. Busca contexto interno
      let documentos = [];
      if (tipoPesquisa === 'interno' || tipoPesquisa === 'ambos') {
        documentos = await this.buscarContexto(relato);
      }

      if (documentos.length === 0 && tipoPesquisa === 'interno') {
        return { 
          casos_similares: [], 
          normas_tecnicas_aplicaveis: [], 
          legislacao_aplicavel: [], 
          observacao: "Nenhum documento encontrado no acervo interno do NORTIS que corresponda aos temas descritos. Tente expandir para 'Fontes Externas'.",
          aviso: "Pesquisa restrita ao acervo local."
        };
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
2. Todo "trecho_destacado" deve ser CÓPIA LITERAL.
3. Repasse a situação das leis se informado.
4. Nunca decida sozinho que uma sugestão é aprovada.`;

      if (tipoPesquisa === 'externo' || tipoPesquisa === 'ambos') {
        systemPrompt += `
5. ATENÇÃO: Você tem acesso à pesquisa web do Google. Pesquise em fontes oficiais (ex: planalto.gov.br, in.gov.br, tcu.gov.br) para complementar. Responda APENAS em JSON bruto.`;
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
      "link_externo": "url se externa"
    }
  ],
  "observacao": "preencher apenas se algum campo ficou vazio",
  "aviso": "Sugestão gerada por IA — validação humana obrigatória."
}

--- CONTEXTO RECUPERADO INTERNAMENTE ---
${contextText}
`;

      const userPrompt = `Analise o seguinte relato e forneça as fundamentações baseadas APENAS no contexto recuperado.
RELATO DO USUÁRIO (${contextoModulo}):
"${relato}"`;

      // 4. Chamada ao Gemini
      const modelConfig = { 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.2, // um pouco maior para grounding
        }
      };

      if (tipoPesquisa === 'interno') {
          modelConfig.generationConfig.responseMimeType = "application/json";
      } else {
          // Quando ativamos o Grounding, alguns SDKs/Modelos não suportam force JSON MimeType, 
          // então tiramos e extraímos o JSON manualmente do texto markdown.
          modelConfig.tools = [{ googleSearch: {} }];
      }

      const model = genAI.getGenerativeModel(modelConfig);

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

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
      } catch(e) {
        console.error("Falha ao fazer parse do JSON:", responseText);
        throw new Error("A IA não retornou um formato JSON válido.");
      }

      // Analisar metadados do Grounding (Links visitados)
      const grounding = result.response.candidates?.[0]?.groundingMetadata;
      if (grounding && grounding.groundingChunks) {
          const linksWeb = grounding.groundingChunks.filter(c => c.web).map(c => c.web.uri);
          
          if (linksWeb.length > 0 && respostaGerada.legislacao_aplicavel) {
              // Aplica URLs às sugestões vazias e avalia nível de confiança
              respostaGerada.legislacao_aplicavel.forEach(item => {
                  if (!item.link_interno && !item.link_externo) {
                      // Associar a primeira URL confiável encontrada, se não tiver link
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
      if (tenantId && userId) {
        const { data: sugestao } = await supabase.from('nortis_ia_sugestoes').insert([{
            tenant_id: tenantId,
            usuario_id: userId,
            contexto_modulo: contextoModulo,
            relato_entrada: relato,
            documentos_recuperados: documentos.map(d => d.id),
            resposta_gerada: respostaGerada,
            modelo_llm: "gemini-2.5-flash",
            tipo_pesquisa: tipoPesquisa
        }]).select('id').single();

        respostaGerada._sugestao_id = sugestao?.id;

        // Se houver normas externas de NIVEL_A ou NIVEL_B, envia para curadoria
        if (respostaGerada.legislacao_aplicavel) {
            for (let item of respostaGerada.legislacao_aplicavel) {
                if (item.link_externo && (item.nivel_fonte === 'NIVEL_A' || item.nivel_fonte === 'NIVEL_B')) {
                    // Inserir sugestão de curadoria
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
      }

      return respostaGerada;

    } catch (error) {
      console.error('Erro na análise NORTIS IA:', error);
      throw error;
    }
  },

  /**
   * Feedback de auditoria e melhoria contínua
   */
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
  }
};

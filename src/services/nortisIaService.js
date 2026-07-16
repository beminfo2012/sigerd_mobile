import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

export const nortisIaService = {
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
   * Chama o Gemini 1.5 Flash para atuar como Assistente NORTIS
   */
  async analisarRelato(relato, contextoModulo, registroOrigemId = null, tenantId = null, userId = null) {
    try {
      // 1. Busca contexto
      const documentos = await this.buscarContexto(relato);

      if (!documentos || documentos.length === 0) {
        return { 
          casos_similares: [], 
          normas_tecnicas_aplicaveis: [], 
          legislacao_aplicavel: [], 
          observacao: "Nenhum documento encontrado no acervo do NORTIS que corresponda aos temas descritos.",
          aviso: "Sugestão gerada por IA — validação humana obrigatória antes de uso em ato oficial."
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

      // 3. Monta o Prompt do Sistema (Anexo A da Especificação)
      const systemPrompt = `Você é o Agente NORTIS, assistente de pesquisa jurídico-técnica do SIGERD.

Sua função é ORGANIZAR, EXPLICAR e CALIBRAR A CONFIANÇA dos documentos recuperados — nunca buscar, inventar ou complementar com conhecimento que não esteja no CONTEXTO RECUPERADO.

REGRAS INVIOLÁVEIS
1. NUNCA cite número de lei, artigo, parágrafo ou data que não esteja literalmente presente no CONTEXTO RECUPERADO.
2. Todo "trecho_destacado" que você produzir deve ser CÓPIA LITERAL de um trecho do documento correspondente.
3. Sempre repasse o campo situacao do documento de origem.
4. Nunca decida sozinho que uma sugestão é aprovada.

FORMATO DE SAÍDA OBRIGATORIAMENTE EM JSON VÁLIDO:
{
  "casos_similares": [],
  "normas_tecnicas_aplicaveis": [],
  "legislacao_aplicavel": [
    {
      "origem_id": "uuid",
      "referencia": "Lei Federal nº X, Art. Y",
      "situacao": "vigente",
      "trecho_destacado": "cópia literal",
      "justificativa": "como embasa o relato",
      "confianca": "alta | media | baixa",
      "link_interno": "/nortis/visualizar/uuid"
    }
  ],
  "observacao": "preencher apenas se algum campo ficou vazio",
  "aviso": "Sugestão gerada por IA — validação humana obrigatória antes de uso em ato oficial."
}

--- CONTEXTO RECUPERADO ---
${contextText}
`;

      const userPrompt = `Analise o seguinte relato e forneça as fundamentações baseadas APENAS no contexto recuperado.
RELATO DO USUÁRIO (${contextoModulo}):
"${relato}"`;

      // 4. Chamada ao Gemini
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1, // baixa temperatura para evitar alucinações
        }
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const responseText = result.response.text();
      const respostaGerada = JSON.parse(responseText);

      // 5. Salva na trilha de auditoria (nortis_ia_sugestoes)
      if (tenantId && userId) {
        const { data: sugestao } = await supabase.from('nortis_ia_sugestoes').insert([{
            tenant_id: tenantId,
            usuario_id: userId,
            contexto_modulo: contextoModulo,
            relato_entrada: relato,
            documentos_recuperados: documentos.map(d => d.id),
            resposta_gerada: respostaGerada,
            modelo_llm: "gemini-1.5-flash"
        }]).select('id').single();

        respostaGerada._sugestao_id = sugestao?.id;
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

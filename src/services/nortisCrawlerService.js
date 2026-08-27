import { supabase } from './supabase';

/**
 * Funções utilitárias de Sanitização, Normalização e Hash
 */

// Simple SHA-256 string hash helper for browser/JS environment
async function generateHash(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Unaccent helper
function removeAccents(str = '') {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Normalizador de conteúdo legislativo
export function normalizeLegislativeText(htmlOrText = '') {
  if (!htmlOrText) return '';
  
  let cleaned = htmlOrText
    // Remover tags HTML (scripts, styles, tags)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Normalizar entidades HTML comuns
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // Normalizar espaços e quebras de linha
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Extrator automático de metadados a partir do texto
 */
export function extractMetadata(rawTitle = '', rawText = '') {
  const fullText = (rawTitle + " " + rawText).trim();
  const textNoAccent = removeAccents(fullText);

  // Identificar Tipo do Ato
  let tipo = 'Ato Normativo';
  if (/decreto/i.test(textNoAccent)) tipo = 'Decreto';
  else if (/lei/i.test(textNoAccent)) tipo = 'Lei';
  else if (/portaria/i.test(textNoAccent)) tipo = 'Portaria';
  else if (/instrucao normativa/i.test(textNoAccent)) tipo = 'Instrução Normativa';
  else if (/resolucao/i.test(textNoAccent)) tipo = 'Resolução';

  // Identificar Número e Ano (ex: Decreto nº 1.245/2026 ou 1245-2026)
  let numero = 'Não identificado';
  let ano = new Date().getFullYear();

  const numMatch = fullText.match(/(?:nº|no|num\.?|numero)\s*([\d\.\-]+)\s*(?:\/|-)?\s*(\d{4})?/i);
  if (numMatch) {
    numero = numMatch[1].replace(/\./g, '');
    if (numMatch[2]) {
      ano = parseInt(numMatch[2], 10);
    }
  }

  // Identificar Esfera
  let esfera = 'Estadual';
  if (/federal|uniao|presidente da republica|ministerio/i.test(textNoAccent)) esfera = 'Federal';
  else if (/municipal|prefeitura|prefeito|camara municipal/i.test(textNoAccent)) esfera = 'Municipal';

  // Ementa básica (se não fornecida separada, usa as primeiras frases ou título)
  let ementa = rawTitle || fullText.substring(0, 300) + '...';

  return {
    tipo,
    numero,
    ano,
    esfera,
    ementa,
    data_publicacao: new Date().toISOString().split('T')[0]
  };
}

/**
 * Servidor e Motor de Relevância
 */
export const nortisCrawlerService = {
  // 1. Obter fontes de dados
  async getFontes() {
    const { data, error } = await supabase.from('fontes_legislativas').select('*').order('nome');
    if (error) throw error;
    return data || [];
  },

  async saveFonte(fonte) {
    if (fonte.id) {
      const { data, error } = await supabase.from('fontes_legislativas').update({
        ...fonte,
        atualizado_em: new Date().toISOString()
      }).eq('id', fonte.id).select();
      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase.from('fontes_legislativas').insert([fonte]).select();
      if (error) throw error;
      return data[0];
    }
  },

  async toggleFonteAtiva(id, statusAtual) {
    const { data, error } = await supabase
      .from('fontes_legislativas')
      .update({ ativo: !statusAtual, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // 2. Módulo Administrativo de Palavras-Chave e Exclusões
  async getPalavrasChave() {
    const { data, error } = await supabase.from('palavras_chave').select('*').order('categoria').order('termo');
    if (error) throw error;
    return data || [];
  },

  async savePalavraChave(palavra) {
    if (palavra.id) {
      const { data, error } = await supabase.from('palavras_chave').update(palavra).eq('id', palavra.id).select();
      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase.from('palavras_chave').insert([palavra]).select();
      if (error) throw error;
      return data[0];
    }
  },

  async deletePalavraChave(id) {
    const { error } = await supabase.from('palavras_chave').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getListaExclusao() {
    const { data, error } = await supabase.from('lista_exclusao_captura').select('*').order('termo');
    if (error) throw error;
    return data || [];
  },

  async saveItemExclusao(item) {
    if (item.id) {
      const { data, error } = await supabase.from('lista_exclusao_captura').update(item).eq('id', item.id).select();
      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase.from('lista_exclusao_captura').insert([item]).select();
      if (error) throw error;
      return data[0];
    }
  },

  async deleteItemExclusao(id) {
    const { error } = await supabase.from('lista_exclusao_captura').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 3. Motor de Cálculo de Pontuação e Relevância
  async calcularPontuacaoEClassificacao(titulo = '', ementa = '', textoIntegral = '') {
    const palavrasChave = await this.getPalavrasChave();
    const listaExclusao = await this.getListaExclusao();

    const normTitulo = removeAccents(titulo.toLowerCase());
    const normEmenta = removeAccents(ementa.toLowerCase());
    const normTexto = removeAccents(textoIntegral.toLowerCase());

    let pontuacaoTotal = 0;
    const palavrasEncontradas = [];
    const regrasAplicadas = [];

    // Avaliação de Palavras-Chave por Localização
    for (const item of palavrasChave) {
      if (!item.ativo) continue;
      const termoNorm = removeAccents(item.termo.toLowerCase());
      
      let encontrouNoTitulo = normTitulo.includes(termoNorm);
      let encontrouNaEmenta = normEmenta.includes(termoNorm);
      let encontrouNoTexto = normTexto.includes(termoNorm);

      if (encontrouNoTitulo || encontrouNaEmenta || encontrouNoTexto) {
        let pesoItem = item.peso || 10;
        let multiplicador = 1;

        if (encontrouNoTitulo) multiplicador = 3;
        else if (encontrouNaEmenta) multiplicador = 3;

        let pontotermo = pesoItem * multiplicador;
        pontuacaoTotal += pontotermo;

        palavrasEncontradas.push({
          termo: item.termo,
          categoria: item.categoria,
          peso: pesoItem,
          multiplicador,
          pontos: pontotermo,
          local: encontrouNoTitulo ? 'Título' : (encontrouNaEmenta ? 'Ementa' : 'Texto')
        });
      }
    }

    // Avaliação de Combinações Especiais
    const hasDefesaCivil = normTitulo.includes('defesa civil') || normEmenta.includes('defesa civil');
    const hasEmergencia = normTitulo.includes('emergencia') || normEmenta.includes('emergencia') || normEmenta.includes('calamidade');
    const hasDesastre = normTexto.includes('deslizamento') || normTexto.includes('enchente') || normTexto.includes('inundacao');

    if (hasEmergencia && (hasDefesaCivil || hasDesastre)) {
      pontuacaoTotal += 40;
      regrasAplicadas.push({ regra: 'Emergência/Calamidade + Evento Adverso', bonus: 40 });
    }

    // Avaliação da Lista de Exclusão (Penalidade por Falsos Positivos)
    for (const exc of listaExclusao) {
      if (!exc.ativo) continue;
      const excNorm = removeAccents(exc.termo.toLowerCase());
      if (normTitulo.includes(excNorm) || normEmenta.includes(excNorm) || normTexto.includes(excNorm)) {
        const penalidade = exc.penalidade_peso || 50;
        pontuacaoTotal -= penalidade;
        regrasAplicadas.push({ penalidade: `Falso positivo detectado: ${exc.termo}`, valor: -penalidade });
      }
    }

    // Classificação Final em Faixas
    let nivelRelevancia = 'IGNORAR';
    if (pontuacaoTotal >= 80) nivelRelevancia = 'ALTA';
    else if (pontuacaoTotal >= 40) nivelRelevancia = 'MEDIA';
    else if (pontuacaoTotal >= 15) nivelRelevancia = 'BAIXA';

    return {
      pontuacao: Math.max(0, pontuacaoTotal),
      nivelRelevancia,
      palavrasEncontradas,
      regrasAplicadas
    };
  },

  // 4. Ingestão e Pré-Cadastramento de Documento Capturado
  async ingestDocument({
    fonte_id,
    identificador_externo,
    tipo,
    numero,
    ano,
    data_publicacao,
    orgao,
    esfera,
    ementa,
    texto_original,
    url_fonte
  }) {
    const texto_normalizado = normalizeLegislativeText(texto_original);
    const hash_documento = await generateHash(url_fonte + "_" + (numero || '') + "_" + (ano || '') + "_" + texto_normalizado.substring(0, 200));

    // Deduplicação: Verificar se o hash já foi cadastrado
    const { data: docExistente } = await supabase
      .from('documentos_capturados')
      .select('id, status')
      .eq('hash_documento', hash_documento)
      .maybeSingle();

    if (docExistente) {
      return { status: 'DUPLICADO', docId: docExistente.id };
    }

    // Calcular Relevância
    const classificacao = await this.calcularPontuacaoEClassificacao(ementa, ementa, texto_normalizado);

    if (classificacao.nivelRelevancia === 'IGNORAR') {
      return { status: 'IGNORADO', pontuacao: classificacao.pontuacao };
    }

    // Extrair Metadados Complementares se faltarem
    const autoMeta = extractMetadata(ementa, texto_normalizado);

    const novoDoc = {
      fonte_id,
      identificador_externo,
      tipo: tipo || autoMeta.tipo,
      numero: numero || autoMeta.numero,
      ano: ano || autoMeta.ano,
      data_publicacao: data_publicacao || autoMeta.data_publicacao,
      orgao: orgao || 'Não identificado',
      esfera: esfera || autoMeta.esfera,
      ementa: ementa || autoMeta.ementa,
      texto_original,
      texto_normalizado,
      url_fonte: url_fonte || 'https://www.in.gov.br',
      hash_documento,
      status: 'RASCUNHO_AGUARDANDO_REVISAO'
    };

    const { data: insertedDoc, error: insertErr } = await supabase
      .from('documentos_capturados')
      .insert([novoDoc])
      .select();

    if (insertErr) throw insertErr;

    const docId = insertedDoc[0].id;

    // Gravar classificação associada
    await supabase.from('classificacoes_legislativas').insert([{
      documento_id: docId,
      pontuacao: classificacao.pontuacao,
      nivel_relevancia: classificacao.nivelRelevancia,
      palavras_encontradas: classificacao.palavrasEncontradas,
      regras_aplicadas: classificacao.regrasAplicadas
    }]);

    return { status: 'PRE_CADASTRADO', docId, nivelRelevancia: classificacao.nivelRelevancia };
  },

  // 5. Simular / Executar Crawler de Fonte
  async executarCapturaFonte(fonteId) {
    const logId = crypto.randomUUID();
    const dataInicio = new Date().toISOString();

    // Atualizar status no log
    await supabase.from('execucoes_captura_log').insert([{
      id: logId,
      fonte_id: fonteId,
      status: 'EM_ANDAMENTO',
      data_inicio: dataInicio
    }]);

    try {
      const { data: fonte } = await supabase.from('fontes_legislativas').select('*').eq('id', fonteId).single();
      
      // Amostra de atos normativos simulados da fonte para testes/demonstração
      const mockDocs = [
        {
          identificador_externo: 'DOU-2026-08-27-01',
          tipo: 'Decreto',
          numero: '14.890',
          ano: 2026,
          data_publicacao: '2026-08-27',
          orgao: 'Presidência da República / Defesa Civil Nacional',
          esfera: 'Federal',
          ementa: 'Declara situação de emergência em municípios afetados por enxurradas e autoriza o repasse de recursos do Fundo de Defesa Civil (FUNDEPDEC).',
          texto_original: '<p><b>DECRETO Nº 14.890, DE 27 DE AGOSTO DE 2026</b></p><p>O PRESIDENTE DA REPÚBLICA declara situação de emergência e autoriza apoio logístico de proteção e defesa civil com plano de contingência integrado no SINPDEC.</p>',
          url_fonte: 'https://www.in.gov.br/web/dou/-/decreto-14890-2026'
        },
        {
          identificador_externo: 'DOE-ES-2026-044',
          tipo: 'Portaria',
          numero: '088',
          ano: 2026,
          data_publicacao: '2026-08-26',
          orgao: 'Coordenadoria Estadual de Proteção e Defesa Civil',
          esfera: 'Estadual',
          ementa: 'Homologa o Mapeamento de Áreas de Risco e obras de contenção de encosta na região serrana.',
          texto_original: '<div>PORTARIA Nº 088/2026 - COMPDEC/CEPDEC. Institui ações de monitoramento e simulado para deslizamento de terra.</div>',
          url_fonte: 'https://dio.es.gov.br/portaria-088-2026'
        },
        {
          identificador_externo: 'DOM-2026-99',
          tipo: 'Lei',
          numero: '3.102',
          ano: 2026,
          data_publicacao: '2026-08-25',
          orgao: 'Câmara Municipal',
          esfera: 'Municipal',
          ementa: 'Denomina rua pública no bairro Jardim das Flores.',
          texto_original: 'Lei Ordinária nº 3102/2026. Denomina logradouro público sem relação com emergência.',
          url_fonte: 'https://municipio.gov.br/lei-3102'
        }
      ];

      let encontrados = mockDocs.length;
      let processados = 0;
      let relevantes = 0;

      for (const item of mockDocs) {
        const res = await this.ingestDocument({ ...item, fonte_id: fonteId });
        processados++;
        if (res.status === 'PRE_CADASTRADO') {
          relevantes++;
        }
      }

      const agora = new Date().toISOString();
      await supabase.from('fontes_legislativas').update({
        ultima_execucao: agora,
        ultima_execucao_sucesso: agora,
        qtd_documentos_encontrados: encontrados,
        qtd_documentos_classificados: relevantes
      }).eq('id', fonteId);

      await supabase.from('execucoes_captura_log').update({
        status: 'SUCESSO',
        data_fim: agora,
        docs_encontrados: encontrados,
        docs_processados: processados,
        docs_relevantes: relevantes
      }).eq('id', logId);

      return { SUCESSO: true, encontrados, relevantes };
    } catch (err) {
      console.error("Erro na execução da captura:", err);
      await supabase.from('execucoes_captura_log').update({
        status: 'FALHA',
        data_fim: new Date().toISOString(),
        mensagem_erro: err.message
      }).eq('id', logId);

      await supabase.from('fontes_legislativas').update({
        qtd_erros: 1,
        ultimo_erro: err.message
      }).eq('id', fonteId);

      throw err;
    }
  },

  // 6. Consultas para Fila de Revisão Rápida
  async getFilaRevisao() {
    const { data, error } = await supabase
      .from('documentos_capturados')
      .select(`
        *,
        fonte:fontes_legislativas(nome, esfera, orgao),
        classificacao:classificacoes_legislativas(*)
      `)
      .eq('status', 'RASCUNHO_AGUARDANDO_REVISAO')
      .order('data_captura', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 7. Ações de Revisão Humana (Aprovar / Editar / Descartar)
  async aprovarEPublicar(documentoId, dadosEditados = null, usuarioInfo = { id: '00000000-0000-0000-0000-000000000000', nome: 'Servidor Validador' }) {
    // Obter o documento capturado
    const { data: doc, error: fetchErr } = await supabase
      .from('documentos_capturados')
      .select('*')
      .eq('id', documentoId)
      .single();

    if (fetchErr) throw fetchErr;

    const finalData = dadosEditados ? { ...doc, ...dadosEditados } : doc;

    // Inserir no Banco Legislativo Definitivo (nortis_normas)
    const payloadNorma = {
      tenant_id: '00000000-0000-0000-0000-000000000000',
      tipo: finalData.tipo || 'Outros',
      numero: finalData.numero || 'S/N',
      ano: finalData.ano || new Date().getFullYear(),
      ambito: (finalData.esfera || 'Estadual').toLowerCase(),
      orgao_emissor: finalData.orgao || 'Defesa Civil',
      ementa: finalData.ementa,
      texto_integral: finalData.texto_original,
      situacao: 'vigente',
      data_publicacao: finalData.data_publicacao || new Date().toISOString().split('T')[0],
      url_fonte_oficial: finalData.url_fonte,
      criado_por: usuarioInfo.id
    };

    const { data: insertedNorma, error: normErr } = await supabase
      .from('nortis_normas')
      .insert([payloadNorma])
      .select();

    if (normErr) throw normErr;

    const normaId = insertedNorma[0].id;

    // Atualizar status do rascunho
    const novoStatus = dadosEditados ? 'EDITADO' : 'APROVADO';
    await supabase.from('documentos_capturados')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', documentoId);

    // Gravar auditoria
    await supabase.from('revisoes_legislativas').insert([{
      documento_id: documentoId,
      norma_publicada_id: normaId,
      usuario_id: usuarioInfo.id,
      usuario_nome: usuarioInfo.nome,
      acao: novoStatus === 'EDITADO' ? 'EDITADO_E_APROVADO' : 'APROVADO',
      dados_alterados: dadosEditados ? dadosEditados : null
    }]);

    return insertedNorma[0];
  },

  async descartarDocumento(documentoId, motivo, observacoes = '', usuarioInfo = { id: '00000000-0000-0000-0000-000000000000', nome: 'Servidor Validador' }) {
    await supabase.from('documentos_capturados')
      .update({ status: 'DESCARTADO', atualizado_em: new Date().toISOString() })
      .eq('id', documentoId);

    await supabase.from('revisoes_legislativas').insert([{
      documento_id: documentoId,
      usuario_id: usuarioInfo.id,
      usuario_nome: usuarioInfo.nome,
      acao: 'DESCARTADO',
      motivo_descarte: motivo,
      observacoes
    }]);

    return true;
  },

  // 8. Obter Estatísticas para o Dashboard do Crawler
  async getDashboardStats() {
    const { data: fontes } = await supabase.from('fontes_legislativas').select('*');
    const { data: docs } = await supabase.from('documentos_capturados').select('id, status, data_captura');
    const { data: classifs } = await supabase.from('classificacoes_legislativas').select('nivel_relevancia');

    const totalCapturados = docs ? docs.length : 0;
    const pendentes = docs ? docs.filter(d => d.status === 'RASCUNHO_AGUARDANDO_REVISAO').length : 0;
    const aprovados = docs ? docs.filter(d => d.status === 'APROVADO' || d.status === 'EDITADO').length : 0;
    const descartados = docs ? docs.filter(d => d.status === 'DESCARTADO').length : 0;

    const altaRelevancia = classifs ? classifs.filter(c => c.nivel_relevancia === 'ALTA').length : 0;
    const mediaRelevancia = classifs ? classifs.filter(c => c.nivel_relevancia === 'MEDIA').length : 0;
    const baixaRelevancia = classifs ? classifs.filter(c => c.nivel_relevancia === 'BAIXA').length : 0;

    const fontesAtivas = fontes ? fontes.filter(f => f.ativo).length : 0;

    return {
      totalCapturados,
      pendentes,
      aprovados,
      descartados,
      altaRelevancia,
      mediaRelevancia,
      baixaRelevancia,
      fontesAtivas,
      totalFontes: fontes ? fontes.length : 0
    };
  }
};

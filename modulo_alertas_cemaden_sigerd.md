# Módulo Alertas (CEMADEN) — Especificação técnica para o SIGERD

## 1. Conceito e diferença em relação ao módulo Avisos (INMET)

O módulo **Avisos** já existente captura, via API, os avisos meteorológicos do INMET — um fluxo automatizado, sem intervenção humana na entrada dos dados.

O módulo **Alertas (CEMADEN)** é estruturalmente diferente porque o CEMADEN não oferece API pública de alertas (situação já confirmada por você na investigação do radar de Santa Teresa): a entrada é manual, via upload do PDF que a Defesa Civil recebe por e-mail/WhatsApp no momento em que o CEMADEN dispara o alerta. Isso muda o desenho do módulo em dois pontos centrais:

- precisa de uma etapa de **extração de texto do PDF** seguida de **confirmação humana** dos dados extraídos antes de gravar (o operador deve poder corrigir o que o parser errar, já que esses registros podem ser usados depois em auditoria do TCE-ES ou em prestação de contas do PLACON);
- o **mesmo número de alerta** (ex.: `1253/2026`) se repete em todos os documentos do mesmo evento — abertura, eventuais atualizações de nível e o cessar. O sistema precisa tratar esses uploads como **versões de um único registro**, não como alertas separados.

## 2. Taxonomia oficial do CEMADEN

| Campo | Valores possíveis |
|---|---|
| Nível de risco | `OBSERVACAO`, `MODERADO`, `ALTO`, `MUITO_ALTO` |
| Tipo de documento | `ABERTURA`, `ATUALIZACAO`, `CESSAR` |
| Categoria de evento | `GEOLOGICO` (movimentos de massa), `HIDROLOGICO` (enxurrada, alagamento, inundação), `OUTRO` |
| Status do alerta (derivado) | `ATIVO`, `CESSADO`, `EXCLUIDO` |

A categoria não vem explícita no PDF — é inferida a partir do texto livre em `TIPO DE EVENTO/NÍVEL:` (ex.: "MOVIMENTOS DE MASSA / MODERADO"). Recomendo manter essa correspondência em uma tabela de domínio editável, e não em código fixo, porque o CEMADEN pode emitir outras nomenclaturas de evento no futuro:

```
movimentos de massa, deslizamento        → GEOLOGICO
enxurrada, alagamento, inundação,
transbordamento, extravasamento de canal → HIDROLOGICO
```

## 3. Ciclo de vida de um alerta

Um alerta nasce com o PDF de **abertura**, pode receber **N atualizações** (CEMADEN reemite o mesmo número com nível diferente, sem necessariamente cessar) e termina com o PDF de **cessar**. O número do alerta (`numero_alerta`) é a chave de vínculo entre todos esses documentos — não crie um registro novo por upload, crie uma nova **versão** dentro do mesmo alerta.

Regra de classificação do upload, a partir do campo `nível` extraído:

- nível extraído é `CESSAR` → é um documento de cessar → procurar alerta `ATIVO` com o mesmo `numero_alerta` (e mesmo município, por segurança) e migrar seu status para `CESSADO`;
- nível extraído é um dos quatro oficiais e já existe alerta `ATIVO` com esse número → é uma **atualização** (escalonamento ou rebaixamento de nível) → nova versão, atualiza `nivel_atual`;
- nível extraído é um dos quatro oficiais e não existe alerta com esse número → é a **abertura** → cria o alerta;
- documento de cessar chega sem encontrar alerta `ATIVO` correspondente → não descartar nem criar um cessar "solto": marcar como **pendência de vínculo** e exibir para o operador resolver manualmente (buscar e relacionar, ou registrar como órfão para fins de histórico).

## 4. Modelo de dados

Quatro tabelas. A separação entre `alertas_cemaden` (o alerta em si, com seu estado atual) e `alertas_cemaden_versoes` (cada PDF recebido) é o que permite reconstruir a linha do tempo completa — abertura, todas as atualizações e o cessar — sem perder nenhum documento original, o que é exatamente o que você precisa para comparações futuras.

```sql
CREATE TABLE alertas_cemaden (
    id                  SERIAL PRIMARY KEY,
    numero_alerta       VARCHAR(20)  NOT NULL,           -- ex: '1253/2026'
    municipio           VARCHAR(120) NOT NULL,
    uf                  VARCHAR(2)   NOT NULL,
    tipo_evento         VARCHAR(60)  NOT NULL,            -- texto bruto, ex: 'MOVIMENTOS DE MASSA'
    categoria_risco     VARCHAR(20)  NOT NULL,            -- GEOLOGICO | HIDROLOGICO | OUTRO
    nivel_atual         VARCHAR(20)  NOT NULL,            -- OBSERVACAO | MODERADO | ALTO | MUITO_ALTO
    status              VARCHAR(20)  NOT NULL DEFAULT 'ATIVO', -- ATIVO | CESSADO | EXCLUIDO
    data_abertura       TIMESTAMP    NOT NULL,
    data_atualizacao    TIMESTAMP,
    data_cessar         TIMESTAMP,
    pessoas_expostas    INTEGER,
    moradias_expostas   INTEGER,
    pendencia_vinculo   BOOLEAN      NOT NULL DEFAULT FALSE, -- true = cessar sem abertura encontrada
    excluido_em         TIMESTAMP,
    excluido_por        INTEGER REFERENCES usuarios(id),
    motivo_exclusao     TEXT,
    criado_em           TIMESTAMP    NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_alerta_numero_ativo
    ON alertas_cemaden (numero_alerta)
    WHERE status <> 'EXCLUIDO';

CREATE INDEX idx_alerta_status      ON alertas_cemaden (status);
CREATE INDEX idx_alerta_categoria   ON alertas_cemaden (categoria_risco, nivel_atual);
CREATE INDEX idx_alerta_municipio   ON alertas_cemaden (municipio);

CREATE TABLE alertas_cemaden_versoes (
    id                   SERIAL PRIMARY KEY,
    alerta_id            INTEGER NOT NULL REFERENCES alertas_cemaden(id),
    tipo_documento       VARCHAR(20) NOT NULL,   -- ABERTURA | ATUALIZACAO | CESSAR
    nivel                VARCHAR(20) NOT NULL,
    data_emissao_doc      TIMESTAMP,             -- 'ABERTO EM' do PDF
    data_atualizacao_doc  TIMESTAMP,             -- 'ATUALIZADO EM' do PDF
    cenario_risco         TEXT,
    situacao_atual        TEXT,
    tendencia             TEXT,
    recomendacoes         TEXT,
    acoes_defesa_civil    TEXT,
    arquivo_path          VARCHAR(255) NOT NULL,  -- caminho/URL do PDF armazenado
    arquivo_nome_original VARCHAR(255),
    dados_extraidos_json  JSONB,                  -- saída bruta do parser, para auditoria/reprocessamento
    confirmado_manualmente BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by           INTEGER REFERENCES usuarios(id),
    uploaded_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_versao_alerta ON alertas_cemaden_versoes (alerta_id);

-- Opcional / fase 2: dados da tabela de estações (página 2 do PDF de abertura)
CREATE TABLE alertas_cemaden_precipitacao (
    id              SERIAL PRIMARY KEY,
    versao_id       INTEGER NOT NULL REFERENCES alertas_cemaden_versoes(id),
    estacao_nome    VARCHAR(150),
    rede            VARCHAR(20),       -- ANA, etc.
    data_leitura    TIMESTAMP,
    acumulado_1h    NUMERIC(6,1),
    acumulado_3h    NUMERIC(6,1),
    acumulado_6h    NUMERIC(6,1),
    acumulado_12h   NUMERIC(6,1),
    acumulado_24h   NUMERIC(6,1),
    acumulado_48h   NUMERIC(6,1),
    acumulado_72h   NUMERIC(6,1),
    acumulado_96h   NUMERIC(6,1),
    acumulado_120h  NUMERIC(6,1)
);

CREATE TABLE alertas_cemaden_log (
    id          SERIAL PRIMARY KEY,
    alerta_id   INTEGER NOT NULL REFERENCES alertas_cemaden(id),
    acao        VARCHAR(40) NOT NULL,  -- UPLOAD_ABERTURA, UPLOAD_ATUALIZACAO, CESSAR_AUTOMATICO,
                                       -- CESSAR_MANUAL, EXCLUSAO, VINCULO_MANUAL
    usuario_id  INTEGER REFERENCES usuarios(id),
    detalhes    TEXT,
    criado_em   TIMESTAMP NOT NULL DEFAULT now()
);
```

Por que exclusão lógica e não `DELETE`: dado o seu histórico de trabalho com TCE-ES e prestação de contas (PLACON, procedimentos licitatórios), manter o registro com `status = 'EXCLUIDO'` mais o motivo e quem excluiu é o que sustenta a rastreabilidade em uma eventual auditoria. A exclusão física do PDF e do banco deveria, na minha avaliação, ficar reservada a um expurgo administrativo separado e não a uma ação de tela.

## 5. Extração de dados do PDF

O CEMADEN usa um template nacional fixo, o que torna viável uma extração por **âncoras de rótulo** (encontrar o texto do rótulo e capturar até o próximo rótulo conhecido), em vez de depender da ordem exata em que a biblioteca de extração devolve o texto — ferramentas de extração de PDF nem sempre preservam a ordem visual de tabelas.

Sugestão de stack, dado que o restante do SIGERD já usa Node.js: `pdf-parse` para extrair o texto bruto, com uma função utilitária de extração entre rótulos.

```javascript
const pdfParse = require('pdf-parse');

const ROTULOS_EM_ORDEM = [
  'ALERTA N°', 'ABERTO EM', 'ATUALIZADO EM', 'MUNICÍPIO', 'UF',
  'TIPO DE EVENTO/NÍVEL:', 'Cenário de Risco:', 'Situação Atual:',
  'Tendência:', 'Recomendações:',
  'Ações de Proteção e Defesa Civil recomendadas pelo CENAD:',
  'FORMULÁRIO DE OCORRÊNCIAS:'
];

function extrairEntreRotulos(texto, rotuloInicio, todosRotulos) {
  const inicio = texto.indexOf(rotuloInicio);
  if (inicio === -1) return null;
  const posInicioConteudo = inicio + rotuloInicio.length;

  let fimMaisProximo = texto.length;
  for (const rotulo of todosRotulos) {
    if (rotulo === rotuloInicio) continue;
    const pos = texto.indexOf(rotulo, posInicioConteudo);
    if (pos !== -1 && pos < fimMaisProximo) fimMaisProximo = pos;
  }
  return texto.slice(posInicioConteudo, fimMaisProximo).trim();
}

async function parseAlertaCemaden(buffer) {
  const { text } = await pdfParse(buffer);

  const numeroAlerta = (text.match(/(\d{3,6}\/\d{4})/) || [])[1];

  const tipoEventoNivel = extrairEntreRotulos(text, 'TIPO DE EVENTO/NÍVEL:', ROTULOS_EM_ORDEM) || '';
  const [tipoEvento, nivel] = tipoEventoNivel.split('/').map(s => s.trim().toUpperCase());

  const abertoEmRaw = extrairEntreRotulos(text, 'ABERTO EM', ROTULOS_EM_ORDEM) || '';
  const atualizadoEmRaw = extrairEntreRotulos(text, 'ATUALIZADO EM', ROTULOS_EM_ORDEM) || '';
  const municipio = extrairEntreRotulos(text, 'MUNICÍPIO', ROTULOS_EM_ORDEM) || '';
  const uf = extrairEntreRotulos(text, 'UF', ROTULOS_EM_ORDEM) || '';

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
}
```

A categoria (geológico/hidrológico) é derivada do `tipo_evento` numa função separada, consultando a tabela de domínio mencionada na seção 2 — assim você ajusta a correspondência sem alterar código.

A tabela de precipitação por estação (página 2 do PDF de abertura) tem layout tabular mais difícil de extrair de forma confiável com `pdf-parse` puro. Recomendo tratá-la como item de fase 2 — guardar a página como referência no PDF original já é suficiente para a maioria dos usos, e a extração estruturada pode vir depois com uma biblioteca específica de tabelas (`pdf-table-extractor` ou processamento via `pdfjs-dist` com coordenadas), ou inclusive preenchimento manual quando o valor for relevante para algum relatório específico.

**Importante:** depois do parse, mostre os campos extraídos em um formulário editável antes de salvar — datas, número do alerta, nível, município e os textos longos. Isso cobre tanto falhas de parsing quanto erros do próprio PDF, e é o que sustenta a confiabilidade do dado para uso posterior em relatórios oficiais.

## 6. Lógica de vinculação no momento do upload

```
upload do PDF
  → parseAlertaCemaden()
  → exibir prévia editável ao operador
  → operador confirma
  → buscar alertas_cemaden WHERE numero_alerta = X AND status = 'ATIVO'

  se nivel === 'CESSAR':
      encontrou alerta ativo?
          sim → status = 'CESSADO', data_cessar = data_atualizacao,
                grava nova versão tipo CESSAR, log: CESSAR_AUTOMATICO
          não → grava versão "órfã" com pendencia_vinculo = true,
                exibe para o operador vincular manualmente a um alerta existente
                (mesmo fora da janela usual, por exemplo se a abertura não foi
                cadastrada) ou confirmar como encerramento sem abertura registrada

  senão (nivel é um dos quatro oficiais):
      encontrou alerta ativo?
          sim → nivel_atual = nivel, data_atualizacao = data extraída,
                grava nova versão tipo ATUALIZACAO, log: UPLOAD_ATUALIZACAO
          não → cria novo registro em alertas_cemaden, status = 'ATIVO',
                grava versão tipo ABERTURA, log: UPLOAD_ABERTURA
```

## 7. Interface

### 7.1 Card no painel (lista de alertas)

Cada card deve mostrar, no mínimo: ícone/cor por categoria (geológico vs. hidrológico), selo de nível com cor por severidade (observação = neutro, moderado = âmbar, alto = vermelho, muito alto = vermelho mais escuro, cessado = verde), número do alerta, município, data de abertura e — quando houver — data de cessar, mais um recorte curto do texto de "Cenário de Risco" (primeiros ~120 caracteres). Status `ATIVO`/`CESSADO` como selo, e um indicador visual separado para `pendencia_vinculo = true`, já que esse caso precisa de atenção do operador.

Sugiro adicionar ao topo do painel (ao lado do card "AVISOS ATIVOS" que já existe para o INMET) um novo indicador "ALERTAS CEMADEN" contando alertas com `status = 'ATIVO'`, mantendo a mesma lógica visual do dashboard atual.

### 7.2 Página de detalhe (ao clicar no card)

- cabeçalho com os mesmos dados do card, expandido;
- **linha do tempo** das versões: abertura → atualizações → cessar, cada item com data, nível e link para abrir o PDF original daquela versão — esse é o ponto que permite reconstruir o histórico completo de um evento;
- seções de texto completas: Cenário de Risco, Situação Atual, Tendência, Recomendações, Ações de Defesa Civil recomendadas;
- pessoas e moradias expostas;
- ações: **Cessar alerta** (upload do PDF de cessar, ou cessar manual com justificativa quando não houver documento do CEMADEN), **Anexar atualização**, **Excluir alerta** (exclusão lógica, com campo obrigatório de motivo);
- log de ações na parte inferior (quem fez upload, quem cessou, quem excluiu, com data/hora).

## 8. Endpoints sugeridos

```
POST   /api/alertas-cemaden/preview-upload      → recebe o PDF, retorna o parse para confirmação (não grava)
POST   /api/alertas-cemaden                      → confirma e grava (abertura/atualização/cessar)
GET    /api/alertas-cemaden                      → lista com filtros: status, categoria, nivel, municipio, periodo
GET    /api/alertas-cemaden/:id                  → detalhe com histórico de versões
PATCH  /api/alertas-cemaden/:id/cessar-manual     → cessar sem PDF, exige justificativa
DELETE /api/alertas-cemaden/:id                   → exclusão lógica, exige motivo
GET    /api/alertas-cemaden/:id/versoes/:versaoId/pdf → download do PDF original daquela versão
```

## 9. Pontos para amadurecer depois

- cruzamento futuro com o módulo Avisos (INMET): mesmo município e período sobreposto entre um aviso INMET e um alerta CEMADEN reforça o cenário de risco e pode justificar exibição conjunta numa mesma linha do tempo situacional;
- a tabela `alertas_cemaden_precipitacao`, quando implementada, permite comparar o acumulado de chuva por estação registrado pelo CEMADEN com os dados pluviométricos que o próprio SIGERD já coleta, útil para validar limiares locais de disparo de ações;
- como o `numero_alerta` é a chave de negócio (não a chave técnica `id`), garanta que toda consulta de vínculo use esse campo combinado com município, para evitar colisão caso o CEMADEN reutilize a numeração entre estados.

# Diário de Abertura — Especificação de Produto e Módulo SIGERD
### (fissura, trinca, rachadura, fenda e brecha — classificação automática por largura, referência IBAPE-MG)

## 1. Conceito

Sistema de monitoramento fotográfico padronizado da evolução de **aberturas patológicas** em elementos construtivos, composto por:

- **Componente físico**: um cartão de referência de baixo custo (CRFP — Cartão de Referência Fotográfica Padronizada), fixado ao lado da abertura no momento da foto.
- **Componente digital**: módulo do SIGERD que recebe as fotos, corrige perspectiva automaticamente via marcador fiducial, mede a abertura em milímetros, **classifica automaticamente o tipo de patologia** (fissura, trinca, rachadura, fenda ou brecha) conforme a largura medida, e constrói uma linha do tempo comparável por ponto monitorado.

> **Nota terminológica**: fissura, trinca e rachadura não são sinônimos — são patologias distintas, diferenciadas principalmente pela largura da abertura. Um cartão de referência fotográfica não mede só "fissuras": mede qualquer abertura, e o sistema deve classificá-la corretamente em vez de assumir uma categoria única. Ver seção 4.4.

O objetivo não é substituir o fissurômetro físico tradicional (colado, com leitura em régua/reticulado) — essa prática já é consolidada no mercado, é confiável e barata para qualquer uma dessas patologias. O objetivo é resolver o problema que o instrumento tradicional **não resolve**: transformar o registro fotográfico disperso (que hoje qualquer agente já faz, mas sem padronização de escala, ângulo ou cadeia de custódia) em **dado técnico comparável, auditável e juridicamente defensável**, sem exigir que o agente seja engenheiro nem que a prefeitura instale um instrumento fixo em cada abertura de cada imóvel vistoriado.

## 2. Diferencial em relação ao que já existe

| Existe hoje | O que falta |
|---|---|
| Fissurômetro físico colado (leitura manual em régua/reticulado) | Não gera foto comparável, exige visita ao ponto exato, não se integra a sistema digital |
| Registro fotográfico "técnico numerado" em vistorias (prática comum) | Sem escala padronizada — impossível comparar largura entre duas fotos tiradas em ângulos/distâncias diferentes |
| Pontos de gesso (testemunho de movimentação) | Indica que houve movimento, mas não quantifica, não tem timestamp/geo verificável |
| Apps genéricos de medição por câmera | Não têm cadeia de custódia, não se integram a processo administrativo, não classificam a patologia corretamente |

O CRFP + módulo digital cobre exatamente esse vão: **instrumento físico tem precisão, mas não digitaliza. Foto solta digitaliza, mas não tem escala, custódia nem classificação.** O produto une as três coisas.

## 3. Componente físico — Cartão CRFP

Cartão rígido, tamanho aproximado A6 (105 × 148 mm), laminado ou em PVC 1–2 mm, para resistir a campo. Genérico e reutilizável — não é numerado nem específico de um ponto.

**Elementos impressos:**

1. **Marcador fiducial** — permite à visão computacional detectar automaticamente a posição, o ângulo e a escala do cartão na foto, mesmo com distorção de perspectiva.
2. **Escala linear em mm** (régua em L, dois eixos, origem compartilhada) — referência visual humana e de calibração da visão computacional.
3. **Campo apagável** para o agente escrever o código do ponto à mão (ex.: "AB-014"), como referência visual redundante à legenda digital.
4. **Guia para adesivo de nível de bolha real** — o desenho impresso é só posicionamento; a função de nivelar depende de um adesivo físico colado ali (ver mockup e notas de fabricação).
5. **Seta "TOPO"** — padroniza orientação do cartão em toda medição futura.
6. **Faixa de referência de cinza/cor** — permite correção de balanço de branco entre fotos tiradas em iluminações diferentes.

**Custo estimado**: impressão em pequena escala (laminação ou PVC rígido) fica na faixa de baixo custo unitário em gráfica local; em volume, cai ainda mais.

## 4. Componente digital — Módulo "Diário de Abertura" (SIGERD)

### 4.1 Fluxo de uso do agente

1. Agente identifica uma abertura em vistoria (fissura, trinca ou rachadura — a classificação exata só é confirmada depois da medição) → cria registro `abertura_patologica` vinculado ao imóvel (e à vistoria/NOPRER, se houver).
2. Agente escreve o código do ponto no campo apagável do cartão, nivela, fotografa cartão + abertura.
3. Sistema (client-side ou server-side) detecta o marcador, corrige perspectiva, calcula fator pixel→mm, sugere a largura medida.
4. **Agente sempre confirma ou corrige a medição sugerida antes de ela virar registro oficial** — nenhuma medição é gravada como definitiva sem validação humana.
5. **Sistema classifica automaticamente** a patologia (fissura/trinca/rachadura/fenda/brecha) a partir da largura validada, conforme a tabela de referência configurada (ver 4.4).
6. Sistema monta a linha do tempo comparável daquele ponto.

### 4.2 Modelo de dados (proposta)

**Tabela `abertura_patologica`**
- `id`, `tenant_id` (RLS)
- `imovel_id` (FK)
- `vistoria_id`, `nopper_id` (FK, opcionais)
- `codigo_ponto` (ex.: "AB-001")
- `localizacao_descricao`
- `categoria` → Estrutural
- `status`: ativa | estabilizada | encerrada
- `data_abertura`, `criado_por`

**Tabela `abertura_registro_fotografico`**
- `id`, `abertura_id` (FK)
- `foto_url` (MinIO) + `hash_sha256` (garante integridade/não-adulteração)
- `data_hora` + `fonte_data_hora` (enum: `exif_foto` | `gps_dispositivo`)
- `latitude`, `longitude` + `fonte_geolocalizacao`
- `largura_mm_medida`
- `classificacao_patologia` (enum: `fissura` | `trinca` | `rachadura` | `fenda` | `brecha`) — **calculado automaticamente** a partir de `largura_mm_medida`, gravado no momento da validação
- `fonte_classificacao` (ex.: `"IBAPE-MG"`) — registra qual tabela de referência gerou aquela classificação, para que mudanças futuras de critério não invalidem o histórico
- `metodo_medicao`: `visao_computacional_auto` | `manual_agente`
- `confianca_deteccao` (0–100, nulo quando manual)
- `validado_por`, `validado_em` (obrigatórios para status oficial)
- `observacoes`

**Tabela `abertura_alerta`** (fase futura, não implementar ainda)
- `abertura_id`, `taxa_crescimento_mm_mes`, `limiar_configurado`, `data_disparo`
- `vistoria_gerada_id` / `nopper_gerado_id`

### 4.3 Pipeline de visão computacional

1. Detecção do marcador fiducial (OpenCV `aruco` module).
2. Cálculo de homografia → correção de perspectiva e ângulo.
3. Conversão pixel→mm usando dimensão real conhecida do marcador.
4. Segmentação da abertura por contraste/bordas na região de interesse.
5. Cálculo de largura em múltiplos pontos (máxima e média).
6. Confirmação humana obrigatória antes de gravar como oficial.

**Importante**: a IA aqui **sugere**, não decide sozinha — nada entra como fato oficial sem validação verificável.

### 4.4 Classificação automática — referência IBAPE-MG

Não existe consenso normativo único entre as instituições brasileiras (IBAPE-MG, IBAPE-SP e a NBR 15575 usam faixas diferentes). Adotamos como padrão do sistema a tabela do **IBAPE-MG**, por ser a mais granular:

| Classificação | Faixa de abertura |
|---|---|
| Fissura | até 0,5 mm |
| Trinca | 0,5 mm a 1,0 mm |
| Rachadura | 1,0 mm a 5,0 mm |
| Fenda | 5,0 mm a 10,0 mm |
| Brecha | acima de 10,0 mm |

**Ressalva que precisa ficar visível no sistema e no parecer gerado**: a classificação por largura **não define, por si só, o grau de risco** da manifestação patológica. É sempre necessário diagnosticar a origem e monitorar a atividade/progressão — uma abertura pequena pode ser mais preocupante que uma maior, dependendo da causa (recalque de fundação, por exemplo). O sistema deve tratar essa classificação como **descritiva** (nomeia o que foi medido), nunca como um veredito automático de severidade.

A tabela de referência é armazenada de forma que outra norma (IBAPE-SP, NBR 15575, ou limiares customizados por município) possa ser adotada no futuro sem quebrar o histórico — cada registro já gravado mantém sua `fonte_classificacao` original.

## 5. Integração com módulos existentes do SIGERD

- **Vistoria**: nova seção "Aberturas Monitoradas" no imóvel, listando todos os pontos, sua classificação atual e histórico.
- **NOPRER**: evolução da abertura pode ser anexada como evidência técnica na notificação de risco, já com a classificação (fissura/trinca/rachadura/fenda/brecha) constando no anexo.
- **Motor de sugestão de risco**: taxa de crescimento (mm/mês) e a classificação da abertura entram como regras ponderadas na categoria Estrutural, cada uma com sua `fonte` normativa.
- **Pareceres (busca full-text)**: histórico de medições e classificações pode ser citado automaticamente como anexo probatório em um Parecer Técnico-Jurídico.
- **Alertas automáticos** (fase futura): quando a taxa de crescimento ultrapassa limiar configurável, ou quando a classificação evolui de uma categoria para outra mais grave (ex.: trinca → rachadura), sistema sugere automaticamente nova vistoria/NOPRER.

## 6. Valor probatório

Prática de monitoramento de aberturas (fissurômetro, pontos de gesso, registro fotográfico numerado) já é aceita tecnicamente como evidência em laudos estruturais no Brasil. O ganho aqui é **cadeia de custódia digital + classificação correta**: hash da foto no momento da captura, timestamp e geolocalização com fonte obrigatória, trilha de quem validou cada medição, e a patologia nomeada de acordo com a norma de referência declarada — não um termo genérico aplicado a qualquer abertura. Isso fortalece diretamente qualquer parecer técnico-jurídico ou processo administrativo que dependa de demonstrar evolução de risco ao longo do tempo — exatamente o tipo de exposição que você mitiga hoje perante o TCE-ES.

## 7. Viabilidade e roadmap sugerido

| Fase | Escopo | Risco técnico |
|---|---|---|
| **V1** | Cartão físico + registro manual da medição no SIGERD + classificação automática (IBAPE-MG) + linha do tempo comparável (sem CV, sem alerta) | Baixo — ganho imediato de padronização, auditoria e nomenclatura correta |
| **V2** | Correção de perspectiva + cálculo automático de escala (pixel→mm) via marcador, medição ainda manual | Médio — depende de qualidade da foto em campo |
| **V3** | Segmentação automática da abertura com sugestão de largura, validação humana obrigatória | Médio-alto — precisa de base de fotos para calibrar |
| **V4** | Alertas automáticos por taxa de crescimento e por mudança de classificação, integrado ao motor de risco e à geração de NOPRER | Baixo (depende só das fases anteriores estarem estáveis) |

Recomendo continuar pelo **V1**: já entrega valor prático imediato (padronização + auditoria + comparabilidade + nomenclatura tecnicamente correta), usando stack e princípios já consolidados no SIGERD, sem depender ainda de visão computacional funcionando bem em campo.

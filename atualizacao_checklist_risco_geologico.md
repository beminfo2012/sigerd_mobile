# Prompt de Implementação — Atualização do Módulo "Risco e Detalhes" (Categoria Geológico/Geotécnico) — SIGERD

## Contexto

Você vai atualizar o formulário "Nova Vistoria" do SIGERD, especificamente a seção 5 ("Risco e Detalhes") quando a categoria selecionada for **Geológico/Geotécnico**. O objetivo é alinhar o checklist técnico e os subtipos de risco à metodologia IPT/CPRM (Augusto Filho, 1992) e à nomenclatura R1–R4 do Ministério das Cidades, eliminando redundâncias e ambiguidades conceituais identificadas na versão atual.

Mantenha o padrão visual e os componentes existentes (cards com radio/checkbox, botão "Consolidar em Observações", botões de nível de risco). Apenas altere a estrutura de dados e os rótulos/opções abaixo.

---

## 1. Checklist Técnico — alterações

**Dividir o item existente "Há inclinação excessiva de árvores, postes ou muros" em dois itens distintos**, pois representam indicadores tecnicamente diferentes (um é dendrogeomorfológico, o outro é estrutural):

- `Há inclinação excessiva de árvores ou postes (indício de movimento lento do solo)`
- `Há muros, cercas ou estruturas com inclinação, fissura ou sinal de tombamento`

**Adicionar os seguintes itens novos ao checklist** (manter o mesmo componente de card/checkbox dos demais):

1. `Há lançamento de água pluvial ou esgoto concentrado sobre o talude`
2. `O corte ou aterro existente apresenta geometria inadequada (ângulo/altura excessivos)`
3. `Há sobrecarga na crista do talude (entulho, construção ou material depositado)`
4. `Há surgência de água com carreamento visível de partículas de solo (piping)`
5. `Existe muro de contenção com fissura, tombamento ou sinal de empuxo`
6. `Há registro de ocorrência anterior no mesmo local`

O checklist final deve conter, portanto, 12 itens (os 5 originais não alterados + os 2 itens divididos + os 6 novos).

Manter o tipo de campo, a obrigatoriedade ("OBRIGATÓRIO") e o botão "Consolidar em Observações" inalterados.

---

## 2. Subtipos de Risco — reestruturação completa

Substituir a lista plana atual (12 itens) por uma estrutura **agrupada em 3 categorias**, com cabeçalho de subseção visível para cada grupo (pode usar um pequeno label cinza acima de cada bloco de cards, no mesmo estilo de "SUBTIPOS DE RISCO"):

**Grupo 1 — Movimentos de Massa**
- Deslizamento Planar
- Deslizamento Rotacional
- Deslizamento em Cunha
- Rastejo
- Corrida de Massa / Fluxo de Detritos
- Queda / Rolamento de Blocos Rochosos

**Grupo 2 — Processos Erosivos**
- Erosão Laminar
- Erosão em Sulco
- Ravina
- Voçoroca

**Grupo 3 — Recalque e Subsidência**
- Subsidência (colapso de vazios subterrâneos)
- Recalque Diferencial do Solo

**Remover da lista de subtipos:**
- "Movimento de Massa" (genérico — agora é o nome do grupo, não mais uma opção individual)
- "Deslizamento de Terra" (redundante com os subtipos de deslizamento já listados)
- "Soterramento" (não é um subtipo de risco, é uma consequência potencial — se necessário, tratar em campo separado de "Pessoas/Bens Expostos", fora desta seção)
- "Afloramento de Água" (já capturado no checklist técnico como fator causal, não deve duplicar como subtipo)
- "Instabilidade de Encosta" (termo genérico demais, sem valor diagnóstico próprio — já é descrito pelos subtipos específicos)
- "Colapso de Talude" (ambíguo; substituído pelos subtipos específicos de deslizamento)
- "Trinca no Terreno" (mover para o checklist técnico como fator observado, não como subtipo — pode ser fundido ao item 1 do checklist ou criado como item adicional, à critério de quem implementar)

Manter o comportamento de seleção (pode ser múltipla escolha, como sugere o layout atual com vários cards habilitáveis).

---

## 3. Nível de Risco — ajuste de nomenclatura

Renomear o rótulo "MODERADO" para **"MÉDIO"**, mantendo a mesma posição e estilo visual.

Adicionar o código de classificação oficial (R1–R4) ao lado ou abaixo de cada rótulo, mantendo o destaque visual do nível selecionado (ex.: verde para o ativo):

- `R1 · BAIXO`
- `R2 · MÉDIO`
- `R3 · ALTO`
- `R4 · MUITO ALTO / IMINENTE`

Não alterar a lógica de seleção única (botão ativo) já existente.

---

## 4. Modelo de dados (schema)

Atualizar o schema/estado do formulário (objeto JS, JSON Schema, ou equivalente usado no projeto) para refletir:

```json
{
  "categoria_risco": "geologico_geotecnico",
  "checklist_tecnico": {
    "trincas_solo_degraus": "boolean",
    "inclinacao_arvores_postes": "boolean",
    "muros_cercas_inclinados_fissurados": "boolean",
    "afloramento_agua_minas": "boolean",
    "talude_escorregamento_recente": "boolean",
    "blocos_rocha_instaveis": "boolean",
    "erosao_avancada_ravinas_vocorocas": "boolean",
    "solo_saturado_lama_fluida": "boolean",
    "lancamento_agua_pluvial_esgoto_talude": "boolean",
    "geometria_corte_aterro_inadequada": "boolean",
    "sobrecarga_crista_talude": "boolean",
    "surgencia_agua_carreamento_piping": "boolean",
    "muro_contencao_fissurado_tombado": "boolean",
    "ocorrencia_anterior_local": "boolean"
  },
  "subtipos_risco": {
    "movimentos_de_massa": [
      "deslizamento_planar",
      "deslizamento_rotacional",
      "deslizamento_cunha",
      "rastejo",
      "corrida_massa_fluxo_detritos",
      "queda_rolamento_blocos"
    ],
    "processos_erosivos": [
      "erosao_laminar",
      "erosao_sulco",
      "ravina",
      "vocoroca"
    ],
    "recalque_subsidencia": [
      "subsidencia",
      "recalque_diferencial_solo"
    ]
  },
  "nivel_risco": "R1 | R2 | R3 | R4"
}
```

Ajuste os nomes de chave conforme a convenção já usada no restante do SIGERD (snake_case parece ser o padrão observado no formulário atual).

---

## 5. Critérios de aceite

- [ ] Checklist técnico exibe 12 itens, na ordem especificada, com os 2 itens divididos corretamente formatados
- [ ] Subtipos de risco aparecem agrupados em 3 blocos com cabeçalho de categoria visível
- [ ] Nenhum dos 7 itens removidos da lista de subtipos aparece mais na tela
- [ ] Nível de risco exibe nomenclatura R1–R4 junto ao rótulo textual
- [ ] Rótulo "MODERADO" foi substituído por "MÉDIO" em toda a interface (inclusive em relatórios/exports que referenciem esse campo)
- [ ] Estado/schema do formulário foi atualizado e testado para não quebrar vistorias já salvas com a estrutura antiga (considerar migração ou mapeamento retroativo dos campos antigos para os novos, se houver dados legados)
- [ ] Botão "Consolidar em Observações" continua funcionando e passa a incluir os novos itens do checklist no texto consolidado

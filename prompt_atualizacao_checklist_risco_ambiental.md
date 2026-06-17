# Prompt de Implementação — Atualização do Módulo "Risco e Detalhes" (Categoria Ambiental) — SIGERD

## Contexto

Você vai atualizar o formulário "Nova Vistoria" do SIGERD, especificamente a seção "Risco e Detalhes" quando a categoria selecionada for **Ambiental**. O objetivo é alinhar o checklist técnico e os subtipos de risco a uma lógica de indicador-de-defeito separado de conclusão-de-risco (seguindo a abordagem da NBR 16246-3 para risco arbóreo), eliminar sobreposição com a categoria Geológico/Geotécnico, e adicionar um sub-bloco estruturado de avaliação para os casos de risco arbóreo.

Mantenha o padrão visual e os componentes existentes (cards com radio/checkbox, botão "Consolidar em Observações", botões de nível de risco) já usados na categoria Geológico/Geotécnico.

---

## 1. Checklist Técnico — alterações

**Remover** o item "Há risco iminente de queda de árvore sobre benfeitorias" (entrega conclusão, não indicador) e **substituir** por indicadores de defeito específicos:

1. `Há inclinação excessiva do tronco ou desequilíbrio acentuado da copa`
2. `Existem cavidades, podridão ou sinais de fungos no tronco, base ou raízes`
3. `Há rachaduras, fendas ou fissuras no tronco ou em ramos estruturais`
4. `As raízes estão expostas, cortadas ou comprometidas por obra, calçada ou escavação`
5. `Há galhos secos, quebrados ou suspensos na copa (deadwood)`
6. `Foi identificado ataque de cupim, broca ou outra infestação`
7. `Há sinais de declínio fisiológico (copa rala, folhas amareladas, morte de ramos)`
8. `Há pessoas, veículos, edificações, rede elétrica ou via pública na possível trajetória de queda (alvo exposto)`

**Dividir** o item "Há queima de vegetação ou solo exposto em área de risco" em dois:

- `Há sinais de queimada ou incêndio recente na vegetação`
- `Há solo exposto sem cobertura vegetal, com risco de erosão`

**Manter sem alteração:**
- `Existem indícios de contaminação de fonte de água`
- `Foi detectado descarte irregular de resíduos perigosos`
- `A vegetação local está morta ou em processo de degradação`

O checklist final deve conter 13 itens. Manter obrigatoriedade e botão "Consolidar em Observações" inalterados.

---

## 2. Subtipos de Risco — reestruturação completa

Substituir a lista plana atual (12 itens) por **4 grupos**, com cabeçalho de subseção visível para cada bloco:

**Grupo 1 — Risco Arbóreo**
- Queda de Árvore Inteira (Tombamento)
- Queda de Galho ou Ramo
- Fratura ou Quebra de Tronco
- Desenraizamento / Falha Radicular
- Galhos em Conflito com Rede Elétrica ou Via Pública

**Grupo 2 — Incêndio e Queima**
- Incêndio Florestal
- Queimada Irregular

**Grupo 3 — Degradação e Poluição**
- Supressão Vegetal Irregular
- Contaminação do Solo
- Contaminação da Água
- Assoreamento Ambiental

**Grupo 4 — Fauna**
- Risco Associado à Fauna

**Remover da lista de subtipos:**
- `Queda de Árvore` e `Árvore com Risco de Queda` (estágios temporais do mesmo fenômeno, substituídos pelos modos de falha do Grupo 1)
- `Deslizamento em Área Verde` (é processo geotécnico, não ambiental — direcionar para a categoria Geológico/Geotécnico)
- `Erosão Ambiental` (sobreposição com erosão geotécnica — ver nota de critério de corte abaixo)

> **Nota de critério de corte (documentar no manual de uso do SIGERD, não apenas no código):** erosão com risco estrutural a pessoas/edificações deve ser cadastrada em Geológico/Geotécnico; degradação ecológica sem risco estrutural iminente (perda de cobertura vegetal, impacto em mata ciliar etc.) permanece em Ambiental, dentro do checklist técnico (item "solo exposto... risco de erosão"), sem precisar de subtipo próprio.

---

## 3. Sub-bloco condicional — Avaliação Arbórea Estruturada

Quando o subtipo selecionado pertencer ao **Grupo 1 (Risco Arbóreo)**, exibir um bloco adicional (mesmo padrão visual do checklist técnico), com os seguintes campos:

```json
{
  "avaliacao_arborea": {
    "parte_afetada": "tronco | raiz | copa_ramos | base",
    "porte_arvore": "pequeno | medio | grande",
    "frequencia_ocupacao_alvo": "ocasional | intermitente | frequente | constante"
  }
}
```

- `parte_afetada`: seleção única, cards no mesmo estilo dos demais campos de seleção.
- `porte_arvore`: seleção única (relevante para o cálculo de risco — peça maior caindo = consequência maior).
- `frequencia_ocupacao_alvo`: seleção única, baseado no conceito QTRA de exposição do alvo (ex.: árvore sobre trilha pouco usada vs. árvore sobre ponto de ônibus).

Este bloco não deve aparecer para os demais grupos de subtipo (Incêndio/Queima, Degradação/Poluição, Fauna).

---

## 4. Nível de Risco — manter consistência com a categoria Geológico/Geotécnico

Aplicar a mesma nomenclatura já implementada na categoria Geológico/Geotécnico:

- `R1 · BAIXO`
- `R2 · MÉDIO`
- `R3 · ALTO`
- `R4 · MUITO ALTO / IMINENTE`

Não citar a NBR 16246-3 como fonte da escala R1–R4 em nenhuma documentação ou tooltip — a escala original da norma de risco arbóreo é Baixo/Moderado/Alto/Extremo. A escala R1–R4 é mantida aqui apenas por consistência de relatório consolidado entre categorias do SIGERD, não como citação normativa direta.

---

## 5. Modelo de dados (schema)

```json
{
  "categoria_risco": "ambiental",
  "checklist_tecnico": {
    "inclinacao_tronco_desequilibrio_copa": "boolean",
    "cavidades_podridao_fungos": "boolean",
    "rachaduras_fendas_fissuras": "boolean",
    "raizes_expostas_cortadas_comprometidas": "boolean",
    "galhos_secos_quebrados_deadwood": "boolean",
    "ataque_cupim_broca_infestacao": "boolean",
    "declinio_fisiologico": "boolean",
    "alvo_exposto_trajetoria_queda": "boolean",
    "sinais_queimada_incendio_recente": "boolean",
    "solo_exposto_risco_erosao": "boolean",
    "indicios_contaminacao_fonte_agua": "boolean",
    "descarte_irregular_residuos_perigosos": "boolean",
    "vegetacao_morta_degradacao": "boolean"
  },
  "subtipos_risco": {
    "risco_arboreo": [
      "queda_arvore_inteira_tombamento",
      "queda_galho_ramo",
      "fratura_quebra_tronco",
      "desenraizamento_falha_radicular",
      "galhos_conflito_rede_eletrica_via_publica"
    ],
    "incendio_queima": [
      "incendio_florestal",
      "queimada_irregular"
    ],
    "degradacao_poluicao": [
      "supressao_vegetal_irregular",
      "contaminacao_solo",
      "contaminacao_agua",
      "assoreamento_ambiental"
    ],
    "fauna": [
      "risco_associado_fauna"
    ]
  },
  "avaliacao_arborea": {
    "parte_afetada": "tronco | raiz | copa_ramos | base",
    "porte_arvore": "pequeno | medio | grande",
    "frequencia_ocupacao_alvo": "ocasional | intermitente | frequente | constante"
  },
  "nivel_risco": "R1 | R2 | R3 | R4"
}
```

Ajuste os nomes de chave conforme a convenção já usada no restante do SIGERD (snake_case, como observado no formulário atual).

---

## 6. Critérios de aceite

- [ ] Checklist técnico exibe 13 itens, na ordem especificada, com os itens divididos/substituídos corretamente
- [ ] Subtipos de risco aparecem agrupados em 4 blocos com cabeçalho de categoria visível
- [ ] Nenhum dos 4 itens removidos (Queda de Árvore, Árvore com Risco de Queda, Deslizamento em Área Verde, Erosão Ambiental) aparece mais na tela
- [ ] Sub-bloco "Avaliação Arbórea" aparece apenas quando algum subtipo do Grupo 1 (Risco Arbóreo) é selecionado, e desaparece se o subtipo for desmarcado
- [ ] Nível de risco exibe nomenclatura R1–R4 junto ao rótulo textual, igual à categoria Geológico/Geotécnico
- [ ] Estado/schema do formulário foi atualizado e testado para não quebrar vistorias já salvas com a estrutura antiga (considerar migração ou mapeamento retroativo dos campos antigos, especialmente "Queda de Árvore" → mapear para "queda_arvore_inteira_tombamento" como valor padrão de migração)
- [ ] Botão "Consolidar em Observações" continua funcionando e passa a incluir os novos itens do checklist e do bloco de avaliação arbórea no texto consolidado
- [ ] Critério de corte entre erosão geotécnica (categoria Geológico/Geotécnico) e degradação ambiental (categoria Ambiental) está documentado no manual de uso do SIGERD

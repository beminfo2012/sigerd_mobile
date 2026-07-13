# Rotina de Funcionamento do Abrigo — SIGERD

## Fundamentação

A doutrina de administração de abrigos temporários (manuais de Defesa Civil
estadual/nacional, ex. SEDEC-RJ e Manual de Instalação de Abrigos
Temporários) trata a "rotina do abrigo" como capítulo próprio e obrigatório:
todo abrigo precisa de horários fixos definidos para cada atividade —
abertura/fechamento, refeições, higiene, descanso, saúde (ex.: lactário a
cada poucas horas), recreação e, quando aplicável, assistência religiosa —
além de regras de convivência claras, válidas para todos e afixadas em
local de fácil visibilidade. A rotina deve ser ajustada ao contexto cultural
da comunidade abrigada, não apenas copiada de um modelo genérico. O curso
oficial da Defesa Civil Nacional ("Administração de Abrigos Temporários")
trata isso como módulo específico de recursos humanos e rotina.

## O que foi implementado

1. **Catálogo padrão** (`catalogo_rotina_padrao_abrigo`) — o modelo sugerido
   pela doutrina (alvorada, café da manhã, lactário a cada 3h, espaço
   recreativo, almoço, jantar, fechamento do abrigo, limpeza, banho etc.),
   único no SIGERD. Serve como ponto de partida — nunca é obrigatório.
2. **Rotina real de cada abrigo** (`abrigo_rotina_item`) — copiada do
   catálogo com "Aplicar Modelo Padrão" e depois livremente editada
   (horários, dias da semana, responsável) para refletir o contexto local
   daquele abrigo específico (escola, quadra, igreja).
3. **Execução diária** (`abrigo_rotina_execucao`) — checklist do dia: cada
   item pode ser marcado como cumprido ou não cumprido, com usuário e
   horário da confirmação. Isso vira evidência auditável (relevante para
   TCE-ES) e, se o abrigo estiver vinculado a uma Operação de Assistência
   Humanitária ativa (ver módulo entregue anteriormente), a confirmação
   também aparece automaticamente no Diário Operacional daquela operação —
   sem nenhuma seleção manual do operador.
4. **Regras de convivência** (`abrigo_regra_convivencia` +
   `catalogo_regra_convivencia_padrao`) — lista de regras claras (proibição
   de álcool/armas, ponto único de acesso, horário de silêncio etc.),
   também com modelo padrão aplicável e editável.
5. **Mural para impressão** (`GET /abrigos/{id}/rotina/mural-impressao`) —
   gera um PDF único com a grade de horários e as regras de convivência,
   pronto para ser impresso e afixado em local visível do abrigo, conforme
   a doutrina exige.

## Arquivos entregues

```
backend/
  migrations/003_rotina_abrigo.sql             -- schema + seed (catálogo + regras padrão)
  models/rotina_abrigo.py                      -- SQLAlchemy
  schemas/rotina_abrigo.py                     -- Pydantic
  services/rotina_abrigo_service.py            -- CRUD, execução diária, geração do mural
  services/_adendo_operacao_context.py         -- helper síncrono a somar ao módulo de Operações
  api/routes_rotina_abrigo.py                  -- endpoints REST
frontend/
  RotinaAbrigo.jsx                             -- card com grade horária, checklist e regras
```

## Integração com os módulos já entregues

- **Planta baixa**: o campo `local_referencia`/observação de cada item de
  rotina pode citar o identificador da planta (ex.: "Refeitório — ver
  planta baixa") para dar contexto de onde a atividade acontece.
- **Operação de Assistência Humanitária**: a confirmação diária de um item
  de rotina, quando há operação ativa no município, gera automaticamente
  uma entrada no Diário Operacional — reaproveitando a função
  `registrar_diario` já existente, sem duplicar lógica.

## Pontos que você vai precisar adaptar

- Permissão `abrigo.gerenciar_rotina` — criar no seu sistema de permissões,
  igual às demais já usadas no módulo.
- O catálogo padrão (seed da migração) é um ponto de partida — vale revisar
  com a CEPDEC-ES qual doutrina/manual específico o SIGERD deve seguir como
  referência oficial, para ajustar nomenclatura e horários sugeridos.
- `get_operacao_id_ativo_sync` deve ser adicionado ao arquivo
  `operacao_context.py` já entregue anteriormente (ver
  `_adendo_operacao_context.py` para o snippet exato).

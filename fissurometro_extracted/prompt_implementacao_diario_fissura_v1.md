# Prompt de Implementação — Diário de Abertura V1

> Uso sugerido: colar este prompt no Claude Code (ou repassar a um desenvolvedor) junto com o arquivo `diario_fissura_v1_implementacao.md` já produzido, dentro do repositório do SIGERD.

---

## Contexto

Você está implementando um novo módulo no SIGERD, sistema de gestão de risco e defesa civil já em produção (stack: FastAPI + SQLAlchemy + PostgreSQL 15 + React 18 + Vite + Tailwind + MinIO, multi-tenant via Row-Level Security, PWA offline-first com IndexedDB outbox).

**Antes de escrever qualquer código**, explore o repositório e localize como o módulo de Vistoria (ou outro módulo que já lida com upload de fotos) está estruturado — models, schemas, routers, componentes React, convenção de nomes de FK (`usuario`, `imovel`, `vistoria`, `nopper` etc.). Siga exatamente essas convenções já em uso. Não introduza um estilo novo de organização de pastas ou nomenclatura.

Leia o arquivo `diario_fissura_v1_implementacao.md` (especificação completa já aprovada) antes de começar — ele contém o modelo de dados, os endpoints, o serviço de classificação e o componente de referência.

**Nota terminológica importante**: fissura, trinca e rachadura são patologias distintas (diferenciadas pela largura da abertura, não sinônimos). O módulo e as tabelas chamam-se "abertura" (`abertura_patologica`, `abertura_registro_fotografico`) — genérico — e não "fissura". A classificação correta (fissura/trinca/rachadura/fenda/brecha) é sempre calculada pelo sistema a partir da largura medida, nunca assumida pelo nome do módulo nem digitada livremente.

## Objetivo

Implementar o módulo "Diário de Abertura" — captura fotográfica padronizada de aberturas patológicas estruturais, com medição validada por humano e classificação automática da patologia. Esta é a **fase V1: captura + medição manual + classificação**.

## Regras não-negociáveis (já vigentes no SIGERD — aplicam-se aqui sem exceção)

1. Toda tabela nova usa Row-Level Security por `tenant_id`, seguindo o padrão já implementado no restante do sistema.
2. `data_hora` e geolocalização **nunca** são gravados sem fonte real verificável (EXIF da foto ou GPS do dispositivo) — mesma regra já aplicada no módulo de fotos de Vistoria. Nunca gerar esses valores artificialmente ou usar `datetime.now()` do servidor como substituto.
3. A foto original enviada **nunca** é alterada, sobrescrita ou reprocessada in-place. É armazenada no MinIO como recebida, com hash SHA-256 calculado no momento do upload.
4. Nenhuma medição em milímetros vira dado oficial sem `validado_por` e `validado_em` preenchidos por uma ação humana explícita. Nunca grave uma medição como definitiva automaticamente, mesmo que venha de um campo pré-preenchido.
5. **A classificação da patologia (`classificacao_patologia`) é sempre calculada pelo backend a partir da largura validada**, usando a tabela de referência IBAPE-MG (`services/classificacao_patologia.py` na spec) — nunca um campo de texto livre digitado pelo agente, e nunca inferida do nome do módulo.
6. A classificação é **descritiva**, não um veredito de risco. Qualquer lugar do sistema que exiba `classificacao_patologia` deve exibir junto a ressalva: essa classificação não define, por si só, o grau de risco — requer diagnóstico de origem e monitoramento de atividade.
7. Toda mudança é aditiva: não altere nenhuma tabela, endpoint ou componente já existente de Vistoria, NOPRER ou do motor de sugestão de risco.

## Escopo da tarefa

1. **Banco de dados** — criar as tabelas `abertura_patologica` e `abertura_registro_fotografico` conforme o modelo SQLAlchemy da especificação, incluindo os campos `classificacao_patologia` e `fonte_classificacao`. Confirmar nomes reais de FK consultando os models existentes antes de criar as referências. Gerar a migration (Alembic ou equivalente já usado no projeto).
2. **Serviço de classificação** — implementar `classificar_abertura(largura_mm)` conforme a tabela IBAPE-MG da especificação, isolado em módulo próprio (não espalhar os limiares pelo código de negócio), para permitir troca de norma no futuro sem reescrever lógica.
3. **Schemas Pydantic** — `AberturaCreate`/`AberturaOut`, `RegistroFotograficoCreate`/`RegistroFotograficoOut`, `ValidarMedicaoInput`.
4. **Endpoints FastAPI** (`routers/abertura.py`):
   - `POST /aberturas/` — criar ponto de abertura
   - `POST /aberturas/{abertura_id}/registros` — upload de foto + metadados (hash, fonte de data/hora, fonte de geo)
   - `PATCH /aberturas/registros/{registro_id}/medicao` — único endpoint que grava medição oficial; sempre chama o serviço de classificação e grava `classificacao_patologia` + `fonte_classificacao = "IBAPE-MG"` junto
   - `GET /aberturas/{abertura_id}/registros` — lista cronológica, sem cálculo de tendência
5. **Frontend** — componente `AberturaRegistro.jsx` (React + Tailwind): abas "Foto original"/"Versão anotada", metadados abaixo da foto, campo de medição em mm + botão de confirmação, selo de classificação com a ressalva de risco, exibição de quem validou e quando.
6. **Integração com Vistoria** — nova seção "Aberturas Monitoradas" na tela de detalhe do imóvel/vistoria já existente, listando pontos (com sua classificação atual) e permitindo criar um novo. Sem alterar a estrutura de dados da Vistoria — apenas uma nova consulta/seção de exibição.

## Fora de escopo — não implementar, não deixar TODO para isso agora

- Gráfico de evolução da abertura
- Cálculo de taxa de crescimento (mm/mês)
- Alerta automático de limiar excedido ou de mudança de classificação (ex.: trinca → rachadura)
- Geração automática de nova vistoria/NOPRER a partir de qualquer alerta
- Pipeline de visão computacional (detecção automática do marcador/medição) — o campo `metodo_medicao` já reserva espaço para isso, mas não implemente a lógica agora
- Suporte a outras normas de classificação além de IBAPE-MG (deixar `fonte_classificacao` como campo pronto para isso, mas não construir seletor de norma agora)

## Critérios de aceite

- [ ] Migration roda limpo em ambiente local, sem afetar tabelas existentes
- [ ] Upload de foto grava hash e preserva o arquivo original sem qualquer reprocessamento visual
- [ ] Acesso/gravação com tenant incorreto falha por RLS (testar com dois tenants)
- [ ] Endpoint de medição rejeita gravação sem usuário autenticado associado
- [ ] Endpoint de medição sempre grava `classificacao_patologia` e `fonte_classificacao` coerentes com a largura informada (testar os 5 limiares: 0,4mm→fissura, 0,8mm→trinca, 3,0mm→rachadura, 7,0mm→fenda, 12,0mm→brecha)
- [ ] Componente React exibe o selo de classificação com a ressalva de risco sempre visível, nunca oculta
- [ ] Componente React renderiza corretamente com dado mockado, sem qualquer dependência de biblioteca de gráfico
- [ ] Nenhum arquivo de Vistoria, NOPRER ou motor de risco foi alterado
- [ ] Nenhuma tabela de alerta, série histórica ou taxa de crescimento foi criada nesta fase

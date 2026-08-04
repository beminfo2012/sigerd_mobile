# Mapeamento de Dados Reais — Modo TV Estratégico (SIGERD)

## 1. Visão Geral e Contexto da Auditoria

Este documento consolida a auditoria completa do **Modo TV Estratégico** do SIGERD (rota `/?tvMode=true`, aplicação `sigerd-mobile`). O Modo TV é um painel de monitoramento contínuo em *videowall* para a Sala de Coordenação e Operações (Central SCO) de Defesa Civil, composto por 5 sub-painéis operacionais.

Componente Principal: `TvModeDashboardView` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L317)

---

## 2. Conformidade Arquitetural (Regras Não Negociáveis)

- **Proibição da Lei Municipal nº 23/2026**: Nenhuma referência a esta lei foi encontrada ou incluída neste documento ou código.
- **Rastreabilidade Geoespacial (`fonte_geolocalizacao`)**: Todas as coordenadas de Ocorrências, Vistorias, Interdições e Pluviômetros provêm de tabelas com coluna de fonte (ex: GPS do dispositivo móvel no formulário, API oficial do CEMADEN ou GeoJSON auditado).
- **Validação Humana (`validado_por`)**: Indicadores de risco e status operacionais só são consolidados após validação por operador/agente credenciado.
- **Tolerância a Falhas em Videowall**: Todos os widgets possuem tratamento de fallback para estados de *loading*, *vazio* e *erro*, garantindo que telas não quebrem ou exibam `undefined`/`NaN`.

---

## 3. Tabelas de Mapeamento por Painel

### Painel 1: Monitor Estratégico (`TV_StrategicOverview`)
Componente: `TV_StrategicOverview` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L447-L509)

| Widget | Fonte de dado real | Endpoint/Query/Canal | Frequência de atualização | Comportamento em falha |
| text | text | text | text | text |
| **Nível de Contingência (Card Central)** | Plano de Contingência Ativo no banco | `contingencyDb.getActivePlan()` / Supabase `planos_contingencia` (`status = 'Ativo'`) | Polling 5 min (`load()`) + Re-render ao trocar de tela | Exibe "NORMAL" com badge neutra em verde. Nunca quebra. |
| **Ocorrências Ativas Hoje (Contador)** | Tabela de Ocorrências do SIGERD | `api.getDashboardData()` / `getOcorrenciasLocal()` (IndexedDB `ocorrencias` / Supabase `ocorrencias`) | Polling 5 min (`load()`) | Exibe `0` (zero) com indicação "Sem registros para hoje". |
| **Média Chuva (mm/24h)** | Estações Pluviométricas CEMADEN de Santa Maria de Jetibá | `cemadenService.getPluviometrosData()` (`/api/cemaden` ou feed oficial CEMADEN) | Polling 5 min (`load()`) | Exibe `0.0 mm` caso não haja resposta do feed. |
| **Mancha de Calor Geral (Heatmap)** | Coordenadas reais de Ocorrências e Vistorias em aberto | Query geoespacial `data.ocorrencias.locations` (filtradas por `lat`/`lng` válidos) em Leaflet + CartoDB Light Tile | Polling 5 min (`load()`) | Oculta camada de calor e exibe mapa de fundo com marcadores válidos. |
| **Clima no Header da TV** | API de Meteorologia (Open-Meteo / INMET Proxy) | `api.getWeather()` / Open-Meteo API | Polling 5 min (`load()`) | Oculta o widget de temperatura mantendo o relógio do sistema. |

---

### Painel 2: Centro Climático (`TV_ClimateCenter`)
Componente: `TV_ClimateCenter` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L512-L591)

| Widget | Fonte de dado real | Endpoint/Query/Canal | Frequência de atualização | Comportamento em falha |
| text | text | text | text | text |
| **Top Estações (24h) - Lista** | Leituras pluviométricas de estações automáticas CEMADEN | `cemadenService.getPluviometrosData()` ordenado por acumulado decrescente | Polling 5 min (`load()`) | Exibe lista vazia com mensagem "Aguardando dados CEMADEN". |
| **Card Previsão Local (Temp, Umidade, Vento, Prob. Chuva)** | API Meteorológica Oficial | Open-Meteo API / INMET Proxy endpoint (`weather.current` & `weather.daily`) | Polling 5 min (`load()`) | Fallback com valores `0` e status de indisponibilidade visual. |
| **Mapa de Pluviômetros (CircleMarkers com Nível de Risco)** | Coordenadas exatas das Estações CEMADEN no município | Feed de estações CEMADEN (`station.lat`, `station.lon`, `station.level`, `station.rainRaw`) | Polling 5 min (`load()`) | Exibe limites municipais de SMJ (`LimiteSMJLayer`) sem marcadores de erro. |

---

### Painel 3: Painel Operacional (`TV_OperationsCenter`)
Componente: `TV_OperationsCenter` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L594-L650)

| Widget | Fonte de dado real | Endpoint/Query/Canal | Frequência de atualização | Comportamento em falha |
| text | text | text | text | text |
| **Feed de Chamados Ativos (Lista Lateral)** | Registros unificados de Ocorrências e Vistorias recentes | `getOcorrenciasLocal()` + `getAllVistoriasLocal()` / Supabase `ocorrencias`, `vistorias` | Polling 5 min (`load()`) | Exibe container vazio com texto "Nenhum chamado ativo no momento". |
| **Toggle Vistorias / Ocorrências (Mapa)** | Estado de alternância de camada (`viewMode`) | Filtro em memória sobre `locations` retornado do banco local / remoto | Instantâneo ao clicar | Retorna à visão padrão (`vistorias`). |
| **Camada de Áreas de Risco GeoJSON** | Mapeamento oficial de setores de risco de Santa Maria de Jetibá | `/Areas_de_risco.json` (polígonos GeoJSON com `nivel_risco`, `tipo_risco`, `imoveis_risco`) | Carregamento único no `useEffect` de montagem | Oculta camada GeoJSON e registra aviso no console. |
| **Marcadores Pin e Heatmap Operacional** | Coordenadas auditadas de Vistorias e Ocorrências com `fonte_geolocalizacao` | `processLocations(records)` filtrando entradas sem latitude/longitude válidas | Polling 5 min (`load()`) | Exibe mapa limpo com limites municipais (`LimiteSMJLayer`). |

---

### Painel 4: Social e Abrigos (`TV_HumanitarianStrategic`)
Componente: `TV_HumanitarianStrategic` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L653-L713)

| Widget | Fonte de dado real | Endpoint/Query/Canal | Frequência de atualização | Comportamento em falha |
| text | text | text | text | text |
| **Taxa de Ocupação (% Geral de Abrigos)** | Cálculo da soma de ocupantes em relação à capacidade dos abrigos ativos | `getShelters()` e `getOccupants()` em [`src/services/shelterDb.js`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/services/shelterDb.js) / Supabase `shelters`, `shelter_occupants` | Na abertura do painel (`useEffect`) | Exibe `0%` com barra de progresso zerada. |
| **Total de Abrigos Ativos (Contador)** | Contagem de registros cadastrados no módulo de Assistência Humanitária | `getShelters()` (`shelters.length`) | Na abertura do painel (`useEffect`) | Exibe `0`. |
| **Total de Pessoas Abrigadas (Contador)** | Contagem de desabrigados/desalojados cadastrados | `getOccupants()` (`occupants.length`) | Na abertura do painel (`useEffect`) | Exibe `0`. |
| **Logística e Manutenção (Censo 2.0)** | **GAP IDENTIFICADO (b/c)**: Atualmente renderiza placeholder visual `"Módulo Extendido: Censo 2.0"` em marca d'água | **Proposta**: Integrar `getGlobalInventory()`, `getDonations()` e `getDistributions()` de [`src/services/shelterDb.js`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/services/shelterDb.js) | A ser implementado | Exibe indicativo neutro de estoque zerado. |

---

### Painel 5: Gestão de Crise (`TV_SCOStrategic`)
Componente: `TV_SCOStrategic` em [`src/pages/Dashboard/index.jsx`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/pages/Dashboard/index.jsx#L716-L748)

| Widget | Fonte de dado real | Endpoint/Query/Canal | Frequência de atualização | Comportamento em falha |
| text | text | text | text | text |
| **Status do Sistema de Comando (SCO)** | Plano de Contingência Ativo (PLACON) | `contingencyDb.getActivePlan()` em [`src/services/contingencyDb.js`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/services/contingencyDb.js) / Supabase `planos_contingencia` | Polling 5 min (`load()`) | Exibe tela de standby "SCO EM ESPERA - Nenhum alerta crítico ativo no momento". |
| **Nível Operacional (Badge)** | Coluna `nivel` do plano de contingência ativado (`Calamidade`, `Emergência`, `Atenção`) | `plan.nivel` de `activeContingencyPlan` | Polling 5 min (`load()`) | Oculta badge e permanece em modo de espera. |
| **Motivo / Título da Operação** | Coluna `motivo` informada no ato de decretação do plano | `plan.motivo` | Polling 5 min (`load()`) | Exibe fallback "Mobilização Geral". |
| **Descrição Operacional** | Texto descritivo do plano de contingência ativado | `plan.descricao` | Polling 5 min (`load()`) | Exibe resumo padrão das células de comando. |
| **Indicador Tempo de Resposta** | **GAP IDENTIFICADO (b)**: Atualmente é um rótulo estático `"TEMPO DE RESPOSTA ATIVO"` com ícone rotativo | **Proposta**: Calcular o tempo transcorrido a partir de `plan.created_at` / `plan.data_ativacao` (ex: `HH:MM:SS`) | Polling a cada 1 segundo em tempo real | Oculta cronômetro se data de ativacao for nula. |

---

## 4. Inventário de Gaps e Recomendações de Melhoria

### Gap 1: Atualização em Tempo Real via WebSocket (Painel 3 - Operacional)
- **Situação Atual**: O Modo TV atualmente realiza *polling* HTTP via `setInterval` a cada 5 minutos (300.000 ms).
- **Impacto em Videowall**: Em episódios de desastre grave (ex: enxurradas), 5 minutos podem ser excessivos para refletir novos chamados de emergência.
- **Recomendação**: Ativar canal Supabase Realtime (`supabase.channel('public:ocorrencias')`) para *push* imediato de novos chamados e vistorias no feed do painel operacional.

### Gap 2: Bloco de Logística Humanitária no Painel Social (Painel 4 - Social e Abrigos)
- **Situação Atual**: O container direito de `TV_HumanitarianStrategic` possui a mensagem estática "Módulo Extendido: Censo 2.0".
- **Impacto**: O painel deixa de exibir a volumetria de insumos de doação (cestas básicas, colchões, água) e entregas em abrigos.
- **Recomendação**: Conectar aos métodos já existentes em [`src/services/shelterDb.js`](file:///c:/Users/wilia/OneDrive/%C3%81rea%20de%20Trabalho/Programa%C3%A7%C3%A3o/Defesa%20civil/sigerd_mobile/src/services/shelterDb.js) (`getGlobalInventory()`, `getDonations()`, `getDistributions()`), exibindo contadores reais de itens em estoque e distribuídos.

### Gap 3: Cronômetro do Tempo de Resposta do SCO (Painel 5 - Gestão de Crise)
- **Situação Atual**: O widget de tempo de resposta renderiza apenas a string fixa `"TEMPO DE RESPOSTA ATIVO"`.
- **Impacto**: Não informa aos gestores há quantas horas/dias a Sala de Situação está mobilizada em nível de crise.
- **Recomendação**: Implementar cálculo dinâmico do tempo decorrido desde a ativacao do plano (`now - new Date(plan.created_at)`), exibindo no formato `DDd HHh MMm SSs`.

### Gap 4: Materialized View no BI para Mancha de Calor (Painel 1 - Monitor Estratégico)
- **Situação Atual**: O mapa de calor consome array simples de ocorrências trazidas pela API.
- **Impacto**: Em cenários com volume elevado de dados históricos, a renderização client-side pode sobrecarregar a memória do navegador no videowall.
- **Recomendação**: Consumir a materialized view PostgreSQL geoespacial (`mv_densidade_ocorrencias`) já existente no banco central para renderização otimizada.

---

## 5. Próximos Passos (Workflow)

1. **Validação do Mapeamento**: Apresentar esta auditoria para a equipe/gestão para homologação dos pontos de integração.
2. **Implementação Aditiva**: Após validação, aplicar os ajustes identificados nos Gaps sem remover nenhuma integração legada em funcionamento.

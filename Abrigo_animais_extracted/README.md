# Registro, Controle e Encaminhamento de Animais de Estimação — SIGERD

## Por que isso importa

É prática consolidada na gestão de abrigos de desastre que pessoas abrigadas
cheguem acompanhadas de animais de estimação. Por questões sanitárias e de
convivência, o alojamento humano normalmente precisa ficar separado do
alojamento animal — mas essa separação não pode significar perda de vínculo
ou de rastreabilidade: o tutor precisa saber onde o animal está, poder
visitá-lo, e o animal precisa estar o mais próximo fisicamente possível do
tutor (ideal para reduzir estresse do animal e viabilizar visitas
frequentes), seja numa área dedicada dentro do próprio abrigo, seja num
canil/gatil municipal, CCZ ou ONG parceira.

## Como o sistema resolve isso

1. **Cadastro do animal** — vinculado obrigatoriamente a um tutor já
   registrado como pessoa abrigada, com dados relevantes de saúde (vacina
   antirrábica, castração, condição de saúde) e temperamento — informação
   que ajuda a decidir o melhor ponto de apoio (ex.: animal reativo talvez
   não deva dividir espaço com outros).
2. **Pontos de apoio animal** (`ponto_apoio_animal`) — cadastro dos locais
   possíveis de encaminhamento, cada um com coordenadas geográficas e
   capacidade. Pode ser a própria área animal dentro do abrigo humano (a
   mesma `area_animais` já prevista no catálogo de doutrina da planta
   baixa) ou uma estrutura externa.
3. **Sugestão por proximidade (opcional)** — ao encaminhar um animal, o
   sistema tenta calcular a distância (Haversine) entre o endereço de
   origem do tutor (ou o abrigo, como aproximação) e cada ponto de apoio
   ativo com vaga, listando do mais próximo ao mais distante. Essa
   ordenação nunca é obrigatória: o operador pode marcar "Ignorar
   proximidade com o tutor" a qualquer momento para listar todos os
   pontos com vaga sem nenhum cálculo de distância (útil quando o
   endereço do tutor não foi geocodificado, quando a urgência não deixa
   tempo para isso, ou quando o operador simplesmente prefere escolher
   livremente). O mesmo acontece automaticamente, mesmo sem marcar nada,
   sempre que não há coordenada disponível nem do tutor nem do abrigo —
   o sistema nunca bloqueia o encaminhamento por falta dessa informação,
   apenas deixa de ordenar por distância e avisa isso na tela.
4. **Encaminhamento e rastreamento** — cada encaminhamento vira um registro
   com status (`encaminhado` → `no_local` → `devolvido_ao_tutor`, ou
   `óbito` em caso de fatalidade), preservando o histórico completo mesmo
   em caso de transferência entre pontos de apoio.

## Arquivos entregues

```
backend/
  migrations/004_animais_abrigo.sql   -- schema (pontos de apoio, animal, encaminhamento)
  models/animal_abrigo.py             -- SQLAlchemy
  schemas/animal_abrigo.py            -- Pydantic
  services/animal_abrigo_service.py   -- cadastro, distância (Haversine), encaminhamento
  api/routes_animal_abrigo.py         -- endpoints REST
frontend/
  AnimaisAbrigo.jsx                   -- card com lista, cadastro e encaminhamento
```

## Pontos que você vai precisar adaptar

- `pessoas_abrigadas` — a migração assume que essa tabela já existe (o
  cadastro de abrigados visto na tela) e que ela tem (ou vai ganhar)
  colunas de coordenadas do endereço residencial de origem
  (`endereco_latitude`/`endereco_longitude`) — é isso que permite calcular
  "próximo ao endereço do tutor" de verdade, e não apenas próximo do
  abrigo. Se essas colunas ainda não existem no cadastro de pessoas, vale
  uma pequena migração complementar.
- `abrigos.latitude`/`abrigos.longitude` — usados como fallback quando o
  endereço do tutor não tiver coordenadas; confirme se já existem no seu
  schema atual de abrigos (prováveis, já que a tela mostra endereço).
- Permissão `abrigo.gerenciar_animais` — criar no seu sistema de
  permissões, no mesmo padrão das demais já usadas no módulo.
- O componente React assume que o campo "Tutor" será preenchido a partir
  de um seletor/autocomplete da lista de pessoas já abrigadas naquele
  abrigo (o input de texto no cadastro é só um placeholder — vale plugar
  no componente de busca de abrigados que o SIGERD já deve ter).
- Geocodificação do endereço residencial do tutor no momento do cadastro
  da pessoa abrigada (para obter latitude/longitude) pode usar o mesmo
  provedor já usado em outros pontos do SIGERD (ex. Nominatim/Google
  Geocoding), fora do escopo desta entrega.

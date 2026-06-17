# Módulo Voluntários — SIGERD

## 1. Objetivo do módulo

Constituir, dentro do SIGERD, um banco vivo de voluntários cadastrados por área de atuação, com disponibilidade atualizada, pronto para ser consultado e acionado pela Defesa Civil em situações de emergência, desastre ou apoio operacional (vistorias, ações humanitárias, campanhas preventivas). O módulo deve permitir localizar rapidamente "quem pode ajudar, em que, e onde está", substituindo listas manuais ou contatos dispersos por um cadastro único, filtrável e auditável.

O módulo se integra à mesma lógica dos demais módulos do SIGERD (REDAP, Assistência Humanitária, SIGERD Mobile), funcionando como camada de apoio que pode ser acionada a partir de ocorrências registradas em outros módulos.

## 2. Submódulos propostos

Seguindo o padrão de organização já adotado na Assistência Humanitária, sugiro estruturar o módulo Voluntários em seis submódulos:

1. **Cadastro de Voluntários** — ficha individual completa
2. **Banco de Habilidades e Especialidades** — taxonomia de áreas de atuação
3. **Disponibilidade e Escala** — controle de quando e onde cada voluntário pode atuar
4. **Acionamento e Convocação** — disparo, aceite/recusa, rastreamento de resposta
5. **Registro de Atuação (Missões)** — histórico de cada acionamento e horas trabalhadas
6. **Treinamento e Certificações** — capacitações realizadas, validade, recertificações

## 3. Submódulo 1 — Cadastro de Voluntários

Campos sugeridos para a ficha do voluntário:

- Dados pessoais: nome completo, CPF, RG, data de nascimento, foto
- Contato: telefone/WhatsApp, e-mail, contato de emergência
- Endereço: logradouro, bairro/região (relevante para acionamento por proximidade)
- Vínculo: voluntário independente, membro de NUDEC, servidor público, profissional liberal, entidade parceira (ONG, igreja, associação)
- Área(s) de atuação (múltipla escolha, ver submódulo 2)
- Nível de experiência por área (básico / intermediário / avançado / profissional habilitado)
- Possui veículo próprio (tipo) / possui equipamentos próprios (quais)
- Restrições (ex.: não pode atuar em altura, não dirige à noite)
- Status do cadastro: ativo, inativo, suspenso, em análise
- Documento de Termo de Adesão e Responsabilidade assinado (sim/não, data, arquivo)
- Histórico resumido de participações (referência ao submódulo 5)

## 4. Submódulo 2 — Banco de Habilidades e Especialidades

Taxonomia inicial de áreas (cada voluntário pode pertencer a mais de uma):

- Resgate e salvamento
- Atendimento pré-hospitalar / saúde (enfermagem, socorrismo, medicina)
- Psicologia e assistência social
- Engenharia, construção civil e operação de máquinas pesadas
- Eletricidade e manutenção predial
- Logística, transporte e condução de veículos
- Comunicação (rádioamadores, redes sociais, TI)
- Operação de drone
- Combate a incêndio (bombeiro civil)
- Cozinha e preparo de alimentação emergencial
- Tradução e Libras
- Manejo e resgate de animais
- Apoio administrativo e digitação de cadastros
- Mergulho / operações em ambiente aquático

Essa taxonomia deve ser cadastrável e editável pelo administrador, para crescer conforme novos perfis aparecerem.

## 5. Submódulo 3 — Disponibilidade e Escala

- Calendário de disponibilidade (dias da semana / horários / período específico, ex. "disponível só em finais de semana")
- Disponibilidade para deslocamento (raio de atuação: só no bairro, no município, região)
- Indicador de disponibilidade em tempo real: disponível agora / em missão / indisponível temporariamente / afastado
- Bloqueios programados (viagem, licença, indisponibilidade médica)

## 6. Submódulo 4 — Acionamento e Convocação

Fluxo sugerido:

1. **Gatilho**: uma ocorrência registrada no REDAP, um alerta meteorológico (integração com o monitoramento INMET já existente) ou uma necessidade manual identificada pela COMPDEC gera a demanda por voluntários de determinado perfil.
2. **Filtro automático**: o sistema cruza área de atuação + disponibilidade + proximidade geográfica e gera uma lista de candidatos.
3. **Disparo de notificação**: envio via WhatsApp (reaproveitando a integração Evolution API já usada em outras automações do SIGERD) e/ou push no SIGERD Mobile.
4. **Resposta do voluntário**: aceitar, recusar ou não responder (com tempo limite configurável e escalonamento automático para o próximo da lista).
5. **Check-in**: registro de chegada ao local (pode usar geolocalização do app).
6. **Execução e check-out**: marcação de início/fim da atuação.
7. **Avaliação pós-missão**: breve retorno do coordenador sobre o desempenho, alimentando o histórico do voluntário.

## 7. Submódulo 5 — Registro de Atuação (Missões)

Para cada acionamento, registrar:

- Ocorrência/missão vinculada (referência ao REDAP ou Assistência Humanitária, quando aplicável)
- Voluntários convocados, quem aceitou, quem atuou de fato
- Data, horário de início e fim, horas totais
- Atividade realizada e observações do coordenador
- Evidências (fotos, relatório breve)

Esse histórico alimenta tanto o currículo interno do voluntário quanto eventuais certificados de participação.

## 8. Submódulo 6 — Treinamento e Certificações

- Capacitações realizadas (curso, data, carga horária, instituição)
- Validade da certificação (quando aplicável) e alerta de vencimento
- Upload de certificado/diploma
- Vínculo entre certificação e liberação para áreas de atuação mais técnicas (ex.: só aciona como "socorrista" quem tiver certificação válida)

## 9. Perfis de acesso sugeridos

- **Administrador (COMPDEC)**: cadastra, edita, aciona, gera relatórios
- **Coordenador de área/missão**: visualiza e aciona voluntários da sua especialidade, registra atuação
- **Voluntário**: acessa e atualiza seu próprio cadastro, disponibilidade e histórico; recebe e responde acionamentos

## 10. Aspectos legais e administrativos

- O cadastro deve prever a assinatura do **Termo de Adesão e Responsabilidade**, alinhado à Lei nº 9.608/1998 (Lei do Voluntariado), deixando claro que não há vínculo empregatício.
- Recomenda-se prever campo para registro de cobertura de seguro de acidentes pessoais durante as atuações, quando houver.
- O módulo pode servir de base para a formalização ou fortalecimento de NUDECs (Núcleos Comunitários de Defesa Civil) no município, vinculando voluntários cadastrados a núcleos por bairro/região.
- O histórico de horas e atuações permite emissão de certificado de participação, útil tanto para reconhecimento do voluntário quanto para prestação de contas da COMPDEC.

## 11. Esboço de modelo de dados (tabelas principais)

- `voluntarios` (dados cadastrais e status)
- `areas_atuacao` (taxonomia de especialidades)
- `voluntario_area` (relação N:N voluntário × área, com nível de experiência)
- `disponibilidade` (janelas de disponibilidade por voluntário)
- `acionamentos` (cada convocação disparada, vinculada a uma ocorrência)
- `acionamento_resposta` (resposta de cada voluntário convocado: aceite/recusa/horário)
- `missoes` (registro consolidado de atuação efetiva)
- `certificacoes` (capacitações e validade)
- `termos_adesao` (controle de assinatura do termo)

## 12. Integrações com outros módulos do SIGERD

- **REDAP**: ocorrências registradas podem gerar automaticamente uma solicitação de voluntários de determinado perfil
- **Assistência Humanitária**: voluntários de logística/cozinha/apoio podem ser acionados diretamente para ações de doação e abrigo
- **Alerta Jetibá / monitoramento INMET**: alertas de risco elevado podem disparar um "pré-aviso" automático a voluntários da região afetada, antes mesmo de uma ocorrência formal
- **SIGERD Mobile**: app do voluntário para receber acionamentos, confirmar presença e fazer check-in/check-out em campo

---

Essa estrutura pode evoluir para um Termo de Referência técnico, um diagrama de fluxo do acionamento, ou o schema de banco de dados detalhado (SQL), dependendo do nível de aprofundamento que você quiser dar a seguir.

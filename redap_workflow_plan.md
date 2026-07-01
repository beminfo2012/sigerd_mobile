# Plano de Implementação: Reestruturação do Fluxo REDAP

## Visão Geral
Substituição da lógica de etapas do REDAP por um fluxo linear de 5 fases, incluindo uma bifurcação de encerramento sem decretação. Inclui também a classificação obrigatória de nível de intensidade (I, II, III) vinculada às modalidades (SE, ECP) conforme Portaria MDR 260/2022.

## Etapa 1: Banco de Dados e Modelo de Dados
1. Atualizar a tabela `eventos_desastre`:
   - Atualizar o ENUM de `status_geral`.
   - Adicionar a coluna `nivel_intensidade_final` (NIVEL_I, NIVEL_II, NIVEL_III).
2. Reescrever a tabela `redap_fluxo_aprovacao`:
   - Adicionar colunas `fase`, `nome_fase`, `responsavel_papel`, `responsavel_usuario_id`, `status`, `decisao_registrada` (json).
3. Criar a tabela `redap_pareceres`:
   - Colunas: `evento_id`, `tipo_parecer`, `autor_id`, `cargo_autor`, `conteudo_texto`, `decisao`, `nivel_intensidade`, `motivacao_ecp`, `requer_reconhecimento`, `documento_gerado_id`.
4. Criar a tabela `redap_reaberturas`:
   - Colunas: `evento_id`, `parecer_anterior_id`, `motivo_reabertura`, `reaberto_por_id`, `data_reabertura`.

## Etapa 2: Backend e Regras de Negócio
1. Criar validações (RPC/Service) para as transições de fase, garantindo a imutabilidade após decisões e impedindo saltos de fase.
2. Implementar a validação de vinculação legal (Portaria 260/2022):
   - Nível I/II apenas com SE.
   - Nível III apenas com ECP e obrigatoriedade do campo `motivacao_ecp`.
3. Disparos de Notificação WhatsApp para cada mudança de fase entre perfis (Analista, Coordenador, Prefeito).

## Etapa 3: Interface de Usuário (Frontend)
1. **Timeline Redesenhada:**
   - 5 etapas horizontais com ramificação visual para a Fase E (Encerrado sem Decretação).
   - Cores de estado: Cinza (Pendente), Âmbar (Em andamento), Verde (Concluída), Vermelho (Encerrado).
2. **Modal "Emitir Parecer Decisório" (Fase 3):**
   - Fluxo guiado em passos:
     1. Classificação de Intensidade (I, II, III).
     2. Tipo de Decretação (Travado com base no Passo 1).
     3. Motivação Específica (Se ECP).
     4. Indicador de Reconhecimento.
     5. Justificativa / Parecer Técnico (com apoio de IA).
3. **Controle de Acesso por Perfil:**
   - Habilitar/Desabilitar botões conforme o papel (Analista, Coordenador, Prefeito).
4. **Tela de Detalhe e Listagem:**
   - Badges informativos de Nível I (azul claro), Nível II (âmbar), Nível III (vermelho).
   - Filtros na listagem por Nível de Intensidade.

## Etapa 4: Geração Documental e Fase 5
1. **Fase 4 (Prefeito):**
   - Autopreenchimento de campos do Decreto ECP com base em `motivacao_ecp`.
   - Adição do "Considerando" padrão citando o nível de intensidade.
2. **Fase 5 (Envio e Exportação):**
   - Lógica de botões adaptada pelo nível (Nível I: Oculta envio ao Estado; Nível II: Opcional; Nível III: Obrigatório).
   - Geração de pacote documental completo (ZIP/PDF único).

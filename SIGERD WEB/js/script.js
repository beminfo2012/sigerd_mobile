// Variáveis globais para armazenar os dados carregados
let vehiclesData = [];
let weatherStationsData = [];
let rainGaugesData = [];
let sheltersData = [];
let actionsData = [];
let scoAlertsData = [];
let membersData = [];
let riskPersonsData = [];
let donationsData = [];
let conversations = {};
let distributionsData = [];

let currentShelterIdToDelete = null;
let currentActionIdToDelete = null;
let currentScoAlertIdToDelete = null;
let currentMemberIdToDelete = null;

let isPlanActive = false;
let currentPlanLevel = 'normalidade'; // normalidade, atencao, alerta, maximo
let currentPlanRisk = '';
let planLastUpdate = null;
let map = null; // Variável para a instância do mapa
let riskAreasLayerGroup = null; // Grupo de camada para áreas de risco
let rainGaugesLayerGroup = null; // Grupo de camada para pluviômetros
let legendControl = null; // Controle da legenda


// Funções utilitárias para PDF (quebra de linhas / paginação)
function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    for (let i = 0; i < lines.length; i++) {
        // Se ultrapassar limite, criar nova página
        if (y > 275) {
            doc.addPage();
            y = 20; // reset margem top
        }
        doc.text(lines[i], x, y);
        y += lineHeight;
    }
    return y;
}

function checkAuth() {
    const user = sessionStorage.getItem('sigerd_user');
    if (!user) {
        // Se não houver usuário na sessão, redireciona para a página de login
        window.location.href = 'pages/login.html';
        return false;
    }

    // Opcional: Atualizar a UI com o nome do usuário
    try {
        const userData = JSON.parse(user);
        document.querySelector('.user-details span').textContent = userData.name || 'Operador';
        document.querySelector('.user-info img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`;
    } catch (e) {
        console.error("Erro ao processar dados do usuário:", e);
    }
    return true;
}

function logout() {
    // Limpa os dados do usuário da sessão
    sessionStorage.removeItem('sigerd_user');
    // Redireciona para a página de login
    window.location.href = 'pages/login.html';
}

// Adiciona o evento de clique ao botão de logout
document.getElementById('logout-btn').addEventListener('click', logout);

async function loadInitialData() {
    // Carrega primeiro o status do plano
    // A lógica de status do plano agora será gerenciada junto com os outros dados
    // ou poderia ter sua própria API, mas vamos simplificar por enquanto.

    // Carrega os demais dados
    try {
        // Alterado para buscar da API na pasta correta
        // Adicionado um parâmetro para evitar cache
        const response = await fetch(`api/api_get_data.php?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        vehiclesData = data.vehiclesData;
        weatherStationsData = data.weatherStationsData;
        // rainGaugesData não é mais carregado daqui, mas da API do CEMADEN
        sheltersData = data.sheltersData;
        actionsData = data.actionsData;
        scoAlertsData = data.scoAlertsData;
        membersData = data.membersData;
        riskPersonsData = data.riskPersonsData;
        donationsData = data.donationsData || [];
        distributionsData = data.distributionsData || [];
        conversations = data.conversations || {};

        // Atualiza os componentes que dependem dos dados
        updateDashboardAlerts();
        updateDashboardCards();
        updateRealTimeMonitorCards();
    } catch (error) {
        console.error("Não foi possível carregar os dados da API. Tentando carregar do arquivo local...", error);
        // Fallback para carregar o arquivo JSON local em caso de falha na API
        const fallbackResponse = await fetch(`api/data.json?v=${Date.now()}`);
        if (!fallbackResponse.ok) {
            throw new Error(`Falha ao carregar também o arquivo local: ${fallbackResponse.status}`);
        }
        const data = await fallbackResponse.json();
        vehiclesData = data.vehiclesData;
        weatherStationsData = data.weatherStationsData;
        rainGaugesData = data.rainGaugesData;
        sheltersData = data.sheltersData;
        actionsData = data.actionsData;
        scoAlertsData = data.scoAlertsData;
        membersData = data.membersData;
        riskPersonsData = data.riskPersonsData;
        donationsData = data.donationsData || [];
        distributionsData = data.distributionsData || [];
        conversations = data.conversations || {}; // Carrega do fallback também

        updateDashboardAlerts();
        updateDashboardCards();
        updateRealTimeMonitorCards();
    }
}

// Função para carregar mensagens de uma conversa
function loadConversation(contactId) {
    const messagesContainer = document.querySelector('#comunicacao .chat-messages');
    if (!messagesContainer) return;
    messagesContainer.innerHTML = ''; // Limpa mensagens antigas
    const conversation = conversations[contactId] || [];

    conversation.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.type}`;
        messageElement.innerHTML = `
            <div class="message-header">
                <span>${msg.sender}</span>
                <span>${msg.time}</span>
            </div>
            <div class="message-body">${msg.body}</div>
        `;
        messagesContainer.appendChild(messageElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function initializeApp() {
    // Navegação lateral para itens SEM submenu e para itens DE submenu
    document.querySelectorAll('.menu-item:not(.has-submenu), .submenu-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remover classes ativas dos itens de menu principais e submenus
            document.querySelectorAll('.menu-item, .submenu-item').forEach(i => i.classList.remove('active'));

            // Adicionar classe ativa ao item clicado
            item.classList.add('active');

            // Adicionar classe ativa ao item pai no menu principal se for um submenu
            const parentMenuItem = item.closest('.menu-item');
            if (parentMenuItem) {
                parentMenuItem.classList.add('active');
            }

            // mostrar/ocultar seções (simples)
            const target = item.getAttribute('data-target');
            document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
            const el = document.getElementById(target);
            if (el) el.style.display = 'block';

            // Se for a seção de veículos, carregar os veículos
            if (target === 'frota-veiculos') {
                loadVehicles();
            }

            // Se for a seção de monitoramento integrado, carregar os dados e o mapa
            if (target === 'monitoramento-integrado') {
                loadMonitoringData();
                // A inicialização do mapa deve ocorrer quando a seção se torna visível
                // A inicialização do mapa deve ocorrer quando a seção se torna visível
                setTimeout(() => {
                    initializeMap();
                    map.invalidateSize(); // Força o mapa a se redimensionar corretamente
                }, 10); // Pequeno delay para garantir que a div está visível
            }

            // Se for a seção de abrigos, carregar os dados de abrigos
            if (target === 'abrigos') {
                loadShelters();
            }

            // Se for a seção de ocorrências (ações do SCO), carregar as ações
            if (target === 'ocorrencias') {
                loadActions();
            }

            // Se for a seção de alertas do SCO, carregar os alertas
            if (target === 'alertas-sco') {
                loadScoAlerts();
            }

            // Se for a seção de pessoas em risco, carregar os dados
            if (target === 'pessoas-risco') {
                loadRiskPersons();
            }

            // Se voltar para o dashboard, atualizar os cards
            if (target === 'dashboard') {
                updateDashboardAlerts();
                updateRealTimeMonitorCards();
                updateDashboardCards();
            }

            // Se for a seção de doações, carregar os dados
            if (target === 'doacoes') {
                loadDonations();
            }

            // Se for a seção de distribuição, carregar os dados
            if (target === 'distribuicao') {
                loadDistributions();
            }

            // Se for a seção de relatórios de assistência, carregar os dados
            if (target === 'relatorios-assistencia') {
                loadAssistanceReports();
            }

            // Se for a seção de comunicação, carrega a conversa inicial
            if (target === 'comunicacao') {
                const initialContact = document.querySelector('.contact-item.active');
                if (initialContact) loadConversation(initialContact.dataset.id);
            }

            // Fecha o menu responsivo após o clique
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.overlay');
            sidebar.classList.remove('open');
            overlay.classList.remove('active');

        });
    });

    // Lógica unificada para itens de menu com submenu (navegação E toggle)
    document.querySelectorAll('.menu-item.has-submenu .menu-item-content').forEach(itemContent => {
        itemContent.addEventListener('click', (event) => {
            // Impede que o evento se propague para outros listeners, se houver.
            event.stopPropagation();
            const clickedItem = itemContent.parentElement;
            const isAlreadyOpen = clickedItem.classList.contains('open');

            // Fecha todos os outros submenus abertos
            document.querySelectorAll('.menu-item.has-submenu.open').forEach(openItem => {
                if (openItem !== clickedItem) {
                    openItem.classList.remove('open');
                    openItem.querySelector('.submenu').style.maxHeight = '0';
                }
            });

            // Qualquer clique no item com submenu apenas abre/fecha o submenu.
            clickedItem.classList.toggle('open');
            const submenu = clickedItem.querySelector('.submenu');

            // Abre o submenu clicado (se não estava aberto)
            if (clickedItem.classList.contains('open')) {
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
            } else {
                submenu.style.maxHeight = '0';
            }
        });
    });

    // Modal de ativação
    const activationModal = document.getElementById('activationModal');
    const deactivationModal = document.getElementById('deactivationModal');
    const changeLevelModal = document.getElementById('changeLevelModal');
    const changeLevelButton = document.getElementById('changeLevelButton');

    document.getElementById('openActivationModal').addEventListener('click', () => {
        if (isPlanActive) {
            deactivationModal.style.display = 'flex';
            deactivationModal.setAttribute('aria-hidden', 'false');
        } else {
            activationModal.style.display = 'flex';
            activationModal.setAttribute('aria-hidden', 'false');
        }
    });
    document.getElementById('cancelActivation').addEventListener('click', () => {
        activationModal.style.display = 'none';
        activationModal.setAttribute('aria-hidden', 'true');

    });
    document.getElementById('confirmActivation').addEventListener('click', () => {
        const risk = document.getElementById('modalRiskType').value;
        const level = document.getElementById('modalAlertLevel').value;
        const auth = document.getElementById('modalAuth').value;
        if (!risk || !level) {
            alert('Preencha todos os campos, incluindo a senha master.');
            return;
        }
        if (auth !== 'SENHA_MESTRA_COORDENADOR' && auth !== 'SENHA_MESTRA_PREFEITO') {
            alert('Preencha todos os campos.');
            return;
        }

        if (auth !== 'SENHA_MESTRA_COORDENADOR' && auth !== 'SENHA_MESTRA_PREFEITO') {
            alert('Senha Master incorreta. A ativação do plano é restrita.');
            return;
        }

        // Se a senha estiver correta, ativa o plano
        activationModal.style.display = 'none';
        document.getElementById('activationSuccessModal').style.display = 'flex';

        const activationButton = document.getElementById('openActivationModal');
        activationButton.innerHTML = '<i class="fas fa-power-off"></i> Desativar Plano';
        activationButton.style.background = '#4CAF50'; // Verde
        activationButton.classList.remove('btn-danger');
        activationButton.classList.add('btn-success'); // Classe simbólica
        isPlanActive = true;
        changeLevelButton.style.display = 'block';
        currentPlanLevel = level;
        currentPlanRisk = risk;
        updateAlertBanner();
        updateDashboardCards();
        updatePlanStatusFile();
    });

    // Lógica de Desativação
    document.getElementById('cancelDeactivation').addEventListener('click', () => {
        deactivationModal.style.display = 'none';
        deactivationModal.setAttribute('aria-hidden', 'true');
    });

    document.getElementById('confirmDeactivation').addEventListener('click', () => {
        const auth = document.getElementById('modalDeauth').value;

        if (auth !== 'SENHA_MESTRA_COORDENADOR' && auth !== 'SENHA_MESTRA_PREFEITO') {
            alert('Senha Master incorreta. A desativação do plano é restrita.');
            return;
        }

        // Se a senha estiver correta, desativa o plano
        deactivationModal.style.display = 'none';
        document.getElementById('modalDeauth').value = ''; // Limpa a senha
        document.getElementById('deactivationSuccessModal').style.display = 'flex';

        const activationButton = document.getElementById('openActivationModal');
        activationButton.innerHTML = '<i class="fas fa-bell"></i> Ativar Plano';
        activationButton.style.background = ''; // Volta ao estilo da classe
        activationButton.classList.remove('btn-success');
        activationButton.classList.add('btn-danger');
        isPlanActive = false;
        changeLevelButton.style.display = 'none';
        currentPlanLevel = 'normalidade';
        currentPlanRisk = '';
        updateAlertBanner();
        updateDashboardCards();
        updatePlanStatusFile();
    });

    document.getElementById('closeDeactivationSuccess').addEventListener('click', () => {
        document.getElementById('deactivationSuccessModal').style.display = 'none';
    });

    // Lógica para Alterar Nível
    changeLevelButton.addEventListener('click', () => {
        const body = document.getElementById('change-level-body');
        // Reutiliza os mesmos campos do modal de ativação
        body.innerHTML = `
            <p>Selecione o novo nível de alerta ou tipo de risco.</p>
            ${document.getElementById('activationModal').querySelector('.modal-body').innerHTML}
            <div class="modal-footer" style="padding-right:0;">
                 <button id="cancelChangeLevel" class="btn-secondary">Cancelar</button>
                 <button id="confirmChangeLevel" class="btn-primary">Confirmar Alteração</button>
            </div>
        `;
        changeLevelModal.style.display = 'flex';

        document.getElementById('cancelChangeLevel').addEventListener('click', () => {
            changeLevelModal.style.display = 'none';
        });

        document.getElementById('confirmChangeLevel').addEventListener('click', () => {
            const risk = body.querySelector('#modalRiskType').value;
            const level = body.querySelector('#modalAlertLevel').value;
            const auth = body.querySelector('#modalAuth').value;

            if (!risk || !level) {
                alert('Por favor, selecione o Tipo de Risco e o Nível de Alerta.');
                return;
            }

            if (auth !== 'SENHA_MESTRA_COORDENADOR' && auth !== 'SENHA_MESTRA_PREFEITO') {
                alert('Senha Master incorreta. A alteração é restrita.');
                return;
            }

            // Lógica para registrar a mudança de nível
            showNotification(`Plano alterado para: Risco ${risk}, Nível ${level}.`);
            changeLevelModal.style.display = 'none';
            currentPlanLevel = level;
            currentPlanRisk = risk;
            updateAlertBanner();
            updateDashboardCards();
            updatePlanStatusFile();
        });
    });


    document.getElementById('closeActivationSuccess').addEventListener('click', () => {
        document.getElementById('activationSuccessModal').style.display = 'none';
    });

    // Teams modal
    const teamsModal = document.getElementById('teamsModal');
    document.getElementById('btn-verificar-equipes').addEventListener('click', () => {
        teamsModal.style.display = 'flex';
        teamsModal.setAttribute('aria-hidden', 'false');
    });
    document.getElementById('closeTeams').addEventListener('click', () => {
        teamsModal.style.display = 'none';
        teamsModal.setAttribute('aria-hidden', 'true');
    });

    // Abre o Painel de Acompanhamento em uma nova aba
    document.getElementById('btn-open-tracking-panel').addEventListener('click', () => {
        // Primeiro, garante que os dados mais recentes estão no localStorage
        saveAllData().then(() => {
            // Abre a nova aba após os dados serem salvos
            window.open('pages/painel.html', '_blank');
        });
    });

    // Botão para abrir o mapa de ocorrências
    document.getElementById('btn-mapa-ocorrencias').addEventListener('click', () => {
        // Garante que os dados mais recentes estão no localStorage para o mapa usar
        saveAllData().then(() => {
            window.open('pages/mapa_ocorrencias.html', '_blank');
        });
    });

    // Mobilize Vehicle Modal
    const mobilizeVehicleModal = document.getElementById('mobilizeVehicleModal');
    document.getElementById('closeMobilizeVehicleModal').addEventListener('click', () => {
        mobilizeVehicleModal.style.display = 'none';
    });


    // Vehicle Detail Modal
    const vehicleDetailModal = document.getElementById('vehicleDetailModal');
    document.getElementById('cancelVehicleDetail').addEventListener('click', () => {
        vehicleDetailModal.style.display = 'none';
        vehicleDetailModal.setAttribute('aria-hidden', 'true');
    });
    // Adiciona o listener para o botão de salvar
    const saveVehicleBtn = document.getElementById('saveVehicleDetail');
    if (saveVehicleBtn) {
        // O submit já está ligado ao form, mas podemos adicionar um listener de clique se necessário
        // A função saveVehicleDetails será chamada pelo submit do form
    }

    // Shelter Modal
    const shelterModal = document.getElementById('shelterModal');
    document.getElementById('closeShelterModal').addEventListener('click', () => {
        shelterModal.style.display = 'none';
        shelterModal.setAttribute('aria-hidden', 'true');
        // Garante que os botões voltem ao estado inicial de visualização
        document.getElementById('editShelterButton').style.display = 'none';
        document.getElementById('saveShelterButton').style.display = 'none';
        document.getElementById('shelter-modal-body').innerHTML = ''; // Limpa o conteúdo
        document.getElementById('shelterForm').remove(); // Remove o form se existir


    });

    // Action Modal
    const actionModal = document.getElementById('actionModal');
    document.getElementById('closeActionModal').addEventListener('click', () => {
        actionModal.style.display = 'none';
        actionModal.setAttribute('aria-hidden', 'true');

    });
    // Lógica para adicionar itens das listas de seleção para as listas de mobilização no modal de ação
    document.getElementById('btn-add-vehicle-to-action').addEventListener('click', () => {
        const select = document.getElementById('action-vehicles');
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
            addResourceToMobilizedList(selectedOption, 'mobilized-vehicles-list');
        }
    });
    document.getElementById('btn-add-member-to-action').addEventListener('click', () => {
        const select = document.getElementById('action-members');
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
            addResourceToMobilizedList(selectedOption, 'mobilized-members-list');
        }
    });
    // Lógica para remover itens das listas de mobilização
    document.getElementById('mobilized-vehicles-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-mobilized-item')) {
            removeResourceFromMobilizedList(e.target.parentElement, 'action-vehicles');
        }
    });
    document.getElementById('mobilized-members-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-mobilized-item')) {
            removeResourceFromMobilizedList(e.target.parentElement, 'action-members');
        }
    });

    // SCO Alert Modal
    const scoAlertModal = document.getElementById('scoAlertModal');
    document.getElementById('closeScoAlertModal').addEventListener('click', () => {
        scoAlertModal.style.display = 'none';
        scoAlertModal.setAttribute('aria-hidden', 'true');

    });

    // Modal para Cessar Alerta
    const ceaseAlertModal = document.getElementById('ceaseAlertModal');
    document.getElementById('cancelCeaseAlert').addEventListener('click', () => {
        ceaseAlertModal.style.display = 'none';
    });
    // Member Modal
    const memberModal = document.getElementById('memberModal');
    document.getElementById('closeMemberModal').addEventListener('click', () => {
        memberModal.style.display = 'none';
        memberModal.setAttribute('aria-hidden', 'true');

    });

    // Donation Modal
    const donationModal = document.getElementById('donationModal');
    document.getElementById('btn-add-donation').addEventListener('click', () => {
        donationModal.style.display = 'flex';
        document.getElementById('donationForm').reset();
        document.getElementById('donation-id').value = '';
    });
    // Adiciona evento para mostrar/ocultar campo de descrição
    document.getElementById('donation-item-type').addEventListener('change', (e) => {
        const descriptionInput = document.getElementById('donation-item-description');
        if (e.target.value === 'Outro') {
            descriptionInput.style.display = 'block';
            descriptionInput.parentElement.style.display = 'block';
        } else {
            descriptionInput.style.display = 'none';
            descriptionInput.parentElement.style.display = 'none';
        }
    });
    document.getElementById('closeDonationModal').addEventListener('click', () => donationModal.style.display = 'none');

    // Distribution Modal
    const distributionModal = document.getElementById('distributionModal');
    document.getElementById('btn-add-distribution').addEventListener('click', () => {
        distributionModal.style.display = 'flex';
        document.getElementById('distributionForm').reset();
        document.getElementById('distribution-id').value = '';
        setupDistributionModal();
    });
    document.getElementById('closeDistributionModal').addEventListener('click', () => distributionModal.style.display = 'none');
    document.getElementById('distribution-destination-type').addEventListener('change', toggleDistributionDestination);
    document.getElementById('distribution-item').addEventListener('change', updateDistributionQuantityPlaceholder);

    // Distribution Detail Modal
    const distributionDetailModal = document.getElementById('distributionDetailModal');
    document.getElementById('closeDistributionDetail').addEventListener('click', () => {
        distributionDetailModal.style.display = 'none';
    });

    // Donation Detail Modal
    const donationDetailModal = document.getElementById('donationDetailModal');
    document.getElementById('closeDonationDetail').addEventListener('click', () => {
        donationDetailModal.style.display = 'none';
    });

    // Person Detail Modal
    const personDetailModal = document.getElementById('personDetailModal');
    document.getElementById('closePersonDetail').addEventListener('click', () => {
        personDetailModal.style.display = 'none';
    });


    // Assignments Modal
    const assignmentsModal = document.getElementById('assignmentsModal');
    document.getElementById('closeAssignmentsModal').addEventListener('click', () => {
        assignmentsModal.style.display = 'none';
        assignmentsModal.setAttribute('aria-hidden', 'true');
    });

    // Confirm Delete Member Modal
    document.getElementById('confirmDeleteMember').addEventListener('click', deleteMember);
    document.getElementById('cancelDeleteMember').addEventListener('click', () => {
        document.getElementById('confirmDeleteMemberModal').style.display = 'none';

    });

    // Confirm Delete SCO Alert Modal
    document.getElementById('confirmDeleteScoAlert').addEventListener('click', deleteScoAlert);
    document.getElementById('cancelDeleteScoAlert').addEventListener('click', () => {
        document.getElementById('confirmDeleteScoAlertModal').style.display = 'none';

    });

    // Confirm Delete Modal
    document.getElementById('confirmDelete').addEventListener('click', deleteShelter);
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.getElementById('confirmDeleteModal').style.display = 'none';

    });

    // Confirm Delete Action Modal
    document.getElementById('confirmDeleteAction').addEventListener('click', deleteAction);
    document.getElementById('cancelDeleteAction').addEventListener('click', () => {
        document.getElementById('confirmDeleteActionModal').style.display = 'none';

    });

    // Contatar regional (simples ação de demonstração)
    document.getElementById('btn-contatar').addEventListener('click', () => {
        // aqui você pode abrir um contato real (tel:) ou integrar com SIP/telefonia
        alert('Iniciando contato com a Defesa Civil Regional... (simulação)');
    });

    // Enviar alerta (prompt simples)
    document.getElementById('btn-enviar-alerta').addEventListener('click', () => {
        const msg = prompt('Mensagem do alerta que será enviada para os contatos cadastrados:');
        if (msg) {
            // aqui você integraria com API de envio de alertas
            const now = new Date().toLocaleString('pt-BR');
            alert('Alerta enviado às ' + now + '\n\nMensagem: ' + msg);
        }
    });

    // Botão atualizar (simulação)
    document.getElementById('btn-update').addEventListener('click', function () {
        const btn = this;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Atualizando...';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
            showNotification('Dados atualizados com sucesso!');
        }, 1200);
    });

    // Botão atualizar monitoramento
    document.getElementById('refresh-monitor').addEventListener('click', function () {
        const btn = this;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        btn.disabled = true;

        // Simular atualização de dados
        setTimeout(() => {
            const timeElement = document.getElementById('last-update-time');
            const now = new Date();
            timeElement.textContent = 'agora há pouco';

            // Restaurar botão
            btn.innerHTML = original;
            btn.disabled = false;

            showNotification('Monitoramento atualizado com sucesso!');
        }, 800);
    });

    // Botão atualizar dados de monitoramento
    document.getElementById('refresh-monitoramento').addEventListener('click', function () {
        const btn = this;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Atualizando...';
        btn.disabled = true;

        // Simular atualização de dados
        setTimeout(() => {
            loadMonitoringData();
            updateSatelliteTime();

            // Restaurar botão
            btn.innerHTML = original;
            btn.disabled = false;

            showNotification('Dados de monitoramento atualizados!');
        }, 1200);
    });

    // Event listeners para os botões de ferramentas de gestão
    document.getElementById('btn-gerenciar-alertas').addEventListener('click', () => {
        // Simula o clique no item de menu para navegar para a seção de Alertas SCO
        const alertasScoMenuItem = document.querySelector('.submenu-item[data-target="alertas-sco"]');
        if (alertasScoMenuItem) {
            alertasScoMenuItem.click();
        }
    });

    document.getElementById('btn-mapa-risco').addEventListener('click', () => {
        // Abre a nova página do mapa em tela cheia
        window.open('pages/mapa_fullscreen.html', '_blank');
    });

    document.getElementById('btn-relatorios-impacto').addEventListener('click', () => {
        alert('Funcionalidade de Relatórios de Impacto será implementada em breve.');
    });

    document.getElementById('btn-status-equipes').addEventListener('click', () => {
        alert('Funcionalidade de Status das Equipes será implementada em breve.');
    });

    // Botão para aplicar filtros (veículos)
    document.getElementById('btn-apply-filters').addEventListener('click', () => {
        loadVehicles();
    });

    // Botão para atualizar a lista de veículos
    document.getElementById('btn-refresh-vehicles').addEventListener('click', () => {
        loadVehicles();
        showNotification('Lista de veículos atualizada!');
    });

    // Botão para aplicar filtros (abrigos)
    document.getElementById('btn-apply-shelter-filters').addEventListener('click', loadShelters);

    // Adicionar evento de clique para todos os botões de fechar modais
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    });


    // Carregar dados iniciais do dashboard
    updateDashboardAlerts();
    updateDashboardCards();
    updateRealTimeMonitorCards();
    updateAlertBanner(); // Define o estado inicial do banner

    // Lógica para o menu responsivo (hambúrguer)
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // --- Lógica da Seção de Comunicação ---
    function initializeCommsSection() {
        const commsSection = document.getElementById('comunicacao');
        if (!commsSection) return;

        const chatHeader = commsSection.querySelector('.chat-header h3');
        const messagesContainer = commsSection.querySelector('.chat-messages');
        const contactList = commsSection.querySelector('.contact-list');
        const chatInput = commsSection.querySelector('.message-input input');
        const chatSendButton = commsSection.querySelector('.message-input button');
        const tabs = commsSection.querySelectorAll('.comms-tab');
        const tabContents = commsSection.querySelectorAll('.tab-content');
        const timeElement = commsSection.querySelector('#current-time');

        // Atualizar hora atual
        function updateTime() {
            if (!timeElement) return;
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            timeElement.textContent = timeString;
        }
        setInterval(updateTime, 60000);
        updateTime();

        // Alternar entre abas
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                const activeContent = commsSection.querySelector(`#${tabId}-tab`);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });

        // Lógica para trocar de contato
        if (contactList) {
            contactList.addEventListener('click', (e) => {
                const contactItem = e.target.closest('.contact-item');
                if (!contactItem) return;

                // Atualiza a classe 'active'
                contactList.querySelector('.contact-item.active').classList.remove('active');
                contactItem.classList.add('active');

                // Atualiza o cabeçalho e carrega as mensagens
                const contactName = contactItem.dataset.name;
                const contactId = contactItem.dataset.id;
                if (chatHeader) chatHeader.textContent = `Chat com ${contactName}`;
                loadConversation(contactId);
            });
        }

        // Envio de mensagem de chat
        if (chatInput && chatSendButton) {
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    const now = new Date();
                    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const activeContactItem = contactList.querySelector('.contact-item.active');
                    const contactId = activeContactItem.dataset.id;

                    // Pega o nome do usuário logado
                    const userSession = JSON.parse(sessionStorage.getItem('sigerd_user')) || {};
                    const senderName = userSession.name || 'Operador';

                    const newMessage = {
                        sender: senderName,
                        time: timeString,
                        body: message,
                        type: 'sent'
                    };

                    const messageElement = document.createElement('div');
                    messageElement.className = 'message sent';
                    messageElement.innerHTML = `
                        <div class="message-header">
                            <span>${senderName}</span>
                            <span>${timeString}</span>
                        </div>
                        <div class="message-body">${message}</div>
                    `;

                    messagesContainer.appendChild(messageElement);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    chatInput.value = '';

                    // Adiciona a nova mensagem ao objeto de conversas e salva
                    if (conversations[contactId]) {
                        conversations[contactId].push(newMessage);
                        saveAllData(); // Salva os dados no servidor
                    }
                }
            };

            chatSendButton.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }
    initializeCommsSection();
}

/**
 * Simula a atualização do arquivo plan_status.json.
 * Em uma aplicação real, isso seria uma chamada de API (POST/PUT) para o backend.
 */
function updatePlanStatusFile() {
    const now = new Date().toISOString();
    const newStatus = {
        isActive: isPlanActive,
        level: currentPlanLevel,
        riskType: currentPlanRisk,
        activatedAt: isPlanActive ? (planLastUpdate || now) : null,
        lastUpdate: now
    };

    planLastUpdate = newStatus.lastUpdate; // Atualiza a variável global

    // Apenas para demonstração no console
    console.log("Simulando escrita em plan_status.json:", newStatus);
    showNotification("Status do plano salvo com sucesso!");
}

function updateDashboardCards() {
    const riskLevelEl = document.getElementById('riskLevel');
    const lastUpdateEl = document.getElementById('lastUpdate');

    if (!riskLevelEl || !lastUpdateEl) return;

    const levelTextMap = {
        'normalidade': 'Normalidade',
        'atencao': 'Atenção',
        'alerta': 'Alerta',
        'maximo': 'Alerta Máximo'
    };

    const riskTypeTextMap = {
        'geologico': 'Geológico',
        'hidrologico': 'Hidrológico',
        '': ''
    };

    const riskText = currentPlanRisk ? `(${riskTypeTextMap[currentPlanRisk]})` : '';
    riskLevelEl.textContent = `${levelTextMap[currentPlanLevel]} ${riskText}`;

    // Formata a data da última atualização
    const lastUpdateDate = new Date(planLastUpdate);
    lastUpdateEl.textContent = lastUpdateDate.toLocaleString('pt-BR');
}

function updateAlertBanner() {
    const banner = document.getElementById('status-banner');
    const bannerText = document.getElementById('status-banner-text');
    const bannerIcon = banner.querySelector('i');
    if (!banner || !bannerText) return;

    // Mapeamento de níveis para classes e textos
    const statusMap = {
        'normalidade': {
            text: 'Normalidade', // Corrigido para ter a classe
            className: 'banner-normalidade'
        },
        'atencao': {
            text: 'Atenção',
            className: 'banner-atencao'
        },
        'alerta': {
            text: 'Alerta',
            className: 'banner-alerta'
        },
        'maximo': {
            text: 'Alerta Máximo',
            className: 'banner-maximo'
        }
    };

    // Se o plano não estiver ativo, o nível é sempre 'normalidade'.
    const level = isPlanActive ? currentPlanLevel : 'normalidade';

    const status = statusMap[level] || statusMap['normalidade'];

    // Define a classe base e a classe de cor
    banner.className = 'alert-banner ' + status.className;

    // Adiciona a classe correta e atualiza o texto
    bannerText.innerHTML = `O SIGERD está operando em modo de <strong>${status.text}</strong>.`;
}


function initializeMap() {
    // Coordenadas aproximadas de Santa Maria de Jetibá, ES
    const smjCoordinates = [-20.033, -40.74];

    // Inicializa o mapa se ainda não foi
    if (!map) {
        map = L.map('map').setView(smjCoordinates, 12);
        // Inicializa os grupos de camadas
        riskAreasLayerGroup = L.layerGroup().addTo(map);
        rainGaugesLayerGroup = L.layerGroup().addTo(map);

        // --- Camadas Base (Tiles) ---
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        osmLayer.addTo(map); // Adiciona a camada padrão ao mapa

        const baseMaps = {
            "Padrão": osmLayer,
            "Satélite": satelliteLayer
        };

        // --- Legenda (criada mas não adicionada ainda) ---
        legendControl = L.control({ position: 'bottomright' });
        legendControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'leaflet-control legend');
            div.innerHTML = `
                <h4>Legenda</h4>
                <div class="legend-section">
                    <strong>Áreas de Risco</strong><br>
                    <i style="background: #e53935"></i> Alto (R3)<br>
                    <i style="background: #fb8c00"></i> Médio (R2)<br>
                </div>
                <div class="legend-section">
                    <strong>Pluviômetros (24h)</strong><br>
                    <i style="background: #e53935"></i> > 70mm (Muito Alto)<br>
                    <i style="background: #fb8c00"></i> 40-70mm (Alto)<br>
                    <i style="background: #FFC107"></i> 10-40mm (Moderado)<br>
                    <i style="background: #4CAF50"></i> < 10mm (Baixo)<br>
                </div>
            `;
            return div;
        };

        // --- Camadas de Sobreposição (Overlays) ---
        const overlayMaps = {
            "Áreas de Risco": riskAreasLayerGroup,
            "Pluviômetros": rainGaugesLayerGroup
        };

        L.control.layers(baseMaps, overlayMaps).addTo(map);

        // --- Botão Customizado para Legenda ---
        L.Control.LegendToggle = L.Control.extend({
            onAdd: function (map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                container.innerHTML = '<a href="#" title="Legenda"><i class="fas fa-list-ul"></i></a>';
                container.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (legendControl._map) { // Verifica se o controle já está no mapa
                        map.removeControl(legendControl);
                    } else {
                        legendControl.addTo(map);
                    }
                }
                return container;
            }
        });
        L.control.legendToggle = function (opts) { return new L.Control.LegendToggle(opts); }
        L.control.legendToggle({ position: 'topright' }).addTo(map);
    }


    // Limpa camadas antigas para evitar duplicação ao recarregar
    // Agora limpamos os grupos de camadas, que é mais eficiente
    if (riskAreasLayerGroup) {
        riskAreasLayerGroup.clearLayers();
    }
    if (rainGaugesLayerGroup) {
        rainGaugesLayerGroup.clearLayers();
    }

    // Carrega e plota as áreas de risco
    loadRiskAreasOnMap();

    // Garante que pelo menos uma camada de tile esteja presente
    let hasTileLayer = false;
    map.eachLayer(l => {
        if (l instanceof L.TileLayer) {
            hasTileLayer = true;
        }
    });
    if (!hasTileLayer) {
        // Se por algum motivo todas as camadas de tile foram removidas, adiciona a padrão de volta
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
}

async function loadRiskAreasOnMap() {
    try {
        const response = await fetch('api/areas_de_riscos.json');
        const geojsonData = await response.json();

        const geoJsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                const nivelRisco = feature.properties.nivel_risco;
                let color = '#cccccc'; // Cor padrão
                if (nivelRisco.includes('R3')) {
                    color = '#e53935'; // Vermelho para R3 (Alto)
                } else if (nivelRisco.includes('R2')) {
                    color = '#fb8c00'; // Laranja para R2 (Médio)
                }
                return {
                    color: color,
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.3
                };
            },
            onEachFeature: function (feature, layer) {
                const props = feature.properties;
                let popupContent = `
                    <h4>Área de Risco: ${props.setor}</h4>
                    <p><strong>Localização:</strong> ${props.localizacao}</p>
                    <p><strong>Nível de Risco:</strong> ${props.nivel_risco}</p>
                    <p><strong>Descrição:</strong> ${props.descricao}</p>
                    <p><strong>Imóveis em Risco:</strong> ${props.imoveis_risco}</p>
                `;
                layer.bindPopup(popupContent);
            }
        });

        riskAreasLayerGroup.addLayer(geoJsonLayer);

    } catch (error) {
        console.error("Erro ao carregar as áreas de risco no mapa:", error);
    }
}

function plotRainGaugesOnMap(gaugesWithCoords) {
    if (!map || !rainGaugesLayerGroup) return;

    gaugesWithCoords.forEach(gauge => {
        if (gauge.latitude && gauge.longitude) {
            const accumulated24h = gauge.acc24hr || 0;

            // Classificação por cor
            let colorClass = 'gauge-icon-low'; // Verde
            if (accumulated24h >= 10 && accumulated24h < 40) {
                colorClass = 'gauge-icon-medium'; // Amarelo
            } else if (accumulated24h >= 40 && accumulated24h < 70) {
                colorClass = 'gauge-icon-high'; // Laranja
            } else if (accumulated24h >= 70) {
                colorClass = 'gauge-icon-very-high'; // Vermelho
            }

            const icon = L.divIcon({
                className: `custom-gauge-icon ${colorClass}`,
                html: `<div><i class="fas fa-cloud-showers-heavy"></i><span>${accumulated24h.toFixed(1)}</span></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });

            const marker = L.marker([gauge.latitude, gauge.longitude], { icon: icon });

            marker.bindPopup(`
                <b>Pluviômetro: ${gauge.nome}</b><br>
                Código: ${gauge.codestacao}<br>
                Bairro: ${gauge.bairro || 'N/A'}<br><hr>
                <b>Acumulado 1h:</b> ${gauge.acc1hr || 0} mm<br>
                <b>Acumulado 3h:</b> ${gauge.acc3hr || 0} mm<br>
                <b>Acumulado 6h:</b> ${gauge.acc6hr || 0} mm<br>
                <b>Acumulado 24h:</b> ${accumulated24h.toFixed(1)} mm
            `);

            rainGaugesLayerGroup.addLayer(marker);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        initializeApp(); // Inicializa a interface primeiro
        loadInitialData();
        loadMonitoringData(); // Carrega dados de monitoramento (clima e chuva) para o dashboard
        // --- Lógica do Relatório Situacional ---
        const openReportModalBtn = document.getElementById('btn-open-report-modal');

        if (openReportModalBtn) openReportModalBtn.addEventListener('click', async () => {
            // Remove a necessidade do modal e gera o relatório com os dados atuais
            const reportData = { scoAlertsData, actionsData, donationsData, distributionsData };
            showNotification('Gerando relatório situacional atual...');
            await generateSituationalReport(reportData);
        });
    }
});

function loadVehicles() {
    const searchTerm = document.getElementById('filter-search').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const statusFilter = document.getElementById('filter-status').value;
    const marcaFilter = document.getElementById('filter-marca').value;
    const anoFilter = document.getElementById('filter-ano').value;

    // Filtrar veículos
    let filteredVehicles = vehiclesData.filter(vehicle => {
        // Aplicar filtros
        let matches = true;

        // Filtro de busca
        if (searchTerm) {
            matches = matches && (
                vehicle.modelo.toLowerCase().includes(searchTerm) ||
                vehicle.placa.toLowerCase().includes(searchTerm) ||
                vehicle.codigo.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de tipo
        if (typeFilter) {
            matches = matches && (vehicle.especie === typeFilter);
        }

        // Filtro de marca
        if (marcaFilter) {
            matches = matches && (vehicle.marca === marcaFilter);
        }

        // Filtro de ano
        if (anoFilter) {
            matches = matches && (vehicle.anoFabricacao.toString() === anoFilter);
        }

        return matches;
    });

    // Popular a tabela
    const vehiclesList = document.getElementById('vehicles-list');
    vehiclesList.innerHTML = '';

    filteredVehicles.forEach(vehicle => {
        const row = document.createElement('tr');

        // Determina o status real do veículo e a qual ocorrência está vinculado
        const isMobilized = actionsData.some(action => action.status === 'em-andamento' && action.vehicles?.includes(vehicle.codigo));
        const vehicleStatus = isMobilized ? 'mobilizado' : 'disponivel';

        let statusText, statusClass, actionButton;

        if (vehicleStatus === 'disponivel') {
            statusText = 'Disponível';
            statusClass = 'status-active';
            actionButton = `<button class="action-btn btn-mobilize" data-id="${vehicle.codigo}">Mobilizar</button>`;
        } else {
            const action = actionsData.find(a => a.status === 'em-andamento' && a.vehicles?.includes(vehicle.codigo));
            statusText = `Mobilizado (${action ? action.id : 'N/A'})`;
            statusClass = 'status-mobilized';
            // O botão de desmobilizar agora leva para a ocorrência para ser desvinculado de lá
            actionButton = `<button class="action-btn btn-demobilize" data-action-id="${action?.id}">Ver Ocorrência</button>`;
        }

        // Cria o ícone de rastreamento apenas se a URL existir
        let rastreadorIcon = '';
        if (vehicle.rastreadorUrl) {
            rastreadorIcon = `
                <a href="${vehicle.rastreadorUrl}" target="_blank" title="Rastrear Veículo" class="action-btn" style="background-color: #17a2b8; color: white; padding: 6px 10px; vertical-align: middle; margin-left: 5px;">
                    <i class="fas fa-globe-americas"></i>
                </a>
            `;
        }

        if (statusFilter && vehicleStatus !== statusFilter) {
            return; // Pular este veículo se não corresponder ao filtro de status
        }

        row.innerHTML = `
            <td>${vehicle.codigo}</td>
            <td>${vehicle.modelo}</td>
            <td>${vehicle.marca}</td>
            <td>${vehicle.placa}</td>
            <td>${vehicle.anoFabricacao}</td>
            <td>${vehicle.especie}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn btn-details btn-vehicle-details" data-id="${vehicle.codigo}">Detalhes</button>
                ${actionButton}
                ${rastreadorIcon}
            </td>
        `;

        vehiclesList.appendChild(row);
    });

    // Atualizar informações de resumo
    document.getElementById('current-items').textContent = vehiclesList.children.length;
    document.getElementById('total-items').textContent = vehiclesData.length;

    // Configurar eventos dos botões
    document.querySelectorAll('.btn-vehicle-details').forEach(btn => {
        btn.addEventListener('click', (e) => showVehicleDetails(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-mobilize').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vehicleId = e.target.getAttribute('data-id');
            openMobilizeModal(vehicleId);
        });
    });

    document.querySelectorAll('.btn-demobilize').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const actionId = e.target.getAttribute('data-action-id');
            if (actionId) {
                // Navega para a seção de ocorrências e abre os detalhes
                document.querySelector('.submenu-item[data-target="ocorrencias"]').click();
                setTimeout(() => showActionDetails(actionId), 100);
            }
        });
    });

    // Atualizar opções de filtros
    updateFilterOptions();
}

function updateFilterOptions() {
    // Atualizar marcas
    const marcas = [...new Set(vehiclesData.map(v => v.marca))].sort();
    const marcaSelect = document.getElementById('filter-marca');
    const currentMarca = marcaSelect.value;

    marcaSelect.innerHTML = '<option value="">Todas</option>';
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        if (marca === currentMarca) option.selected = true;
        marcaSelect.appendChild(option);
    });

    // Atualizar anos
    const anos = [...new Set(vehiclesData.map(v => v.anoFabricacao))].sort((a, b) => b - a);
    const anoSelect = document.getElementById('filter-ano');
    const currentAno = anoSelect.value;

    anoSelect.innerHTML = '<option value="">Todos</option>';
    anos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        if (ano.toString() === currentAno) option.selected = true;
        anoSelect.appendChild(option);
    });
}

function showVehicleDetails(vehicleId) {
    const vehicle = vehiclesData.find(v => v.codigo === vehicleId);
    if (!vehicle) return;

    const modal = document.getElementById('vehicleDetailModal');
    const modalContent = document.getElementById('vehicle-detail-content');
    modal.querySelector('.modal-header').textContent = `Detalhes do Veículo - ${vehicle.modelo}`;

    modalContent.innerHTML = `
        <form id="vehicleDetailForm">
            <input type="hidden" id="vehicle-id" value="${vehicle.codigo}">
            <div class="detail-grid">
                <div class="detail-section">
                    <h4 class="detail-section-title"><i class="fas fa-car"></i> Informações Básicas</h4>
                    <div class="detail-item"><span class="detail-label">Código:</span> ${vehicle.codigo}</div>
                    <div class="detail-item"><span class="detail-label">Modelo:</span> ${vehicle.modelo}</div>
                    <div class="detail-item"><span class="detail-label">Marca:</span> ${vehicle.marca}</div>
                    <div class="detail-item"><span class="detail-label">Placa:</span> ${vehicle.placa}</div>
                    <div class="detail-item"><span class="detail-label">Ano:</span> ${vehicle.anoFabricacao}</div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-section-title"><i class="fas fa-id-card"></i> Documentação</h4>
                    <div class="detail-item"><span class="detail-label">Chassis:</span> ${vehicle.chassis}</div>
                    <div class="detail-item"><span class="detail-label">Renavam:</span> ${vehicle.renavam}</div>
                    <div class="detail-item"><span class="detail-label">Situação:</span> ${vehicle.situacao}</div>
                </div>
                <div class="detail-section full-width">
                    <h4 class="detail-section-title"><i class="fas fa-map-marker-alt"></i> Rastreamento</h4>
                    <label for="vehicle-tracker-url">URL do Rastreador</label>
                    <input type="url" id="vehicle-tracker-url" name="rastreadorUrl" value="${vehicle.rastreadorUrl || ''}" placeholder="https://rastreador.com/veiculo/...">
                </div>
            </div>
        </form>
    `;

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('vehicleDetailForm').addEventListener('submit', saveVehicleDetails);

    const vehicleDetailModal = document.getElementById('vehicleDetailModal');
    vehicleDetailModal.style.display = 'flex';
    vehicleDetailModal.setAttribute('aria-hidden', 'false');
}

function saveVehicleDetails(e) {
    e.preventDefault();
    const vehicleId = document.getElementById('vehicle-id').value;
    const rastreadorUrl = document.getElementById('vehicle-tracker-url').value;

    const vehicleIndex = vehiclesData.findIndex(v => v.codigo === vehicleId);
    if (vehicleIndex !== -1) {
        vehiclesData[vehicleIndex].rastreadorUrl = rastreadorUrl;
        showNotification('URL de rastreamento salva com sucesso!');
        saveAllData();
        loadVehicles(); // Recarrega a lista para mostrar/ocultar o ícone
        document.getElementById('vehicleDetailModal').style.display = 'none';
    } else {
        showNotification('Erro: Veículo não encontrado.', 'error');
    }
}

function toggleVehicleStatus(vehicleId, action) {
    const vehicle = vehiclesData.find(v => v.codigo === vehicleId);
    if (!vehicle) return;

    const actionText = action === 'mobilizar' ? 'mobilizado' : 'desmobilizado';
    showNotification(`Veículo ${vehicle.placa} ${actionText} com sucesso!`);

    // Recarregar a lista para atualizar os status
    setTimeout(() => {
        loadVehicles();
    }, 500);
}

function openMobilizeModal(vehicleId) {
    const vehicle = vehiclesData.find(v => v.codigo === vehicleId);
    if (!vehicle) return;

    const modal = document.getElementById('mobilizeVehicleModal');
    const select = document.getElementById('mobilize-action-select');
    select.innerHTML = '';

    const ongoingActions = actionsData.filter(a => a.status === 'em-andamento');

    if (ongoingActions.length === 0) {
        select.innerHTML = '<option value="">Nenhuma ocorrência em andamento</option>';
        select.disabled = true;
        modal.querySelector('button[type="submit"]').disabled = true;
    } else {
        ongoingActions.forEach(action => {
            const option = document.createElement('option');
            option.value = action.id;
            option.textContent = `${action.id}: ${action.descricao}`;
            select.appendChild(option);
        });
        select.disabled = false;
        modal.querySelector('button[type="submit"]').disabled = false;
    }

    document.getElementById('mobilize-vehicle-id').value = vehicleId;
    document.getElementById('mobilize-vehicle-name').textContent = `${vehicle.modelo} - ${vehicle.placa}`;

    // Adiciona o listener aqui, quando o modal é aberto
    document.getElementById('mobilizeVehicleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const vehicleId = document.getElementById('mobilize-vehicle-id').value;
        const actionId = document.getElementById('mobilize-action-select').value;
        linkVehicleToAction(vehicleId, actionId);
        modal.style.display = 'none';
    });

    modal.style.display = 'flex';
}



function showNotification(text, type = 'success') {
    const n = document.createElement('div');
    let iconClass, backgroundColor;

    switch (type) {
        case 'error':
            iconClass = 'fas fa-times-circle';
            backgroundColor = '#c82333'; // Vermelho
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            backgroundColor = '#f57c00'; // Laranja
            break;
        default: // success
            iconClass = 'fas fa-check-circle';
            backgroundColor = '#4CAF50'; // Verde
            break;
    }

    n.style.position = 'fixed';
    n.style.right = '20px';
    n.style.top = '85px'; // Ajustado para aparecer abaixo do cabeçalho superior
    n.style.background = backgroundColor;
    n.style.color = 'white';
    n.style.padding = '12px 16px';
    n.style.borderRadius = '8px';
    n.style.boxShadow = '0 6px 20px rgba(0,0,0,.15)';
    n.style.zIndex = 9999;
    n.innerHTML = `<i class="${iconClass}"></i> ${text}`;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.opacity = '0';
        n.style.transition = 'opacity 0.5s';
        setTimeout(() => n.remove(), 500);
    }, 3000);
}

// Função para carregar dados de monitoramento
function loadMonitoringData() {
    loadWeatherStations();
    loadRainGauges();
    updateSatelliteTime();
}

// Função para carregar estações meteorológicas
async function loadWeatherStations() {
    const container = document.getElementById('weather-stations-grid');
    container.innerHTML = '<p>Carregando dados meteorológicos...</p>';

    // Coordenadas de Santa Maria de Jetibá
    const lat = -20.033;
    const lon = -40.74;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=America/Sao_Paulo`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados da API: ${response.statusText}`);
        }
        const data = await response.json();
        const current = data.current;

        container.innerHTML = ''; // Limpa o container

        const stationElement = document.createElement('div');
        stationElement.className = 'monitor-item weather-station';
        stationElement.innerHTML = `
            <div class="monitor-item-label">Estação Meteorológica (SMJ)</div>
            <div class="monitor-details">
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${current.temperature_2m.toFixed(1)}°C</div>
                    <div class="monitor-detail-label">Temperatura</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${current.relative_humidity_2m}%</div>
                    <div class="monitor-detail-label">Umidade</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${current.wind_speed_10m.toFixed(1)} km/h</div>
                    <div class="monitor-detail-label">Vento (${current.wind_direction_10m}°)</div>
                </div>
            </div>
            <div class="monitor-item-status">
                <span class="status-indicator status-online"></span>
                <span>Online</span>
            </div>
            <div class="monitor-item-update">Atualizado: ${new Date(current.time).toLocaleString('pt-BR')}</div>
        `;
        container.appendChild(stationElement);

        // Atualiza os cards no dashboard principal
        const dashboardHumidity = document.getElementById('dashboard-humidity');
        const dashboardTemperature = document.getElementById('dashboard-temperature');

        if (dashboardHumidity) dashboardHumidity.textContent = `${current.relative_humidity_2m}%`;
        if (dashboardTemperature) dashboardTemperature.textContent = `${current.temperature_2m.toFixed(1)}°C`;


    } catch (error) {
        console.error("Falha ao carregar dados meteorológicos:", error);
        container.innerHTML = `<p style="color: #c82333;">Não foi possível carregar os dados meteorológicos. Tente novamente mais tarde.</p>`;
    }
}

// Função para carregar pluviômetros automáticos
async function loadRainGauges() {
    // Função auxiliar para formatar a data no padrão da API (aaaaMMddHHmm)
    const getFormattedDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
    };

    const container = document.getElementById('rain-gauges-grid');
    container.innerHTML = '<p>Carregando dados dos pluviômetros...</p>';
    const ibgeCode = '3204559'; // Código IBGE CORRETO para Santa Maria de Jetibá
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIiLCJwYXNzd29yZCI6IitMamJKS2xFUE1Zd0UzOCszY2RFb3RmaGc4L0lmYjFPTEk5TFNQRUlBTUU9IiwiaXNzIjoiYnIuZ292LmNlbWFkZW4iLCJleHAiOjE3NTg5MDQzOTAsImlhdCI6MTc1ODg4OTk5MCwianRpIjoiYjM5YjQzMDktYjYxMi00YjQ4LWE0MzYtM2I3YjYxN2Y1YjQzIiwidXNlcm5hbWUiOiJiN2JJNGw1eldtdFY0WFJ3VkJ5OHZnZTBYRUo0TGtyNnNodmxSazRlMGxJPSJ9.5-u5_p_iIeU1_yRj_1-K_q_q-y_z-x_w-v_u-t_s-r'; // NOVO TOKEN
    try {
        console.log('[ETAPA 1] Buscando dados cadastrais...');
        // 1. Buscar dados cadastrais das estações para ter nomes e bairros
        const cadastroUrl = `api/proxy_cemaden_cadastro.php?codibge=${ibgeCode}&token=${token}`;
        console.log('URL do Proxy de Cadastro:', cadastroUrl);
        const cadastroResponse = await fetch(cadastroUrl, {
            method: 'GET'
            // O token agora é passado como parâmetro para o proxy
        });
        console.log('Resposta do Proxy de Cadastro:', cadastroResponse);
        if (!cadastroResponse.ok) throw new Error(`Erro ao buscar cadastro: ${cadastroResponse.statusText}`);
        const estacoesCadastradas = await cadastroResponse.json();

        // Mapeia os dados cadastrais para fácil acesso
        // CORREÇÃO: A API de cadastro retorna 'codestacao' como chave.
        const cadastroMap = new Map(estacoesCadastradas.map(estacao => [estacao.codestacao, estacao]));

        // 2. Buscar os últimos registros de chuva
        console.log('[ETAPA 2] Buscando registros de chuva...');
        // A requisição agora é GET e os parâmetros vão na URL
        const dataParam = getFormattedDate(); // Gera a data no formato aaaaMMddHHmm
        const registrosUrl = `api/proxy_cemaden_registros.php?codibge=${ibgeCode}&data=${dataParam}&token=${token}`;

        // Log para depuração
        console.log("URL do Proxy de Registros:", registrosUrl);

        const registrosResponse = await fetch(registrosUrl, {
            method: 'GET'
            // Não há mais corpo (body) nem cabeçalhos customizados aqui,
            // pois o proxy PHP cuidará disso.
        });
        console.log('Resposta do Proxy de Registros:', registrosResponse);
        if (!registrosResponse.ok) throw new Error(`Erro ao buscar registros: ${registrosResponse.status} `);
        // A API retorna um array dentro de um objeto, então precisamos acessar a propriedade correta
        // CORREÇÃO: A API /pcds-acum/acumulados-historicos retorna um array diretamente,
        // não um objeto com a propriedade 'pcds'.
        const gaugesData = await registrosResponse.json();
        // const gaugesData = responseData.pcds; // Linha removida

        // Combina os dados de registro com os dados cadastrais (coordenadas)
        const gaugesWithCoords = gaugesData.map(gauge => ({ ...gauge, ...cadastroMap.get(gauge.codestacao) }));
        plotRainGaugesOnMap(gaugesWithCoords); // Plota os pluviômetros no mapa

        if (!gaugesData) {
            // Se a propriedade pcds não existir, lança um erro.
            throw new Error("A resposta da API não contém a propriedade 'pcds' esperada.");
        }

        container.innerHTML = ''; // Limpa a mensagem de "carregando"
        console.log('[ETAPA 3] Renderizando dados na tela.');

        // --- CÁLCULO PARA O DASHBOARD ---
        if (gaugesData.length > 0) {
            // Soma o acumulado de 24h de todas as estações
            const totalRainfall = gaugesData.reduce((sum, gauge) => sum + (gauge.acc24hr || 0), 0);
            // Calcula a média
            const averageRainfall = totalRainfall / gaugesData.length;

            // Atualiza o card no dashboard principal
            const rainfallCard = document.getElementById('rainfall24h'); // Card antigo
            const rainfallDashboardGauge = document.getElementById('rainfall24h-dashboard'); // Novo gauge

            if (rainfallCard) {
                rainfallCard.textContent = `${averageRainfall.toFixed(1)} mm`;
            }
            if (rainfallDashboardGauge) {
                rainfallDashboardGauge.textContent = `${averageRainfall.toFixed(1)} mm`;
            }
        }

        if (gaugesData.length === 0) {
            container.innerHTML = '<p>Nenhum pluviômetro encontrado para este município.</p>';
            return;
        }

        gaugesData.forEach(gauge => {
            // A API de registros retorna 'codestacao', que usamos para buscar no mapa de cadastro.
            const cadastroInfo = cadastroMap.get(gauge.codestacao);
            // Usa o 'nome' do cadastro se disponível, senão usa um fallback.
            const nomeEstacao = cadastroInfo ? `${cadastroInfo.nome} (${gauge.codestacao})` : `Estação ${gauge.codestacao}`;
            // A API de acumulados não informa o status 'online', então vamos assumir 'online' se houver dados.
            const statusClass = 'status-online';
            const statusText = 'Online';

            const gaugeElement = document.createElement('div');
            gaugeElement.className = 'monitor-item rain-gauge';
            gaugeElement.innerHTML = `
            <div class="monitor-item-label">${nomeEstacao}</div>
            <div class="monitor-details">
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc1hr ?? 0} mm</div>
                    <div class="monitor-detail-label">1h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc3hr ?? 0} mm</div>
                    <div class="monitor-detail-label">3h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc6hr ?? 0} mm</div>
                    <div class="monitor-detail-label">6h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc12hr ?? 0} mm</div>
                    <div class="monitor-detail-label">12h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc24hr ?? 0} mm</div>
                    <div class="monitor-detail-label">24h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc96hr ?? 0} mm</div>
                    <div class="monitor-detail-label">96h</div>
                </div>
                <div class="monitor-detail-item">
                    <div class="monitor-detail-value">${gauge.acc120hr ?? 0} mm</div>
                    <div class="monitor-detail-label">120h</div>
                </div>
            </div>
            <div class="monitor-item-status">
                <span class="status-indicator ${statusClass}"></span>
                <span>${statusText}</span>
            </div>
            <div class="monitor-item-update">Último registro: ${new Date().toLocaleString('pt-BR')}</div>
        `;
            container.appendChild(gaugeElement);
        });

    } catch (error) {
        console.error("Falha ao carregar dados dos pluviômetros:", error);
        container.innerHTML = `<p style="color: #c82333;">Não foi possível carregar os dados dos pluviômetros do CEMADEN. Verifique a conexão, o token da API ou tente novamente mais tarde.</p>`;
    }
}

// Função para atualizar horário da imagem de satélite
function updateSatelliteTime() {
    const now = new Date();
    const timeString = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('last-satellite-update').textContent = timeString;
}

// Funções para a seção de abrigos
function loadShelters() {
    const searchTerm = document.getElementById('filter-shelter-search').value.toLowerCase();
    const statusFilter = document.getElementById('filter-shelter-status').value;

    const filteredShelters = sheltersData.filter(shelter => {
        const matchesSearch = searchTerm ?
            shelter.nome.toLowerCase().includes(searchTerm) ||
            shelter.localizacao.toLowerCase().includes(searchTerm) ||
            shelter.responsaveis.toLowerCase().includes(searchTerm) : true;

        const matchesStatus = statusFilter ? shelter.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const sheltersList = document.getElementById('shelters-list');
    sheltersList.innerHTML = '';

    filteredShelters.forEach(shelter => {
        const row = document.createElement('tr');

        let statusText = 'Aberto';
        let statusClass = 'status-active';
        if (shelter.status === 'lotado') {
            statusText = 'Lotado';
            statusClass = 'status-inactive';
        } else if (shelter.status === 'fechado') {
            statusText = 'Fechado';
            statusClass = 'status-inactive';
        }

        row.innerHTML = `
        <td>${shelter.nome}</td>
        <td>${shelter.localizacao}</td>
        <td>${shelter.responsaveis}</td>
        <td>${shelter.capacidade}</td>
        <td>${shelter.desalojados + shelter.desabrigados}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
            <button class="action-btn btn-details btn-shelter-details" data-id="${shelter.id}">Detalhes</button>
            <button class="action-btn btn-danger btn-shelter-delete" data-id="${shelter.id}">Excluir</button>
        </td>
    `;
        sheltersList.appendChild(row);
    });

    // Adicionar listeners para os botões de detalhes e exclusão
    document.querySelectorAll('.btn-shelter-details').forEach(btn => {
        btn.addEventListener('click', (e) => openShelterModal(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-shelter-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentShelterIdToDelete = e.target.getAttribute('data-id');
            document.getElementById('confirmDeleteModal').style.display = 'flex';
        });
    });
}

async function showShelterDetails(shelterId) {
    const shelter = sheltersData.find(s => s.id === shelterId);
    if (!shelter) return;

    const modal = document.getElementById('shelterModal');
    const modalBody = document.getElementById('shelter-modal-body');
    const editButton = document.getElementById('editShelterButton');
    const saveButton = document.getElementById('saveShelterButton');

    const fullData = shelter.fullData || {};
    const totalAcomodados = (shelter.desalojados || 0) + (shelter.desabrigados || 0);

    // Monta o HTML para visualização
    modalBody.innerHTML = `
        <div class="modal-tabs">
            <button class="modal-tab-button active" data-tab="info-basicas">Básico</button>
            <button class="modal-tab-button" data-tab="contatos">Contatos</button>
            <button class="modal-tab-button" data-tab="infraestrutura">Infraestrutura</button>
            <button class="modal-tab-button" data-tab="historico">Histórico</button>
        </div>
        <div id="tab-content-container">
            <div id="info-basicas" class="detail-section">
                <div class="detail-item"><span class="detail-label">Endereço:</span> ${shelter.localizacao}</div>
                <div class="detail-item"><span class="detail-label">Coordenadas:</span> ${fullData.coordenadas_gps || 'Não informado'}</div>
                <div class="detail-item"><span class="detail-label">Tipo:</span> ${fullData.tipo_abrigo || 'Não informado'}</div>
                <div class="detail-item"><span class="detail-label">Status:</span> ${fullData.status_operacional || 'Não informado'}</div>
                <hr style="margin: 10px 0;">
                <div class="detail-item"><span class="detail-label">Capacidade:</span> ${shelter.capacidade} pessoas</div>
                <div class="detail-item"><span class="detail-label">Acomodados:</span> ${totalAcomodados} pessoas</div>
            </div>
            <div id="contatos" class="detail-section" style="display: none;">
                <div class="detail-item"><span class="detail-label">Responsável/Diretor:</span> ${shelter.responsaveis}</div>
                <div class="detail-item"><span class="detail-label">Telefone:</span> ${fullData.direcao_telefone || shelter.contato}</div>
                <hr style="margin: 10px 0;">
                <div class="detail-item"><span class="detail-label">Responsável pelas Chaves:</span> ${fullData.chaves_nome || 'Não informado'}</div>
                <div class="detail-item"><span class="detail-label">Telefone (Chaves):</span> ${fullData.chaves_telefone || 'N/A'}</div>
            </div>
            <div id="infraestrutura" class="detail-section" style="display: none;">
                <div class="detail-item"><span class="detail-label">Salas Disponíveis:</span> ${fullData.salas_disponiveis || 0}</div>
                <div class="detail-item"><span class="detail-label">Banheiros:</span> ${fullData.banheiros || 0}</div>
                <div class="detail-item"><span class="detail-label">Banheiros Adaptados (PCD):</span> ${fullData.banheiros_adaptados || 0}</div>
                <div class="detail-item"><span class="detail-label">Possui Cozinha:</span> ${fullData.possui_cozinha === 'sim' ? 'Sim' : 'Não'}</div>
                <div class="detail-item"><span class="detail-label">Possui Chuveiros:</span> ${fullData.chuveiros === 'sim' ? 'Sim' : 'Não'}</div>
                <hr style="margin: 10px 0;">
                <div class="detail-item"><span class="detail-label">Colchões:</span> ${fullData.colchoes_quantidade || shelter.colchoes || 0}</div>
                <div class="detail-item"><span class="detail-label">Cobertores:</span> ${fullData.cobertores_quantidade || 0}</div>
            </div>
            <div id="historico" class="detail-section" style="display: none;">
                <h4 class="detail-section-title" style="border: none; padding-bottom: 0;"><i class="fas fa-history"></i> Histórico de Itens Recebidos</h4>
                <div id="shelter-distribution-list-view" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
    `;

    // Adiciona a lógica para trocar de aba
    modalBody.querySelectorAll('.modal-tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Desativa todas as abas e painéis
            modalBody.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
            modalBody.querySelectorAll('.detail-section, .form-section').forEach(panel => panel.style.display = 'none');

            // Ativa a aba e o painel clicados
            const tabId = button.getAttribute('data-tab');
            button.classList.add('active');
            const activePanel = modalBody.querySelector(`#${tabId}`);
            if (activePanel) {
                activePanel.style.display = 'block';
            }
        });
    });

    // Preenche o histórico de distribuição
    const distributionList = document.getElementById('shelter-distribution-list-view');
    const shelterDistributions = distributionsData.filter(d => d.destination === shelter.nome);
    if (shelterDistributions.length > 0) {
        distributionList.innerHTML = shelterDistributions.map(dist => `
                    <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <div><strong>${dist.quantity} un. de ${dist.item}</strong></div>
                        <div style="font-size: 13px; color: #666;">
                            Distribuído em: ${new Date(dist.date).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                `).join('');
    } else {
        distributionList.innerHTML = '<p>Nenhum item distribuído para este abrigo.</p>';
    }

    modal.querySelector('.modal-header').textContent = `Detalhes do Abrigo - ${shelter.nome}`;
    editButton.style.display = 'block';
    saveButton.style.display = 'none';
    modal.style.display = 'flex';

    // Lógica para o botão "Editar"
    editButton.onclick = async () => {
        modal.querySelector('.modal-header').textContent = `Editando Abrigo - ${shelter.nome}`;
        modalBody.innerHTML = '<p>Carregando formulário...</p>';

        // Carrega o HTML do formulário
        const response = await fetch('pages/partials/form-abrigo.html');
        const formHtml = await response.text(); // O HTML completo do formulário

        // Monta a estrutura com abas e o formulário
        modalBody.innerHTML = `
            <div class="modal-tabs">
                <button class="modal-tab-button active" data-tab="form-info-basicas">Básico</button>
                <button class="modal-tab-button" data-tab="form-contatos">Contatos</button>
                <button class="modal-tab-button" data-tab="form-infraestrutura">Infraestrutura</button>
                <button class="modal-tab-button" data-tab="form-outros">Outros</button>
            </div>
            <form id="shelterForm">
                <div id="form-content-container">
                    <!-- O HTML do form-abrigo.html será dividido e inserido aqui -->
                </div>
            </form>
        `;

        // Injeta o HTML do formulário e o divide em painéis de abas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formHtml;
        const formSections = Array.from(tempDiv.children);
        const formContentContainer = document.getElementById('form-content-container');

        // Mapeia seções para abas
        formSections[0].id = "form-info-basicas"; // Informações Básicas
        formSections[1].id = "form-contatos"; // Contatos Principais
        formSections[2].id = "form-infraestrutura"; // Infraestrutura
        formSections[3].id = "form-outros"; // Material, Acomodados, etc.
        formSections[4].id = "form-outros";
        formSections[5].id = "form-outros";
        formSections[6].id = "form-outros";

        // Agrupa as seções "Outros"
        const outrosWrapper = document.createElement('div');
        outrosWrapper.id = 'form-outros';
        outrosWrapper.style.display = 'none';

        formSections.forEach((section, index) => {
            if (section.id === 'form-outros') {
                outrosWrapper.appendChild(section);
            } else {
                if (index > 0) section.style.display = 'none'; // Esconde todas menos a primeira
                formContentContainer.appendChild(section);
            }
        });
        formContentContainer.appendChild(outrosWrapper);

        // Preenche o formulário com os dados existentes
        document.getElementById('local').value = shelter.nome || '';
        document.getElementById('capacidade').value = shelter.capacidade || '';
        document.getElementById('endereco_completo').value = shelter.localizacao || '';
        document.getElementById('coordenadas_gps').value = fullData.coordenadas_gps || '';
        document.getElementById('tipo_abrigo').value = fullData.tipo_abrigo || '';
        document.getElementById('status_operacional').value = fullData.status_operacional || 'ativo';
        document.getElementById('direcao_nome').value = shelter.responsaveis || '';
        document.getElementById('direcao_telefone').value = fullData.direcao_telefone || shelter.contato || '';
        document.getElementById('chaves_nome').value = fullData.chaves_nome || '';
        document.getElementById('chaves_telefone').value = fullData.chaves_telefone || '';
        document.getElementById('salas_disponiveis').value = fullData.salas_disponiveis || '';
        document.getElementById('banheiros').value = fullData.banheiros || '';
        document.getElementById('banheiros_adaptados').value = fullData.banheiros_adaptados || '';
        document.getElementById('chuveiros').value = fullData.chuveiros || 'nao';
        document.getElementById('possui_cozinha').value = fullData.possui_cozinha || 'nao';
        document.getElementById('colchoes_quantidade').value = fullData.colchoes_quantidade || shelter.colchoes || '';
        document.getElementById('cobertores_quantidade').value = fullData.cobertores_quantidade || '';
        document.getElementById('produtos_higiene').value = fullData.produtos_higiene || 'nao';
        document.getElementById('observacoes').value = fullData.observacoes || '';
        document.getElementById('data_ultima_inspecao').value = fullData.data_ultima_inspecao || '';
        document.getElementById('responsavel_cadastro').value = fullData.responsavel_cadastro || '';

        // Adiciona o ID ao formulário para a função saveShelter saber que é uma edição
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'shelter-id';
        idInput.name = 'id';
        idInput.value = shelter.id;
        document.getElementById('shelterForm').appendChild(idInput);

        // Adiciona a lógica para trocar de aba no modo de edição
        modalBody.querySelectorAll('.modal-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // Desativa todas as abas e painéis
                modalBody.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
                formContentContainer.querySelectorAll('.form-section, div[id^="form-"]').forEach(panel => panel.style.display = 'none');

                // Ativa a aba e o painel clicados
                const tabId = button.getAttribute('data-tab');
                button.classList.add('active');
                const activePanel = formContentContainer.querySelector(`#${tabId}`);
                if (activePanel) {
                    activePanel.style.display = 'block';
                }
            });
        });

        // Adiciona o listener para o formulário recém-criado
        document.getElementById('shelterForm').addEventListener('submit', saveShelter);

        // Troca os botões
        editButton.style.display = 'none';
        saveButton.style.display = 'block';
    };
}

function showPersonDetails(personId) {
    const person = riskPersonsData.find(p => p.id === personId);
    if (!person) return;

    // Encontrar o histórico de distribuição para esta pessoa/família
    const distributions = distributionsData.filter(d => d.destination === person.name);
    let distributionHistoryHtml = '<li>Nenhuma distribuição registrada.</li>';
    if (distributions.length > 0) {
        distributionHistoryHtml = distributions.map(dist => `
            <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                <div><strong>${dist.quantity} un. de ${dist.item}</strong></div>
                <div style="font-size: 13px; color: #666;">
                    Distribuído em: ${new Date(dist.date).toLocaleDateString('pt-BR')}
                </div>
            </div>
        `).join('');
    }

    const content = document.getElementById('person-detail-content');
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div><strong>Nome:</strong> ${person.name}</div>
            <div><strong>Endereço:</strong> ${person.address}</div>
            <div><strong>Área de Risco:</strong> ${person.riskArea}</div>
            <div><strong>Contato:</strong> ${person.contact}</div>
            <div style="grid-column: 1 / -1;"><strong>Vulnerabilidades:</strong> ${person.vulnerabilities.join(', ')}</div>
        </div>
        <div class="card">
            <div class="card-header"><i class="fas fa-history"></i><h3>Histórico de Itens Recebidos</h3></div>
            <ul class="card-list">${distributionHistoryHtml}</ul>
        </div>
    `;
    document.getElementById('personDetailModal').style.display = 'flex';
}

function saveShelter(e) {
    e.preventDefault();

    const form = e.target.closest('form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;

    if (id) {
        // Editar abrigo existente
        const index = sheltersData.findIndex(s => s.id === id);
        if (index !== -1) {
            const existingShelter = sheltersData[index];
            // Atualiza os campos principais e mantém o resto
            sheltersData[index] = {
                ...existingShelter,
                nome: data.local,
                localizacao: data.endereco_completo,
                capacidade: parseInt(data.capacidade, 10),
                responsaveis: data.direcao_nome,
                contato: data.direcao_telefone,
                colchoes: parseInt(data.colchoes_quantidade, 10) || 0,
                desalojados: parseInt(data['shelter-displaced'], 10) || existingShelter.desalojados,
                desabrigados: parseInt(data['shelter-homeless'], 10) || existingShelter.desabrigados,
                fullData: data // Salva todos os dados do formulário
            };
            showNotification('Abrigo atualizado com sucesso!');
        }
    } else {
        // Adicionar novo abrigo (esta lógica agora está em cadastro-abrigo.js)
        const newId = 'abg' + (sheltersData.length + 1).toString().padStart(3, '0');
        sheltersData.push({
            id: newId,
            nome, localizacao, capacidade, responsaveis,
            desalojados, desabrigados, cestasBasicas, colchoes, agua,
            status: 'aberto'
        });
        showNotification('Novo abrigo adicionado com sucesso!');
    }

    document.getElementById('shelterModal').style.display = 'none';
    // Reseta o modal para o estado de visualização
    document.getElementById('editShelterButton').style.display = 'none';
    document.getElementById('saveShelterButton').style.display = 'none';
    document.getElementById('shelter-modal-body').innerHTML = '';

    loadShelters();
    updateDashboardAlerts();
    saveAllData();
}

async function openShelterModal(shelterId = null) {
    const modal = document.getElementById('shelterModal');
    const modalBody = document.getElementById('shelter-modal-body');
    const modalHeader = modal.querySelector('.modal-header');
    const saveButton = document.getElementById('saveShelterButton');
    const editButton = document.getElementById('editShelterButton');

    modalHeader.textContent = shelterId ? 'Editar Abrigo' : 'Adicionar Novo Abrigo';
    modalBody.innerHTML = '<p>Carregando formulário...</p>';
    modal.style.display = 'flex';

    try {
        const response = await fetch('pages/cadastro-abrigo.html');
        const formPartialHtml = await response.text();

        // Monta a estrutura com abas e o formulário
        modalBody.innerHTML = `
            <div class="modal-tabs">
                <button class="modal-tab-button active" data-tab="basico">Básico</button>
                <button class="modal-tab-button" data-tab="emergencia">Emergência</button>
                <button class="modal-tab-button" data-tab="contatos">Contatos</button>
                <button class="modal-tab-button" data-tab="infraestrutura">Infraestrutura</button>
                <button class="modal-tab-button" data-tab="recursos">Recursos</button>
                <button class="modal-tab-button" data-tab="outros">Outros</button>
            </div>
            <form id="shelterForm">
                ${formPartialHtml}
            </form>
        `;

        const form = modalBody.querySelector('#shelterForm');
        form.addEventListener('submit', handleShelterFormSubmit); // Listener é adicionado aqui

        // Lógica de abas
        const formSections = Array.from(form.querySelectorAll('.form-section'));

        // Esconde todos os painéis, exceto o primeiro
        formSections.forEach(section => section.style.display = 'none');
        form.querySelector('[data-tab-id="basico"]').style.display = 'block';

        modalBody.querySelectorAll('.modal-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                modalBody.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                formSections.forEach(section => section.style.display = 'none');

                const tabId = button.getAttribute('data-tab');
                form.querySelectorAll(`[data-tab-id="${tabId}"]`).forEach(sectionToShow => {
                    sectionToShow.style.display = 'block';
                });
            });
        });

        if (shelterId) {
            const shelterToEdit = sheltersData.find(s => s.id === shelterId);
            if (shelterToEdit) {
                const idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.name = 'id';
                idInput.value = shelterId;
                form.appendChild(idInput);

                // Preenche o formulário com os dados existentes (fullData)
                const data = shelterToEdit.fullData || {};

                // Itera sobre todos os dados e preenche os campos do formulário
                for (const key in data) {
                    const field = form.querySelector(`[name="${key}"]`);
                    const fields = form.querySelectorAll(`[name="${key}[]"]`); // Para checkboxes

                    if (field) {
                        if (field.type === 'radio') {
                            const fieldToSelect = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                            if (fieldToSelect) fieldToSelect.checked = true;
                            // Dispara o evento 'change' para acionar a lógica de campos condicionais
                            const event = new Event('change', {
                                bubbles: true,
                                cancelable: true,
                            });
                            fieldToSelect.dispatchEvent(event);
                        } else {
                            field.value = data[key];
                        }
                    } else if (fields.length > 0) { // Lógica para checkboxes
                        const values = Array.isArray(data[key]) ? data[key] : [data[key]];
                        fields.forEach(checkbox => {
                            if (values.includes(checkbox.value)) {
                                checkbox.checked = true;
                            }
                        });
                    }
                }

                // Preenche campos que podem estar no nível superior do objeto shelter
                if (!data.local) form.querySelector('#local').value = shelterToEdit.nome || '';
                if (!data.capacidade) form.querySelector('#capacidade').value = shelterToEdit.capacidade || '';
                if (!data.endereco_completo) form.querySelector('#endereco_completo').value = shelterToEdit.localizacao || '';
                if (!data.direcao_nome) form.querySelector('#direcao_nome').value = shelterToEdit.responsaveis || '';
                if (!data.direcao_telefone) form.querySelector('#direcao_telefone').value = shelterToEdit.contato || '';
                if (!data.colchoes_quantidade) form.querySelector('#colchoes_quantidade').value = shelterToEdit.colchoes || '';

            }
        }

        setupShelterFormListeners(form); // Adiciona os listeners para os campos condicionais

        editButton.style.display = 'none'; // Esconde o botão de editar
        saveButton.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar formulário de abrigo:', error);
        modalBody.innerHTML = '<p>Ocorreu um erro ao carregar o formulário. Tente novamente.</p>';
        saveButton.style.display = 'none';
    }
}

function setupShelterFormListeners(form) {
    // Lógica para Chuveiros
    const possuiChuveiroRadios = form.querySelectorAll('input[name="possui_chuveiro"]');
    const chuveirosQuantidadeGroup = form.querySelector('#chuveiros_quantidade_group');
    const chuveirosInstalacaoGroup = form.querySelector('#chuveiros_instalacao_group');

    possuiChuveiroRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'sim') {
                chuveirosQuantidadeGroup.style.display = 'block';
                chuveirosInstalacaoGroup.style.display = 'none';
            } else { // 'nao'
                chuveirosQuantidadeGroup.style.display = 'none';
                chuveirosInstalacaoGroup.style.display = 'block';
            }
        });
    });

    const localInstalacaoRadios = form.querySelectorAll('input[name="local_instalacao_chuveiro"]');
    const localQuantidadeGroup = form.querySelector('#chuveiros_local_quantidade_group');

    localInstalacaoRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            localQuantidadeGroup.style.display = (e.target.value === 'sim') ? 'block' : 'none';
        });
    });

    // Lógica para Refeitório
    const possuiRefeitorioRadios = form.querySelectorAll('input[name="possui_refeitorio"]');
    const refeitorioMesasGroup = form.querySelector('#refeitorio_mesas_group');

    possuiRefeitorioRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            refeitorioMesasGroup.style.display = (e.target.value === 'sim') ? 'block' : 'none';
        });
    });
}


async function handleShelterFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;

    if (id) { // Editando
        const index = sheltersData.findIndex(s => s.id === id);
        if (index !== -1) {
            const existingShelter = sheltersData[index];
            sheltersData[index] = { ...existingShelter, nome: data.local, localizacao: data.endereco_completo, capacidade: parseInt(data.capacidade, 10), responsaveis: data.direcao_nome, contato: data.direcao_telefone, colchoes: parseInt(data.colchoes_quantidade, 10) || 0, fullData: data };
            showNotification('Abrigo atualizado com sucesso!');
        }
    } else { // Criando
        const newId = 'abg' + (sheltersData.length + 1).toString().padStart(3, '0');
        const newShelter = {
            id: newId, nome: data.local, localizacao: data.endereco_completo,
            capacidade: parseInt(data.capacidade, 10), responsaveis: data.direcao_nome,
            contato: data.direcao_telefone, desalojados: 0, desabrigados: 0,
            colchoes: parseInt(data.colchoes_quantidade, 10) || 0, status: 'aberto',
            fullData: data
        };
        sheltersData.push(newShelter);
        showNotification('Novo abrigo cadastrado com sucesso!');
    }

    await saveAllData();
    loadShelters();
    document.getElementById('shelterModal').style.display = 'none';
}


function deleteShelter() {
    if (!currentShelterIdToDelete) return;

    const index = sheltersData.findIndex(s => s.id === currentShelterIdToDelete);
    if (index !== -1) {
        sheltersData.splice(index, 1);
        showNotification('Abrigo removido com sucesso!');
        loadShelters();
        saveAllData();
    }
    document.getElementById('confirmDeleteModal').style.display = 'none';
    currentShelterIdToDelete = null;
}

// Funções para a seção de ações do SCO
function loadActions() {
    const searchTerm = document.getElementById('filter-action-search').value.toLowerCase();
    const phaseFilter = document.getElementById('filter-action-phase').value;
    const statusFilter = document.getElementById('filter-action-status').value;

    const filteredActions = actionsData.filter(action => {
        const matchesSearch = searchTerm ?
            action.descricao.toLowerCase().includes(searchTerm) ||
            action.responsavel.toLowerCase().includes(searchTerm) : true;
        const matchesPhase = phaseFilter ? action.fase === phaseFilter : true;
        const matchesStatus = statusFilter ? action.status === statusFilter : true;

        return matchesSearch && matchesPhase && matchesStatus;
    });

    const actionsList = document.getElementById('actions-list');
    actionsList.innerHTML = '';

    filteredActions.forEach(action => {
        const row = document.createElement('tr');
        const statusMap = {
            'nao-iniciada': { text: 'Não Iniciada', class: 'status-nao-iniciada' },
            'em-andamento': { text: 'Em Andamento', class: 'status-em-andamento' },
            'concluida': { text: 'Concluída', class: 'status-concluida' },
            'cancelada': { text: 'Cancelada', class: 'status-cancelada' },
        };
        const statusInfo = statusMap[action.status];

        row.innerHTML = `
        <td>${action.descricao}</td>
        <td>${action.fase}</td>
        <td>${action.responsavel}</td>
        <td><span class="action-status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
        <td>${action.ultimaAtualizacao}</td>
        <td>
            <button class="action-btn btn-details btn-action-details" data-id="${action.id}">Detalhes</button>
            <button class="action-btn btn-danger btn-action-delete" data-id="${action.id}">Excluir</button>
        </td>
    `;
        actionsList.appendChild(row);
    });

    // Adicionar listeners para os botões de detalhes e exclusão
    document.querySelectorAll('.btn-action-details').forEach(btn => {
        btn.addEventListener('click', (e) => showActionDetails(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-action-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentActionIdToDelete = e.target.getAttribute('data-id');
            document.getElementById('confirmDeleteActionModal').style.display = 'flex';
        });
    });
}

function showActionDetails(actionId) {
    const action = actionsData.find(a => a.id === actionId);
    if (!action) return;

    const modal = document.getElementById('actionModal');
    document.getElementById('action-id').value = action.id;
    document.getElementById('action-description').value = action.descricao;
    document.getElementById('action-responsible').value = action.responsavel;
    document.getElementById('action-phase').value = action.fase;
    document.getElementById('action-status').value = action.status;
    document.getElementById('action-equipments').value = action.equipments || '';
    document.getElementById('action-latitude').value = action.latitude || '';
    document.getElementById('action-longitude').value = action.longitude || '';

    // Limpa e popula as listas de seleção e de mobilizados
    populateActionModalLists(action);

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('actionForm').addEventListener('submit', saveAction);

    modal.querySelector('.modal-header').textContent = `Detalhes da Ação - ${action.id}`;
    modal.style.display = 'flex';
}

function saveAction(e) {
    e.preventDefault(); // Impede o recarregamento da página
    const id = document.getElementById('action-id').value;
    const descricao = document.getElementById('action-description').value;
    const responsavel = document.getElementById('action-responsible').value;
    const fase = document.getElementById('action-phase').value;
    const status = document.getElementById('action-status').value;
    const equipments = document.getElementById('action-equipments').value;
    const latitude = document.getElementById('action-latitude').value;
    const longitude = document.getElementById('action-longitude').value;

    // Captura os IDs da lista de itens mobilizados, não mais do select
    const selectedVehicles = Array.from(document.querySelectorAll('#mobilized-vehicles-list li')).map(li => li.dataset.id);
    const selectedMembers = Array.from(document.querySelectorAll('#mobilized-members-list li')).map(li => li.dataset.id);

    if (id) {
        // Editar ação existente
        const index = actionsData.findIndex(a => a.id === id);
        if (index !== -1) {
            actionsData[index] = {
                ...actionsData[index],
                descricao, responsavel, fase, status, equipments, latitude, longitude,
                vehicles: selectedVehicles, members: selectedMembers,
                ultimaAtualizacao: new Date().toLocaleString('pt-BR')
            };
            showNotification('Ação atualizada com sucesso!');
        }
    } else {
        // Adicionar nova ação
        const newId = 'sco' + (actionsData.length + 1).toString().padStart(3, '0');
        actionsData.push({
            id: newId,
            descricao, responsavel, fase, status, equipments, latitude, longitude,
            vehicles: selectedVehicles, members: selectedMembers,
            ultimaAtualizacao: new Date().toLocaleString('pt-BR')
        });
        showNotification('Nova ação adicionada com sucesso!');
    }

    document.getElementById('actionModal').style.display = 'none';
    loadActions();
    loadVehicles(); // Recarrega a lista de veículos para refletir a mudança de status
    saveAllData(); // Salva automaticamente no backend
}

function deleteAction() {
    if (!currentActionIdToDelete) return;

    const index = actionsData.findIndex(a => a.id === currentActionIdToDelete);
    if (index !== -1) {
        actionsData.splice(index, 1);
        showNotification('Ação removida com sucesso!');
        loadActions();
        saveAllData(); // Salva automaticamente no backend
    }
    document.getElementById('confirmDeleteActionModal').style.display = 'none';
    currentActionIdToDelete = null;
}

// Funções para a seção de Alertas do SCO
function loadScoAlerts() {
    const alertsList = document.getElementById('sco-alerts-list');
    alertsList.innerHTML = '';

    scoAlertsData.forEach(alert => {
        const row = document.createElement('tr');

        const formatDateTime = (dt) => new Date(dt).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        let endDateHtml;
        if (alert.end) {
            endDateHtml = formatDateTime(alert.end);
        } else {
            endDateHtml = `<button class="action-btn btn-mobilize btn-cease-alert" data-id="${alert.id}">Cessar Alerta</button>`;
        }


        row.innerHTML = `
        <td>${alert.category}</td>
        <td>${alert.type}</td>
        <td>${alert.attachment ? '<i class="fas fa-paperclip" title="' + alert.attachment + '"></i>' : '-'}</td>
        <td>${alert.region}</td>
        <td>${alert.intensity}</td>
        <td>${formatDateTime(alert.start)}</td>
        <td>${endDateHtml}</td>
        <td>
            <button class="action-btn btn-details btn-sco-alert-details" data-id="${alert.id}">Detalhes</button>
            <button class="action-btn btn-danger btn-sco-alert-delete" data-id="${alert.id}">Excluir</button>
        </td>
    `;
        alertsList.appendChild(row);
    });

    // Adicionar listeners para os botões de detalhes e exclusão
    document.querySelectorAll('.btn-sco-alert-details').forEach(btn => {
        btn.addEventListener('click', (e) => showScoAlertDetails(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-cease-alert').forEach(btn => {
        btn.addEventListener('click', (e) => ceaseScoAlert(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-sco-alert-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentScoAlertIdToDelete = e.target.getAttribute('data-id');
            document.getElementById('confirmDeleteScoAlertModal').style.display = 'flex';
        });
    });
}

function showScoAlertDetails(alertId) {
    const alert = scoAlertsData.find(a => a.id === alertId);
    if (!alert) return;

    const modal = document.getElementById('scoAlertModal');
    document.getElementById('sco-alert-id').value = alert.id;
    document.getElementById('sco-alert-category').value = alert.category;
    document.getElementById('sco-alert-type').value = alert.type;
    document.getElementById('sco-alert-intensity').value = alert.intensity;
    document.getElementById('sco-alert-start').value = alert.start || '';
    document.getElementById('sco-alert-end').value = alert.end || '';
    document.getElementById('sco-alert-region').value = alert.region;
    document.getElementById('sco-alert-description').value = alert.description || '';

    // Exibir o anexo, se houver
    const fileDisplay = document.getElementById('sco-alert-file-display');
    if (alert.attachment) {
        fileDisplay.innerHTML = `<div class="file-display-card"><i class="fas fa-file-alt"></i> Arquivo atual: <a href="#" onclick="alert('Visualizando ${alert.attachment}')">${alert.attachment}</a></div>`;
    } else {
        fileDisplay.innerHTML = '';
    }

    modal.querySelector('.modal-header').textContent = `Detalhes do Alerta - ${alert.type}`;
    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('scoAlertForm').addEventListener('submit', saveScoAlert);

    modal.style.display = 'flex';
    setupScoAlertModalListeners(); // Configura os listeners do modal de anexo
}

function setupScoAlertModalListeners() {
    const modal = document.getElementById('scoAlertModal');
    if (!modal) return;

    const dropArea = modal.querySelector('.file-drop-area');
    const fileInput = modal.querySelector('#sco-alert-file');
    const fileDisplay = modal.querySelector('#sco-alert-file-display');

    if (!dropArea || !fileInput || !fileDisplay) return;

    const updateFileDisplay = () => {
        if (fileInput.files.length > 0) {
            fileDisplay.innerHTML = `<div class="file-display-card"><i class="fas fa-file-alt"></i> Novo arquivo: <strong>${fileInput.files[0].name}</strong></div>`;
        } else {
            fileDisplay.innerHTML = '';
        }
    };

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateFileDisplay();
        }
    });
    fileInput.addEventListener('change', updateFileDisplay);
}

function saveScoAlert(e) {
    e.preventDefault(); // Impede o recarregamento da página
    const id = document.getElementById('sco-alert-id').value;
    const category = document.getElementById('sco-alert-category').value;
    const type = document.getElementById('sco-alert-type').value;
    const intensity = document.getElementById('sco-alert-intensity').value;
    const start = document.getElementById('sco-alert-start').value;
    const end = document.getElementById('sco-alert-end').value || null; // Salva como null se estiver vazio
    const fileInput = document.getElementById('sco-alert-file'); // Declara a variável aqui
    const description = document.getElementById('sco-alert-description').value;
    const region = document.getElementById('sco-alert-region').value;
    let attachment = null;

    if (fileInput && fileInput.files.length > 0) {
        attachment = fileInput.files[0].name;
    }

    if (id) { // Editar
        const index = scoAlertsData.findIndex(a => a.id === id);
        if (index !== -1) {
            // Manter o anexo antigo se nenhum novo for enviado
            const oldAttachment = scoAlertsData[index].attachment;
            scoAlertsData[index] = { id, category, type, intensity, start, end, region, description, attachment: attachment || oldAttachment };
            showNotification('Alerta atualizado com sucesso!');
        }
    } else { // Adicionar
        const newId = 'scoalt' + (scoAlertsData.length + 1).toString().padStart(3, '0');
        scoAlertsData.push({ id: newId, category, type, intensity, start, end, region, description, attachment });
        showNotification('Novo alerta/aviso cadastrado com sucesso!');
    }

    document.getElementById('scoAlertModal').style.display = 'none';
    loadScoAlerts();
    updateDashboardAlerts();
}

function deleteScoAlert() {
    if (!currentScoAlertIdToDelete) return;

    const index = scoAlertsData.findIndex(a => a.id === currentScoAlertIdToDelete);
    if (index !== -1) {
        scoAlertsData.splice(index, 1);
        showNotification('Alerta removido com sucesso!');
        loadScoAlerts();
        updateDashboardAlerts(); // Garante que o dashboard seja atualizado
    }
    document.getElementById('confirmDeleteScoAlertModal').style.display = 'none';
    currentScoAlertIdToDelete = null;
}

// Função para atualizar o card de alertas no dashboard
function updateDashboardAlerts() {
    const activeAlertsCount = document.getElementById('activeAlerts');
    const activeAlertsList = document.getElementById('activeAlertsList');

    if (!activeAlertsCount || !activeAlertsList) return;

    // Filtra alertas que ainda estão vigentes
    const now = new Date();
    const currentAlerts = scoAlertsData.filter(alert => {
        return !alert.end || new Date(alert.end) > now;
    });

    activeAlertsCount.textContent = currentAlerts.length;
    activeAlertsList.innerHTML = '';

    if (currentAlerts.length === 0) {
        activeAlertsList.innerHTML = '<li><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Nenhum alerta vigente.</li>';
        return;
    }

    currentAlerts.forEach(alert => {
        const li = document.createElement('li');
        const intensityMap = {
            'Alto': { icon: 'fa-exclamation-triangle', color: '#c82333' },
            'Moderado': { icon: 'fa-exclamation-circle', color: '#f57c00' },
            'Baixo': { icon: 'fa-info-circle', color: '#2196f3' }
        };
        const iconInfo = intensityMap[alert.intensity] || intensityMap['Baixo'];

        li.innerHTML = `<i class="fas ${iconInfo.icon}" style="color: ${iconInfo.color};"></i> <strong>${alert.category}:</strong> ${alert.type} - ${alert.region}`;
        activeAlertsList.appendChild(li);
    });
}

function updateRealTimeMonitorCards() {
    // Atualiza o card de "Alertas Ativos" na seção de Monitoramento em Tempo Real
    const realTimeAlertsCard = document.querySelector('.monitor-card.alerts .monitor-value');
    if (!realTimeAlertsCard) return;

    // Reutiliza a lógica de filtragem de alertas vigentes
    const now = new Date();
    const currentAlerts = scoAlertsData.filter(alert => {
        return !alert.end || new Date(alert.end) > now;
    });

    realTimeAlertsCard.textContent = currentAlerts.length;
}

// Funções para a seção de Integrantes
function loadMembers() {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';

    // Ordena os integrantes em ordem alfabética pelo nome antes de exibir
    const sortedMembers = [...membersData].sort((a, b) => a.name.localeCompare(b.name));

    sortedMembers.forEach(member => {
        const row = document.createElement('tr');
        const statusMap = {
            'ativo': { text: 'Ativo', class: 'status-active' },
            'inativo': { text: 'Inativo', class: 'status-inactive' },
            'licenca': { text: 'Em Licença', class: 'status-mobilized' }
        };
        const statusInfo = statusMap[member.status];

        row.innerHTML = `
        <td>${member.name}</td>
        <td>${member.role}</td>
        <td>${member.secretaria}</td>
        <td>${member.contact}</td>
        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
        <td>
            <button class="action-btn btn-primary btn-member-assignments" data-id="${member.id}" style="background-color: #17a2b8;">Atribuições</button>
            <button class="action-btn btn-details btn-member-details" data-id="${member.id}">Detalhes</button>
            <button class="action-btn btn-danger btn-member-delete" data-id="${member.id}">Excluir</button>
        </td>
    `;
        membersList.appendChild(row);
    });

    document.querySelectorAll('.btn-member-details').forEach(btn => {
        btn.addEventListener('click', (e) => showMemberDetails(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-member-assignments').forEach(btn => {
        btn.addEventListener('click', (e) => showMemberAssignments(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-member-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMemberIdToDelete = e.target.getAttribute('data-id');
            document.getElementById('confirmDeleteMemberModal').style.display = 'flex';
        });
    });
}

async function showMemberDetails(memberId) {
    const member = membersData.find(m => m.id === memberId);
    const modal = document.getElementById('memberModal');
    const secretariaSelect = document.getElementById('member-secretaria');

    // Popula o select de secretarias a partir do JSON
    secretariaSelect.innerHTML = '<option value="">Carregando...</option>';
    try {
        const response = await fetch('api/atribuicoes.json');
        const data = await response.json();
        secretariaSelect.innerHTML = '<option value="">Selecione a Secretaria</option>';
        data.organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org.name;
            option.textContent = org.name;
            secretariaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar secretarias:", error);
        secretariaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }

    document.getElementById('member-id').value = member ? member.id : '';
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-secretaria').value = member.secretaria;
    document.getElementById('member-role').value = member.role;
    document.getElementById('member-contact').value = member.contact;
    document.getElementById('member-status').value = member.status;

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('memberForm').addEventListener('submit', saveMember);

    modal.querySelector('.modal-header').textContent = `Detalhes do Integrante - ${member.name}`;
    modal.style.display = 'flex';
}

function saveMember(e) {
    e.preventDefault();
    const id = document.getElementById('member-id').value;
    const name = document.getElementById('member-name').value;
    const secretaria = document.getElementById('member-secretaria').value;
    const role = document.getElementById('member-role').value;
    const contact = document.getElementById('member-contact').value;
    const status = document.getElementById('member-status').value;

    if (id) { // Editar
        const index = membersData.findIndex(m => m.id === id);
        if (index !== -1) {
            membersData[index] = { id, name, secretaria, role, contact, status };
            showNotification('Integrante atualizado com sucesso!');
        }
    } else { // Adicionar
        const newId = 'mem' + (membersData.length + 1).toString().padStart(3, '0');
        membersData.push({ id: newId, name, secretaria, role, contact, status });
        showNotification('Novo integrante cadastrado com sucesso!');
    }

    document.getElementById('memberModal').style.display = 'none';
    loadMembers();
    saveAllData();
}

function ceaseScoAlert(alertId) {
    const modal = document.getElementById('ceaseAlertModal');
    document.getElementById('cease-alert-id').value = alertId;
    // Preenche com a data e hora atuais
    // Adiciona o listener aqui
    document.getElementById('ceaseAlertForm').addEventListener('submit', (e) => {
        handleCeaseAlertSubmit(e);
    });

    document.getElementById('cease-alert-end-date').value = new Date().toISOString().slice(0, 16);
    modal.style.display = 'flex';
}

function handleCeaseAlertSubmit(e) {
    e.preventDefault();
    const alertId = document.getElementById('cease-alert-id').value;
    const endDate = document.getElementById('cease-alert-end-date').value;
    const index = scoAlertsData.findIndex(a => a.id === alertId);
    if (index !== -1) {
        scoAlertsData[index].end = endDate;
        showNotification('Alerta cessado com sucesso!');
        document.getElementById('ceaseAlertModal').style.display = 'none';
        loadScoAlerts();
        updateDashboardAlerts();
        saveAllData();
    }
}

function deleteMember() {
    if (!currentMemberIdToDelete) return;
    membersData = membersData.filter(m => m.id !== currentMemberIdToDelete);
    showNotification('Integrante removido com sucesso!');
    loadMembers();
    document.getElementById('confirmDeleteMemberModal').style.display = 'none';
    saveAllData();
    currentMemberIdToDelete = null;
}

async function showMemberAssignments(memberId) { // Função para exibir atribuições
    const member = membersData.find(m => m.id === memberId);
    if (!member) return;

    const modal = document.getElementById('assignmentsModal');
    document.getElementById('assignments-member-name').innerHTML = `Integrante: ${member.name}<br><small style="font-weight: normal; color: #555;">${member.secretaria}</small>`;
    const assignmentsContent = document.getElementById('assignments-content');
    assignmentsContent.innerHTML = '<p>Carregando atribuições...</p>';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    try {
        const response = await fetch('api/atribuicoes.json');
        const data = await response.json();
        const organization = data.organizations.find(org => org.name === member.secretaria);

        if (!organization) {
            assignmentsContent.innerHTML = '<p>Nenhuma atribuição encontrada para esta secretaria.</p>';
            return;
        }

        const createListItems = (items) => items.map(item => `<li>${item}</li>`).join('');

        assignmentsContent.innerHTML = `
            <div class="modal-tabs">
                <button class="modal-tab-button active tab-prevencao" data-tab="prevencao">Prevenção</button>
                <button class="modal-tab-button tab-preparacao" data-tab="preparacao">Preparação</button>
                <button class="modal-tab-button tab-resposta" data-tab="resposta">Resposta</button>
            </div>
            <div id="assignments-tab-content" style="padding-top: 20px;">
                <div id="prevencao" class="assignment-tab-pane active">
                    <ul class="assignment-list">${createListItems(organization.sections.prevencao || [])}</ul>
                </div>
                <div id="preparacao" class="assignment-tab-pane">
                    <ul class="assignment-list">${createListItems(organization.sections.preparacao || [])}</ul>
                </div>
                <div id="resposta" class="assignment-tab-pane">
                    <ul class="assignment-list">${createListItems(organization.sections.resposta || [])}</ul>
                </div>
            </div>
        `;

        // Re-adiciona a lógica de clique nas abas após o conteúdo ser carregado
        const tabButtons = assignmentsContent.querySelectorAll('.modal-tab-button');
        const tabPanes = assignmentsContent.querySelectorAll('.assignment-tab-pane');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

    } catch (error) {
        console.error("Erro ao carregar atribuições:", error);
        assignmentsContent.innerHTML = '<p>Ocorreu um erro ao carregar as atribuições.</p>';
    }
}

// Funções para a seção de Pessoas em Risco
function loadRiskPersons() {
    const searchTerm = document.getElementById('filter-person-search').value.toLowerCase();
    const riskAreaFilter = document.getElementById('filter-risk-area').value;
    const vulnerabilityFilter = document.getElementById('filter-vulnerability').value;

    const filteredPersons = riskPersonsData.filter(person => {
        const matchesSearch = searchTerm ?
            person.name.toLowerCase().includes(searchTerm) ||
            person.address.toLowerCase().includes(searchTerm) : true;

        const matchesArea = riskAreaFilter ? person.riskArea === riskAreaFilter : true;

        const matchesVulnerability = vulnerabilityFilter ?
            person.vulnerabilities.includes(vulnerabilityFilter) : true;

        return matchesSearch && matchesArea && matchesVulnerability;
    });

    const personsList = document.getElementById('risk-persons-list');
    personsList.innerHTML = '';

    filteredPersons.forEach(person => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${person.name}</td>
            <td>${person.address}</td>
            <td>${person.riskArea}</td>
            <td>${person.contact}</td>
            <td>${person.vulnerabilities.join(', ')}</td>
            <td>
                <button class="action-btn btn-details btn-person-details" data-id="${person.id}">Detalhes</button>
                <button class="action-btn btn-danger" data-id="${person.id}">Excluir</button>
            </td>
        `;
        personsList.appendChild(row);
    });
}

// Botão para aplicar filtros de pessoas
document.getElementById('btn-apply-person-filters').addEventListener('click', loadRiskPersons);

document.getElementById('btn-add-person').addEventListener('click', () => { // TODO: Implementar modal para adicionar pessoa
    alert('A funcionalidade para adicionar uma nova pessoa ainda não foi implementada. Um modal de cadastro será criado aqui.');
    /* 
    const modal = document.getElementById('personModal'); // Supondo que exista um 'personModal'
    modal.querySelector('.modal-header').textContent = 'Adicionar Nova Pessoa';
    document.getElementById('personForm').reset(); // Supondo que exista um 'personForm'
    document.getElementById('person-id').value = '';
    modal.style.display = 'flex';
    */
});

// Delegação de eventos para os botões de detalhes e excluir da lista de pessoas
document.getElementById('risk-persons-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-person-details')) {
        showPersonDetails(e.target.getAttribute('data-id'));
    } else if (e.target.classList.contains('btn-danger')) {
        alert('Funcionalidade de exclusão da pessoa será implementada em breve.');
    }
});

// Botão para adicionar nova ação (SCO)
document.getElementById('btn-add-action').addEventListener('click', () => {
    const modal = document.getElementById('actionModal');
    document.getElementById('action-id').value = '';
    modal.querySelector('.modal-header').textContent = 'Adicionar Nova Ação';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('actionForm').reset(); // Resetar DEPOIS de exibir
});

document.getElementById('btn-add-shelter').addEventListener('click', () => {
    openShelterModal();
});


function populateActionModalLists(action) {
    const actionId = action ? action.id : null;
    const currentActionVehicles = action ? action.vehicles || [] : [];
    const currentActionMembers = action ? action.members || [] : [];

    // --- VEÍCULOS ---
    const vehiclesSelect = document.getElementById('action-vehicles');
    const mobilizedVehiclesList = document.getElementById('mobilized-vehicles-list');
    vehiclesSelect.innerHTML = '';
    mobilizedVehiclesList.innerHTML = '';
    vehiclesSelect.innerHTML = '<option value="">Selecione um veículo</option>'; // Opção padrão

    vehiclesData.forEach(v => {
        const isMobilizedInOtherAction = actionsData.some(a => a.id !== actionId && a.status === 'em-andamento' && a.vehicles?.includes(v.codigo));

        if (currentActionVehicles.includes(v.codigo)) {
            // Se já está nesta ação, vai para a lista de mobilizados
            const li = document.createElement('li');
            li.dataset.id = v.codigo;
            li.innerHTML = `<span>${v.modelo} - ${v.placa}</span><i class="fas fa-times remove-mobilized-item"></i>`;
            mobilizedVehiclesList.appendChild(li);
        } else if (!isMobilizedInOtherAction) {
            // Se está disponível, vai para o dropdown de seleção
            const option = document.createElement('option');
            option.value = v.codigo;
            option.textContent = `${v.modelo} - ${v.placa}`;
            vehiclesSelect.appendChild(option);
        }
    });

    // --- INTEGRANTES ---
    const membersSelect = document.getElementById('action-members');
    const mobilizedMembersList = document.getElementById('mobilized-members-list');
    membersSelect.innerHTML = '';
    mobilizedMembersList.innerHTML = '';
    membersSelect.innerHTML = '<option value="">Selecione um integrante</option>'; // Opção padrão

    membersData.forEach(m => {
        const isMobilizedInOtherAction = actionsData.some(a => a.id !== actionId && a.status === 'em-andamento' && a.members?.includes(m.id));

        if (currentActionMembers.includes(m.id)) {
            // Se já está nesta ação, vai para a lista de mobilizados
            const li = document.createElement('li');
            li.dataset.id = m.id;
            li.innerHTML = `<span>${m.name} (${m.role})</span><i class="fas fa-times remove-mobilized-item"></i>`;
            mobilizedMembersList.appendChild(li);
        } else if (m.status === 'ativo' && !isMobilizedInOtherAction) {
            // Se está disponível, vai para o dropdown de seleção
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = `${m.name} (${m.role})`;
            membersSelect.appendChild(option);
        }
    });
}

function addResourceToMobilizedList(optionElement, listId) {
    const list = document.getElementById(listId);

    // Cria o item na lista de mobilizados
    const li = document.createElement('li');
    li.dataset.id = optionElement.value;
    li.innerHTML = `<span>${optionElement.textContent}</span><i class="fas fa-times remove-mobilized-item"></i>`;
    list.appendChild(li);

    // Remove a opção do select
    optionElement.remove();
}

function removeResourceFromMobilizedList(listItem, selectId) {
    const select = document.getElementById(selectId);

    // Cria a opção de volta no select
    const option = document.createElement('option');
    option.value = listItem.dataset.id;
    option.textContent = listItem.querySelector('span').textContent;
    select.appendChild(option);

    // Remove o item da lista
    listItem.remove();
}

function linkVehicleToAction(vehicleId, actionId) {
    const actionIndex = actionsData.findIndex(a => a.id === actionId);
    if (actionIndex !== -1) {
        if (!actionsData[actionIndex].vehicles) {
            actionsData[actionIndex].vehicles = [];
        }
        actionsData[actionIndex].vehicles.push(vehicleId);
        showNotification(`Veículo vinculado à ocorrência ${actionId} com sucesso!`);
        loadVehicles(); // Atualiza a tabela de veículos
        saveAllData();
    }
}
// Botão para adicionar novo alerta (SCO)
document.getElementById('btn-add-sco-alert').addEventListener('click', () => {
    const modal = document.getElementById('scoAlertModal');
    document.getElementById('sco-alert-id').value = '';
    modal.querySelector('.modal-header').textContent = 'Cadastrar Novo Alerta/Aviso';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('scoAlertForm').reset();

    // A lógica de upload de arquivo foi movida para cá para garantir que os elementos existam
    const fileDisplay = document.getElementById('sco-alert-file-display');
    const dropArea = document.querySelector('.file-drop-area');
    const fileInput = document.getElementById('sco-alert-file');

    if (fileDisplay) fileDisplay.innerHTML = '';
    if (dropArea) dropArea.classList.remove('dragover');

    const updateFileDisplay = () => {
        if (fileInput && fileInput.files.length > 0) {
            fileDisplay.innerHTML = `<i class="fas fa-file-alt"></i> Arquivo selecionado: <strong>${fileInput.files[0].name}</strong>`;
        } else {
            fileDisplay.innerHTML = '';
        }
    };
    if (fileInput) fileInput.addEventListener('change', updateFileDisplay);
    if (dropArea) {
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
    }
});

// --- Lógica para Cadastro Automático de Alerta ---
document.getElementById('btn-add-automatic-alert').addEventListener('click', () => {
    const modal = document.getElementById('automaticAlertModal');
    const formFieldsContainer = document.getElementById('auto-alert-form-fields');

    // Clona os campos do formulário manual para o automático
    const manualFormFields = document.getElementById('scoAlertModal').querySelector('.modal-body').innerHTML;
    formFieldsContainer.innerHTML = manualFormFields;

    // Limpa o formulário e reseta o estado
    document.getElementById('automaticAlertForm').reset();
    document.getElementById('autoAlertExtractedData').style.display = 'none';
    const fileUploadArea = document.getElementById('autoAlertFileUploadArea');
    fileUploadArea.innerHTML = `
        <p><i class="fas fa-cloud-upload-alt" style="font-size: 24px;"></i></p>
        <p>Clique aqui ou arraste o arquivo PDF do alerta</p>
        <p class="file-info">Formatos suportados: PDF</p>
        <input type="file" id="autoAlertPdfFile" accept=".pdf">
    `;

    modal.style.display = 'flex';
});

document.getElementById('closeAutoAlertModal').addEventListener('click', () => {
    document.getElementById('automaticAlertModal').style.display = 'none';
});

// Adiciona listeners para a área de upload do novo modal
document.body.addEventListener('click', (e) => {
    if (e.target.closest('#autoAlertFileUploadArea')) {
        document.getElementById('autoAlertPdfFile').click();
    }
});

document.body.addEventListener('change', (e) => {
    if (e.target.id === 'autoAlertPdfFile' && e.target.files.length) {
        handleAutoAlertPDFUpload(e.target.files[0]);
    }
});

function handleAutoAlertPDFUpload(file) {
    // Adiciona o listener para o formulário AQUI, quando o upload acontece
    document.getElementById('automaticAlertForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formContainer = document.getElementById('auto-alert-form-fields');

        // Coleta os dados do formulário preenchido
        const category = formContainer.querySelector('#sco-alert-category').value;
        const type = formContainer.querySelector('#sco-alert-type').value;
        const intensity = formContainer.querySelector('#sco-alert-intensity').value;
        const start = formContainer.querySelector('#sco-alert-start').value;
        const end = formContainer.querySelector('#sco-alert-end').value || null;
        const region = formContainer.querySelector('#sco-alert-region').value;
        const description = formContainer.querySelector('#sco-alert-description').value;

        // Pega o nome do arquivo que foi processado
        const fileInfoElement = document.getElementById('autoAlertFileUploadArea').querySelector('.file-info');
        const attachment = fileInfoElement ? fileInfoElement.textContent.replace('Arquivo processado: ', '') : null;

        // Cria o novo alerta
        const newId = 'scoalt' + (scoAlertsData.length + 1).toString().padStart(3, '0');
        scoAlertsData.push({ id: newId, category, type, intensity, start, end, region, description, attachment });

        showNotification('Novo alerta cadastrado com sucesso via upload!');

        // Fecha o modal e atualiza a tabela
        document.getElementById('automaticAlertModal').style.display = 'none';
        loadScoAlerts();
        updateDashboardAlerts();
        saveAllData();
    });
    if (file.type !== 'application/pdf') {
        alert('Por favor, selecione um arquivo PDF.');
        return;
    }
    // Simulação de extração de dados do PDF
    simulateAutoAlertPDFExtraction(file.name);
}

function simulateAutoAlertPDFExtraction(filename) {
    const fileUploadArea = document.getElementById('autoAlertFileUploadArea');
    fileUploadArea.innerHTML = '<p>Processando PDF...</p>';

    setTimeout(() => {
        // Dados simulados que seriam extraídos do PDF
        const extractedInfo = {
            number: '0160/2025',
            date: '09/01/2025',
            time: '07:56',
            category: 'hidrologico',
            intensity: 'Moderado',
            region: 'SANTA MARIA DE JETIBÁ',
            type: 'Risco Hidrológico', // Descrição curta (Tipo)
            description: 'Chuvas persistentes com acumulado significativo nas últimas 24 horas. Risco MODERADO para ocorrências de alagamentos e inundações graduais, principalmente nas áreas ribeirinhas do centro da cidade. A população deve ficar atenta aos avisos sonoros e informes oficiais.' // Descrição detalhada
        };

        // Atualiza a interface com os dados extraídos
        document.getElementById('autoAlertNumber').textContent = extractedInfo.number;
        document.getElementById('autoAlertDate').textContent = extractedInfo.date;
        document.getElementById('autoAlertTime').textContent = extractedInfo.time;

        // Preenche automaticamente os campos do formulário clonado
        const formContainer = document.getElementById('auto-alert-form-fields');
        formContainer.querySelector('#sco-alert-category').value = 'Alerta'; // Categoria do alerta

        // Converte a data e hora para o formato datetime-local (YYYY-MM-DDTHH:mm)
        const [day, month, year] = extractedInfo.date.split('/');
        const startDateTime = `${year}-${month}-${day}T${extractedInfo.time}`;
        formContainer.querySelector('#sco-alert-start').value = startDateTime;
        formContainer.querySelector('#sco-alert-type').value = extractedInfo.type;
        formContainer.querySelector('#sco-alert-intensity').value = extractedInfo.intensity;
        formContainer.querySelector('#sco-alert-region').value = extractedInfo.region;
        formContainer.querySelector('#sco-alert-description').value = extractedInfo.description;

        // Mostra a seção de dados extraídos
        document.getElementById('autoAlertExtractedData').style.display = 'block';
        fileUploadArea.innerHTML = `<p class="file-info">Arquivo processado: ${filename}</p>`;
    }, 1500); // Simula um tempo de processamento
};

// Botão para aplicar filtros de ações
document.getElementById('btn-apply-action-filters').addEventListener('click', loadActions);

// Botão para adicionar novo integrante (SCO)
document.getElementById('btn-add-member').addEventListener('click', () => {
    const modal = document.getElementById('memberModal');
    document.getElementById('member-id').value = '';
    modal.querySelector('.modal-header').textContent = 'Cadastrar Novo Integrante';
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('memberForm').reset(); // Resetar DEPOIS de exibir
});

document.getElementById('btn-open-alerts-panel').addEventListener('click', () => {
    // Garante que os dados mais recentes estão no localStorage para o painel usar
    saveAllData().then(() => {
        // Abre a nova aba após os dados serem salvos
        window.open('pages/painel_alertas.html', '_blank');
    });
});

// Chamar as funções de carregamento quando a seção for ativada
const sectionsToLoad = {
    'abrigos': loadShelters,
    'ocorrencias': loadActions,
    'alertas-sco': loadScoAlerts,
    'integrantes': loadMembers,
    'frota-veiculos': loadVehicles,
    'pessoas-risco': loadRiskPersons,
    'doacoes': loadDonations,
    'distribuicao': loadDistributions,
    'relatorios-assistencia': () => console.log('Carregar dados de relatórios...'),
};

document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        if (sectionsToLoad[target]) {
            // Pequeno atraso para garantir que a seção está visível antes de carregar
            setTimeout(sectionsToLoad[target], 100);
        }
    });
});

// Funções para a seção de Doações
function loadDonations() {
    const donationsList = document.getElementById('donations-list');
    donationsList.innerHTML = '';

    donationsData.forEach(donation => {
        // Calcular o saldo restante desta doação específica
        const distributedAmount = (donation.distributions || []).reduce((sum, dist) => sum + dist.quantity, 0);
        const availableStock = (donation.originalQuantity || donation.quantity) - distributedAmount;

        // Definir o status com base no estoque
        let statusText, statusClass;
        if (availableStock <= 0 && (donation.distributions || []).length > 0) {
            statusText = 'Distribuído';
            statusClass = 'status-inactive'; // Vermelho
        } else {
            statusText = 'Em Estoque';
            statusClass = 'status-active'; // Verde
        }

        const row = document.createElement('tr');
        const donationDate = new Date(donation.date).toLocaleDateString('pt-BR');
        const displayQuantity = donation.originalQuantity || donation.quantity;

        row.innerHTML = `
            <td>${donation.item}</td>
            <td>${displayQuantity} ${donation.unit || ''}</td>
            <td>${donation.donor}</td>
            <td>${donationDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><button class="action-btn btn-details btn-donation-details" data-id="${donation.id}">Detalhes</button></td>
        `;
        donationsList.appendChild(row);
    });
}

function saveDonation(e) {
    e.preventDefault();
    const id = document.getElementById('donation-id').value;
    let item = document.getElementById('donation-item-type').value;
    if (item === 'Outro') {
        item = document.getElementById('donation-item-description').value;
        if (!item) {
            alert('Por favor, especifique a descrição do item.');
            return;
        }
    }
    const quantity = document.getElementById('donation-quantity').value;
    const unit = document.getElementById('donation-unit').value;
    const donor = document.getElementById('donation-donor').value;
    const date = document.getElementById('donation-date').value;
    const shelterId = document.getElementById('donation-shelter').value;

    if (!item || !quantity || !date) {
        alert('Por favor, preencha os campos Item, Quantidade e Data.');
        return;
    }

    if (id) {
        // Lógica de edição (se necessário no futuro)
    } else {
        const newId = 'don' + Date.now();
        // Adicionamos 'originalQuantity' para rastrear o valor inicial da doação
        donationsData.push({
            id: newId, item, quantity: parseInt(quantity), originalQuantity: parseInt(quantity),
            unit, donor, date, shelterId, status: 'estoque', distributions: []
        });
        showNotification('Doação registrada com sucesso!');
    }

    document.getElementById('donationModal').style.display = 'none';
    loadDonations();
    saveAllData();
}

function showDonationDetails(id) {
    const donation = donationsData.find(d => d.id === id);
    if (!donation) return;

    const itemUnit = donation.unit || 'un';
    const originalQuantity = donation.originalQuantity || donation.quantity;
    const distributedAmount = (donation.distributions || []).reduce((sum, dist) => sum + dist.quantity, 0);
    const availableStock = originalQuantity - distributedAmount;

    // 2. Encontrar o histórico de distribuição VINCULADO a esta doação específica
    const distributions = donation.distributions || [];
    let distributionHistoryHtml = '<li>Nenhuma distribuição registrada para esta doação.</li>';
    if (distributions.length > 0) {
        distributionHistoryHtml = distributions.map(dist => `
            <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                <div>
                    <strong>${dist.quantity} ${itemUnit}</strong> para 
                    <strong>${dist.destination}</strong>
                </div>
                <div style="font-size: 13px; color: #666;">
                    Distribuído em: ${new Date(dist.date).toLocaleDateString('pt-BR')}
                </div>
            </div>
        `).join('');
    }

    // 3. Montar o conteúdo do modal
    const content = document.getElementById('donation-detail-content');
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div><strong>Item:</strong> ${donation.item}</div>
            <div><strong>Quantidade Original:</strong> ${originalQuantity} ${itemUnit}</div>
            <div><strong>Doador:</strong> ${donation.donor}</div>
            <div><strong>Data da Doação:</strong> ${new Date(donation.date).toLocaleDateString('pt-BR')}</div>
        </div>
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header" style="margin-bottom: 0;"><i class="fas fa-box-open"></i><h3>Saldo Restante Nesta Doação</h3></div>
            <p style="font-size: 18px; font-weight: bold; color: #1e3c72;">${availableStock} ${itemUnit} disponíveis</p>
        </div>
        <div class="card">
            <div class="card-header"><i class="fas fa-history"></i><h3>Histórico de Distribuição</h3></div>
            <div style="padding-top: 10px;">${distributionHistoryHtml}</div>
        </div>
        <div class="modal-footer" style="margin-top: 20px; padding-right: 0;">
            <button class="btn-secondary" onclick="editDonation('${id}')"><i class="fas fa-edit"></i> Editar</button>
            <button class="btn-danger" onclick="deleteDonation('${id}')"><i class="fas fa-trash"></i> Excluir</button>
        </div>
    `;

    document.getElementById('donationDetailModal').style.display = 'flex';
}

function editDonation(id) {
    const donation = donationsData.find(d => d.id === id);
    if (!donation) return;

    // Fechar o modal de detalhes e abrir o de cadastro
    document.getElementById('donationDetailModal').style.display = 'none';
    const donationModal = document.getElementById('donationModal');

    // Preencher o formulário com os dados da doação
    document.getElementById('donation-id').value = donation.id;
    const itemTypeSelect = document.getElementById('donation-item-type');
    const descriptionInput = document.getElementById('donation-item-description');

    // Verifica se o item é um dos tipos padrão ou 'Outro'
    const isStandardType = Array.from(itemTypeSelect.options).some(opt => opt.value === donation.item);
    if (isStandardType) {
        itemTypeSelect.value = donation.item;
        descriptionInput.style.display = 'none';
        descriptionInput.parentElement.style.display = 'none';
    } else {
        itemTypeSelect.value = 'Outro';
        descriptionInput.value = donation.item;
        descriptionInput.style.display = 'block';
        descriptionInput.parentElement.style.display = 'block';
    }

    document.getElementById('donation-quantity').value = donation.originalQuantity; // Editar a quantidade original
    document.getElementById('donation-unit').value = donation.unit;
    document.getElementById('donation-donor').value = donation.donor;
    document.getElementById('donation-date').value = donation.date;
    document.getElementById('donation-shelter').value = donation.shelterId;

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('donationForm').addEventListener('submit', saveDonation);

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('automaticAlertForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAutoAlertSubmit(e);
    });
    donationModal.style.display = 'flex';
}

function deleteDonation(id) {
    if (confirm('Tem certeza que deseja excluir esta doação? Esta ação é irreversível e removerá o item do estoque.')) {
        const index = donationsData.findIndex(d => d.id === id);
        if (index > -1) {
            // Antes de remover, verificar se há distribuições vinculadas
            if (donationsData[index].distributions && donationsData[index].distributions.length > 0) {
                alert('Não é possível excluir esta doação, pois ela possui um histórico de distribuição. Remova primeiro os registros de distribuição associados.');
                return;
            }
            donationsData.splice(index, 1);
            showNotification('Doação excluída com sucesso!');
            document.getElementById('donationDetailModal').style.display = 'none';
            loadDonations();
            saveAllData();
        }
    }
}

// Funções para a seção de Distribuição
function loadDistributions() {
    const distributionsList = document.getElementById('distributions-list');
    distributionsList.innerHTML = '';

    distributionsData.forEach(dist => {
        const row = document.createElement('tr');
        const distDate = new Date(dist.date).toLocaleDateString('pt-BR');

        row.innerHTML = `
            <td>${dist.item}</td>
            <td>${dist.quantity}</td>
            <td>${dist.destination}</td>
            <td>${distDate}</td>
            <td>${dist.responsible}</td>
            <td>
                <button class="action-btn btn-details btn-distribution-details" data-id="${dist.id}">Detalhes/Reverter</button>
            </td>
        `;
        distributionsList.appendChild(row);
    });
}

function setupDistributionModal() {
    // Popular itens disponíveis para distribuição (agrupados e somados)
    const stock = donationsData.reduce((acc, donation) => {
        const distributedAmount = (donation.distributions || []).reduce((sum, dist) => sum + dist.quantity, 0);
        const availableStock = (donation.originalQuantity || donation.quantity) - distributedAmount;
        const key = `${donation.item} (${donation.unit || 'un'})`;
        acc[key] = (acc[key] || 0) + availableStock;
        return acc;
    }, {});

    const itemSelect = document.getElementById('distribution-item');
    itemSelect.innerHTML = '<option value="">Selecione um item do estoque</option>';
    for (const item in stock) {
        if (stock[item] > 0) { // Mostra apenas itens com estoque positivo
            // Adiciona o saldo como um atributo de dados para fácil acesso
            itemSelect.innerHTML += `<option value="${item}" data-stock="${stock[item]}">${item}</option>`;
        }
    }

    // Popular abrigos no modal de doação
    const donationShelterSelect = document.getElementById('donation-shelter');
    donationShelterSelect.innerHTML = '<option value="">Estoque Central</option>'; // Opção padrão
    sheltersData.filter(s => s.status === 'aberto' || s.status === 'lotado').forEach(shelter => {
        donationShelterSelect.innerHTML += `<option value="${shelter.id}">${shelter.nome}</option>`;
    });


    // Popular abrigos disponíveis
    const shelterSelect = document.getElementById('distribution-destination-shelter');
    shelterSelect.innerHTML = '<option value="">Selecione um abrigo</option>';
    sheltersData.filter(s => s.status === 'aberto' || s.status === 'lotado').forEach(shelter => {
        shelterSelect.innerHTML += `<option value="${shelter.nome}">${shelter.nome}</option>`;
    });

    // Popular pessoas em risco disponíveis
    const personSelect = document.getElementById('distribution-destination-person');
    personSelect.innerHTML = '<option value="">Selecione uma pessoa/família</option>';
    riskPersonsData.forEach(person => {
        personSelect.innerHTML += `<option value="${person.name}">${person.name} - ${person.address}</option>`;
    });

    // Adiciona o listener para o formulário DEPOIS que ele foi criado
    document.getElementById('distributionForm').addEventListener('submit', saveDistribution);

    toggleDistributionDestination(); // Garante que o campo correto seja exibido
    updateDistributionQuantityPlaceholder(); // Limpa o placeholder inicial
}

function updateDistributionQuantityPlaceholder() {
    const itemSelect = document.getElementById('distribution-item');
    const quantityInput = document.getElementById('distribution-quantity');
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const stock = selectedOption.getAttribute('data-stock');
        quantityInput.placeholder = `Máx: ${stock} disponíveis`;
    } else {
        quantityInput.placeholder = 'Quantidade';
    }
}

function showDistributionDetails(id) {
    const dist = distributionsData.find(d => d.id === id);
    if (!dist) return;

    const content = document.getElementById('distribution-detail-content');
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Item:</strong> ${dist.item}</div>
            <div><strong>Quantidade:</strong> ${dist.quantity}</div>
            <div><strong>Destino:</strong> ${dist.destination}</div>
            <div><strong>Data:</strong> ${new Date(dist.date).toLocaleString('pt-BR')}</div>
            <div><strong>Responsável:</strong> ${dist.responsible}</div>
        </div>
        <div class="modal-footer" style="margin-top: 20px; padding-right: 0;">
            <p style="margin-right: auto; font-size: 12px; color: #666;">A exclusão deste registro irá retornar os itens ao estoque de origem.</p>
            <button class="btn-danger" onclick="deleteDistribution('${id}')"><i class="fas fa-trash"></i> Excluir Registro e Reverter Estoque</button>
        </div>
    `;
    document.getElementById('distributionDetailModal').style.display = 'flex';
}

function deleteDistribution(id) {
    if (confirm('Tem certeza que deseja excluir este registro de distribuição? Esta ação irá retornar os itens ao estoque de origem.')) {
        const distributionId = id;
        const distributionIndex = distributionsData.findIndex(d => d.id === distributionId);

        if (distributionIndex === -1) {
            alert('Registro de distribuição não encontrado.');
            return;
        }

        // 1. Encontrar todas as doações que foram afetadas por esta distribuição
        donationsData.forEach(donation => {
            if (donation.distributions && donation.distributions.length > 0) {
                const distHistoryIndex = donation.distributions.findIndex(dist => dist.distributionId === distributionId);

                if (distHistoryIndex > -1) {
                    const quantityToReturn = donation.distributions[distHistoryIndex].quantity;

                    // 2. A quantidade não precisa ser retornada, pois o saldo é calculado dinamicamente.
                    // Apenas removemos o registro do histórico.

                    // 3. Remover o registro do histórico da doação
                    donation.distributions.splice(distHistoryIndex, 1);
                }
            }
        });

        // 4. Remover o registro da lista geral de distribuições
        distributionsData.splice(distributionIndex, 1);

        showNotification('Distribuição revertida e estoque restaurado!');
        document.getElementById('distributionDetailModal').style.display = 'none';
        loadDistributions();
        loadDonations(); // Recarrega para mostrar o status e saldo atualizados
        saveAllData();
    }
}

function toggleDistributionDestination() {
    const type = document.getElementById('distribution-destination-type').value;
    const shelterGroup = document.getElementById('destination-shelter-group');
    const personGroup = document.getElementById('destination-person-group');
    const otherGroup = document.getElementById('destination-other-group');

    shelterGroup.style.display = (type === 'shelter') ? 'block' : 'none';
    personGroup.style.display = (type === 'person') ? 'block' : 'none';
    otherGroup.style.display = (type === 'other') ? 'block' : 'none';
}

function saveDistribution(e) {
    e.preventDefault();
    const selectedItem = document.getElementById('distribution-item').value;
    let quantityToDistribute = parseInt(document.getElementById('distribution-quantity').value, 10);
    const destinationType = document.getElementById('distribution-destination-type').value;
    let destination = '';

    if (!selectedItem || !quantityToDistribute || quantityToDistribute <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    // Determina o destino
    if (destinationType === 'shelter') {
        destination = document.getElementById('distribution-destination-shelter').value;
    } else if (destinationType === 'person') {
        destination = document.getElementById('distribution-destination-person').value;
    } else {
        destination = document.getElementById('distribution-destination-other').value;
    }
    if (!destination) {
        alert('Por favor, especifique um destino.');
        return;
    }

    // Lógica FIFO (First-In, First-Out)
    const itemNameOnly = selectedItem.split(' (')[0].trim();
    const itemUnit = selectedItem.match(/\(([^)]+)\)/)?.[1] || 'un';

    // 1. Encontrar todas as doações relevantes (em estoque, mesmo item, ordenadas por data)
    const availableDonations = donationsData
        .filter(d => d.item === itemNameOnly)
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordena por data para FIFO

    const totalAvailableStock = availableDonations.reduce((sum, d) => sum + d.quantity, 0);

    if (quantityToDistribute > totalAvailableStock) {
        alert(`A quantidade solicitada (${quantityToDistribute}) é maior que o estoque total disponível (${totalAvailableStock}).`);
        return;
    }

    const newDistributionId = 'dist' + Date.now();
    const distributionDate = new Date().toISOString();
    const responsible = 'Operador do Sistema'; // Placeholder

    // 2. Iterar e "consumir" das doações
    for (const donation of availableDonations) {
        if (quantityToDistribute <= 0) break;

        const quantityFromThisDonation = Math.min(quantityToDistribute, donation.quantity); // Ainda usamos a quantidade atual para saber o saldo

        // 4. Adicionar histórico na própria doação
        if (!donation.distributions) donation.distributions = [];
        donation.distributions.push({
            distributionId: newDistributionId,
            quantity: quantityFromThisDonation,
            destination: destination,
            date: distributionDate,
            responsible: responsible
        });

        quantityToDistribute -= quantityFromThisDonation;
    }

    // 5. Adicionar um único registro na lista geral de distribuições
    distributionsData.push({
        id: newDistributionId,
        item: itemNameOnly,
        quantity: parseInt(document.getElementById('distribution-quantity').value, 10), // A quantidade total solicitada
        destination,
        date: distributionDate,
        responsible: responsible
    });

    showNotification('Distribuição registrada com sucesso!');

    document.getElementById('distributionModal').style.display = 'none';
    loadDistributions();
    loadDonations(); // Atualiza a lista de doações para refletir o novo status do estoque
    saveAllData();
}


function saveDistribution_OLD(e) {
    e.preventDefault();
    const selectedItem = document.getElementById('distribution-item').value;
    let quantityToDistribute = parseInt(document.getElementById('distribution-quantity').value, 10);
    const destinationType = document.getElementById('distribution-destination-type').value;
    let destination = '';

    if (!selectedItem || !quantityToDistribute || quantityToDistribute <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    // Determina o destino
    if (destinationType === 'shelter') {
        destination = document.getElementById('distribution-destination-shelter').value;
    } else if (destinationType === 'person') {
        destination = document.getElementById('distribution-destination-person').value;
    } else {
        destination = document.getElementById('distribution-destination-other').value;
    }
    if (!destination) {
        alert('Por favor, especifique um destino.');
        return;
    }

    // Lógica FIFO (First-In, First-Out)
    const itemNameOnly = selectedItem.split(' (')[0].trim();
    const itemUnit = selectedItem.match(/\(([^)]+)\)/)?.[1] || 'un';

    // 1. Encontrar todas as doações relevantes (em estoque, mesmo item, ordenadas por data)
    const availableDonations = donationsData
        .filter(d => d.item === itemNameOnly && d.status === 'estoque' && d.quantity > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalAvailableStock = availableDonations.reduce((sum, d) => sum + d.quantity, 0);

    if (quantityToDistribute > totalAvailableStock) {
        alert(`A quantidade solicitada (${quantityToDistribute}) é maior que o estoque total disponível (${totalAvailableStock}).`);
        return;
    }

    const newDistributionId = 'dist' + Date.now();
    const distributionDate = new Date().toISOString();
    const responsible = 'Operador do Sistema'; // Placeholder

    // 2. Iterar e "consumir" das doações
    for (const donation of availableDonations) {
        if (quantityToDistribute <= 0) break;

        const quantityFromThisDonation = Math.min(quantityToDistribute, donation.quantity);

        // 3. Atualizar a doação
        donation.quantity -= quantityFromThisDonation;
        if (donation.quantity <= 0) {
            donation.status = 'distribuido';
        }

        // 4. Adicionar histórico na própria doação
        if (!donation.distributions) donation.distributions = [];
        donation.distributions.push({
            distributionId: newDistributionId,
            quantity: quantityFromThisDonation,
            destination: destination,
            date: distributionDate,
            responsible: responsible
        });

        quantityToDistribute -= quantityFromThisDonation;
    }

    // 5. Adicionar um único registro na lista geral de distribuições
    distributionsData.push({
        id: newDistributionId,
        item: itemNameOnly,
        quantity: parseInt(document.getElementById('distribution-quantity').value, 10), // A quantidade total solicitada
        destination,
        date: distributionDate,
        responsible: responsible
    });

    showNotification('Distribuição registrada com sucesso!');

    document.getElementById('distributionModal').style.display = 'none';
    loadDistributions();
    loadDonations(); // Atualiza a lista de doações para refletir o novo status do estoque
    saveAllData();
}

// Funções para a seção de Relatórios de Assistência
function loadAssistanceReports() {
    // 1. Calcular o estoque atual
    const stock = donationsData.reduce((acc, donation) => {
        const distributedAmount = (donation.distributions || []).reduce((sum, dist) => sum + dist.quantity, 0);
        const availableStock = (donation.originalQuantity || donation.quantity) - distributedAmount;
        const key = `${donation.item} (${donation.unit || 'un'})`;
        acc[key] = (acc[key] || 0) + availableStock;
        return acc;
    });

    // 3. Renderizar o card de estoque
    const stockList = document.getElementById('stock-report-list');
    stockList.innerHTML = '';
    if (Object.keys(stock).length === 0) {
        stockList.innerHTML = '<li>Nenhum item em estoque.</li>';
    } else {
        for (const item in stock) {
            if (stock[item] > 0) { // Mostra apenas itens com saldo positivo
                const [itemName, unit] = item.split(' (');
                stockList.innerHTML += `<li>${itemName}: <strong>${stock[item]} ${unit.replace(')', '')}</strong></li>`;
            }
        }
    }

    // 4. Calcular o total de itens distribuídos
    const distributed = distributionsData.reduce((acc, dist) => {
        const key = dist.item;
        acc[key] = (acc[key] || 0) + parseInt(dist.quantity, 10);
        return acc;
    }, {});

    // 5. Renderizar o card de itens distribuídos
    const distList = document.getElementById('distribution-report-list');
    distList.innerHTML = '';
    if (Object.keys(distributed).length === 0) {
        distList.innerHTML = '<li>Nenhum item distribuído.</li>';
    } else {
        for (const item in distributed) {
            distList.innerHTML += `<li>${item}: <strong>${distributed[item]} unidades</strong></li>`;
        }
    }
}

// Delegação de eventos para os botões de detalhes
document.getElementById('donations-list').addEventListener('click', (e) => {
    const button = e.target.closest('.btn-donation-details');
    if (button) {
        showDonationDetails(button.getAttribute('data-id'));
    }
});

document.getElementById('distributions-list').addEventListener('click', (e) => {
    const detailButton = e.target.closest('.btn-distribution-details');
    if (detailButton) {
        showDistributionDetails(detailButton.getAttribute('data-id'));
    }

});

// Expor a função para ser acessível por outros scripts, como o de cadastro
window.saveAllData = saveAllData;

export async function saveAllData() {
    try {
        const allData = {
            vehiclesData,
            weatherStationsData,
            rainGaugesData,
            sheltersData,
            actionsData,
            scoAlertsData,
            membersData,
            riskPersonsData,
            donationsData,
            distributionsData,
            conversations,
            // Adiciona o status do plano para o painel usar
            isPlanActive,
            currentPlanLevel,
            // Adiciona os dados de alerta para o painel de alertas
            scoAlertsData: scoAlertsData
        };

        // Dados específicos para o painel, para não sobrecarregar o localStorage com HTML
        const dashboardCards = {
            statusPlano: document.getElementById('status-plano')?.closest('.card').innerHTML,
            alertasAtivos: document.getElementById('alertas-ativos')?.closest('.card').innerHTML,
            pessoasImpactadas: document.getElementById('pessoas-impactadas')?.closest('.card').innerHTML,
            recursosEmpregados: document.getElementById('recursos-empregados')?.closest('.card').innerHTML,
            tarefasPrioritarias: document.getElementById('tarefas-prioritarias')?.closest('.card').innerHTML,
            condicoesClimaticas: document.getElementById('condicoes-climaticas')?.closest('.card').innerHTML
        };

        // Salva os dados no localStorage para a outra aba ler
        localStorage.setItem('sigerd_all_data', JSON.stringify({ ...allData, dashboardCards }));
        // Salva as áreas de risco separadamente para o painel de alertas
        const areasResponse = await fetch('api/areas_de_riscos.json');
        const areasData = await areasResponse.json();
        localStorage.setItem('sigerd_areas_risco', JSON.stringify(areasData));
        // Dispara um evento para notificar a outra aba instantaneamente
        localStorage.setItem('sigerd_data_update', Date.now());

        const response = await fetch('api/api_save_data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(allData),
        });

        if (!response.ok) {
            throw new Error(`Erro do servidor: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(result.message); // 'Dados salvos com sucesso!'
        showNotification('Alterações salvas no servidor!');
    } catch (error) {
        console.error('Falha ao salvar os dados:', error);
        showNotification('Erro ao salvar alterações no servidor!', 'error');
    }
}
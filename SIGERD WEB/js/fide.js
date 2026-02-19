let fideData = [];
let currentFideIdToDelete = null;

// --- Lógica de Autenticação e Usuário (Simplificada para esta página) ---
function checkAuth() {
    const user = sessionStorage.getItem('sigerd_user');
    if (!user) {
        // Se não houver usuário, redireciona para a página de login relativa ao diretório atual
        window.location.href = 'login.html'; // Supondo que login.html está no mesmo nível que documentos.html
        return false;
    }

    // Atualiza a UI com o nome do usuário
    try {
        const userData = JSON.parse(user);
        const userNameElement = document.querySelector('.user-details span');
        const userAvatarElement = document.querySelector('.user-info img');
        if (userNameElement) userNameElement.textContent = userData.name || 'Operador';
        if (userAvatarElement) userAvatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`;
    } catch (e) {
        console.error("Erro ao processar dados do usuário:", e);
    }

    return true;
}

function logout() {
    // Limpa os dados do usuário da sessão
    sessionStorage.removeItem('sigerd_user');
    // Redireciona para a página de login
    window.location.href = 'login.html';
}

// --- Funções Utilitárias ---
function showNotification(text, type = 'success') {
    const n = document.createElement('div');
    let iconClass, backgroundColor;

    switch (type) {
        case 'error':
            iconClass = 'fas fa-times-circle';
            backgroundColor = '#c82333';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            backgroundColor = '#f57c00';
            break;
        default:
            iconClass = 'fas fa-check-circle';
            backgroundColor = '#4CAF50';
            break;
    }

    Object.assign(n.style, {
        position: 'fixed',
        right: '20px',
        top: '85px',
        background: backgroundColor,
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 6px 20px rgba(0,0,0,.15)',
        zIndex: '9999',
        opacity: '1',
        transition: 'opacity 0.5s'
    });
    n.innerHTML = `<i class="${iconClass}"></i> ${text}`;
    document.body.appendChild(n);

    setTimeout(() => {
        n.style.opacity = '0';
        setTimeout(() => n.remove(), 500);
    }, 3000);
}

// --- Funções de Carregamento e Salvamento de Dados ---
async function loadFideData() {
    try {
        const response = await fetch(`../api/api_get_data.php?v=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        fideData = data.fideData || [];
        loadFideTable();
    } catch (error) {
        console.error("Não foi possível carregar os dados FIDE da API:", error);
        showNotification("Erro ao carregar dados FIDE.", "error");
    }
}

async function saveAllData() {
    try {
        // Para salvar, precisamos enviar todos os dados, não apenas FIDE.
        // Primeiro, carregamos os dados atuais para não sobrescrever outras seções.
        const response = await fetch(`../api/api_get_data.php?v=${Date.now()}`);
        const allData = await response.json();

        // Atualizamos apenas a parte do FIDE
        allData.fideData = fideData;

        const saveResponse = await fetch('../api/api_save_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allData),
        });

        if (!saveResponse.ok) throw new Error(`Erro do servidor: ${saveResponse.statusText}`);

        const result = await saveResponse.json();
        console.log(result.message);
        showNotification('Alterações no FIDE salvas no servidor!');
    } catch (error) {
        console.error('Falha ao salvar os dados:', error);
        showNotification('Erro ao salvar alterações no servidor!', 'error');
    }
}

// --- Funções de Manipulação do FIDE ---

function loadFideTable() {
    const tableBody = document.getElementById('fide-list');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    fideData.forEach(fide => {
        const row = document.createElement('tr');
        let statusClass = 'status-em-andamento';
        if (fide.status === 'Enviado') statusClass = 'status-concluida';
        if (fide.status === 'Cancelado') statusClass = 'status-cancelada';

        row.innerHTML = `
            <td>${fide.id}</td>
            <td>${fide.desastre}</td>
            <td>${new Date(fide.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
            <td><span class="status-badge ${statusClass}">${fide.status}</span></td>
            <td>
                <button class="action-btn btn-details" data-id="${fide.id}">Editar</button>
                <button class="action-btn btn-danger" data-id="${fide.id}">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function openFideModal(fideId = null) {
    const fideModal = document.getElementById('fideModal');
    const fideModalBody = document.getElementById('fide-modal-body');
    const fideModalFooter = document.getElementById('fide-modal-footer');
    const modalHeader = fideModal.querySelector('.modal-header');

    fideModalBody.innerHTML = '<p>Carregando formulário...</p>';
    fideModal.style.display = 'flex';

    try {
        const response = await fetch('cadastro_fide.html');
        const formPageHtml = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formPageHtml;
        const formContent = tempDiv.querySelector('.form-content');
        const buttonGroup = tempDiv.querySelector('.button-group');

        fideModalBody.innerHTML = ''; // Limpa o "carregando"
        fideModalBody.appendChild(formContent);
        fideModalFooter.innerHTML = '';
        fideModalFooter.appendChild(buttonGroup);

        const form = fideModalBody.querySelector('#fideForm');
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'fide-id';
        idInput.name = 'fide_id';
        form.appendChild(idInput);

        if (fideId) {
            modalHeader.textContent = 'Editar FIDE';
            const fide = fideData.find(f => f.id === fideId);
            if (fide && fide.fullData) {
                document.getElementById('fide-id').value = fide.id;
                for (const key in fide.fullData) {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field) {
                        if (field.type === 'radio' || field.type === 'checkbox') {
                            const value = fide.fullData[key];
                            const fieldToSelect = form.querySelector(`[name="${key}"][value="${value}"]`);
                            if (fieldToSelect) fieldToSelect.checked = true;
                        } else {
                            field.value = fide.fullData[key];
                        }
                    }
                }
            }
        } else {
            modalHeader.textContent = 'Cadastrar Novo FIDE';
        }

        form.addEventListener('submit', handleFideFormSubmit);
        fideModalFooter.querySelector('.btn-secondary')?.addEventListener('click', () => fideModal.style.display = 'none');

    } catch (error) {
        console.error("Erro ao carregar o formulário FIDE:", error);
        fideModalBody.innerHTML = '<p>Ocorreu um erro ao carregar o formulário. Tente novamente.</p>';
    }
}

async function handleFideFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const fullData = Object.fromEntries(formData.entries());
    const id = fullData.fide_id;

    if (id) {
        const index = fideData.findIndex(f => f.id === id);
        if (index !== -1) {
            fideData[index].fullData = fullData;
            fideData[index].desastre = fullData.denominacao || fideData[index].desastre;
            fideData[index].data = fullData.data_ocorrencia || fideData[index].data;
        }
    } else {
        const newId = `FIDE-${new Date().getFullYear()}-${(fideData.length + 1).toString().padStart(3, '0')}`;
        fideData.push({
            id: newId,
            desastre: fullData.denominacao || 'Não especificado',
            data: fullData.data_ocorrencia,
            status: 'Em Elaboração',
            fullData: fullData
        });
    }

    await saveAllData();
    loadFideTable();
    document.getElementById('fideModal').style.display = 'none';
    showNotification('FIDE salvo com sucesso!');
}

function confirmDeleteFide(fideId) {
    currentFideIdToDelete = fideId;
    document.getElementById('confirmDeleteFideModal').style.display = 'flex';
}

async function deleteFide() {
    fideData = fideData.filter(f => f.id !== currentFideIdToDelete);
    await saveAllData();
    loadFideTable();
    document.getElementById('confirmDeleteFideModal').style.display = 'none';
    showNotification('FIDE excluído com sucesso.');
    currentFideIdToDelete = null;
}

// --- Lógica de Navegação da Página de Documentos ---
function initializeDocsNavigation() {
    const menuItems = document.querySelectorAll('.sidebar .menu-item');
    const sections = document.querySelectorAll('.main-content .section');

    menuItems.forEach(item => {
        item.addEventListener('click', async () => {
            const targetId = item.getAttribute('data-target');
            if (!targetId) return;

            // Gerencia a classe 'active' no menu
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Mostra a seção alvo
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                // Esconde todas as seções e mostra a correta
                sections.forEach(s => s.classList.remove('active'));
                targetSection.classList.add('active');

                if (targetId === 'reconhecimento' && targetSection.innerHTML.trim() === '') {
                    // Carrega o conteúdo do reconhecimento federal na primeira vez
                    try {
                        const response = await fetch('reconhecimento.html');
                        if (!response.ok) {
                            throw new Error(`Falha ao carregar: ${response.status} ${response.statusText}`);
                        }
                        targetSection.innerHTML = await response.text();
                        initializeReconhecimentoSection(targetSection); // Inicializa os scripts da seção
                    } catch (error) {
                        console.error('Erro ao carregar a seção de reconhecimento:', error);
                        targetSection.innerHTML = `<p style="color: red; padding: 20px;">Erro ao carregar o conteúdo. Verifique o console para mais detalhes.</p>`;
                    }
                }

                // Fecha o menu responsivo após o clique (lógica do menu principal)
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.overlay');
                if (sidebar && overlay) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                }
            }
        });
    });
}

// --- Funções da Seção de Reconhecimento Federal ---
function initializeReconhecimentoSection(container) {
    // Dados da classificação COBRADE (resumidos)
    const cobradeData = {
        naturais: [
            {
                grupo: "Geológico", tipos: [
                    { nome: "Terremoto", codigo: "1.1.1.1.0", definicao: "Vibrações do terreno que provocam obstáculos verticais e horizontais na superfície da Terra" },
                    { nome: "Tsunami", codigo: "1.1.1.2.0", definicao: "Série de ondas geradas por deslocamento de um grande volume de água" },
                    { nome: "Movimento de Massa", codigo: "1.1.3.0.0", definicao: "Quedas, deslizamentos, corridas de massa, subsidências e colapsos" }
                ]
            },
            {
                grupo: "Hidrológico", tipos: [
                    { nome: "Inundação", codigo: "1.2.1.0.0", definicao: "Submersão de áreas fora dos limites normais de um curso de água" },
                    { nome: "Enxurrada", codigo: "1.2.2.0.0", definicao: "Escoamento superficial de alta velocidade e energia, provocada por chuvas intensas" },
                    { nome: "Alagamento", codigo: "1.2.3.0.0", definicao: "Acúmulo de água em ruas, calçadas ou outras infraestruturas urbanas" }
                ]
            },
            {
                grupo: "Meteorológico", tipos: [
                    { nome: "Vendaval/Ciclone", codigo: "1.3.1.1.1", definicao: "Ventos fortes com potencial destrutivo" },
                    { nome: "Granizo", codigo: "1.3.2.3.0", definicao: "Precipitação de pedaços irregulares de gelo" },
                    { nome: "Seca", codigo: "1.4.1.2.0", definicao: "Estiagem prolongada que provoca grave desequilíbrio hidrológico" }
                ]
            }
        ],
        tecnologicos: [
            {
                grupo: "Substâncias Perigosas", tipos: [
                    { nome: "Vazamento Químico", codigo: "2.2.1.1.0", definicao: "Liberação de produtos químicos para a atmosfera" },
                    { nome: "Contaminação da Água", codigo: "2.2.2.1.0", definicao: "Derramamento de produtos químicos em sistemas de água" }
                ]
            },
            {
                grupo: "Transporte", tipos: [
                    { nome: "Acidente Rodoviário", codigo: "2.5.1.0.0", definicao: "Acidente no modal rodoviário envolvendo transporte" },
                    { nome: "Acidente Ferroviário", codigo: "2.5.2.0.0", definicao: "Acidente com participação de veículo ferroviário" }
                ]
            },
            {
                grupo: "Infraestrutura", tipos: [
                    { nome: "Colapso de Edificação", codigo: "2.4.1.0.0", definicao: "Queda de estrutura civil" },
                    { nome: "Rompimento de Barragem", codigo: "2.4.2.0.0", definicao: "Rompimento ou colapso de barragens" }
                ]
            }
        ]
    };

    // Função para popular a tabela COBRADE
    function populateCobradeTable() {
        const naturaisContent = container.querySelector('#naturais-content');
        const tecnologicosContent = container.querySelector('#tecnologicos-content');
        if (!naturaisContent || !tecnologicosContent) return;

        let naturaisHTML = '';
        cobradeData.naturais.forEach(grupo => {
            naturaisHTML += `<h4>${grupo.grupo}</h4>`;
            grupo.tipos.forEach(tipo => {
                naturaisHTML += `<div class="definition-box" data-search="${tipo.nome.toLowerCase()} ${tipo.codigo} ${tipo.definicao.toLowerCase()}"><strong>${tipo.nome}</strong> (Código: ${tipo.codigo})<br>${tipo.definicao}</div>`;
            });
        });
        naturaisContent.innerHTML = naturaisHTML;

        let tecnologicosHTML = '';
        cobradeData.tecnologicos.forEach(grupo => {
            tecnologicosHTML += `<h4>${grupo.grupo}</h4>`;
            grupo.tipos.forEach(tipo => {
                tecnologicosHTML += `<div class="definition-box" data-search="${tipo.nome.toLowerCase()} ${tipo.codigo} ${tipo.definicao.toLowerCase()}"><strong>${tipo.nome}</strong> (Código: ${tipo.codigo})<br>${tipo.definicao}</div>`;
            });
        });
        tecnologicosContent.innerHTML = tecnologicosHTML;
    }

    // Sistema de abas
    container.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            container.querySelector(`#${tabId}`).classList.add('active');
        });
    });

    // Função para abrir uma aba específica (usada pelo botão "Ver Documentação")
    window.openTab = (tabName) => {
        container.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) tab.classList.add('active');
        });
        container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName) content.classList.add('active');
        });
    };

    // Funcionalidade de busca na aba COBRADE
    const searchInput = container.querySelector('#cobradeSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase();
            container.querySelectorAll('#cobrade .definition-box').forEach(box => {
                const text = box.getAttribute('data-search');
                if (text.includes(searchTerm)) {
                    box.style.display = 'block';
                } else {
                    box.style.display = 'none';
                }
            });
        });
    }

    // Inicializa o conteúdo
    populateCobradeTable();
}

// --- Lógica para o menu responsivo (hambúrguer) ---
function initializeResponsiveMenu() {
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
}

// --- Inicialização e Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadFideData();

        // Botão de logout
        document.getElementById('logout-btn-docs').addEventListener('click', logout);

        // Botão para adicionar novo FIDE
        document.getElementById('btn-add-fide').addEventListener('click', () => openFideModal());

        // Listeners para os modais
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });

        // Listener para a tabela (delegação de eventos)
        document.getElementById('fide-list').addEventListener('click', (e) => {
            const target = e.target;
            const fideId = target.getAttribute('data-id');
            if (!fideId) return;

            if (target.classList.contains('btn-details')) {
                openFideModal(fideId);
            } else if (target.classList.contains('btn-danger')) {
                confirmDeleteFide(fideId);
            }
        });

        // Listeners para o modal de confirmação de exclusão
        document.getElementById('cancelDeleteFide').addEventListener('click', () => {
            document.getElementById('confirmDeleteFideModal').style.display = 'none';
        });
        document.getElementById('confirmDeleteFide').addEventListener('click', deleteFide);

        // Inicializa a navegação da página
        initializeDocsNavigation();

        // Inicializa o menu responsivo
        initializeResponsiveMenu();

        // Garante que a seção inicial (FIDE) esteja visível
        document.getElementById('fide').classList.add('active');
    }
});
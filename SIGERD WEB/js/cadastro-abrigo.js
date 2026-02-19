import { saveAllData } from './script.js';

let editingShelterId = null; // Variável para controlar se estamos editando

// Lógica de autenticação e usuário
const user = sessionStorage.getItem('sigerd_user');
if (!user) {
    window.location.href = 'login.html';
} else {
    try {
        const userData = JSON.parse(user);
        document.querySelector('.user-details span').textContent = userData.name || 'Operador';
        document.querySelector('.user-info img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`;
    } catch (e) { console.error("Erro ao processar dados do usuário:", e); }
}

// Logout
document.getElementById('logout-btn-page').addEventListener('click', () => {
    sessionStorage.removeItem('sigerd_user');
    window.location.href = 'login.html';
});

// Lógica do menu hambúrguer (simplificada para esta página)
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

// Função para carregar o formulário parcial
async function loadFormPartial() {
    try {
        const response = await fetch('partials/form-abrigo.html'); // Caminho corrigido relativo à página 'cadastro-abrigo.html'
        const formHtml = await response.text();
        // Injeta o formulário e adiciona o listener de submit
        document.getElementById('abrigoForm').insertAdjacentHTML('afterbegin', formHtml);
        document.getElementById('abrigoForm').addEventListener('submit', handleFormSubmit);

    } catch (error) {
        console.error('Erro ao carregar o formulário de abrigo:', error);
        document.getElementById('abrigoForm').innerHTML = '<p>Erro ao carregar o formulário. Tente recarregar a página.</p>';
    }
}

// Verifica se há um ID na URL (modo de edição)
const urlParams = new URLSearchParams(window.location.search);
editingShelterId = urlParams.get('id');

if (editingShelterId) {
    // Estamos em modo de edição
    document.querySelector('.header h2').innerHTML = '<i class="fas fa-edit"></i> Editar Abrigo';
    document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
}

// Carrega o formulário e depois, se for o caso, preenche com os dados de edição
loadFormPartial().then(() => {
    if (editingShelterId) {

        // Carrega os dados do abrigo do localStorage
        const allData = JSON.parse(localStorage.getItem('sigerd_all_data'));
        const shelterToEdit = allData?.sheltersData.find(s => s.id === editingShelterId);

        if (shelterToEdit) {
            // Preenche o formulário com os dados
            const data = shelterToEdit.fullData || {};
            document.getElementById('local').value = shelterToEdit.nome || '';
            document.getElementById('capacidade').value = shelterToEdit.capacidade || '';
            document.getElementById('endereco_completo').value = shelterToEdit.localizacao || '';
            document.getElementById('coordenadas_gps').value = data.coordenadas_gps || '';
            document.getElementById('tipo_abrigo').value = data.tipo_abrigo || '';
            document.getElementById('status_operacional').value = data.status_operacional || 'ativo';
            document.getElementById('direcao_nome').value = shelterToEdit.responsaveis || '';
            document.getElementById('direcao_telefone').value = data.direcao_telefone || shelterToEdit.contato || '';
            document.getElementById('chaves_nome').value = data.chaves_nome || '';
            document.getElementById('chaves_telefone').value = data.chaves_telefone || '';
            document.getElementById('salas_disponiveis').value = data.salas_disponiveis || '';
            document.getElementById('banheiros').value = data.banheiros || '';
            document.getElementById('banheiros_adaptados').value = data.banheiros_adaptados || '';
            document.getElementById('chuveiros').value = data.chuveiros || 'nao';
            document.getElementById('possui_cozinha').value = data.possui_cozinha || 'nao';
            document.getElementById('colchoes_quantidade').value = shelterToEdit.colchoes || '';
            document.getElementById('cobertores_quantidade').value = data.cobertores_quantidade || '';
            document.getElementById('produtos_higiene').value = data.produtos_higiene || 'nao';
            document.getElementById('observacoes').value = data.observacoes || '';
            document.getElementById('data_ultima_inspecao').value = data.data_ultima_inspecao || '';
            document.getElementById('responsavel_cadastro').value = data.responsavel_cadastro || '';
        }
    }
});

// Lógica do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (key.endsWith('[]')) {
            const cleanKey = key.slice(0, -2);
            if (!data[cleanKey]) data[cleanKey] = [];
            data[cleanKey].push(value);
        } else {
            data[key] = value;
        }
    }

    try {
        let allData = JSON.parse(localStorage.getItem('sigerd_all_data')) || {};
        if (!allData.sheltersData) allData.sheltersData = [];

        if (editingShelterId) {
            const index = allData.sheltersData.findIndex(s => s.id === editingShelterId);
            if (index !== -1) {
                const existingShelter = allData.sheltersData[index];
                allData.sheltersData[index] = { ...existingShelter, nome: data.local, localizacao: data.endereco_completo, capacidade: parseInt(data.capacidade, 10), responsaveis: data.direcao_nome, contato: data.direcao_telefone, colchoes: parseInt(data.colchoes_quantidade, 10) || 0, fullData: data };
            }
        } else {
            const newId = 'abg' + (allData.sheltersData.length + 1).toString().padStart(3, '0');
            const newShelter = {
                id: newId,
                nome: data.local,
                localizacao: data.endereco_completo,
                capacidade: parseInt(data.capacidade, 10),
                responsaveis: data.direcao_nome,
                contato: data.direcao_telefone,
                infraestrutura: '', // Campo legado, mantido para compatibilidade
                desalojados: 0,
                desabrigados: 0,
                cestasBasicas: 0, // Campo legado
                colchoes: parseInt(data.colchoes_quantidade, 10) || 0,
                agua: 0, // Campo legado
                status: 'aberto',
                fullData: data // Salva todos os detalhes do formulário
            };
            allData.sheltersData.push(newShelter);
        }

        localStorage.setItem('sigerd_all_data', JSON.stringify(allData));
        await saveAllData();

        const message = editingShelterId ? 'Abrigo atualizado com sucesso!' : 'Abrigo cadastrado com sucesso!';
        alert(message + ' Você será redirecionado para o painel.');

        setTimeout(() => { window.location.href = '../index.html#abrigos'; }, 1500);
    } catch (error) {
        console.error('Erro ao salvar abrigo:', error);
        alert('Ocorreu um erro ao salvar o abrigo. Verifique o console.');
    }
}
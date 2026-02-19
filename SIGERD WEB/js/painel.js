document.addEventListener('DOMContentLoaded', () => {
    // Função para fechar a aba
    document.getElementById('closePanel').addEventListener('click', () => {
        window.close();
    });

    // Atualiza o painel imediatamente ao carregar
    updateTrackingPanel();

    // Define um intervalo para atualizar a cada 10 segundos
    setInterval(updateTrackingPanel, 10000);

    // Ouve por mudanças no localStorage feitas pela aba principal
    window.addEventListener('storage', (event) => {
        if (event.key === 'sigerd_data_update') {
            console.log('Dados atualizados pela aba principal. Recarregando painel...');
            updateTrackingPanel();
        }
    });
});

function updateTrackingPanel() {
    console.log('Atualizando painel de acompanhamento...');

    // Pega os dados do localStorage
    const allData = JSON.parse(localStorage.getItem('sigerd_all_data'));

    if (!allData) {
        console.error('Nenhum dado do SIGERD encontrado no localStorage.');
        // Opcional: exibir uma mensagem de erro no painel
        // Apenas mostra o erro se não for a primeira vez que a função roda
        if (document.body.getAttribute('data-loaded-once')) {
            document.getElementById('tracking-status-plano').innerHTML = '<h1>Erro: Não foi possível carregar os dados. Mantenha a aba principal do SIGERD aberta e atualize-a.</h1>';
        } else {
            document.getElementById('tracking-status-plano').innerHTML = '<h2>Aguardando dados da aba principal...</h2>';
        }
        return;
    }

    const { sheltersData, donationsData, dashboardCards, isPlanActive, currentPlanLevel } = allData;

    // Atualiza a hora da última atualização
    document.getElementById('tracking-panel-last-update').textContent = new Date().toLocaleTimeString('pt-BR');
    document.body.setAttribute('data-loaded-once', 'true'); // Marca que já carregou dados pelo menos uma vez

    // 1. Preenche os cards que vêm prontos do dashboard
    document.getElementById('tracking-status-plano').innerHTML = dashboardCards.statusPlano || 'Carregando...';
    document.getElementById('tracking-alertas-ativos').innerHTML = dashboardCards.alertasAtivos || 'Carregando...';
    document.getElementById('tracking-pessoas-impactadas').innerHTML = dashboardCards.pessoasImpactadas || 'Carregando...';
    document.getElementById('tracking-recursos-empregados').innerHTML = dashboardCards.recursosEmpregados || 'Carregando...';
    document.getElementById('tracking-tarefas-prioritarias').innerHTML = dashboardCards.tarefasPrioritarias || 'Carregando...';
    document.getElementById('tracking-condicoes-climaticas').innerHTML = dashboardCards.condicoesClimaticas || 'Carregando...';

    // 2. Atualiza a cor de fundo com base no status do plano
    const body = document.body;
    // Remove classes de cor antigas
    body.classList.remove('bg-normalidade', 'bg-atencao', 'bg-alerta', 'bg-maximo');

    // Adiciona a classe nova
    const level = isPlanActive ? currentPlanLevel : 'normalidade';
    const statusClassMap = {
        'normalidade': 'bg-normalidade', 'atencao': 'bg-atencao',
        'alerta': 'bg-alerta', 'maximo': 'bg-maximo'
    };
    body.classList.add(statusClassMap[level] || 'bg-normalidade');

    // 2. Status dos Abrigos (cálculo local)
    const abertos = sheltersData.filter(s => s.status === 'aberto').length;
    const lotados = sheltersData.filter(s => s.status === 'lotado').length;
    const totalAcomodados = sheltersData.reduce((sum, s) => sum + (s.desalojados || 0) + (s.desabrigados || 0), 0);
    const capacidadeTotal = sheltersData.reduce((sum, s) => sum + (s.capacidade || 0), 0);
    const ocupacaoPercent = capacidadeTotal > 0 ? ((totalAcomodados / capacidadeTotal) * 100).toFixed(0) : 0;

    document.getElementById('tracking-abrigos').innerHTML = `
        <div class="card-header"><i class="fas fa-home"></i><h3>Status dos Abrigos</h3></div>
        <div class="stat">${totalAcomodados}</div>
        <p>Pessoas Acomodadas</p>
        <ul class="card-list">
            <li>Abrigos Abertos: <strong>${abertos}</strong></li>
            <li>Abrigos Lotados: <strong>${lotados}</strong></li>
            <li>Ocupação Total: <strong>${ocupacaoPercent}%</strong></li>
        </ul>
    `;

    // 3. Estoque de Itens Essenciais (cálculo local)
    const stock = donationsData.reduce((acc, donation) => {
        const distributedAmount = (donation.distributions || []).reduce((sum, dist) => sum + dist.quantity, 0);
        const availableStock = (donation.originalQuantity || donation.quantity) - distributedAmount;
        const key = donation.item;
        acc[key] = (acc[key] || 0) + availableStock;
        return acc;
    }, {});

    const itensEssenciais = ['Cesta Básica', 'Água Mineral', 'Colchão', 'Kit de Higiene'];
    let estoqueHtml = '<ul class="card-list">';
    let hasStock = false;
    itensEssenciais.forEach(item => {
        if (stock[item] !== undefined && stock[item] > 0) {
            estoqueHtml += `<li>${item}: <strong>${stock[item]}</strong></li>`;
            hasStock = true;
        }
    });

    if (!hasStock) {
        estoqueHtml += '<li>Nenhum item essencial em estoque.</li>';
    }
    estoqueHtml += '</ul>';

    document.getElementById('tracking-estoque').innerHTML = `
        <div class="card-header"><i class="fas fa-box-open"></i><h3>Estoque de Itens Essenciais</h3></div>
        ${estoqueHtml}
    `;
}
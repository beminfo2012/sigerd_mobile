document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Autenticação e Usuário ---
    function checkAuth() {
        const user = sessionStorage.getItem('sigerd_user');
        if (!user) {
            // Se não houver usuário, pode fechar a aba ou redirecionar,
            // mas como é uma aba filha, vamos apenas não mostrar os dados.
            console.warn("Usuário não autenticado.");
            return false;
        }

        try {
            const userData = JSON.parse(user);
            document.querySelector('.user-details span').textContent = userData.name || 'Operador';
            document.querySelector('.user-info img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`;
        } catch (e) {
            console.error("Erro ao processar dados do usuário:", e);
        }
        return true;
    }

    let map = null;
    let actionsData = [];
    // Camadas separadas para cada status
    let naoIniciadaLayer = L.layerGroup();
    let emAndamentoLayer = L.layerGroup();
    let concluidaLayer = L.layerGroup();
    let canceladaLayer = L.layerGroup();
    let layerControl = null;

    // Coordenadas de Santa Maria de Jetibá para centrar o mapa
    const smjCoordinates = [-20.033, -40.74];

    // Função para inicializar o mapa
    function initializeMap() {
        if (map) return; // Evita reinicializar

        map = L.map('map-ocorrencias', {
            layers: [naoIniciadaLayer, emAndamentoLayer, concluidaLayer, canceladaLayer] // Adiciona as camadas por padrão
        }).setView(smjCoordinates, 12);

        const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        baseLayer.addTo(map);

        const baseMaps = {
            "Padrão": baseLayer
        };

        const overlayMaps = {
            "<span style='color: #DC3545; font-weight: bold;'>Em Andamento</span>": emAndamentoLayer,
            "<span style='color: #808080;'>Não Iniciada</span>": naoIniciadaLayer,
            "<span style='color: #28A745;'>Concluída</span>": concluidaLayer,
            "<span style='color: #343a40;'>Cancelada</span>": canceladaLayer
        };

        layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    }

    // Função para carregar e exibir as ocorrências
    function loadOccurrences() {
        const allData = JSON.parse(localStorage.getItem('sigerd_all_data'));
        if (!allData || !allData.actionsData) {
            console.error('Dados de ocorrências não encontrados no localStorage.');
            return;
        }
        actionsData = allData.actionsData;
        plotOccurrences(actionsData);
    }

    // Função para plotar as ocorrências no mapa
    function plotOccurrences(occurrences) {
        // Limpa todas as camadas antes de redesenhar
        naoIniciadaLayer.clearLayers();
        emAndamentoLayer.clearLayers();
        concluidaLayer.clearLayers();
        canceladaLayer.clearLayers();

        const statusInfo = {
            'nao-iniciada': { color: '#808080', icon: 'fa-hourglass-start' }, // Cinza
            'em-andamento': { color: '#DC3545', icon: 'fa-cogs' }, // Vermelho (Urgente)
            'concluida': { color: '#28A745', icon: 'fa-check-circle' }, // Verde
            'cancelada': { color: '#343a40', icon: 'fa-times-circle' }, // Cinza Escuro
        };

        const validOccurrences = occurrences.filter(action => action.latitude && action.longitude);

        if (validOccurrences.length === 0) {
            return; // Sai se não houver ocorrências com coordenadas
        }

        validOccurrences.forEach(action => {
            const lat = parseFloat(action.latitude);
            const lon = parseFloat(action.longitude);

            if (!isNaN(lat) && !isNaN(lon)) {
                const status = statusInfo[action.status] || { color: 'blue', icon: 'fa-question-circle' };

                // Cria um ícone de alfinete (map pin) com SVG
                const pinSVG = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker">
                        <path fill-opacity=".9" stroke="#FFF" stroke-width="1.5" d="M16 3.5c-4.4 0-8 3.6-8 8 0 8 8 16.5 8 16.5s8-8.5 8-16.5c0-4.4-3.6-8-8-8z" fill="${status.color}"/>
                    </svg>`;

                const customIcon = L.divIcon({
                    html: pinSVG,
                    className: '', // Remove a classe padrão para usar o SVG puro
                    iconSize: [32, 32],
                    iconAnchor: [16, 32], // Aponta a ponta do alfinete para a coordenada
                    popupAnchor: [0, -32] // Posiciona o popup acima do ícone
                });

                const marker = L.marker([lat, lon], { icon: customIcon });

                // Conteúdo do Popup
                const statusText = (action.status || '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

                const popupContent = `
                    <b>Ocorrência: ${action.id}</b><br>
                    <hr>
                    <b>Descrição:</b> ${action.descricao}<br>
                    <b>Status:</b> ${statusText}<br>
                    <b>Fase:</b> ${action.fase || 'N/A'}<br>
                    <b>Responsável:</b> ${action.responsavel}<br>
                `;

                marker.bindPopup(popupContent);

                // Adiciona o marcador à camada correta
                switch (action.status) {
                    case 'nao-iniciada': naoIniciadaLayer.addLayer(marker); break;
                    case 'em-andamento': emAndamentoLayer.addLayer(marker); break;
                    case 'concluida': concluidaLayer.addLayer(marker); break;
                    case 'cancelada': canceladaLayer.addLayer(marker); break;
                    default:
                        // Pode criar uma camada "Outros" se quiser
                        break;
                }
            }
        });
    }

    // --- Event Listeners ---

    // Fechar o painel
    document.getElementById('closePanel').addEventListener('click', () => {
        window.close();
    });

    // Ouvir por atualizações da aba principal
    window.addEventListener('storage', (event) => {
        if (event.key === 'sigerd_data_update') {
            console.log('Dados atualizados pela aba principal. Recarregando mapa de ocorrências...');
            loadOccurrences();
        }
    });

    // --- Inicialização ---
    checkAuth();
    initializeMap();
    loadOccurrences();

    // Atualiza a cada 30 segundos para garantir sincronia
    setInterval(loadOccurrences, 30000);
});
let map = null;
let riskAreasLayerGroup = null;
let riskAreaFeatures = []; // Armazena as features para busca

document.addEventListener('DOMContentLoaded', () => {
    initializePanel();
    updateTime();
    setInterval(updateTime, 60000); // Atualiza a cada minuto
});

function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

function initializePanel() {
    const allData = JSON.parse(localStorage.getItem('sigerd_all_data'));
    const areasDeRisco = JSON.parse(localStorage.getItem('sigerd_areas_risco'));

    if (!allData || !allData.scoAlertsData || !areasDeRisco) {
        document.getElementById('alerts-table-body').innerHTML = '<tr><td colspan="5">Não foi possível carregar os dados. Mantenha a aba principal do SIGERD aberta e atualize-a.</td></tr>';
        return;
    }

    riskAreaFeatures = areasDeRisco.features; // Salva as features para uso posterior

    initializeMap(areasDeRisco);

    const now = new Date();
    const activeAlerts = allData.scoAlertsData.filter(alert => !alert.end || new Date(alert.end) > now);

    displaySummaryCards(activeAlerts);
    displayAlertsTable(activeAlerts);
}

function displaySummaryCards(activeAlerts) {
    const container = document.getElementById('summary-cards');
    container.innerHTML = '';

    const counts = activeAlerts.reduce((acc, alert) => {
        const intensity = alert.intensity.toLowerCase();
        acc[intensity] = (acc[intensity] || 0) + 1;
        return acc;
    }, {});

    const levels = [
        { name: 'Alto', class: 'alto' },
        { name: 'Moderado', class: 'moderado' },
        { name: 'Baixo', class: 'baixo' }
    ];

    levels.forEach(level => {
        const count = counts[level.name.toLowerCase()] || 0;
        const card = document.createElement('div');
        card.className = `summary-card card-${level.class}`;
        card.innerHTML = `
            <div class="card-title">Alertas de Risco ${level.name}</div>
            <div class="card-value">${count}</div>
        `;
        container.appendChild(card);
    });
}

function displayAlertsTable(activeAlerts) {
    const tableBody = document.getElementById('alerts-table-body');
    const tableHead = document.querySelector('.alerts-table thead');
    tableBody.innerHTML = '';

    tableHead.innerHTML = `
        <tr>
            <th>Nível</th>
            <th>Tipo de Risco</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Anexo</th>
        </tr>
    `;

    if (activeAlerts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum alerta vigente no momento.</td></tr>';
        return;
    }

    activeAlerts.forEach(alert => {
        const row = document.createElement('tr');
        row.className = 'alert-row';
        row.dataset.region = alert.region; // Armazena a região para o clique

        const formatDate = (dateString) => {
            if (!dateString) return 'Vigente';
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        };

        const startDate = formatDate(alert.start);
        const endDate = formatDate(alert.end);

        row.innerHTML = `
            <td><span class="level-indicator intensity-${alert.intensity}"></span> ${alert.intensity}</td>
            <td>${alert.type}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${alert.attachment ? `<i class="fas fa-file-pdf" title="${alert.attachment}"></i>` : '-'}</td>
        `;

        row.addEventListener('click', () => {
            tableBody.querySelectorAll('.alert-row.active').forEach(el => el.classList.remove('active'));
            row.classList.add('active');

            const areaName = row.dataset.region;
            const areaFeature = riskAreaFeatures.find(f => f.properties.setor === areaName);

            if (map && areaFeature && areaFeature.geometry) {
                const polygon = L.geoJSON(areaFeature);
                map.flyToBounds(polygon.getBounds(), { paddingTopLeft: L.point(50, 50) });
            }
        });

        tableBody.appendChild(row);
    });
}

function initializeMap(geojsonData) {
    const smjCoordinates = [-20.033, -40.74];
    map = L.map('map', {
        zoomControl: false // Desativa o controle de zoom padrão
    }).setView(smjCoordinates, 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map); // Adiciona o controle de zoom no canto inferior direito

    riskAreasLayerGroup = L.layerGroup().addTo(map);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    osmLayer.addTo(map);
    const baseMaps = { "Padrão": osmLayer, "Satélite": satelliteLayer };
    const overlayMaps = { "Áreas de Risco": riskAreasLayerGroup };
    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    loadRiskAreasOnMap(geojsonData);
}

function loadRiskAreasOnMap(geojsonData) {
    try {
        L.geoJSON(geojsonData, {
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
                    <p><strong>Nível de Risco:</strong> ${props.nivel_risco}</p>
                    <p><strong>Descrição:</strong> ${props.descricao}</p>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(riskAreasLayerGroup);

    } catch (error) {
        console.error("Erro ao carregar as áreas de risco no mapa do painel:", error);
    }
}
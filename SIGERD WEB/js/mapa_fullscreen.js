let map = null;
let riskAreasLayerGroup = null;
let rainGaugesLayerGroup = null;
let legendControl = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    loadRainGauges();
});

function initializeMap() {
    const smjCoordinates = [-20.033, -40.74];

    if (!map) {
        map = L.map('map').setView(smjCoordinates, 12);
        riskAreasLayerGroup = L.layerGroup().addTo(map);
        rainGaugesLayerGroup = L.layerGroup().addTo(map);

        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });

        osmLayer.addTo(map);

        const baseMaps = { "Padrão": osmLayer, "Satélite": satelliteLayer };
        const overlayMaps = { "Áreas de Risco": riskAreasLayerGroup, "Pluviômetros": rainGaugesLayerGroup };

        L.control.layers(baseMaps, overlayMaps).addTo(map);

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
                    <i style="background: #e53935"></i> > 70mm<br>
                    <i style="background: #fb8c00"></i> 40-70mm<br>
                    <i style="background: #FFC107"></i> 10-40mm<br>
                    <i style="background: #4CAF50"></i> < 10mm<br>
                </div>
            `;
            return div;
        };

        L.Control.LegendToggle = L.Control.extend({
            onAdd: function (map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                container.innerHTML = '<a href="#" title="Legenda"><i class="fas fa-list-ul"></i></a>';
                container.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (legendControl._map) {
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

    if (riskAreasLayerGroup) riskAreasLayerGroup.clearLayers();
    if (rainGaugesLayerGroup) rainGaugesLayerGroup.clearLayers();

    loadRiskAreasOnMap();
}

async function loadRiskAreasOnMap() {
    try {
        const response = await fetch('../api/areas_de_riscos.json');
        const geojsonData = await response.json();

        const geoJsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                const nivelRisco = feature.properties.nivel_risco;
                let color = '#cccccc';
                if (nivelRisco.includes('R3')) color = '#e53935';
                else if (nivelRisco.includes('R2')) color = '#fb8c00';
                return { color: color, weight: 2, opacity: 0.8, fillOpacity: 0.3 };
            },
            onEachFeature: function (feature, layer) {
                const props = feature.properties;
                layer.bindPopup(`
                    <h4>Área de Risco: ${props.setor}</h4>
                    <p><strong>Localização:</strong> ${props.localizacao}</p>
                    <p><strong>Nível de Risco:</strong> ${props.nivel_risco}</p>
                    <p><strong>Descrição:</strong> ${props.descricao}</p>
                `);
            }
        });
        riskAreasLayerGroup.addLayer(geoJsonLayer);
    } catch (error) {
        console.error("Erro ao carregar as áreas de risco no mapa:", error);
    }
}

async function loadRainGauges() {
    const getFormattedDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
    };

    const ibgeCode = '3204559';
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIiLCJwYXNzd29yZCI6IitMamJKS2xFUE1Zd0UzOCszY2RFb3RmaGc4L0lmYjFPTEk5TFNQRUlBTUU9IiwiaXNzIjoiYnIuZ292LmNlbWFkZW4iLCJleHAiOjE3NTg5MDQzOTAsImlhdCI6MTc1ODg4OTk5MCwianRpIjoiYjM5YjQzMDktYjYxMi00YjQ4LWE0MzYtM2I3YjYxN2Y1YjQzIiwidXNlcm5hbWUiOiJiN2JJNGw1eldtdFY0WFJ3VkJ5OHZnZTBYRUo0TGtyNnNodmxSazRlMGxJPSJ9.5-u5_p_iIeU1_yRj_1-K_q_q-y_z-x_w-v_u-t_s-r'; // NOVO TOKEN

    try {
        const cadastroUrl = `../api/proxy_cemaden_cadastro.php?codibge=${ibgeCode}&token=${token}`;
        const cadastroResponse = await fetch(cadastroUrl);
        if (!cadastroResponse.ok) throw new Error(`Erro no cadastro: ${cadastroResponse.statusText}`);
        const estacoesCadastradas = await cadastroResponse.json();
        const cadastroMap = new Map(estacoesCadastradas.map(estacao => [estacao.codestacao, estacao]));

        const dataParam = getFormattedDate();
        const registrosUrl = `../api/proxy_cemaden_registros.php?codibge=${ibgeCode}&data=${dataParam}&token=${token}`;
        const registrosResponse = await fetch(registrosUrl);
        if (!registrosResponse.ok) throw new Error(`Erro nos registros: ${registrosResponse.statusText}`);
        const gaugesData = await registrosResponse.json();

        const gaugesWithCoords = gaugesData.map(gauge => ({ ...gauge, ...cadastroMap.get(gauge.codestacao) }));
        plotRainGaugesOnMap(gaugesWithCoords);

    } catch (error) {
        console.error("Falha ao carregar dados dos pluviômetros:", error);
        alert("Não foi possível carregar os dados dos pluviômetros. Verifique o console para mais detalhes.");
    }
}

function plotRainGaugesOnMap(gaugesWithCoords) {
    if (!map || !rainGaugesLayerGroup) return;

    gaugesWithCoords.forEach(gauge => {
        if (gauge.latitude && gauge.longitude) {
            const accumulated24h = gauge.acc24hr || 0;

            let colorClass = 'gauge-icon-low';
            if (accumulated24h >= 10 && accumulated24h < 40) {
                colorClass = 'gauge-icon-medium';
            } else if (accumulated24h >= 40 && accumulated24h < 70) {
                colorClass = 'gauge-icon-high';
            } else if (accumulated24h >= 70) {
                colorClass = 'gauge-icon-very-high';
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
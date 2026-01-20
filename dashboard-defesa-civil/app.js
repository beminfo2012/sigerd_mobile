/**
 * Dashboard Application Logic - SIGERD Mobile Optimized
 */

const app = {
    // State
    data: [],
    filteredData: [],
    filters: {
        locality: null,
        riskType: null,
        severity: null,
        search: ''
    },
    charts: {
        pie: null,
        bar: null
    },
    map: null,

    // Initialize
    init: () => {
        try {
            console.log("Initializing Mobile App...");

            app.data = window.appData || [];
            app.filteredData = [...app.data];

            // Initialize Icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            app.renderStats();

            // Charts
            if (typeof Chart !== 'undefined') {
                app.initCharts();
            }

            app.setupEventListeners();

            // Populate Locality Filter
            app.populateFilters();

            // Initialize main embedded map
            app.initMainMap();

            // Default View
            app.switchView('dashboard');

        } catch (err) {
            console.error("Critical Init Error:", err);
            document.body.innerHTML += `<div class="fixed top-0 left-0 bg-red-500 text-white p-4 z-[9999] w-full text-center">Erro: ${err.message}</div>`;
        }
    },

    populateFilters: () => {
        const locSelect = document.getElementById('filter-locality');
        if (!locSelect) return;

        // Extract unique localities from data
        const localities = [...new Set(app.data.map(d => d.locality))].sort();

        localities.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.innerText = loc;
            locSelect.appendChild(opt);
        });
    },

    // Navigation
    switchView: (viewId) => {
        ['view-dashboard', 'view-map', 'view-files'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.remove('hidden');

        // Update Nav Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeBtn = document.querySelector(`button[onclick="app.switchView('${viewId}')"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (viewId === 'map') {
            setTimeout(() => {
                if (!app.map) app.initMap();
                else app.map.invalidateSize();
            }, 100);
        }
    },

    // Statistics
    renderStats: () => {
        const total = app.filteredData.length;
        const geo = app.filteredData.filter(d => d.riskType.includes('Geológico')).length;
        const hydro = app.filteredData.filter(d => d.riskType.includes('Hidrológico') || d.riskType.includes('Inundação')).length;
        const high = app.filteredData.filter(d => d.severity === 'Alta' || d.severity === 'Muito Alta').length;

        document.getElementById('stat-total').innerText = total.toLocaleString('pt-BR');
        document.getElementById('stat-geo').innerText = geo.toLocaleString('pt-BR');
        document.getElementById('stat-hydro').innerText = hydro.toLocaleString('pt-BR');
        document.getElementById('stat-high').innerText = high.toLocaleString('pt-BR');
    },

    // Charts
    initCharts: () => {
        const ctxPie = document.getElementById('riskPieChart').getContext('2d');
        const ctxBar = document.getElementById('localityBarChart').getContext('2d');

        // Aggregations
        const riskCounts = {};
        const localityMap = {};

        app.data.forEach(d => {
            riskCounts[d.riskType] = (riskCounts[d.riskType] || 0) + 1;
            localityMap[d.locality] = (localityMap[d.locality] || 0) + 1;
        });

        const topLocalities = Object.entries(localityMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Pie Chart
        app.charts.pie = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: Object.keys(riskCounts),
                datasets: [{
                    data: Object.values(riskCounts),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ef4444'],
                    hoverOffset: 4,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, font: { size: 10, weight: 'bold' }, padding: 15 }
                    }
                },
                onClick: (e, elem) => {
                    if (elem.length > 0) {
                        const label = app.charts.pie.data.labels[elem[0].index];
                        app.applyFilter('riskType', label);
                    }
                }
            }
        });

        // Bar Chart
        app.charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: topLocalities.map(l => l[0]),
                datasets: [{
                    label: 'Registros',
                    data: topLocalities.map(l => l[1]),
                    backgroundColor: '#3b82f6',
                    borderRadius: 10,
                    barThickness: 20
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false, grid: { display: false } },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
                }
            }
        });
    },

    // Filtering
    applyFilter: (type, value) => {
        app.filters[type] = value;

        // UI Feedback
        const resetBtn = document.getElementById('reset-filter-btn');
        const hasFilters = app.filters.locality || app.filters.riskType || app.filters.severity || app.filters.search;

        if (resetBtn) {
            if (hasFilters) resetBtn.classList.remove('hidden');
            else resetBtn.classList.add('hidden');
        }

        app.filterData();
    },

    filterData: () => {
        app.filteredData = app.data.filter(item => {
            const matchesLocality = !app.filters.locality || item.locality === app.filters.locality;
            const matchesRisk = !app.filters.riskType || item.riskType.includes(app.filters.riskType);
            const matchesSeverity = !app.filters.severity || item.severity === app.filters.severity;
            const matchesSearch = !app.filters.search ||
                item.resident.toLowerCase().includes(app.filters.search.toLowerCase()) ||
                item.locality.toLowerCase().includes(app.filters.search.toLowerCase());

            return matchesLocality && matchesRisk && matchesSeverity && matchesSearch;
        });

        app.renderStats();
        app.updateMapMarkers();
        app.updateMainMapMarkers();
    },

    resetFilters: () => {
        app.filters = { locality: null, riskType: null, severity: null, search: '' };

        document.getElementById('search-input').value = '';
        document.getElementById('filter-locality').value = '';
        document.getElementById('filter-severity').value = '';

        const resetBtn = document.getElementById('reset-filter-btn');
        if (resetBtn) resetBtn.classList.add('hidden');

        app.filterData();
    },

    setupEventListeners: () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                app.filters.search = e.target.value;
                app.filterData();
            });
        }
    },

    // Bottom Sheet Logic
    openModal: (id) => {
        const item = app.data.find(d => d.id === id);
        if (!item) return;

        const modal = document.getElementById('details-modal');
        const contentBox = document.getElementById('modal-content-box');
        const body = document.getElementById('modal-body');

        // Build Content
        let html = `
            <div class="space-y-6">
                <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <div class="flex items-center gap-4 mb-4">
                         <div class="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                            <i data-lucide="user" class="text-primary w-7 h-7"></i>
                         </div>
                         <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</p>
                            <h2 class="text-xl font-black text-slate-900">${item.resident}</h2>
                         </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white p-3 rounded-2xl border border-slate-100">
                            <p class="text-[9px] font-bold text-slate-400 uppercase">Localidade</p>
                            <p class="text-xs font-bold text-slate-800 mt-1">${item.locality}</p>
                        </div>
                        <div class="bg-white p-3 rounded-2xl border border-slate-100">
                            <p class="text-[9px] font-bold text-slate-400 uppercase">ID Imóvel</p>
                            <p class="text-xs font-mono text-slate-800 mt-1">#${item.id}</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Análise de Risco</h4>
                    
                    <div class="space-y-3">
                        ${item.details?.DESCRICAO ? `
                        <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</p>
                            <p class="text-sm text-slate-700 leading-relaxed font-medium">${item.details.DESCRICAO}</p>
                        </div>` : ''}

                        <div class="grid grid-cols-2 gap-3">
                             <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipologia</p>
                                <p class="text-xs font-bold text-slate-800">${item.details?.TIPOLOGIA || item.riskType}</p>
                            </div>
                            <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Grau de Risco</p>
                                <p class="text-xs font-bold ${item.severity.includes('Alta') ? 'text-red-600' : 'text-orange-600'}">${item.severity}</p>
                            </div>
                        </div>

                        ${item.details?.SUG_INTERV ? `
                        <div class="bg-primary/5 p-5 rounded-3xl border border-primary/10">
                            <div class="flex items-center gap-2 mb-2">
                                <i data-lucide="hard-hat" class="w-4 h-4 text-primary"></i>
                                <p class="text-[10px] font-black text-primary uppercase">Intervenções Sugeridas</p>
                            </div>
                            <p class="text-sm text-slate-700 leading-relaxed">${item.details.SUG_INTERV}</p>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button class="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/25">Exportar PDF</button>
                    <button class="bg-slate-100 p-4 rounded-2xl text-slate-600">
                        <i data-lucide="map-pin" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        `;

        body.innerHTML = html;
        lucide.createIcons();

        // Show Animation
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            contentBox.classList.remove('translate-y-full');
            contentBox.classList.add('translate-y-0');
        }, 10);
    },

    closeModal: () => {
        const modal = document.getElementById('details-modal');
        const contentBox = document.getElementById('modal-content-box');

        contentBox.classList.add('translate-y-full');
        modal.classList.add('opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    },

    // Map Logic
    initMap: () => {
        if (app.map || typeof L === 'undefined') return;
        app.map = L.map('map-container', { zoomControl: false }).setView([-20.0247, -40.7425], 14);

        L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap'
        }).addTo(app.map);

        app.markers = L.layerGroup().addTo(app.map);
        app.updateMapMarkers();
    },

    updateMapMarkers: () => {
        if (!app.map || !app.markers) return;
        app.markers.clearLayers();

        let bounds = L.latLngBounds();
        let hasPoints = false;

        const showGeo = document.getElementById('chk-geo')?.checked ?? true;
        const showHydro = document.getElementById('chk-hydro')?.checked ?? true;

        app.filteredData.forEach(item => {
            const isGeo = item.riskType.includes('Geológico');
            const isHydro = item.riskType.includes('Hidrológico') || item.riskType.includes('Inundação');

            if ((isGeo && !showGeo) || (isHydro && !showHydro)) return;

            if (item.lat && item.lng) {
                const color = isGeo ? '#3b82f6' : '#06b6d4';
                const marker = L.circleMarker([item.lat, item.lng], {
                    radius: 7,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).bindPopup(`<div class="font-sans"><b>${item.resident}</b><br><span class="text-[10px] uppercase font-bold text-slate-400">${item.locality}</span></div>`);

                app.markers.addLayer(marker);
                bounds.extend([item.lat, item.lng]);
                hasPoints = true;
            }
        });

        if (hasPoints && app.filteredData.length < 500) {
            app.map.fitBounds(bounds, { padding: [40, 40] });
        }
    },

    // Main Map (Embedded in Dashboard)
    initMainMap: () => {
        if (app.mainMap || typeof L === 'undefined') return;

        const container = document.getElementById('main-map-container');
        if (!container) return;

        app.mainMap = L.map('main-map-container', { zoomControl: true }).setView([-20.0247, -40.7425], 13);

        L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap'
        }).addTo(app.mainMap);

        app.mainMarkers = L.layerGroup().addTo(app.mainMap);
        app.updateMainMapMarkers();
    },

    updateMainMapMarkers: () => {
        if (!app.mainMap || !app.mainMarkers) return;
        app.mainMarkers.clearLayers();

        let bounds = L.latLngBounds();
        let hasPoints = false;

        const showGeo = document.getElementById('chk-geo-main')?.checked ?? true;
        const showHydro = document.getElementById('chk-hydro-main')?.checked ?? true;

        app.filteredData.forEach(item => {
            const isGeo = item.riskType.includes('Geológico');
            const isHydro = item.riskType.includes('Hidrológico') || item.riskType.includes('Inundação');
            const isDual = isGeo && isHydro;

            // Visibility logic
            let isVisible = false;
            if (isGeo && showGeo) isVisible = true;
            if (isHydro && showHydro) isVisible = true;
            if (!isVisible) return;

            if (item.lat && item.lng) {
                // Color logic
                let color = '#6b7280'; // gray fallback
                if (isDual) {
                    color = '#8b5cf6'; // purple for dual risk
                } else if (isGeo) {
                    color = '#3b82f6'; // blue for geological
                } else if (isHydro) {
                    color = '#06b6d4'; // cyan for hydrological
                }

                const marker = L.circleMarker([item.lat, item.lng], {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.85
                }).bindPopup(`
                    <div class="font-sans text-sm">
                        <strong class="block text-slate-800 mb-1">${item.resident}</strong>
                        <div class="text-slate-600 text-xs mb-1">${item.locality}</div>
                        <div class="text-[10px] font-bold px-2 py-0.5 rounded w-fit ${item.severity === 'Alta' || item.severity === 'Muito Alta' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">
                            ${item.riskType}
                        </div>
                    </div>
                `);

                marker.on('click', () => {
                    app.openModal(item.id);
                });

                app.mainMarkers.addLayer(marker);
                bounds.extend([item.lat, item.lng]);
                hasPoints = true;
            }
        });

        if (hasPoints) {
            app.mainMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', app.init);

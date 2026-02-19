import { supabase } from './supabase'
import { getRemoteVistoriasCache, saveRemoteVistoriasCache, getAllVistoriasLocal } from './db'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // 1. Fetch all vistorias from Supabase
            let vistoriasData = [];

            if (navigator.onLine) {
                const { data, error } = await supabase
                    .from('vistorias')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    vistoriasData = data;
                    // Optional: Update cache if needed, but prioritize fresh data
                    await saveRemoteVistoriasCache(data).catch(() => { });
                } else {
                    console.error('Supabase fetch error, using cache:', error);
                    vistoriasData = await getRemoteVistoriasCache();
                }
            } else {
                vistoriasData = await getRemoteVistoriasCache();
            }

            // Also include local (pending) sync vistorias to avoid "missing" data
            const localVistorias = await getAllVistoriasLocal().catch(() => []);
            const pendingVistorias = localVistorias.filter(v => !v.synced);

            // Merge local pending with remote
            const mergedMap = new Map();
            vistoriasData.forEach(v => mergedMap.set(v.vistoria_id || v.id, v));
            pendingVistorias.forEach(v => mergedMap.set(v.vistoriaId || v.id, v));
            const allData = Array.from(mergedMap.values());

            const locations = allData
                .filter(v => (v.coordenadas && String(v.coordenadas).includes(',')) || (v.latitude && v.longitude))
                .map(v => {
                    let lat, lng;
                    if (v.coordenadas && String(v.coordenadas).includes(',')) {
                        const parts = String(v.coordenadas).split(',')
                        lat = parseFloat(parts[0])
                        lng = parseFloat(parts[1])
                    } else if (v.latitude && v.longitude) {
                        lat = parseFloat(v.latitude)
                        lng = parseFloat(v.longitude)
                    }

                    if (isNaN(lat) || isNaN(lng)) return null

                    const subtypes = v.subtipos_risco || []
                    const category = v.categoria_risco || 'Outros'

                    return {
                        lat,
                        lng,
                        risk: category,
                        details: subtypes.length > 0 ? subtypes.join(', ') : category,
                        date: v.created_at || v.data_hora || new Date().toISOString()
                    }
                })
                .filter(loc => loc !== null) || []

            // Calculate breakdown by Category
            const totalReports = allData.length;
            const counts = {};

            allData.forEach(v => {
                const cat = v.categoria_risco || v.categoriaRisco || 'Outros';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const colorPalette = {
                'Geológico / Geotécnico': 'bg-orange-500',
                'Risco Geológico': 'bg-orange-500',
                'Hidrológico': 'bg-blue-500',
                'Inundação': 'bg-blue-500',
                'Alagamento': 'bg-blue-400',
                'Inundação/Alagamento': 'bg-blue-500',
                'Enxurrada': 'bg-blue-600',
                'Estrutural': 'bg-slate-400',
                'Estrutural/Predial': 'bg-slate-400',
                'Ambiental': 'bg-emerald-500',
                'Tecnológico': 'bg-amber-500',
                'Climático / Meteorológico': 'bg-sky-500',
                'Infraestrutura Urbana': 'bg-indigo-500',
                'Sanitário': 'bg-rose-500',
                'Deslizamento': 'bg-orange-500',
                'Vendaval': 'bg-sky-600',
                'Granizo': 'bg-indigo-400',
                'Incêndio': 'bg-red-500',
                'Outros': 'bg-slate-400'
            };

            const defaultColors = ['bg-slate-300', 'bg-slate-400', 'bg-slate-500'];

            const breakdown = Object.keys(counts).map((label, idx) => ({
                label,
                count: counts[label],
                percentage: totalReports > 0 ? Math.round((counts[label] / totalReports) * 100) : 0,
                color: colorPalette[label] || defaultColors[idx % defaultColors.length]
            })).sort((a, b) => b.count - a.count);

            // Fetch INMET alerts
            let inmetAlerts = [];
            try {
                const inmetResp = await fetch('/api/inmet');
                if (inmetResp.ok) {
                    const alerts = await inmetResp.json();
                    inmetAlerts = Array.isArray(alerts) ? alerts : [];
                }
            } catch (e) { console.error('INMET fetch error:', e); }

            return {
                stats: {
                    totalVistorias: totalReports,
                    activeOccurrences: inmetAlerts.length,
                    inmetAlertsCount: inmetAlerts.length
                },
                breakdown,
                locations,
                alerts: inmetAlerts
            }
        } catch (error) {
            console.error('API Error:', error)
            return {
                stats: { totalVistorias: 0, activeOccurrences: 0, inmetAlertsCount: 0 },
                breakdown: [],
                locations: []
            }
        }
    }
}

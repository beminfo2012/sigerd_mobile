import { supabase } from './supabase'
import { getRemoteVistoriasCache, saveRemoteVistoriasCache } from './db'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // 1. Load from local cache first (Persistence/Offline)
            let cachedVistorias = await getRemoteVistoriasCache()

            // 2. Try to fetch only NEW vistorias from Supabase (Incremental Update)
            let allVistorias = [...cachedVistorias]

            if (navigator.onLine) {
                try {
                    let lastCreatedAt = '1970-01-01T00:00:00Z'
                    if (cachedVistorias.length > 0) {
                        // Find most recent created_at in cache
                        lastCreatedAt = cachedVistorias.reduce((max, v) =>
                            v.created_at > max ? v.created_at : max, lastCreatedAt)
                    }

                    // Fetch records created AFTER our last cached record
                    let { data: newVistorias } = await supabase
                        .from('vistorias')
                        .select('id, coordenadas, categoria_risco, subtipos_risco, created_at')
                        .gt('created_at', lastCreatedAt)
                        .order('created_at', { ascending: false });

                    if (newVistorias && newVistorias.length > 0) {
                        // Update cache with new records
                        await saveRemoteVistoriasCache(newVistorias)

                        // Merge new records - using Map to prevent duplicates
                        const mergedMap = new Map()
                        allVistorias.forEach(v => mergedMap.set(v.id, v))
                        newVistorias.forEach(v => mergedMap.set(v.id, v))
                        allVistorias = Array.from(mergedMap.values())
                    }
                } catch (e) {
                    console.warn('Incremental fetch failed, using cached data:', e)
                }
            }

            const vistoriasData = allVistorias;
            const locations = vistoriasData.filter(v => v.coordenadas).map(v => {
                const parts = v.coordenadas.split(',')
                const subtypes = v.subtipos_risco || []
                const category = v.categoria_risco || 'Outros'

                return {
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    risk: category,
                    details: subtypes.length > 0 ? subtypes.join(', ') : category
                }
            }) || []

            // Calculate breakdown by Category
            const totalReports = vistoriasData.length;
            const counts = {};

            vistoriasData.forEach(v => {
                const cat = v.categoria_risco || 'Outros';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            // We use total reports for percentage since we are back to 1:1 category mapping
            const totalOccurrences = totalReports;

            // Color palette for distinct categories
            const colorPalette = {
                'Deslizamento': 'bg-orange-500',
                'Alagamento': 'bg-blue-500',
                'Inundação': 'bg-cyan-500',
                'Enxurrada': 'bg-teal-500',
                'Vendaval': 'bg-gray-500',
                'Granizo': 'bg-indigo-500',
                'Incêndio': 'bg-red-500',
                'Estrutural': 'bg-purple-500',
                'Outros': 'bg-slate-400'
            };

            const defaultColors = ['bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-violet-500'];

            const breakdown = Object.keys(counts).map((label, idx) => ({
                label,
                count: counts[label],
                percentage: totalOccurrences > 0 ? Math.round((counts[label] / totalOccurrences) * 100) : 0,
                color: colorPalette[label] || defaultColors[idx % defaultColors.length]
            })).sort((a, b) => b.count - a.count);

            // Fetch INMET alerts
            let inmetAlertsCount = 0;
            try {
                const inmetResp = await fetch('/api/inmet');
                if (inmetResp.ok) {
                    const alerts = await inmetResp.json();
                    inmetAlertsCount = Array.isArray(alerts) ? alerts.length : 0;
                }
            } catch (e) { console.error('INMET fetch error:', e); }

            return {
                stats: {
                    totalVistorias: totalReports,
                    activeOccurrences: inmetAlertsCount,
                    inmetAlertsCount
                },
                breakdown,
                locations
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

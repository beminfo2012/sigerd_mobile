import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // Fetch all vistorias with position and subtypes for the map and breakdown
            const { data: vistorias } = await supabase
                .from('vistorias')
                .select('coordenadas, categoria_risco, subtipos_risco')
                .order('created_at', { ascending: false })
                .limit(5000)

            const locations = vistorias?.filter(v => v.coordenadas).map(v => {
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
            const totalReports = vistorias?.length || 0;
            const counts = {};

            vistorias?.forEach(v => {
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

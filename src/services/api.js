import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // Fetch all vistorias with position and type for the map and breakdown
            const { data: vistorias } = await supabase
                .from('vistorias')
                .select('coordenadas, tipo_info')

            const locations = vistorias?.filter(v => v.coordenadas).map(v => {
                const parts = v.coordenadas.split(',')
                return {
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    risk: 'Alto' // Default for visualization until risk mapping is implemented
                }
            }) || []

            // Calculate real breakdown
            const total = vistorias?.length || 0;
            const counts = {};
            vistorias?.forEach(v => {
                const type = v.tipo_info || 'Outros';
                counts[type] = (counts[type] || 0) + 1;
            });

            const colors = {
                'Risco Geológico': 'bg-orange-500',
                'Inundação/Alagamento': 'bg-blue-500',
                'Estrutural/Predial': 'bg-gray-400',
                'Outros': 'bg-slate-300'
            };

            const breakdown = Object.keys(counts).map(label => ({
                label,
                count: counts[label],
                percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
                color: colors[label] || 'bg-blue-400'
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
                    totalVistorias: total,
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

import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // Fetch all vistorias with position and subtypes for the map and breakdown
            const { data: vistorias } = await supabase
                .from('vistorias')
                .select('coordenadas, categoria_risco, subtipos_risco')

            const locations = vistorias?.filter(v => v.coordenadas).map(v => {
                const parts = v.coordenadas.split(',')
                return {
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    risk: 'Alto'
                }
            }) || []

            // Calculate breakdown by subtypes
            const totalReports = vistorias?.length || 0;
            const counts = {};

            vistorias?.forEach(v => {
                const subtypes = v.subtipos_risco || [];
                if (subtypes.length === 0) {
                    const cat = v.categoria_risco || 'Outros';
                    counts[cat] = (counts[cat] || 0) + 1;
                } else {
                    subtypes.forEach(sub => {
                        counts[sub] = (counts[sub] || 0) + 1;
                    });
                }
            });

            // We use total as the sum of all subtype occurrences for percentage
            const totalOccurrences = Object.values(counts).reduce((a, b) => a + b, 0);

            const breakdown = Object.keys(counts).map(label => ({
                label,
                count: counts[label],
                percentage: totalOccurrences > 0 ? Math.round((counts[label] / totalOccurrences) * 100) : 0,
                color: 'bg-blue-400'
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

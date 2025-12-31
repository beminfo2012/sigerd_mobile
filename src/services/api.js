import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // Fetch real operational stats if possible, or keep mock
            // But definitely fetch real locations for the map
            const { data: vistorias } = await supabase
                .from('vistorias')
                .select('latitude, longitude, risk_level')
                .not('latitude', 'is', null)
                .limit(50)

            const locations = vistorias?.map(v => ({
                lat: parseFloat(v.latitude),
                lng: parseFloat(v.longitude),
                risk: v.risk_level
            })) || []

            // Fetch INMET alerts
            let inmetAlertsCount = 0;
            try {
                const inmetResp = await fetch('/api/inmet');
                if (inmetResp.ok) {
                    const alerts = await inmetResp.json();
                    inmetAlertsCount = alerts.length;
                }
            } catch (e) { console.error('INMET fetch error:', e); }

            // Return rich mock data mixed with real map data
            return {
                stats: {
                    pendingVistorias: 12,
                    pendingVistoriasDiff: 3,
                    activeOccurrences: inmetAlertsCount, // Show real INMET alert count
                    activeOccurrencesDiff: 0,
                    avgResponseTime: 34,
                    avgResponseTimeTrend: 12,
                    inmetAlertsCount
                },
                breakdown: [
                    { label: 'Risco Geológico', percentage: 45, count: 18, color: 'bg-orange-500' },
                    { label: 'Inundação/Alagamento', percentage: 30, count: 12, color: 'bg-blue-500' },
                    { label: 'Estrutural/Predial', percentage: 25, count: 10, color: 'bg-gray-400' }
                ],
                locations // Real coordinates
            }
        } catch (error) {
            console.error('API Error:', error)
            return {
                stats: { pendingVistorias: 12, activeOccurrences: 5, avgResponseTime: 34 },
                breakdown: [],
                locations: [] // Fallback
            }
        }
    }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard.php`)
            if (!response.ok) {
                // If offline or error, we might want to return cached data or throw
                throw new Error('Network response was not ok')
            }
            return await response.json()
        } catch (error) {
            console.error('API Error:', error)
            // Return rich mock data for UI development/offline mode
            return {
                stats: {
                    pendingVistorias: 12,
                    pendingVistoriasDiff: 3, // "3 urgentes"
                    activeOccurrences: 5,
                    activeOccurrencesDiff: 2, // "+2 novas"
                    avgResponseTime: 34, // minutes
                    avgResponseTimeTrend: 12, // 12% improvement
                },
                breakdown: [
                    { label: 'Risco Geológico', percentage: 45, count: 18, color: 'bg-orange-500' },
                    { label: 'Inundação/Alagamento', percentage: 30, count: 12, color: 'bg-blue-500' },
                    { label: 'Estrutural/Predial', percentage: 25, count: 10, color: 'bg-gray-400' }
                ]
            }
        }
    }
}

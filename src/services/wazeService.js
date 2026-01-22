/**
 * Service to consume Waze for Cities data from the internal proxy
 */
export const wazeService = {
    async getIncidents() {
        try {
            const response = await fetch('/api/waze');
            if (!response.ok) throw new Error('Failed to fetch Waze data');

            const data = await response.json();

            // Normalize alerts for Leaflet
            const alerts = (data.alerts || []).map(alert => ({
                id: alert.id || Math.random().toString(36).substr(2, 9),
                type: alert.type,
                subtype: alert.subtype,
                lat: alert.location.y,
                lng: alert.location.x,
                description: alert.description || alert.type,
                rating: alert.reportRating || 0,
                isWaze: true
            }));

            // Normalize jams (lines)
            const jams = (data.jams || []).map(jam => ({
                id: jam.id,
                path: jam.line.map(p => [p.y, p.x]),
                level: jam.level, // 1-4 (4 being high congestion)
                delay: jam.delay,
                speed: jam.speed,
                isWaze: true
            }));

            return { alerts, jams };
        } catch (error) {
            console.error('WazeService Error:', error);
            return { alerts: [], jams: [] };
        }
    }
};

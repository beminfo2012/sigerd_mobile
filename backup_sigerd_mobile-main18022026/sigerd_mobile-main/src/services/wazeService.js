/**
 * Service to consume Waze for Cities data from the internal proxy
 */
export const wazeService = {
    async getIncidents() {
        try {
            const response = await fetch('/api/waze');
            if (!response.ok) throw new Error('Failed to fetch Waze data');

            const data = await response.json();

            // Normalize alerts (incidents)
            const alerts = (data.alerts || []).map(alert => ({
                id: alert.uuid || Math.random().toString(36).substr(2, 9),
                type: alert.type,
                subtype: alert.subtype || '',
                lat: alert.location.y,
                lng: alert.location.x,
                street: alert.street || 'Via sem nome',
                description: this.formatDescription(alert),
                rating: alert.reportRating || 0,
                confidence: alert.confidence || 0,
                reliability: alert.reliability || 0,
                isWaze: true,
                pubMillis: alert.pubMillis
            }));

            // Normalize jams (congestion lines)
            const jams = (data.jams || []).map(jam => ({
                id: jam.uuid || jam.id,
                path: jam.line ? jam.line.map(p => [p.y, p.x]) : [],
                level: jam.level || 1, // 1-5
                delay: jam.delay,
                speed: jam.speedKMH || jam.speed,
                street: jam.street,
                isWaze: true
            })).filter(jam => jam.path.length > 0);

            return { alerts, jams };
        } catch (error) {
            console.error('WazeService Error:', error);
            return { alerts: [], jams: [] };
        }
    },

    /**
     * Translates and formats Waze types for the user
     */
    formatDescription(alert) {
        const types = {
            'ROAD_CLOSED': 'Via Interditada',
            'ACCIDENT': 'Acidente',
            'HAZARD': 'Perigo na Via',
            'JAM': 'Congestionamento',
            'WEATHERHAZARD': 'Clima Adverso'
        };

        const subtypes = {
            'HAZARD_ON_ROAD_POT_HOLE': 'Buraco na pista',
            'HAZARD_ON_ROAD_FLOOD': 'Alagamento',
            'ACCIDENT_MAJOR': 'Acidente Grave',
            'ROAD_CLOSED_CONSTRUCTION': 'Obras na pista',
            'ROAD_CLOSED_EVENT': 'Evento na via'
        };

        let translated = types[alert.type] || alert.type;
        if (alert.subtype && subtypes[alert.subtype]) {
            translated += `: ${subtypes[alert.subtype]}`;
        }

        return `${translated} em ${alert.street || 'localização não informada'}`;
    }
};

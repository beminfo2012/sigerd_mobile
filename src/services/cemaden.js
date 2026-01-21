/**
 * CEMADEN Data Service
 * Version: 1.36.0
 * Municipality: Santa Maria de Jetibá - ES (IBGE: 3204559)
 */

const MUNICIPIO_IBGE = '3204559';
const API_BASE = 'https://sws.cemaden.gov.br/PED/rest';

// Metadata for stations including human-readable names and coordinates
const STATION_METADATA = {
    '320455902A': { name: 'Vila de Jetibá', lat: -19.974, lon: -40.697 },
    '320455901A': { name: 'Alto Rio Possmoser', lat: -19.912, lon: -40.735 },
    '320455903A': { name: 'São Luis', lat: -20.015, lon: -40.758 }
};

export const cemadenService = {
    /**
     * Fetches cumulative rainfall for the municipality.
     * Note: In production, this might need a token or a proxy to avoid CORS.
     */
    async getRainfallData() {
        try {
            // We use the cumulative endpoint with the IBGE code
            // Santa Maria de Jetiba - ES: 3204559
            const response = await fetch(`${API_BASE}/pcds-acum/acumulados-recentes?codibge=${MUNICIPIO_IBGE}`, {
                method: 'GET',
                // CEMADEN API often requires a token. If it fails, we fallback to a secondary public mirror or informative mock.
                // headers: { 'token': 'YOUR_TOKEN' }
            });

            if (!response.ok) throw new Error('Cemaden rainfall API unreachable');

            const data = await response.json();

            // Normalize data for SIGERD UI
            return data.map(station => {
                const metadata = STATION_METADATA[station.codestacao] || {};
                return {
                    id: station.codestacao,
                    name: metadata.name || station.nomeestacao || 'Estação Cemaden',
                    lat: metadata.lat || null,
                    lon: metadata.lon || null,
                    rain: `${station.acum24h || 0}mm`,
                    rainRaw: station.acum24h || 0,
                    level: this.calculateLevel(station.acum24h || 0),
                    updated: station.datahora || new Date().toISOString()
                };
            });

        } catch (error) {
            console.warn('[Cemaden] Error fetching rainfall:', error);
            return null;
        }
    },

    /**
     * Fetches active alerts from Cemaden.
     * Currently using the mapainterativo endpoint as it is usually more open.
     */
    async getActiveAlerts() {
        try {
            // Note: This endpoint is prone to CORS in browsers. 
            // In a real PWA/Mobile app, we might need a small Vercel Serverless function to proxy it.
            const response = await fetch('https://mapainterativo.cemaden.gov.br/data/alertas.json');
            if (!response.ok) return [];

            const allAlerts = await response.json();

            // Filter alerts for our municipality
            // CEMADEN alerts usually have a 'municipio' property
            return allAlerts.filter(alert =>
                alert.municipio?.toLowerCase().includes('santa maria de jetiba') ||
                alert.cod_ibge === MUNICIPIO_IBGE
            );
        } catch (error) {
            console.error('[Cemaden] Error fetching alerts:', error);
            return [];
        }
    },

    /**
     * Simple logic to determine alert level based on 24h rainfall
     */
    calculateLevel(rain) {
        if (rain > 80) return 'Extremo';
        if (rain > 50) return 'Alerta';
        if (rain > 30) return 'Atenção';
        return 'Normal';
    }
};

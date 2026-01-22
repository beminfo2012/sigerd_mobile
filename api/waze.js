export default async function handler(request, response) {
    // These URLs should be replaced by the official ones from Waze for Cities Portal
    const WAZE_ALERTS_URL = process.env.WAZE_ALERTS_URL || '';
    const WAZE_JAMS_URL = process.env.WAZE_JAMS_URL || '';

    // Mock data for demonstration if URLs are not provided
    const mockData = {
        alerts: [
            {
                id: 'mock-1',
                type: 'ACCIDENT',
                subtype: 'ACCIDENT_MAJOR',
                location: { x: -40.7484, y: -20.0256 },
                description: 'Acidente Grave na Av. Principal',
                reportRating: 5
            },
            {
                id: 'mock-2',
                type: 'WEATHERHAZARD',
                subtype: 'HAZARD_ROAD_FLOOD',
                location: { x: -40.7444, y: -20.0210 },
                description: 'Alagamento detectado',
                reportRating: 4
            }
        ],
        jams: [
            {
                id: 'jam-1',
                line: [
                    { x: -40.7500, y: -20.0260 },
                    { x: -40.7460, y: -20.0240 }
                ],
                speed: 5,
                delay: 120,
                level: 4
            }
        ]
    };

    try {
        if (!WAZE_ALERTS_URL) {
            // Return mock data for initial validation
            return response.status(200).json(mockData);
        }

        // Real implementation would fetch and merge from Waze
        const [alertsRes, jamsRes] = await Promise.all([
            fetch(WAZE_ALERTS_URL).then(res => res.json()).catch(() => ({ alerts: [] })),
            fetch(WAZE_JAMS_URL).then(res => res.json()).catch(() => ({ jams: [] }))
        ]);

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json({
            alerts: alertsRes.alerts || [],
            jams: jamsRes.jams || []
        });

    } catch (error) {
        console.error('Waze Proxy Error:', error);
        response.status(500).json({ error: 'Failed to fetch Waze data', details: error.message });
    }
}

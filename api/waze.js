export default async function handler(request, response) {
    // Official Waze for Cities Feed Token (Provided by User)
    const PARTNER_ID = '11711665012_b1794de7a65a445c590559cd0ce513fe9d1667a7';
    const WAZE_FEED_URL = `https://www.waze.com/partnerhub-api/waze-feed-config-resource/${PARTNER_ID}?format=json`;

    // Mock data based on the real structure provided by the user
    const mockData = {
        alerts: [
            {
                country: "BR",
                city: "Santa Maria de Jetibá",
                reportRating: 5,
                confidence: 0,
                reliability: 7,
                type: "ROAD_CLOSED",
                uuid: "0820d709-3574-44b2-83be-0040ece382b0",
                street: "R. Guerlinda Küster",
                location: { x: -40.741976, y: -20.027562 },
                pubMillis: Date.now()
            },
            {
                country: "BR",
                city: "Santa Maria de Jetibá",
                reportRating: 3,
                confidence: 5,
                reliability: 10,
                type: "HAZARD",
                subtype: "HAZARD_ON_ROAD_POT_HOLE",
                uuid: "e6f06660-8778-4ae1-9358-aedfd7d05d95",
                street: "ES-264 Rod. Dr. Afonso Schwab",
                location: { x: -40.730355, y: -20.037975 },
                pubMillis: Date.now()
            }
        ],
        jams: [
            {
                country: "BR",
                level: 5,
                city: "Santa Maria de Jetibá",
                line: [{ x: -40.741976, y: -20.027562 }, { x: -40.741102, y: -20.027402 }],
                speedKMH: 0,
                length: 93,
                street: "R. Guerlinda Küster",
                id: 1318470944,
                pubMillis: Date.now()
            }
        ]
    };

    try {
        const apiResponse = await fetch(WAZE_FEED_URL);

        if (apiResponse.ok) {
            const data = await apiResponse.json();

            // Enable CORS
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
            return response.status(200).json(data);
        }

        // Fallback to structural mock if official feed is unreachable
        response.setHeader('Access-Control-Allow-Origin', '*');
        return response.status(200).json(mockData);

    } catch (error) {
        console.warn('Waze fetch failed, using mock:', error);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json(mockData);
    }
}

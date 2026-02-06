export default async function handler(request, response) {
    const targetUrl = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';
    const targetGeocode = "3204559"; // Santa Maria de Jetibá

    try {
        const apiResponse = await fetch(targetUrl);

        // Handle rate limits or non-OK responses
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('INMET API Error Response:', errorText);
            return response.status(200).json([]); // Return empty list rather than 500 to keep UI stable
        }

        const rawText = await apiResponse.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (jsonErr) {
            console.error('Failed to parse INMET JSON. Raw response:', rawText.substring(0, 500));
            return response.status(200).json([]);
        }

        const now = new Date();
        const alerts = [];

        const processList = (list) => {
            if (!list) return;
            list.forEach(alert => {
                if (alert.geocodes && alert.geocodes.includes(targetGeocode)) {
                    // Relaxed filtering: any alert that hasn't finished yet or starts soon (next 24h)
                    const endDate = new Date(alert.fim);
                    const startDate = new Date(alert.inicio);
                    const isRelevant = endDate >= now || (startDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000));

                    if (isRelevant) {
                        alerts.push({
                            id: alert.id,
                            tipo: alert.aviso_tipo || alert.descricao,
                            severidade: alert.aviso_severidade || alert.severidade,
                            inicio: alert.inicio,
                            fim: alert.fim,
                            riscos: alert.riscos,
                            instrucoes: alert.instrucoes,
                            msg: alert.msg,
                            descricao: alert.descricao || alert.aviso_tipo
                        });
                    }
                }
            });
        };

        if (data.hoje) processList(data.hoje);
        if (data.amanha) processList(data.amanha);
        if (data.futuro) processList(data.futuro);

        // Deduplicate and sort by severity/date
        const uniqueAlerts = Array.from(new Map(alerts.map(a => [a.id, a])).values());

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(uniqueAlerts);

    } catch (error) {
        console.error('INMET Handler Exception:', error);
        response.status(200).json([]);
    }
}

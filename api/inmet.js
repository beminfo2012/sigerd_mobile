export default async function handler(request, response) {
    const targetUrl = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';
    const targetGeocode = "3204559"; // Santa Maria de Jetibá

    try {
        const apiResponse = await fetch(targetUrl);
        if (!apiResponse.ok) {
            throw new Error(`INMET connection failed: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        const activeAlerts = [];

        const processList = (list) => {
            if (!list) return;
            list.forEach(alert => {
                if (alert.geocodes && alert.geocodes.includes(targetGeocode)) {
                    activeAlerts.push({
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
            });
        };

        if (data.hoje) processList(data.hoje);
        if (data.amanha) processList(data.amanha);
        if (data.futuro) processList(data.futuro);

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(activeAlerts);

    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Failed to fetch INMET data', details: error.message });
    }
}

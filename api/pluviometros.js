export default async function handler(request, response) {
    const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";

    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`CEMADEN connection failed: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        // Filter for Santa Maria de Jetibá
        const cityData = data.filter(s =>
            s.cidade && s.cidade.toLowerCase().includes("maria de jetib")
        );

        const result = cityData.map(s => ({
            id: s.idestacao,
            name: s.nomeestacao,
            acc24hr: (s.acc24hr === "-" || !s.acc24hr) ? 0.0 : parseFloat(s.acc24hr),
            acc1hr: (s.acc1hr === "-" || !s.acc1hr) ? 0.0 : parseFloat(s.acc1hr),
            lastUpdate: s.datahoraUltimovalor
        }));

        // ADD PCH RIO BONITO MONTANTE 1 (ANA 57118080)
        // ⚠️ STATIC DATA: Waiting for ANA API integration
        result.push({
            id: "57118080",
            name: "PCH RIO BONITO MONTANTE 1",
            type: "fluviometric",
            isRealTime: false,  // Flag indicating this is reference data
            acc24hr: 24.8,      // Reference value (not live)
            acc1hr: 2.5,
            level: 181,         // cm
            flow: 11.9,         // m3/s
            status: "Dados de Referência",
            lastUpdate: "2026-01-15T12:00:00.000Z"  // Fixed date to show data is not live
        });

        // ADD SANTA MARIA DE JETIBA - SÃO JOÃO DE GARRAFÃO (ANA 57090000)
        // ⚠️ STATIC DATA: Waiting for ANA API integration
        result.push({
            id: "57090000",
            name: "SÃO JOÃO DE GARRAFÃO",
            type: "fluviometric",
            isRealTime: false,
            acc24hr: 0.0,
            acc1hr: 0.0,
            level: 100,
            flow: 5.2,
            status: "Dados de Referência",
            lastUpdate: "2026-01-15T12:00:00.000Z"
        });

        // ADD PCH RIO BONITO MONTANTE 2 (ANA 57117000)
        // ⚠️ STATIC DATA: Waiting for ANA API integration
        result.push({
            id: "57117000",
            name: "PCH RIO BONITO MONTANTE 2",
            type: "fluviometric",
            isRealTime: false,
            acc24hr: 12.4,
            acc1hr: 1.2,
            level: 145,
            flow: 8.7,
            status: "Dados de Referência",
            lastUpdate: "2026-01-15T12:00:00.000Z"
        });

        // ADD PCH RIO BONITO BARRAMENTO (ANA 57119000)
        // ⚠️ STATIC DATA: Waiting for ANA API integration
        result.push({
            id: "57119000",
            name: "PCH RIO BONITO BARRAMENTO",
            type: "fluviometric",
            isRealTime: false,
            acc24hr: 18.2,
            acc1hr: 0.8,
            level: 210,
            flow: 15.4,
            status: "Dados de Referência",
            lastUpdate: "2026-01-15T12:00:00.000Z"
        });

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(result);

    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}

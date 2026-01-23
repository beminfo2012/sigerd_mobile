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

        // ANA STATIONS CONFIGURATION
        const ANA_STATIONS = [
            { id: "57118080", name: "PCH RIO BONITO MONTANTE 1" },
            { id: "57090000", name: "SÃO JOÃO DE GARRAFÃO" },
            { id: "57117000", name: "PCH RIO BONITO MONTANTE 2" },
            { id: "57119000", name: "PCH RIO BONITO BARRAMENTO" }
        ];

        // Fetch ANA Data in Parallel
        const anaPromises = ANA_STATIONS.map(async (station) => {
            try {
                // Fetch last 3 days to ensure we find at least one recent reading
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 3);

                const fmt = d => d.toISOString().split('T')[0];
                const anaUrl = `https://www.ana.gov.br/hidrowebservice/rest/estacoestelemetricas/gethidroinfoanaserietelemetricaAdotada?codEstacao=${station.id}&dataInicio=${fmt(startDate)}&dataFim=${fmt(endDate)}`;

                const resAna = await fetch(anaUrl);
                if (!resAna.ok) throw new Error(`HTTP ${resAna.status}`);

                const jsonAna = await resAna.json();

                // Find latest reading (Sort by DataHora Descending)
                // API structure: { items: [ { DataHora: "...", Nivel: "...", Vazao: "..." } ] }
                // Note: Sometimes items is null or empty
                const items = jsonAna?.items || [];
                const latest = items.sort((a, b) => new Date(b.DataHora) - new Date(a.DataHora))[0];

                if (!latest) {
                    return {
                        id: station.id,
                        name: station.name,
                        type: "fluviometric",
                        isRealTime: false,
                        status: "Sem dados recentes (Offline)",
                        level: 0,
                        flow: 0,
                        lastUpdate: null
                    };
                }

                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric",
                    isRealTime: true,
                    // Parse values handling different decimal formats just in case
                    level: parseFloat(latest.Nivel || 0), // cm
                    flow: parseFloat(latest.Vazao || 0),  // m3/s
                    status: "Online",
                    lastUpdate: latest.DataHora
                };

            } catch (err) {
                console.error(`Failed to fetch ANA station ${station.id}:`, err);
                // Return offline state on error
                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric",
                    isRealTime: false,
                    status: "Erro de Conexão",
                    level: 0,
                    flow: 0,
                    lastUpdate: null
                };
            }
        });

        const anaResults = await Promise.all(anaPromises);

        // Merge CEMADEN + ANA
        const finalResult = [...result, ...anaResults];

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(finalResult);

    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}

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
                let items = [];

                // TRY 1: Modern REST API (JSON)
                try {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 2);
                    const fmt = d => d.toISOString().split('T')[0];
                    const restUrl = `https://www.ana.gov.br/hidrowebservice/rest/estacoestelemetricas/gethidroinfoanaserietelemetricaAdotada?codEstacao=${station.id}&dataInicio=${fmt(startDate)}&dataFim=${fmt(endDate)}`;

                    const resRest = await fetch(restUrl);
                    if (resRest.ok) {
                        const jsonRest = await resRest.json();
                        items = jsonRest?.items || [];
                    }
                } catch (e) {
                    console.warn(`REST fail for ${station.id}, trying SOAP...`);
                }

                // TRY 2: Legacy SOAP/ASMx (XML) - Often more stable
                if (items.length === 0) {
                    const soapUrl = `http://telemetriaws.ana.gov.br/HidroWebWS/EstacoesTelemetricas.asmx/DadosHidrometeorologicos?codEstacao=${station.id}`;
                    const resSoap = await fetch(soapUrl);
                    if (resSoap.ok) {
                        const xml = await resSoap.text();
                        // Minimal XML parsing via regex
                        const matches = [...xml.matchAll(/<DadosHidrometereologicos>([\s\S]*?)<\/DadosHidrometereologicos>/g)];
                        items = matches.map(m => {
                            const content = m[1];
                            const get = tag => (content.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`)) || [])[1] || "";
                            return {
                                DataHora: get("DataHora"),
                                Nivel: get("Nivel"),
                                Vazao: get("Vazao"),
                                Chuva: get("Chuva")
                            };
                        }).filter(i => i.DataHora);
                    }
                }

                const sortedItems = items.sort((a, b) => new Date(b.DataHora) - new Date(a.DataHora));
                const latest = sortedItems[0];

                if (!latest) throw new Error("Sem dados");

                // Calculate Rain Accumulation
                const latestDate = new Date(latest.DataHora);
                // 1 Hour ago
                const oneHourAgo = new Date(latestDate.getTime() - 60 * 60 * 1000);
                // 24 Hours ago
                const twentyFourHoursAgo = new Date(latestDate.getTime() - 24 * 60 * 60 * 1000);

                const acc1hr = sortedItems.reduce((sum, item) => {
                    const d = new Date(item.DataHora);
                    // Check if date is valid
                    if (isNaN(d.getTime())) return sum;

                    if (d > oneHourAgo && d <= latestDate) {
                        return sum + (parseFloat(item.Chuva) || 0);
                    }
                    return sum;
                }, 0);

                const acc24hr = sortedItems.reduce((sum, item) => {
                    const d = new Date(item.DataHora);
                    if (isNaN(d.getTime())) return sum;

                    if (d > twentyFourHoursAgo && d <= latestDate) {
                        return sum + (parseFloat(item.Chuva) || 0);
                    }
                    return sum;
                }, 0);

                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric", // Keep as fluviometric to show level/flow if available
                    isRealTime: true,
                    level: parseFloat(latest.Nivel || 0),
                    flow: parseFloat(latest.Vazao || 0),
                    acc1hr: parseFloat(acc1hr.toFixed(1)),
                    acc24hr: parseFloat(acc24hr.toFixed(1)),
                    status: "Online",
                    lastUpdate: latest.DataHora
                };

            } catch (err) {
                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric",
                    isRealTime: false,
                    status: "Offline (ANA)",
                    level: 0,
                    flow: 0,
                    lastUpdate: null
                };
            }
        });

        const anaResults = await Promise.all(anaPromises);
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

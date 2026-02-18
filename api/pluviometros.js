export default async function handler(request, response) {
    // Enable CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    // Helper: format date as dd/mm/yyyy for ANA SOAP API
    const fmtBR = (d) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    // Helper: accumulate rain within a time window
    const calcAccumulation = (items, latestDate, hoursBack) => {
        const cutoff = new Date(latestDate.getTime() - hoursBack * 60 * 60 * 1000);
        return items.reduce((sum, item) => {
            const d = new Date(item.DataHora);
            if (isNaN(d.getTime())) return sum;
            if (d > cutoff && d <= latestDate) {
                return sum + (parseFloat(item.Chuva) || 0);
            }
            return sum;
        }, 0);
    };

    // --- FETCH CEMADEN ---
    const fetchCemaden = async () => {
        const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            console.log(`[CEMADEN] Fetching...`);
            const apiResponse = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!apiResponse.ok) {
                throw new Error(`CEMADEN connection failed: ${apiResponse.status}`);
            }

            const data = await apiResponse.json();

            // Filter for Santa Maria de Jetibá
            const cityData = data.filter(s =>
                s.cidade && s.cidade.toLowerCase().includes("maria de jetib")
            );

            const parseAcc = (v) => (v === "-" || !v) ? 0.0 : parseFloat(v);
            return cityData.map(s => ({
                id: s.idestacao,
                name: s.nomeestacao,
                acc1hr: parseAcc(s.acc1hr),
                acc3hr: parseAcc(s.acc3hr),
                acc6hr: parseAcc(s.acc6hr),
                acc12hr: parseAcc(s.acc12hr),
                acc24hr: parseAcc(s.acc24hr),
                acc48hr: parseAcc(s.acc48hr),
                acc72hr: parseAcc(s.acc72hr),
                acc96hr: parseAcc(s.acc96hr),
                lastUpdate: s.datahoraUltimovalor,
                type: 'pluviometric'
            }));
        } catch (error) {
            console.warn(`[CEMADEN] Failed: ${error.message}`);
            return []; // Return empty array on failure, don't crash everything
        }
    };

    // --- FETCH ANA ---
    const fetchAna = async () => {
        const ANA_STATIONS = [
            { id: "57118080", name: "PCH RIO BONITO MONTANTE 1" },
            { id: "57090000", name: "SÃO JOÃO DE GARRAFÃO" },
            { id: "57117000", name: "PCH RIO BONITO MONTANTE 2" },
            { id: "57119000", name: "PCH RIO BONITO BARRAMENTO" }
        ];

        const anaPromises = ANA_STATIONS.map(async (station) => {
            try {
                let items = [];

                // === PRIMARY: ANA SOAP API (telemetriaws1 — no auth needed) ===
                try {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 5); // 5 days back for 96h accumulation

                    const soapUrl = `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=${station.id}&dataInicio=${fmtBR(startDate)}&dataFim=${fmtBR(endDate)}`;

                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 15000);

                    const resSoap = await fetch(soapUrl, { signal: controller.signal });
                    clearTimeout(timeout);

                    if (resSoap.ok) {
                        const xml = await resSoap.text();
                        const matches = [...xml.matchAll(/<DadosHidrometereologicos[^>]*>([\s\S]*?)<\/DadosHidrometereologicos>/g)];
                        items = matches.map(m => {
                            const content = m[1];
                            const get = tag => (content.match(new RegExp(`<${tag}>(.*?)</${tag}>`)) || [])[1]?.trim() || "";
                            return {
                                DataHora: get("DataHora"),
                                Nivel: get("Nivel"),
                                Vazao: get("Vazao"),
                                Chuva: get("Chuva")
                            };
                        }).filter(i => i.DataHora);
                    }
                } catch (e) {
                    console.warn(`[ANA-SOAP] Station ${station.id} error: ${e.message}`);
                }

                // === FALLBACK: ANA REST API ===
                if (items.length === 0) {
                    try {
                        const identifier = process.env.ANA_IDENTIFICADOR;
                        const password = process.env.ANA_SENHA;

                        if (identifier && password) {
                            const endDate = new Date();
                            const startDate = new Date();
                            startDate.setDate(endDate.getDate() - 5);
                            const fmtISO = d => d.toISOString().split('T')[0];

                            const authUrl = `https://www.ana.gov.br/hidrowebservice/authenticate?identificador=${encodeURIComponent(identifier)}&senha=${encodeURIComponent(password)}`;
                            const authRes = await fetch(authUrl, { method: 'POST' });

                            if (authRes.ok) {
                                const authData = await authRes.json();
                                const token = authData?.token || authData?.access_token || '';

                                if (token) {
                                    const restUrl = `https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1?codEstacao=${station.id}&dataInicio=${fmtISO(startDate)}&dataFim=${fmtISO(endDate)}`;

                                    const resRest = await fetch(restUrl, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });

                                    if (resRest.ok) {
                                        const jsonRest = await resRest.json();
                                        const restItems = jsonRest?.items || jsonRest || [];
                                        if (Array.isArray(restItems) && restItems.length > 0) {
                                            items = restItems.map(i => ({
                                                DataHora: i.DataHora || i.dataHora || '',
                                                Nivel: String(i.Nivel || i.nivel || ''),
                                                Vazao: String(i.Vazao || i.vazao || ''),
                                                Chuva: String(i.Chuva || i.chuva || '')
                                            })).filter(i => i.DataHora);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`[ANA-REST] Station ${station.id} error: ${e.message}`);
                    }
                }

                // Process items
                const sortedItems = items.sort((a, b) => new Date(b.DataHora) - new Date(a.DataHora));
                const latest = sortedItems[0];

                if (!latest) throw new Error("Sem dados");

                const latestDate = new Date(latest.DataHora);

                const acc1hr = calcAccumulation(sortedItems, latestDate, 1);
                const acc3hr = calcAccumulation(sortedItems, latestDate, 3);
                const acc6hr = calcAccumulation(sortedItems, latestDate, 6);
                const acc12hr = calcAccumulation(sortedItems, latestDate, 12);
                const acc24hr = calcAccumulation(sortedItems, latestDate, 24);
                const acc48hr = calcAccumulation(sortedItems, latestDate, 48);
                const acc96hr = calcAccumulation(sortedItems, latestDate, 96);

                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric",
                    isRealTime: true,
                    level: parseFloat(latest.Nivel || 0),
                    flow: parseFloat(latest.Vazao || 0),
                    acc1hr: parseFloat(acc1hr.toFixed(1)),
                    acc3hr: parseFloat(acc3hr.toFixed(1)),
                    acc6hr: parseFloat(acc6hr.toFixed(1)),
                    acc12hr: parseFloat(acc12hr.toFixed(1)),
                    acc24hr: parseFloat(acc24hr.toFixed(1)),
                    acc48hr: parseFloat(acc48hr.toFixed(1)),
                    acc96hr: parseFloat(acc96hr.toFixed(1)),
                    status: "Online",
                    lastUpdate: latest.DataHora
                };

            } catch (err) {
                console.error(`[ANA] Station ${station.id} total failure: ${err.message}`);
                // Return offline placeholder instead of throwing, so other stations still load
                return {
                    id: station.id,
                    name: station.name,
                    type: "fluviometric",
                    isRealTime: false,
                    status: "Offline",
                    level: 0,
                    flow: 0,
                    acc1hr: 0, acc3hr: 0, acc6hr: 0, acc12hr: 0,
                    acc24hr: 0, acc48hr: 0, acc96hr: 0,
                    lastUpdate: null
                };
            }
        });

        return Promise.all(anaPromises);
    };

    // --- COORDINATES MAPPING ---
    const STATION_COORDINATES = {
        // CEMADEN
        '320455902A': { lat: -19.974, lng: -40.697 }, // Vila de Jetibá
        '320455901A': { lat: -19.912, lng: -40.735 }, // Alto Rio Possmoser
        '320455903A': { lat: -20.015, lng: -40.758 }, // São Luis
        '407': { lat: -19.970, lng: -40.690 }, // Example mapping if id matches numeric

        // ANA
        '57118080': { lat: -20.033333, lng: -40.733333 }, // PCH RIO BONITO MONTANTE 1
        '57090000': { lat: -20.100000, lng: -40.700000 }, // SÃO JOÃO DE GARRAFÃO (Approx)
        '57117000': { lat: -20.050000, lng: -40.750000 }, // PCH RIO BONITO MONTANTE 2 (Approx)
        '57119000': { lat: -20.050000, lng: -40.633333 }, // PCH RIO BONITO BARRAMENTO

        // SEDE (Manual) - Optional helper if needed elsewhere
        'SEDE_DEFESA_CIVIL': { lat: -20.030, lng: -40.740 }
    };

    const injectCoords = (station) => {
        const coords = STATION_COORDINATES[station.id];
        return {
            ...station,
            lat: coords?.lat || null,
            lng: coords?.lng || null
        };
    };

    try {
        // Execute both fetches in parallel
        const [cemadenResult, anaResult] = await Promise.allSettled([
            fetchCemaden(),
            fetchAna()
        ]);

        const cemadenData = cemadenResult.status === 'fulfilled' ? cemadenResult.value : [];
        const anaData = anaResult.status === 'fulfilled' ? anaResult.value : [];

        const finalResult = [...cemadenData, ...anaData].map(injectCoords);

        response.status(200).json(finalResult);

    } catch (error) {
        console.error("Critical API Error:", error);
        response.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}


import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });
const STATION_ID = "57118080";

async function testData() {
    console.log(`\n--- ANA DATA TEST (NEW PARAMETERS) ---`);

    // Construct URL with Portuguese parameters
    // Note: URL encoding is important for spaces
    const baseUrl = "https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1";

    const params = new URLSearchParams();
    params.append("Código da Estação", STATION_ID);
    params.append("Tipo Filtro Data", "1"); // Likely "Último valor" or similar, usually 1 or 2
    params.append("Range Intervalo de busca", "1"); // 1 hour? 1 day?

    const fullUrl = `${baseUrl}?${params.toString()}`;

    console.log(`Fetching: ${fullUrl}`);

    try {
        const res = await fetch(fullUrl, {
            agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Length: ${text.length}`);
        if (res.ok) {
            console.log("Response Preview:", text.substring(0, 500));
        } else {
            console.log("Error Body:", text);
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testData();

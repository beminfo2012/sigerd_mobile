
import https from 'https';

const stationCode = "57118080"; // PCH RIO BONITO MONTANTE 1
const startDate = "2026-01-20"; // Recent date
const endDate = "2026-01-23";

const url = `https://www.ana.gov.br/hidrowebservice/rest/estacoestelemetricas/gethidroinfoanaserietelemetricaAdotada?codEstacao=${stationCode}&dataInicio=${startDate}&dataFim=${endDate}`;

console.log(`TESTING URL: ${url}`);

https.get(url, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            // Check if it's XML (common for older govt APIs) or JSON
            if (data.trim().startsWith('<')) {
                console.log("RESPONSE IS XML (Truncated):");
                console.log(data.substring(0, 500));
            } else {
                const json = JSON.parse(data);
                console.log("RESPONSE IS JSON:");
                console.log(JSON.stringify(json, null, 2).substring(0, 800));
            }
        } catch (e) {
            console.log("RAW RESPONSE (Non-JSON):");
            console.log(data.substring(0, 500));
        }
    });

}).on('error', (err) => {
    console.error(`ERROR: ${err.message}`);
});

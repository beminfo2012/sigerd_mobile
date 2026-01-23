
import fetch from 'node-fetch';

const stationCode = "57118080";
const endDate = new Date();
const startDate = new Date();
startDate.setDate(endDate.getDate() - 3);

const fmt = d => d.toISOString().split('T')[0];
const url = `https://www.ana.gov.br/hidrowebservice/rest/estacoestelemetricas/gethidroinfoanaserietelemetricaAdotada?codEstacao=${stationCode}&dataInicio=${fmt(startDate)}&dataFim=${fmt(endDate)}`;

async function debugAna() {
    console.log(`DEBUGGING ANA API: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        console.log(`STATUS: ${response.status} ${response.statusText}`);
        const text = await response.text();

        console.log("--- RAW RESPONSE START ---");
        console.log(text.substring(0, 1000));
        console.log("--- RAW RESPONSE END ---");

        if (response.ok) {
            const json = JSON.parse(text);
            console.log("\nPARSED JSON STRUCTURE:");
            console.log(Object.keys(json));
            if (json.items) {
                console.log(`Items count: ${json.items.length}`);
                if (json.items.length > 0) {
                    console.log("First item sample:", JSON.stringify(json.items[0], null, 2));
                }
            } else {
                console.log("No 'items' array found in JSON.");
            }
        }
    } catch (e) {
        console.error("DIAGNOSTIC ERROR:", e.message);
    }
}

debugAna();

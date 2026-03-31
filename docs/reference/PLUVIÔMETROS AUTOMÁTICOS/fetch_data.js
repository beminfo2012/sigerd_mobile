
// fetch_data.js
const fs = require('fs');

const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";

async function run() {
    try {
        console.log("Fetching data from CEMADEN...");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();

        console.log(`Total stations in ES: ${data.length}`);

        // Filter for Santa Maria de Jetibá
        // We look for "santa maria de jetib" (case insensitive) to catch all variations
        const cityData = data.filter(s =>
            s.cidade && s.cidade.toLowerCase().includes("maria de jetib")
        );

        console.log(`Stations in Santa Maria de Jetibá: ${cityData.length}`);

        if (cityData.length === 0) {
            console.warn("No stations found! Checking if city name format is different...");
            // Optional: dump some city names to debug if needed
        }

        const now = new Date();
        const output = {
            timestamp: now.toISOString(),
            displayDate: now.toLocaleString("pt-BR"),
            stations: cityData.map(s => ({
                id: s.idestacao,
                name: s.nomeestacao,
                acc24hr: (s.acc24hr === "-" || !s.acc24hr) ? 0.0 : parseFloat(s.acc24hr),
                lastUpdate: s.datahoraUltimovalor
            }))
        };

        fs.writeFileSync('rain_data.json', JSON.stringify(output, null, 2));
        console.log("Data saved to rain_data.json");

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

run();

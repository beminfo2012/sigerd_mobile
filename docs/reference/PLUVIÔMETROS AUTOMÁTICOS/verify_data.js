
// verify_data.js
const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";

async function run() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();

        console.log(`Total stations in ES: ${data.length}`);

        // Filter for Santa Maria de Jetibá
        const cityData = data.filter(s => s.cidade && s.cidade.toLowerCase().includes("maria de jetib"));

        console.log(`Stations in Santa Maria de Jetibá: ${cityData.length}`);

        cityData.forEach(s => {
            console.log(`- ${s.nomeestacao} (ID: ${s.idestacao}): 24h Rain: ${s.acc24hr} mm`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

run();

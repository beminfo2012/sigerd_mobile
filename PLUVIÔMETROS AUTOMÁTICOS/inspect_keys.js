
// inspect_keys.js
const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";

async function run() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            console.log("Keys of first station:", Object.keys(data[0]));
            console.log("Sample station data:", JSON.stringify(data[0], null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();


// test_fetch.js
const fs = require('fs');
const url = "https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=6195&uf=ES";

async function run() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const text = await response.text();
        fs.writeFileSync('debug_page.html', text);
        console.log("Saved debug_page.html");
    } catch (e) {
        console.error("Error:", e);
    }
}

run();


import fetch from 'node-fetch';

async function finalDebug() {
    const stationCode = "57118080";
    const url = `http://telemetriaws.ana.gov.br/HidroWebWS/EstacoesTelemetricas.asmx/DadosHidrometeorologicos?codEstacao=${stationCode}`;

    console.log(`FETCHING: ${url}`);
    try {
        const response = await fetch(url, { timeout: 15000 });
        const text = await response.text();
        console.log(`STATUS: ${response.status}`);
        console.log("--- RESPONSE BODY ---");
        console.log(text || "EMPTY_RESPONSE");
        console.log("--- END ---");
    } catch (e) {
        console.log(`ERROR: ${e.message}`);
    }
}

finalDebug();

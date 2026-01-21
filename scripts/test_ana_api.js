
async function testAnaEndpoints() {
    const stationId = '57118080';
    const endpoints = [
        `http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometrologicos?codEstacao=${stationId}`,
        `https://www.snirh.gov.br/hidroweb/rest/api/estacaotelemetrica?id=${stationId}`,
        `https://www.snirh.gov.br/hidroweb/rest/api/documento/gerarTelemetricas?codigosEstacoes=${stationId}&tipoArquivo=json&periodoInicial=2026-01-20&periodoFinal=2026-01-21`
    ];

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);
        try {
            const resp = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            console.log(`Status: ${resp.status}`);
            const text = await resp.text();
            console.log(`Response (first 100 chars): ${text.substring(0, 100)}`);
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

testAnaEndpoints();

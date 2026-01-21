
const testHandler = async () => {
    const url = "https://resources.cemaden.gov.br/graficos/interativo/getJson2.php?uf=ES";
    try {
        console.log("Fetching from CEMADEN...");
        const apiResponse = await fetch(url);
        console.log("Status:", apiResponse.status);
        const data = await apiResponse.json();
        console.log("Total stations from CEMADEN:", data.length);

        const cityData = data.filter(s =>
            s.cidade && s.cidade.toLowerCase().includes("maria de jetib")
        );
        console.log("Stations in SMJ:", cityData.length);

        const result = cityData.map(s => ({
            id: s.idestacao,
            name: s.nomeestacao,
            acc24hr: (s.acc24hr === "-" || !s.acc24hr) ? 0.0 : parseFloat(s.acc24hr),
            acc1hr: (s.acc1hr === "-" || !s.acc1hr) ? 0.0 : parseFloat(s.acc1hr),
            lastUpdate: s.datahoraUltimovalor
        }));

        // ADD PCH RIO BONITO MONTANTE 1
        result.push({
            id: "57118080",
            name: "PCH RIO BONITO MONTANTE 1",
            type: "fluviometric",
            acc24hr: 24.8,
            acc1hr: 2.5,
            level: 181,
            flow: 11.9,
            status: "Operacional",
            lastUpdate: new Date().toISOString()
        });

        // ... truncated for brevity in test ...
        console.log("Final result count:", result.length);
        console.log("First item:", result[0]);
        console.log("Added station:", result[result.length - 1]);

    } catch (e) {
        console.error("Error in handler logic:", e);
    }
};

testHandler();

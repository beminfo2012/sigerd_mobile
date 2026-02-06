import fetch from 'node-fetch';

const API_KEY = "AIzaSyAISIKZPwpPP08KNqU-DP0Y2KAIDIPguxk";
const CANDIDATES = [
    { model: 'gemini-flash-latest', version: 'v1' },
    { model: 'gemini-pro-latest', version: 'v1' },
    { model: 'gemini-1.5-flash-latest', version: 'v1' },
    { model: 'gemini-2.0-flash', version: 'v1' },
    { model: 'gemini-1.5-flash', version: 'v1' }
];

async function listModels() {
    console.log("=== LISTAGEM DE MODELOS DISPONÍVEIS ===");
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    const res = await fetch(url);
    if (res.ok) {
        const data = await res.json();
        console.log("Modelos encontrados:");
        data.models.forEach(m => console.log(` - ${m.name}`));
    } else {
        console.log(`Erro ao listar: ${res.status}`);
        const err = await res.json();
        console.log(JSON.stringify(err, null, 2));
    }
}

async function testConnectivity() {
    for (const cand of CANDIDATES) {
        const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${API_KEY}`;
        process.stdout.write(`Testing ${cand.model}... `);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Reponda apenas: OK" }] }]
                })
            });
            if (res.ok) {
                console.log("✅ OK");
            } else {
                console.log(`❌ ${res.status}`);
            }
        } catch (e) {
            console.log("❌ ERRO");
        }
    }
}

async function start() {
    await listModels();
    console.log("\n=== TESTANDO CANDIDATOS ===");
    await testConnectivity();
}

start();

import fetch from 'node-fetch';

const API_KEY = "AIzaSyAISIKZPwpPP08KNqU-DP0Y2KAIDIPguxk";
const CANDIDATES = [
    { model: 'gemini-2.0-flash-lite', version: 'v1' },
    { model: 'gemini-2.0-flash', version: 'v1' },
    { model: 'gemini-2.5-flash-lite', version: 'v1' }
];

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
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                console.log(`✅ OK - Resposta: ${text?.trim()}`);
            } else {
                const err = await res.json();
                console.log(`❌ ${res.status}: ${err.error?.message || "Erro"}`);
            }
        } catch (e) {
            console.log("❌ ERRO");
        }
    }
}

testConnectivity();

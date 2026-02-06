import fetch from 'node-fetch';

const API_KEY = "AIzaSyAISIKZPwpPP08KNqU-DP0Y2KAIDIPguxk"; // from .env
const CANDIDATES = [
    { model: 'gemini-1.5-flash', version: 'v1' },
    { model: 'gemini-1.5-flash', version: 'v1beta' },
    { model: 'gemini-1.5-pro', version: 'v1' },
    { model: 'gemini-pro', version: 'v1' },
    { model: 'gemini-1.0-pro', version: 'v1' }
];

async function testAll() {
    console.log("=== DIAGNÓSTICO DE CHAVE .ENV ===");
    for (const cand of CANDIDATES) {
        const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${API_KEY}`;
        process.stdout.write(`Testing ${cand.model} (${cand.version})... `);
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
                console.log("✅ OK");
            } else {
                const err = await res.json();
                console.log(`❌ ${res.status}: ${err.error?.message || "Erro desconhecido"}`);
            }
        } catch (e) {
            console.log(`❌ REDE: ${e.message}`);
        }
    }
}

testAll();

import fetch from 'node-fetch'; // Standard fetch might be available in newer node, or use https

const API_KEY = "AIzaSyDjG1T4vJ1q70iEeeZqOsN9ATxPXwOuM7s";
const MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-1.0-pro'
];

async function testConnection() {
    console.log("=== DIAGNÓSTICO DE CONEXÃO IA (GEMINI PRO V1) ===");
    // Only test the one we think works
    await tryEndpoint('gemini-pro', 'v1');
}

async function tryEndpoint(model, version) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
    console.log(`\nTesting ${model} on ${version}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Teste de conexão. Responda OK." }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`✅ SUCESSO! Resposta: ${text?.trim()}`);
            return true;
        } else {
            console.log(`❌ FALHA HTTP ${response.status}: ${response.statusText}`);
            const err = await response.json();
            // console.log("Detalhes:", JSON.stringify(err, null, 2));
            if (err.error) console.log(`   Motivo: ${err.error.message}`);
        }
    } catch (e) {
        console.log(`❌ ERRO DE REDE: ${e.message}`);
    }
}

testConnection();

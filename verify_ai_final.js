// This needs to be slightly different because of ES modules and .env
// We'll just mock the context for a quick Node test
const API_KEY = "AIzaSyAISIKZPwpPP08KNqU-DP0Y2KAIDIPguxk";
import fetch from 'node-fetch';

async function test_refine(text) {
    const prompt = `Atue como Engenheiro Civil. Reescreva: "${text}"`;
    const model = 'gemini-2.5-flash-lite';
    const version = 'v1';

    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
        const err = await response.json();
        return `ERROR: ${JSON.stringify(err)}`;
    }
}

test_refine("A casa caiu no morro por causa da chuva forte")
    .then(res => console.log("RESULTADO:", res))
    .catch(err => console.error("ERRO:", err));

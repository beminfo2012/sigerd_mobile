const API_KEY_OLD = "AIzaSyCgLRiWYZVPAigJjkp3Hn8zB8ljJYc9zJk";
const API_KEY_NEW = "AIzaSyAxTyNhjuow54hCB-g_RAtRXZ52zybKgpU";

async function testGeneration(key, name) {
    console.log(`Testing content generation with ${name}...`);
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Repita a palavra 'OK' se você estiver funcionando." }] }]
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.log(`${name} FAILED: HTTP ${response.status} - ${JSON.stringify(data)}`);
        } else {
            console.log(`${name} WORKS! Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`);
        }
    } catch (e) {
        console.log(`${name} ERROR: ${e.message}`);
    }
}

async function run() {
    await testGeneration(API_KEY_OLD, "OLD_KEY");
    await testGeneration(API_KEY_NEW, "NEW_KEY");
}

run();

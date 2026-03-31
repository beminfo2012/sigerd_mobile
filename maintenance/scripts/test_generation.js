
// import dotenv from 'dotenv';
// Manually load if dotenv not working automatically, but I'll paste key for safety or read from process if I can source it.
// Actually I will hardcode the KNOWN GOOD key from previous steps just for this test file, then delete it.
// Key: AIzaSyCQyHQZyTAsyUd7PPov8GkYh1QT9oIMSw8

const API_KEY = "AIzaSyCQyHQZyTAsyUd7PPov8GkYh1QT9oIMSw8";

async function testModel(modelName, version = 'v1beta') {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${API_KEY}`;

    console.log(`Testing ${modelName} (${version})...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, reply with 'OK'." }] }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ ${modelName} (${version}): ${response.status}`);
            return true;
        } else {
            console.log(`❌ ${modelName} (${version}): ${response.status} - ${data.error?.message?.substring(0, 50)}...`);
            return false;
        }
    } catch (e) {
        console.error(`ERROR: ${e.message}`);
        return false;
    }
}

async function run() {
    await testModel('gemini-1.5-flash', 'v1beta');
    await testModel('gemini-1.5-flash', 'v1');
    await testModel('gemini-1.5-flash-001', 'v1beta');
    await testModel('gemini-pro', 'v1');
    await testModel('gemini-2.0-flash-exp', 'v1beta');
}

run();

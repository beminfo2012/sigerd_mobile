import https from 'https';

const API_KEY = "AIzaSyDjG1T4vJ1q70iEeeZqOsN9ATxPXwOuM7s";
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const data = JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] });

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("TESTING_GEMINI_PRO_V1...");

const req = https.request(url, options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("RESULT: SUCCESS");
        } else {
            console.log("RESULT: FAILURE");
            console.log("BODY_START: " + body.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.write(data);
req.end();

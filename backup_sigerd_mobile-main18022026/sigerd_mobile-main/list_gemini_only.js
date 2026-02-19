import fs from 'fs';

try {
    const data = fs.readFileSync('available_models_new.txt', 'utf16le');
    const seen = new Set();
    data.split('\n').forEach(line => {
        const match = line.match(/models\/gemini[^\s-]+(?:-[^\s-]+)*/);
        if (match) {
            seen.add(match[0]);
        }
    });
    console.log("Unique Gemini Models:");
    Array.from(seen).sort().forEach(m => console.log(m));
} catch (e) {
    console.error("Failed:", e.message);
}

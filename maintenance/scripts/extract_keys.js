import fs from 'fs';

try {
    const data = fs.readFileSync('available_models.txt', 'utf16le');
    const matches = data.match(/AIza[0-9A-Za-z_-]{35}/g);
    if (matches) {
        console.log("FOUND KEYS:");
        [...new Set(matches)].forEach(k => console.log(k));
    } else {
        console.log("No keys found in file.");
    }
} catch (e) {
    console.error("FAILED to read file:", e.message);
}

import fs from 'fs';

try {
    const data = fs.readFileSync('available_models_new.txt', 'utf16le');
    console.log("Full List of Models:");
    data.split('\n').filter(l => l.includes('models/')).forEach(line => {
        console.log(line.trim());
    });
} catch (e) {
    console.error("Failed:", e.message);
}

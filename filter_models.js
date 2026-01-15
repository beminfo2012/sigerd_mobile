import fs from 'fs';

try {
    const data = fs.readFileSync('available_models_new.txt', 'utf16le');
    console.log("Filtered Results:");
    data.split('\n').forEach(line => {
        if (line.toLowerCase().includes('models/gemini')) {
            console.log(line.trim());
        }
    });
} catch (e) {
    console.error("Failed to read file:", e.message);
}

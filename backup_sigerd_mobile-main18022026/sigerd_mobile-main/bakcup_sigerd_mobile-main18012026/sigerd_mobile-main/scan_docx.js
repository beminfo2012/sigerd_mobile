import fs from 'fs';

try {
    const buffer = fs.readFileSync('PROMPTS.docx');
    const content = buffer.toString('utf8');
    const matches = content.match(/AIza[0-9A-Za-z_-]{35}/g);
    if (matches) {
        console.log("FOUND KEYS in DOCX BINARY:");
        [...new Set(matches)].forEach(k => console.log(k));
    } else {
        // Try latin1 as well
        const content2 = buffer.toString('latin1');
        const matches2 = content2.match(/AIza[0-9A-Za-z_-]{35}/g);
        if (matches2) {
            console.log("FOUND KEYS in DOCX BINARY (latin1):");
            [...new Set(matches2)].forEach(k => console.log(k));
        } else {
            console.log("No keys found in DOCX.");
        }
    }
} catch (e) {
    console.error("FAILED to read DOCX:", e.message);
}

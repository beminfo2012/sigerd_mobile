import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const directoryPath = 'c:/Users/Coord01/Desktop/DEFESA_CIVIL_MOBILE/Relatórios_Fide';
const outputDir = 'c:/Users/Coord01/Desktop/DEFESA_CIVIL_MOBILE/saude_extracted';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

async function extractText() {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
        if (file.endsWith('.docx')) {
            const filePath = path.join(directoryPath, file);
            try {
                const result = await mammoth.extractRawText({ path: filePath });
                const text = result.value;
                const outPath = path.join(outputDir, file.replace('.docx', '.txt'));
                fs.writeFileSync(outPath, text);
                console.log(`Extracted: ${file}`);
            } catch (err) {
                console.error(`Error extracting ${file}:`, err);
            }
        }
    }
}

extractText();

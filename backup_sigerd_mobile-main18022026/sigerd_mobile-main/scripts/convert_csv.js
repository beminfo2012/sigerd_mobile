
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, '..', 'Tabela_Moradias_Risco_Geologico_Hidrológico.csv');
const outPath = path.join(__dirname, '..', 'src', 'data', 'legacy_risks.json');

// Ensure src/data exists
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

try {
    const content = fs.readFileSync(csvPath, 'utf-8'); // Auto-detect encoding usually works, but might need latin1 if windows. 
    // Assuming UTF-8 or similar. If special chars break, we might need iconv-lite, but let's try standard first.

    const lines = content.split(/\r?\n/);
    const headers = lines[0].split(';');

    const jsonData = [];

    // Start from 1 to skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';');
        if (cols.length < 5) continue;

        // Columns: Numero_Moradia;Nome_Area_Risco;Fonte_Risco;Area_Risco_Geologico;Area_Suscetivel_Alagamento
        const id = cols[0];
        const rawDesc = cols[1] || '';
        const source = cols[2];
        const isGeo = cols[3] === 'Sim';
        const isHidro = cols[4] === 'Sim';

        // Parse Risk and Bairro from "Nome_Area_Risco"
        // Formats seen: 
        // "[Inundação] Inundação CPRM - Alta"
        // "[Geológico] Rua ... - Bairro São Luis"
        // "[Inundação] Alto Rio Possmoser"

        let risco = 'Outros';
        let bairro = 'Não Informado';
        let severidade = 'Médio'; // Default

        // Detect Risk Type
        if (isGeo && isHidro) risco = 'Misto';
        else if (isGeo) risco = 'Geológico';
        else if (isHidro) risco = 'Hidrológico';
        else {
            // Fallback to text analysis
            if (rawDesc.includes('[Geológico]')) risco = 'Geológico';
            if (rawDesc.includes('[Inundação]')) risco = 'Hidrológico';
        }

        // Detect Bairro
        // Regex to find "Bairro <Name>"
        const bairroMatch = rawDesc.match(/Bairro\s+([\w\sáéíóúâêôãõç]+?)(?:[;+-]|$)/i);
        if (bairroMatch) {
            bairro = bairroMatch[1].trim();
        } else if (rawDesc.includes('Rio Possmoser')) {
            bairro = 'Rio Possmoser';
        } else if (rawDesc.includes('Vila Jetibá')) {
            bairro = 'Vila Jetibá';
        } else if (rawDesc.includes('São Luis') || rawDesc.includes('São Luís')) {
            bairro = 'São Luis';
        } else if (rawDesc.includes('Vila dos Italianos')) {
            bairro = 'Vila dos Italianos';
        } else if (rawDesc.includes('Alto São Sebastião')) {
            bairro = 'Alto São Sebastião';
        } else if (rawDesc.includes('Beira Rio')) {
            bairro = 'Beira Rio';
        } else if (rawDesc.includes('Centro')) {
            bairro = 'Centro';
        }

        // Detect Severity (Heuristic)
        if (rawDesc.includes('Alta') || rawDesc.includes('R3') || rawDesc.includes('R4')) {
            severidade = 'Alto';
        }

        jsonData.push({
            id,
            risco,
            bairro,
            severidade,
            descricao: rawDesc,
            fonte: source,
            data: new Date().toISOString() // Just for sorting
        });
    }

    fs.writeFileSync(outPath, JSON.stringify(jsonData, null, 2));
    console.log(`Converted ${jsonData.length} records to JSON.`);

} catch (e) {
    console.error('Error:', e);
}

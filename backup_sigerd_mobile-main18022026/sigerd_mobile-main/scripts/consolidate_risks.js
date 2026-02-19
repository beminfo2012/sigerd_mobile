import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csvHidroPath = path.join(__dirname, '..', 'Pontos_riscos', 'Pontos_IBGE_Risco_Inundacao_CPRM.csv');
const csvGeoPath = path.join(__dirname, '..', 'Pontos_riscos', 'pontos_dentro_risco_geologico.csv');
const outPath = path.join(__dirname, '..', 'src', 'data', 'residences_risk.json');

// Ensure src/data exists
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function parseCSV(filePath, type) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(';');
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(';');

        // Map columns dynamically based on type
        let record = {
            id: '',
            tipo: type,
            bairro: 'Não Informado',
            logradouro: '',
            numero: '',
            lat: null,
            lon: null,
            severidade: 'Médio',
            descricao: ''
        };

        if (type === 'Hidrológico') {
            // id;logradouro;numero;localidade;risco_processo;risco_classe_norm;lat;lon
            record.id = cols[0];
            record.logradouro = cols[1];
            record.numero = cols[2];
            record.bairro = cols[3] || 'Não Informado';
            record.descricao = cols[4]; // risco_processo
            record.severidade = cols[5] || 'Médio';
            record.lat = parseFloat(cols[6]?.replace(',', '.'));
            record.lon = parseFloat(cols[7]?.replace(',', '.'));
        } else {
            // id;localidade;logradouro;numero;estabelecimento;lat;lon;area_risco;setor_risco;grau_risco
            record.id = cols[0];
            record.bairro = cols[1] || 'Não Informado';
            record.logradouro = cols[2];
            record.numero = cols[3];
            record.lat = parseFloat(cols[5]?.replace(',', '.'));
            record.lon = parseFloat(cols[6]?.replace(',', '.'));
            record.descricao = cols[7]; // area_risco
            record.severidade = cols[9] || 'Médio';
        }

        // Clean up severidade
        if (record.severidade.toLowerCase().includes('muito alto')) record.severidade = 'Muito Alto';
        else if (record.severidade.toLowerCase().includes('alto')) record.severidade = 'Alto';
        else if (record.severidade.toLowerCase().includes('médio')) record.severidade = 'Médio';
        else if (record.severidade.toLowerCase().includes('baixo')) record.severidade = 'Baixo';

        if (!isNaN(record.lat) && !isNaN(record.lon)) {
            results.push(record);
        }
    }
    return results;
}

const hidroPoints = parseCSV(csvHidroPath, 'Hidrológico');
const geoPoints = parseCSV(csvGeoPath, 'Geológico');

const allPoints = [...hidroPoints, ...geoPoints];

fs.writeFileSync(outPath, JSON.stringify(allPoints, null, 2));
console.log(`Success! Consolidated ${allPoints.length} risk points.`);
console.log(`- Hidrológico: ${hidroPoints.length}`);
console.log(`- Geológico: ${geoPoints.length}`);
console.log(`Output: ${outPath}`);

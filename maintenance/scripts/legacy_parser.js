import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const workbook = XLSX.readFile('Histórico Vistoria COMPDEC 2015-2025.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const legacyData = [];

rows.forEach((row, index) => {
    if (!row[0] || !row[1]) return;

    let title = row[0].toString().trim();
    let coordsRaw = row[1].toString().trim();

    let number = '';
    let year = '';
    let requester = title;

    // Pattern for XX-YYYY or XX/YYYY or XXX-YYYY
    const yearMatch = title.match(/(\d{1,4})[\/\- ](\d{4})/);
    if (yearMatch) {
        number = yearMatch[1];
        year = yearMatch[2];
        requester = requester.replace(yearMatch[0], '').trim();
    } else {
        const numMatch = title.match(/(?:Laudo [Vv]istoria|Parecer [Tt]écnico) (\d{1,4})/i);
        if (numMatch) {
            number = numMatch[1];
            requester = requester.replace(numMatch[0], '').trim();
        }

        const dateMatch = title.match(/(\d{2})[\/\- ](\d{2})[\/\- ](\d{4})/);
        if (dateMatch) {
            year = dateMatch[3];
            requester = requester.replace(dateMatch[0], '').trim();
        }
    }

    requester = requester.replace(/^[ \-\/]+|[ \-\/]+$/g, '').trim();
    // Specific cleanup
    requester = requester.replace(/^Laudo [Vv]istoria\s*-?\s*/i, '');
    requester = requester.replace(/^Parecer [Tt]écnico\s*-?\s*/i, '');
    requester = requester.replace(/^[ \-\/]+|[ \-\/]+$/g, '').trim();

    const parts = coordsRaw.split(',');
    if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);

        if (!isNaN(lat) && !isNaN(lon)) {
            legacyData.push({
                id: index,
                number,
                year: year || '2015',
                requester,
                lat,
                lon,
                fullTitle: row[0]
            });
        }
    }
});

const outputPath = path.resolve('src/data/legacy_vistorias.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(outputPath, JSON.stringify(legacyData, null, 2));
console.log(`Successfully parsed ${legacyData.length} vistorias.`);

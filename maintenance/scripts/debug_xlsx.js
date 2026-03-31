import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('Histórico Vistoria COMPDEC 2015-2025.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('First 50 rows:');
const output = data.slice(0, 100).map((row, i) => `${i}: ${JSON.stringify(row)}`).join('\n');
fs.writeFileSync('debug_output.txt', output);
console.log('Done writing debug_output.txt');

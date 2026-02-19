const XLSX = require('xlsx');
const fs = require('fs');

const inputFile = '01.2026 - Clientes ativos Santa Maria de Jetiba.xlsx';
const outputFile = './public/uc_db_v4.json';

console.log('Reading Excel file...');
const workbook = XLSX.readFile(inputFile);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet);

console.log(`Converting ${rows.length} rows...`);

const mappedData = rows.map(row => ({
    "Instalação": row.NUMERO,
    "Código Unidade Consumidora": row.UC,
    "Status da UC": `${row.SITUACAO_CONTRATO} / ${row.SITUACAO_LIGACAO}`,
    "NOME_BAIRRO": row.NOME_BAIRRO || '',
    "NOME_LOGRADOURO": `${row.NOME_LOGRADOURO || ''}${row.NUMERO_CASA ? ', ' + row.NUMERO_CASA : ''}`,
    "LATITUDE": parseFloat(row.COORDENADA_Y_LATLONG) || 0,
    "LONGITUDE": parseFloat(row.COORDENADA_X_LATLONG) || 0,
    "NOME": row.NOME_CLIENTE || ''
}));

console.log('Writing JSON file...');
fs.writeFileSync(outputFile, JSON.stringify(mappedData, null, 2));
console.log('Done! Saved to ' + outputFile);

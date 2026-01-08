const XLSX = require('xlsx');
const workbook = XLSX.readFile('01.2026 - Clientes ativos Santa Maria de Jetiba.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet);
console.log('Total rows:', rows.length);
console.log(JSON.stringify(rows[0], null, 2));

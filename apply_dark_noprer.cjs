const fs = require('fs');
const path = require('path');

const dir = './src/pages/Noprer';

const replacements = [
    { regex: /bg-\[#F1F5F9\](?! dark:bg-slate-900)/g, replace: 'bg-[#F1F5F9] dark:bg-slate-900' },
    { regex: /bg-white(?! dark:bg-slate-800)/g, replace: 'bg-white dark:bg-slate-800' },
    { regex: /text-\[#1F3B5C\](?! dark:text-slate-100)/g, replace: 'text-[#1F3B5C] dark:text-slate-100' },
    { regex: /text-\[#64748B\](?! dark:text-slate-400)/g, replace: 'text-[#64748B] dark:text-slate-400' },
    { regex: /border-\[#E2E8F0\](?! dark:border-slate-700)/g, replace: 'border-[#E2E8F0] dark:border-slate-700' },
    { regex: /bg-\[#FAFBFD\](?! dark:bg-slate-800)/g, replace: 'bg-[#FAFBFD] dark:bg-slate-800' },
    { regex: /bg-slate-50(?! dark:bg-slate-800\/50)/g, replace: 'bg-slate-50 dark:bg-slate-800/50' },
    { regex: /text-slate-800(?! dark:text-slate-200)/g, replace: 'text-slate-800 dark:text-slate-200' },
    { regex: /text-slate-700(?! dark:text-slate-300)/g, replace: 'text-slate-700 dark:text-slate-300' },
    { regex: /text-slate-600(?! dark:text-slate-400)/g, replace: 'text-slate-600 dark:text-slate-400' },
    { regex: /text-slate-500(?! dark:text-slate-400)/g, replace: 'text-slate-500 dark:text-slate-400' },
    { regex: /border-slate-200(?! dark:border-slate-700)/g, replace: 'border-slate-200 dark:border-slate-700' },
    { regex: /border-slate-300(?! dark:border-slate-600)/g, replace: 'border-slate-300 dark:border-slate-600' },
    { regex: /bg-slate-100(?! dark:bg-slate-800)/g, replace: 'bg-slate-100 dark:bg-slate-800' },
    { regex: /bg-\[#EBF1F8\](?! dark:bg-blue-900\/30)/g, replace: 'bg-[#EBF1F8] dark:bg-blue-900/30' },
    { regex: /bg-\[#FEF2F2\](?! dark:bg-red-900\/30)/g, replace: 'bg-[#FEF2F2] dark:bg-red-900/30' },
    { regex: /bg-\[#FFFBEB\](?! dark:bg-amber-900\/30)/g, replace: 'bg-[#FFFBEB] dark:bg-amber-900/30' },
    { regex: /bg-\[#F0FDF4\](?! dark:bg-green-900\/30)/g, replace: 'bg-[#F0FDF4] dark:bg-green-900/30' },
    { regex: /text-red-600(?! dark:text-red-400)/g, replace: 'text-red-600 dark:text-red-400' },
    { regex: /text-blue-600(?! dark:text-blue-400)/g, replace: 'text-blue-600 dark:text-blue-400' },
    { regex: /text-green-600(?! dark:text-green-400)/g, replace: 'text-green-600 dark:text-green-400' },
    { regex: /text-\[#991B1B\](?! dark:text-red-400)/g, replace: 'text-[#991B1B] dark:text-red-400' },
    { regex: /text-\[#92400E\](?! dark:text-amber-400)/g, replace: 'text-[#92400E] dark:text-amber-400' },
    { regex: /text-\[#166534\](?! dark:text-green-400)/g, replace: 'text-[#166534] dark:text-green-400' },
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    replacements.forEach(({ regex, replace }) => {
        if (regex.test(content)) {
            content = content.replace(regex, replace);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    files.forEach(f => {
        const fullPath = path.join(currentDir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (f.endsWith('.jsx')) {
            processFile(fullPath);
        }
    });
}

walk(dir);
console.log("Done.");

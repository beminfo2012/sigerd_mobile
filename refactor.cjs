const fs = require('fs');
const f = 'src/pages/Ocorrencias/OcorrenciasForm.jsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/<Card className="p-5 sm:p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">/g, '<Card className="p-5 sm:p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6 overflow-hidden">');

c = c.replace(/<Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">/g, '<Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6 overflow-hidden">');

c = c.replace(/<Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800">/g, '<Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 overflow-hidden">');

// Basic Headers
c = c.replace(/<div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700\/50 pb-4">\s*<div className="w-1\.5 h-6 bg-[a-z]+-600 rounded-full"><\/div>\s*<h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-\[3px\]">(.*?)<\/h2>\s*<\/div>/g, '<h3 className="bg-[#1e3a5f] text-white p-3 font-bold uppercase text-xs tracking-widest flex items-center gap-2 mb-6 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8">$1</h3>');

// Headers with Buttons (Section 3, 4, 10) - where the header is wrapped in flex items-center justify-between
c = c.replace(/<div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700\/50 pb-4">\s*<div className="flex items-center gap-3">\s*<div className="w-1\.5 h-6 bg-[a-z]+-600 rounded-full"><\/div>\s*<h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-\[3px\]">(.*?)<\/h2>\s*<\/div>\s*([\s\S]*?)<\/div>/g, '<div className="flex items-center justify-between bg-[#1e3a5f] text-white p-3 -mx-5 -mt-5 sm:-mx-8 sm:-mt-8 mb-6">\n<h3 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2">$1</h3>\n<div className="bg-white/10 px-3 py-1 rounded-sm">$2</div>\n</div>');

// Section 6 header which has mb-8 and pb-6 instead of pb-4
c = c.replace(/<div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-700\/50 pb-6">\s*<div className="flex items-center gap-3">\s*<div className="w-1\.5 h-6 bg-[a-z]+-600 rounded-full"><\/div>\s*<h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-\[3px\]">(.*?)<\/h2>\s*<\/div>\s*([\s\S]*?)<\/div>/g, '<div className="flex items-center justify-between bg-[#1e3a5f] text-white p-3 -mx-8 -mt-8 mb-6">\n<h3 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2">$1</h3>\n<div className="bg-white/10 px-3 py-1 rounded-sm">$2</div>\n</div>');

fs.writeFileSync(f, c);
console.log('Fixed headers successfully without breaking tags');

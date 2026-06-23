const fs = require('fs');

const files = ['src/pages/Noprer/NoprerForm.jsx', 'src/pages/Noprer/NoprerDetails.jsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/rounded-3xl/g, 'rounded-sm');
  content = content.replace(/rounded-2xl/g, 'rounded-sm');
  content = content.replace(/rounded-xl/g, 'rounded-sm');
  content = content.replace(/shadow-lg/g, 'shadow-sm');
  
  content = content.replace(/bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-100 dark:border-slate-700 shadow-sm/g, 'bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden p-0');
  content = content.replace(/bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden/g, 'bg-white border border-slate-200 rounded-sm shadow-sm relative overflow-hidden p-0');
  content = content.replace(/bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4/g, 'bg-white border border-slate-200 rounded-sm shadow-sm space-y-4 p-0');
  content = content.replace(/bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6/g, 'bg-white border border-slate-200 rounded-sm shadow-sm space-y-6 p-0');
  
  // Specific replacements for the dark blue headers
  content = content.replace(/<h3 className="font-black text-slate-800 dark:text-white mb-4 uppercase text-xs tracking-widest flex items-center gap-2">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">');
  content = content.replace(/<h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2 mb-6">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">');
  content = content.replace(/<h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-3">');
  content = content.replace(/<h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">');
  content = content.replace(/<h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-6">');
  content = content.replace(/<h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">/g, '<h3 className="bg-[#1e3a5f] text-white p-2 font-bold uppercase text-xs mb-4">');

  // Specific buttons adjustments
  content = content.replace(/bg-slate-50 dark:bg-slate-900 min-h-screen pb-32/g, 'bg-[#f0f4f8] dark:bg-slate-900 min-h-screen pb-32');
  
  // Strip Lucide icons from inside these specific headers by finding the components
  content = content.replace(/<AlertTriangle size=\{16\} className="text-orange-500" \/>/g, '');
  content = content.replace(/<CheckCircle size=\{16\} className="text-emerald-500" \/>/g, '');
  content = content.replace(/<Calendar size=\{16\} className="text-blue-500" \/>/g, '');
  content = content.replace(/<FileText size=\{16\} className="text-indigo-500" \/>/g, '');
  content = content.replace(/<History size=\{16\} className="text-blue-500" \/>/g, '');
  content = content.replace(/<FileText size=\{14\} \/>/g, '');
  content = content.replace(/<CheckCircle size=\{14\} \/>/g, '');
  content = content.replace(/<MapPin size=\{14\} \/>/g, '');
  content = content.replace(/<RefreshCw size=\{14\} \/>/g, '');
  content = content.replace(/<Calendar size=\{14\} \/>/g, '');

  fs.writeFileSync(f, content);
});

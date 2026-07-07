import React from 'react';
import { Truck, Wrench, Package, Users, MapPin, List } from 'lucide-react';

export default function CategoryTabs({ categorias, categoriaAtiva, onChange }) {
    const allCategories = [
        { categoria: 'TODAS', label: 'Todas', icone: List, total: categorias.reduce((acc, cat) => acc + cat.total, 0) },
        ...categorias
    ];

    return (
        <div className="w-full overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <div className="flex gap-2 min-w-max px-1">
                {allCategories.map((cat) => {
                    const isActive = categoriaAtiva === cat.categoria;
                    const Icon = cat.icone;
                    return (
                        <button
                            key={cat.categoria}
                            onClick={() => onChange(cat.categoria)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                isActive 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-900/20' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                            <span className="uppercase tracking-wider">{cat.label}</span>
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                isActive 
                                    ? 'bg-blue-500/30 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                            }`}>
                                {cat.total}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

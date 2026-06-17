import React, { useState } from 'react';
import { Search, X, CheckCircle } from 'lucide-react';

const SearchableSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    icon: IconComponent,
    className
}) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const baseInputClasses = "w-full px-4 py-3.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-bold text-sm";
    const appliedInputClasses = className ? `${baseInputClasses} ${className}` : `${baseInputClasses} bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200`;

    return (
        <div className="relative">
            {label && <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase block mb-1.5">{label}</label>}
            <div className="relative group">
                {IconComponent && <IconComponent size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />}
                <div
                    onClick={() => setIsOpen(true)}
                    className={`${appliedInputClasses} ${IconComponent ? 'pl-12' : ''} cursor-pointer min-h-[52px] flex items-center justify-between pr-4`}
                >
                    <span className={value ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                        {value || placeholder}
                    </span>
                    <Search size={16} className="text-slate-300 shrink-0 ml-2" />
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl mx-auto flex flex-col max-h-[85vh] overflow-hidden shadow-2xl mt-10">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">{label || placeholder || 'Selecione'}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    autoFocus
                                    className={`${baseInputClasses} bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-12 w-full`}
                                    placeholder="Comece a digitar para filtrar..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-2 pb-20 flex-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group mb-1 ${value === opt ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <span className="flex-1">{opt}</span>
                                        {value === opt && <CheckCircle size={18} className="ml-2 shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center space-y-2 opacity-50">
                                    <Search size={32} className="mx-auto text-slate-300" />
                                    <p className="font-bold text-sm">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;

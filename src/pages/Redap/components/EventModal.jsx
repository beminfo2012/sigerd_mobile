import React, { useState } from 'react';
import { X, Shield, Calendar, Tag } from 'lucide-react';
import { getCobrades } from '../../../services/redapService';

const EventModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [cobrade, setCobrade] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const cobrades = getCobrades();

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !cobrade || !startDate) return;
        
        onSave({
            nome_evento: name,
            cobrade,
            data_inicio: new Date(startDate).toISOString(),
            status_evento: 'Aberto às Secretarias'
        });
        
        setName('');
        setCobrade('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <Shield size={24} />
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Abrir Novo Desastre</h2>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Início do Fluxo REDAP</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            Nome do Evento
                        </label>
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                placeholder="Ex: Enchentes de Março 2024"
                            />
                            <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                Classificação COBRADE
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={cobrade}
                                    onChange={(e) => setCobrade(e.target.value)}
                                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                                >
                                    <option value="">Selecione o tipo de desastre...</option>
                                    {cobrades.map(c => (
                                        <option key={c.code} value={`${c.code} - ${c.label}`}>
                                            [{c.code}] {c.label}
                                        </option>
                                    ))}
                                </select>
                                <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                Data de Início
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700"
                        >
                            Criar Pasta de Evento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;

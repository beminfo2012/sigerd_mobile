import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, Tag, Info } from 'lucide-react';
import { getCobrades } from '../../../services/redapService';

const EventModal = ({ isOpen, onClose, onSave, eventToEdit = null }) => {
    const [name, setName] = useState('');
    const [cobrade, setCobrade] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [limitDate, setLimitDate] = useState('');
    const [status, setStatus] = useState('RASCUNHO');
    const cobrades = getCobrades();

    useEffect(() => {
        if (eventToEdit) {
            setName(eventToEdit.nome_evento || '');
            // Se vier com o código acoplado (ex: "1.2.1.0.0 - Inundações") ou apenas o código
            setCobrade(eventToEdit.cobrade || '');
            setStartDate(eventToEdit.data_inicio ? new Date(eventToEdit.data_inicio).toISOString().split('T')[0] : '');
            setLimitDate(eventToEdit.data_limite ? new Date(eventToEdit.data_limite).toISOString().split('T')[0] : '');
            setStatus(eventToEdit.status_geral || 'RASCUNHO');
        } else {
            setName('');
            setCobrade('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setLimitDate('');
            setStatus('RASCUNHO');
        }
    }, [eventToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !cobrade || !startDate) return;
        
        onSave({
            nome_evento: name,
            cobrade,
            data_inicio: new Date(startDate).toISOString(),
            data_limite: limitDate ? new Date(limitDate + 'T23:59:59').toISOString() : null,
            status_geral: status
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <Shield size={24} />
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">
                                {eventToEdit ? 'Editar Informações do Desastre' : 'Abrir Novo Desastre'}
                            </h2>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                                {eventToEdit ? 'Gestão de Ciclo de Vida REDAP' : 'Início do Fluxo REDAP'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    {/* Nome do Evento */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Nome do Evento
                        </label>
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                placeholder="Ex: Enchentes de Março 2024"
                            />
                            <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-650" size={20} />
                        </div>
                    </div>

                    {/* Classificação COBRADE */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Classificação COBRADE
                        </label>
                        <div className="relative">
                            <select
                                required
                                value={cobrade}
                                onChange={(e) => setCobrade(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 appearance-none"
                            >
                                <option value="">Selecione o tipo de desastre...</option>
                                {cobrades.map(c => (
                                    <option key={c.code} value={`${c.code} - ${c.label}`}>
                                        [{c.code}] {c.label}
                                    </option>
                                ))}
                            </select>
                            <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-650 pointer-events-none" size={20} />
                        </div>
                    </div>

                    {/* Datas: Início e Limite */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                Data de Início
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-650 pointer-events-none" size={20} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                Data Limite (Opcional)
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={limitDate}
                                    onChange={(e) => setLimitDate(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-650 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Status do Evento (Disponível sempre ou na Edição) */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Status do Workflow
                        </label>
                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 appearance-none"
                            >
                                <option value="RASCUNHO">Aberto às Secretarias (Rascunho)</option>
                                <option value="FECHADO">Fechado para Lançamento (Consolidado/Finalizado)</option>
                            </select>
                            <Info className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-650 pointer-events-none" size={20} />
                        </div>
                        {status === 'FECHADO' && (
                            <p className="text-[10px] text-rose-500 font-bold ml-1 flex items-center gap-1 mt-1">
                                ⚠️ Atenção: Ao fechar o desastre, secretarias não poderão mais inserir ou editar dados.
                            </p>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 px-6 bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-slate-750"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3.5 px-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all hover:bg-blue-700"
                        >
                            {eventToEdit ? 'Salvar Alterações' : 'Criar Pasta de Evento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;

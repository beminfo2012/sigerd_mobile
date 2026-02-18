import React, { useState } from 'react';
import {
    X,
    MapPin,
    ShieldAlert,
    Users,
    Home,
    Send,
    CheckCircle,
    AlertTriangle,
    Clock,
    ExternalLink
} from 'lucide-react';
import { updateStateStatus } from '../services/api';

const OccurrenceDetail = ({ occurrence, onClose, onUpdate }) => {
    const [statusEstadual, setStatusEstadual] = useState(occurrence?.status || 'Em monitoramento');
    const [saving, setSaving] = useState(false);

    if (!occurrence) return null;

    const handleSaveStatus = async () => {
        setSaving(true);
        try {
            await updateStateStatus(occurrence.id, statusEstadual);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error saving status:', error);
        } finally {
            setSaving(false);
        }
    };

    const statusOptions = [
        'Em monitoramento',
        'Em análise',
        'Apoio aprovado',
        'Apoio negado',
        'Encerrado'
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white shadow-2xl scale-in-center">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Detalhes da Ocorrência</p>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{occurrence.municipio}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Main Indicators Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação COBRADE</p>
                            <p className="font-bold text-slate-700 text-sm italic">{occurrence.tipo}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gravidade Declarada</p>
                            <p className={`font-black text-sm uppercase tracking-tighter ${occurrence.gravidade.includes('Crítica') ? 'text-red-600' : 'text-orange-600'}`}>
                                {occurrence.gravidade}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Data do Evento</p>
                            <p className="font-bold text-slate-700 text-sm">{occurrence.data_evento}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Col: Municipal Data Summary */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={18} className="text-amber-500" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resumo de Danos</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Afetados</p>
                                        <p className="text-lg font-black text-indigo-900">2.408</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Home size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Desabrigados</p>
                                        <p className="text-lg font-black text-blue-900">32</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Situação Institucional</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">Plano de Contingência</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] ${occurrence.plano ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {occurrence.plano ? 'ACIONADO' : 'NÃO ACIONADO'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">Decreto de Emergência</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] ${occurrence.decreto ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {occurrence.decreto ? 'EMITIDO' : 'NÃO POSSUI'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">Solicitação de Apoio</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] ${occurrence.apoio ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {occurrence.apoio ? 'SIM (APOIO SOLICITADO)' : 'NÃO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                    <ExternalLink size={14} /> Ver Relatório Municipal Completo
                                </button>
                            </div>
                        </div>

                        {/* Right Col: State Management */}
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert size={18} className="text-blue-600" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Gestão Estadual</h3>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-blue-900/60 uppercase tracking-widest mb-3 ml-1">Status da Ocorrência no Estado</label>
                                <div className="space-y-2">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setStatusEstadual(opt)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${statusEstadual === opt ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-tight">{opt}</span>
                                            {statusEstadual === opt && <CheckCircle size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSaveStatus}
                                    disabled={saving || statusEstadual === occurrence.status}
                                    className="w-full py-4 bg-blue-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                                    Atualizar Status Estadual
                                </button>
                                <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                                    Última atualização: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OccurrenceDetail;

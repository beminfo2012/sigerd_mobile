import React, { useState, useEffect } from 'react';
import {
    X, MapPin, Users, AlertTriangle, FileText, ShieldAlert,
    TrendingUp, Clock, CheckCircle2, DollarSign, ChevronRight,
    Loader2, Send
} from 'lucide-react';
import { fetchStateControl, updateStateStatus } from '../services/api';

const OccurrenceDetail = ({ occurrence, onClose, onUpdate }) => {
    const [stateCtrl, setStateCtrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const o = occurrence;

    useEffect(() => {
        loadStateControl();
    }, [o.id]);

    const loadStateControl = async () => {
        try {
            const ctrl = await fetchStateControl(o.id);
            setStateCtrl(ctrl);
            if (ctrl) {
                setSelectedStatus(ctrl.status_estadual || '');
                setNotes(ctrl.notas || '');
            }
        } catch (err) {
            console.warn('State control not available (table may not exist yet)');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDecision = async () => {
        if (!selectedStatus) return;
        try {
            setSaving(true);
            await updateStateStatus(o.id, selectedStatus, notes);
            await loadStateControl();
            onUpdate?.();
        } catch (err) {
            console.error('Error saving state decision:', err);
            alert('Erro ao salvar. A tabela estado_controle pode não existir ainda. Consulte a seção de criação de tabelas.');
        } finally {
            setSaving(false);
        }
    };

    const statusOptions = [
        { value: 'Em monitoramento', label: 'Em Monitoramento', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        { value: 'Em análise', label: 'Em Análise', color: 'bg-blue-50 text-blue-700 border-blue-100' },
        { value: 'Apoio aprovado', label: 'Apoio Aprovado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        { value: 'Apoio negado', label: 'Apoio Negado', color: 'bg-red-50 text-red-700 border-red-100' },
        { value: 'Encerrado', label: 'Encerrado', color: 'bg-slate-50 text-slate-700 border-slate-100' },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{o.municipio}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {o.tipo} • {o.data_evento}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* KPI Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <Users size={16} className="mx-auto text-[#2a5299] mb-1" />
                            <p className="text-lg font-extrabold text-slate-800">{o.afetados?.toLocaleString('pt-BR') || 0}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Afetados</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <TrendingUp size={16} className="mx-auto text-red-500 mb-1" />
                            <p className="text-lg font-extrabold text-slate-800">{(o.desalojados || 0) + (o.desabrigados || 0)}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Desaloj. + Desabr.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <DollarSign size={16} className="mx-auto text-amber-500 mb-1" />
                            <p className="text-lg font-extrabold text-slate-800">R$ {(o.prejuizo_total || 0).toLocaleString('pt-BR')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Prejuízo Total</p>
                        </div>
                    </div>

                    {/* Detailed Human Damages */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Danos Humanos</h4>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                            {[
                                { label: 'Mortos', value: o.mortos, icon: '💀' },
                                { label: 'Feridos', value: o.feridos, icon: '🩹' },
                                { label: 'Enfermos', value: o.enfermos, icon: '🤒' },
                                { label: 'Desabrigados', value: o.desabrigados, icon: '🏚️' },
                                { label: 'Desalojados', value: o.desalojados, icon: '🚶' },
                                { label: 'Desaparecidos', value: o.desaparecidos, icon: '❓' },
                            ].map((d, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg">
                                    <span>{d.icon}</span>
                                    <div>
                                        <span className="font-bold text-slate-800">{d.value || 0}</span>
                                        <span className="text-slate-400 ml-1">{d.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Institutional Status */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Situação Institucional</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <FileText size={16} className="text-slate-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-700">Decreto Municipal</p>
                                    <p className="text-[10px] text-slate-400">{o.decreto ? `Nº ${o.decreto_numero} — ${o.decreto_data}` : 'Não emitido'}</p>
                                </div>
                                {o.decreto ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-slate-300" />}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <ShieldAlert size={16} className="text-slate-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-700">Plano de Contingência</p>
                                    <p className="text-[10px] text-slate-400">{o.plano ? 'Acionado' : 'Não acionado'}</p>
                                </div>
                                {o.plano ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-slate-300" />}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <MapPin size={16} className="text-slate-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-700">Apoio Estadual</p>
                                    <p className="text-[10px] text-slate-400">{o.apoio ? 'Solicitado pelo município' : 'Não solicitado'}</p>
                                </div>
                                {o.apoio && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">URGENTE</span>}
                            </div>
                        </div>
                    </div>

                    {/* STATE DECISION (core workflow) */}
                    <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5299] p-5 rounded-2xl text-white">
                        <h4 className="text-[10px] font-bold text-blue-200/70 uppercase tracking-widest mb-3">Análise Estadual</h4>

                        {stateCtrl && (
                            <div className="mb-4 p-3 bg-white/10 rounded-xl border border-white/10">
                                <p className="text-[10px] text-blue-200/70 mb-1">Status Atual</p>
                                <p className="text-sm font-bold">{stateCtrl.status_estadual}</p>
                                <p className="text-[9px] text-blue-200/50 mt-1">Por {stateCtrl.analista} • {new Date(stateCtrl.updated_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSelectedStatus(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all
                    ${selectedStatus === opt.value
                                            ? 'bg-white text-[#1e3c72] border-white shadow-lg scale-105'
                                            : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observações do analista estadual..."
                            className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white text-xs placeholder:text-blue-200/40 resize-none h-20 outline-none focus:border-white/30"
                        />

                        <button
                            onClick={handleSaveDecision}
                            disabled={saving || !selectedStatus}
                            className="w-full mt-3 py-3 bg-white text-[#1e3c72] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {saving ? 'Salvando...' : 'Registrar Decisão Estadual'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OccurrenceDetail;

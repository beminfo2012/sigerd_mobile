import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Info, AlertTriangle, CheckCircle2, TrendingUp, Users, Home, BarChart3, ShieldAlert } from 'lucide-react';
import { CurrencyInput } from '../../../components/RedapInputs';

const RedapIntensityModal = ({ isOpen, onClose, formData, onSave }) => {
    const [rcl, setRcl] = useState(formData.data.metadata_oficial.rcl_anual || 0);
    const [capacidade, setCapacidade] = useState(formData.data.metadata_oficial.capacidade_resposta || '');

    // 1. Calculate Human Impacts
    const humanImpacts = useMemo(() => {
        const d = formData.data.danos_humanos;
        return {
            mortos: d.mortos || 0,
            feridos: d.feridos || 0,
            enfermos: d.enfermos || 0,
            desabrigados: d.desabrigados || 0,
            desalojados: d.desalojados || 0,
            total: (d.mortos || 0) + (d.feridos || 0) + (d.enfermos || 0) + (d.desabrigados || 0) + (d.desalojados || 0)
        };
    }, [formData.data.danos_humanos]);

    // 2. Calculate Economic Impacts (Material + Public + Private)
    const economicImpacts = useMemo(() => {
        // Material Damages (6.2)
        const materialValue = Object.values(formData.data.danos_materiais).reduce((acc, curr) => acc + (curr.valor || 0), 0);

        // Public Losses (7.1)
        const publicValue = Object.values(formData.data.prejuizos_publicos).reduce((acc, curr) => acc + (curr || 0), 0);

        // Private Losses (7.2)
        const privateValue = Object.values(formData.data.prejuizos_privados).reduce((acc, curr) => acc + (curr || 0), 0);

        // Sectoral additions (if not already counted)
        let sectoralValue = 0;
        if (formData.data.setorial) {
            Object.values(formData.data.setorial).forEach(s => {
                sectoralValue += (s.inst_valor || 0);
                // Prejuizos start with 'prejuizo_'
                Object.entries(s).forEach(([k, v]) => {
                    if (k.startsWith('prejuizo_') && typeof v === 'number') sectoralValue += v;
                    if (k.startsWith('valor_') && typeof v === 'number') sectoralValue += v;
                    if (k.startsWith('custo_') && typeof v === 'number') sectoralValue += v;
                });
            });
        }

        return {
            material: materialValue,
            public: publicValue,
            private: privateValue,
            sectoral: sectoralValue,
            total: materialValue + publicValue + privateValue + sectoralValue
        };
    }, [formData.data.danos_materiais, formData.data.prejuizos_publicos, formData.data.prejuizos_privados, formData.data.setorial]);

    // 3. Logic based on Portaria 260/2022
    const intensitySugerida = useMemo(() => {
        if (humanImpacts.mortos > 0) return 'Nível III'; // Usually severe

        if (capacidade === 'coordenada') return 'Nível III';
        if (capacidade === 'complementada') return 'Nível II';
        if (capacidade === 'local') return 'Nível I';

        // Percentage heuristics (historical benchmarks, though qualitative)
        if (rcl > 0) {
            const ratio = (economicImpacts.total / rcl) * 100;
            if (ratio > 10) return 'Nível III';
            if (ratio > 5) return 'Nível II';
        }

        return 'Nível I';
    }, [humanImpacts, economicImpacts, rcl, capacidade]);

    const handleSave = () => {
        onSave({
            rcl_anual: rcl,
            intensidade: intensitySugerida,
            capacidade_resposta: capacidade
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight leading-none">Calculadora de Intensidade</h2>
                            <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Portaria MDR 260/2022</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Aggregated Data Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-3 text-blue-600">
                                <Users size={18} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Impacto Humano</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Óbitos:</span>
                                    <span className={humanImpacts.mortos > 0 ? "text-red-600" : ""}>{humanImpacts.mortos}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Afetados:</span>
                                    <span>{humanImpacts.total - humanImpacts.mortos}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-3 text-emerald-600">
                                <TrendingUp size={18} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Impacto Econômico</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Prejuízo Total:</span>
                                    <span className="text-slate-800">R$ {economicImpacts.total.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                    <span>Materiais + Públicos:</span>
                                    <span>R$ {(economicImpacts.material + economicImpacts.public).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RCL & Response Capacity Input */}
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 ml-1">Receita Corrente Líquida - RCL (Anual)</label>
                            <CurrencyInput
                                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                value={rcl}
                                onChange={setRcl}
                                placeholder="Informe a RCL de SMJ..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 ml-1">Capacidade de Resposta do Município</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { value: 'local', label: 'Local: Normalidade reestabelecida apenas com recursos próprios' },
                                    { value: 'complementada', label: 'Média: Exige aporte complementar do Estado ou União' },
                                    { value: 'coordenada', label: 'Alta: Exige ação coordenada federal e possivelmente internacional' }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setCapacidade(opt.value)}
                                        className={`p-3 text-left rounded-xl border text-xs transition-all ${capacidade === opt.value
                                            ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-lg shadow-blue-200 scale-[1.02]'
                                            : 'bg-white border-blue-100 text-slate-600 hover:border-blue-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Suggested Classification */}
                    <div className="p-6 bg-slate-900 rounded-3xl text-white">
                        <div className="flex items-center gap-2 mb-4 opacity-60">
                            <BarChart3 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enquadramento Sugerido</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className={`text-3xl font-black ${intensitySugerida === 'Nível III' ? 'text-red-400' : 'text-amber-400'}`}>
                                    {intensitySugerida}
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                    Declaração de {intensitySugerida === 'Nível III' ? 'ESTADO DE CALAMIDADE' : 'SITUAÇÃO DE EMERGÊNCIA'}
                                </p>
                            </div>
                            <div className="h-12 w-[1px] bg-white/20" />
                            <div className="flex-1">
                                {rcl > 0 && (
                                    <div className="text-[10px] font-bold text-slate-300">
                                        Impacto Econômico: <span className="text-white text-xs">{((economicImpacts.total / rcl) * 100).toFixed(2)}% da RCL</span>
                                    </div>
                                )}
                                <p className="text-[9px] text-slate-500 mt-2 italic leading-relaxed">
                                    * Baseado na suficiência de recursos do Sinpdec.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white active:scale-95 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        Salvar no Registro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedapIntensityModal;

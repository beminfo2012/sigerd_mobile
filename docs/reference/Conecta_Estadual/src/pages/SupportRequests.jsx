import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Search, RefreshCw, Eye,
    ArrowRight, AlertTriangle, ShieldCheck, Clock, Loader2
} from 'lucide-react';
import { fetchDashboardKPIs, subscribeToOccurrences } from '../services/api';
import OccurrenceDetail from '../components/OccurrenceDetail';

const SupportRequests = () => {
    const [loading, setLoading] = useState(true);
    const [occurrences, setOccurrences] = useState([]);
    const [controls, setControls] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOccurrence, setSelectedOccurrence] = useState(null);

    useEffect(() => {
        loadData();
        const unsubscribe = subscribeToOccurrences(() => loadData());
        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchDashboardKPIs();
            // Filter by visibility criteria (already calculated in transformS2idRecord as visivel_estado)
            setOccurrences(data.occurrences.filter(o => o.visivel_estado));
            setControls(data.controls);
        } catch (err) {
            console.error('[SupportRequests] Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = occurrences.filter(item =>
        (item.municipio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (id) => {
        const ctrl = controls[id];
        if (!ctrl) return 'bg-slate-100 text-slate-500 border-slate-200';

        const status = ctrl.status_estadual;
        if (status === 'Apoio aprovado') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (status === 'Apoio negado') return 'bg-red-50 text-red-700 border-red-100';
        if (status === 'Em análise') return 'bg-blue-50 text-blue-700 border-blue-100';
        if (status === 'Em monitoramento') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    };

    return (
        <div className="space-y-6 anim-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Solicitações de Apoio</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Filtrado por: Gravidade Alta/Crítica, Decretos ou Pedidos de Apoio
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 ring-blue-500/10 transition-all">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-transparent border-none outline-none text-xs w-36"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#2a5299] transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading && occurrences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 size={32} className="animate-spin text-[#2a5299]" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguardando dados críticos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl p-20 text-center border border-slate-100">
                            <ShieldCheck size={48} className="mx-auto text-emerald-100 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Tudo sob controle</h3>
                            <p className="text-sm text-slate-400">Nenhuma ocorrência crítica pendente de análise estadual no momento.</p>
                        </div>
                    ) : (
                        filtered.map((o) => (
                            <div
                                key={o.id}
                                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                onClick={() => setSelectedOccurrence(o)}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${o.gravidade === 'Crítica' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    o.gravidade === 'Alta' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {o.gravidade}
                                            </span>
                                            {o.tipo_registro === 's2id' && (
                                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase border border-slate-200">
                                                    Fluxo FIDE
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-[#2a5299] transition-colors">
                                                {o.municipio} — {o.tipo}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <div className="flex items-center gap-1"><Clock size={12} /> {o.data_evento}</div>
                                                {o.apoio && <div className="flex items-center gap-1 text-red-500"><ShieldAlert size={12} /> Apoio Solicitado</div>}
                                                {o.decreto && <div className="flex items-center gap-1 text-amber-600"><AlertTriangle size={12} /> Decreto Emitido</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-lg font-black text-slate-800Leading-tight">{o.afetados?.toLocaleString('pt-BR')}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Afetados</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100 hidden lg:block" />
                                        <div className="min-w-[140px]">
                                            <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl border text-center transition-all ${getStatusStyle(o.id)}`}>
                                                {controls[o.id]?.status_estadual || 'Pendente de Análise'}
                                            </div>
                                        </div>
                                        <ArrowRight className="text-slate-300 group-hover:text-[#2a5299] group-hover:translate-x-1 transition-all" size={20} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {selectedOccurrence && (
                <OccurrenceDetail
                    occurrence={selectedOccurrence}
                    onClose={() => setSelectedOccurrence(null)}
                    onUpdate={loadData}
                />
            )}
        </div>
    );
};

export default SupportRequests;

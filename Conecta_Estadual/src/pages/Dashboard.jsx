import React, { useState, useEffect } from 'react';
import {
    MapPin, ShieldAlert, AlertTriangle, FileText, TrendingUp,
    ChevronRight, Filter, AlertCircle, Clock, Menu, ArrowRight,
    RefreshCw, Loader2
} from 'lucide-react';
import StateMap from '../components/StateMap';
import { fetchDashboardKPIs, subscribeToOccurrences } from '../services/api';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState(null);
    const [error, setError] = useState(null);
    const [selectedMun, setSelectedMun] = useState(null);

    useEffect(() => {
        loadData();

        // Subscribe to real-time updates
        const unsubscribe = subscribeToOccurrences(() => {
            console.log('[Dashboard] Real-time update received, refreshing...');
            loadData();
        });

        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchDashboardKPIs();
            setKpis(data);

            // Auto-select the first occurrence for the detail card
            if (data.occurrences.length > 0 && !selectedMun) {
                setSelectedMun(data.occurrences[0]);
            }
            setError(null);
        } catch (err) {
            console.error('[Dashboard] Load error:', err);
            // Capture more specific error details
            const msg = err.message || (typeof err === 'string' ? err : 'Erro desconhecido');
            const details = err.hint || err.details || '';
            setError(`Erro de conexão: ${msg} ${details ? '(' + details + ')' : ''}`);
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loading && !kpis) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-[#2a5299]" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando dados municipais...</p>
                </div>
            </div>
        );
    }

    // Error state with fallback
    if (error && !kpis) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Conexão não estabelecida</h3>
                <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>
                <button onClick={loadData} className="px-6 py-3 bg-[#2a5299] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#1e3c72] transition-colors">
                    <RefreshCw size={14} /> Tentar Novamente
                </button>
            </div>
        );
    }

    const stats = [
        { label: 'Ocorrências Ativas', value: kpis?.activeOccurrences || 0, icon: '📋', gradient: true },
        { label: 'Planos Acionados', value: kpis?.withPlan || 0, icon: '🛡️' },
        { label: 'Pendentes Análise', value: kpis?.pending || 0, icon: '✏️' },
        { label: 'Decretos Emitidos', value: kpis?.withDecree || 0, icon: '⚠️' },
    ];

    const recentOccurrences = (kpis?.occurrences || []).slice(0, 6);

    return (
        <div className="space-y-6 anim-fade">
            {/* Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Painel Geral</h2>
                    <Menu size={16} className="text-slate-300" />
                </div>
                <div className="flex items-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin text-blue-400" />}
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {kpis?.activeOccurrences || 0} registros • {kpis?.totalAffected?.toLocaleString('pt-BR') || 0} afetados
                    </span>
                </div>
            </div>

            {/* MAP + DETAIL CARD */}
            <div className="map-section">
                <StateMap occurrences={recentOccurrences.filter(o => o._raw?.data?.localizacao)} />

                {selectedMun && (
                    <div className="map-detail-card anim-slide">
                        <h3 className="text-base font-bold text-slate-800 mb-0.5">{selectedMun.municipio}</h3>
                        <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-[9px] font-bold text-slate-400">{selectedMun.id}</span>
                        </div>

                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-orange-100 mb-4">
                            <MapPin size={10} /> {selectedMun.tipo || 'Ocorrência'}
                        </span>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <p className="text-xl font-extrabold text-slate-800">{selectedMun.afetados?.toLocaleString('pt-BR') || 0}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Afetados</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <TrendingUp size={12} className="text-red-500" />
                                    <p className="text-xl font-extrabold text-slate-800">{selectedMun.desalojados || 0}</p>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Desalojados</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px]">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-emerald-50 flex items-center justify-center"><TrendingUp size={8} className="text-emerald-600" /></span>
                                    {selectedMun.gravidade}
                                </span>
                                <span className="text-slate-500 flex items-center gap-1"><Clock size={9} /> {selectedMun.data_evento}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-amber-50 flex items-center justify-center"><AlertTriangle size={8} className="text-amber-500" /></span>
                                    {selectedMun.decreto ? 'Decreto Emitido' : 'Sem Decreto'}
                                </span>
                                <span className="text-slate-500 flex items-center gap-1">
                                    <FileText size={9} /> R$ {(selectedMun.prejuizo_total || 0).toLocaleString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        {selectedMun.apoio && (
                            <div className="mt-3 p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                                    <ShieldAlert size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-red-700 leading-tight">Apoio Estadual Solicitado</p>
                                    <p className="text-[8px] text-red-500 truncate">Necessita análise imediata</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden
            ${s.gradient
                            ? 'bg-gradient-to-br from-[#1e3c72] to-[#2a5299] border-blue-400/20'
                            : 'bg-white border-slate-100'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-base">{s.icon}</span>
                        </div>
                        <div className={`text-2xl font-extrabold ${s.gradient ? 'text-white' : 'text-slate-800'}`}>{s.value}</div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${s.gradient ? 'text-blue-200/70' : 'text-slate-400'}`}>{s.label}</p>
                        {s.gradient && <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl"></div>}
                    </div>
                ))}
            </div>

            {/* OCCURRENCES TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Ocorrências em Tempo Real</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={loadData} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="text-[10px] font-bold text-[#2a5299] flex items-center gap-1 hover:underline">
                            Ver Todos <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-50 overflow-x-auto">
                    {['Região', 'Tipo', 'Status'].map(f => (
                        <button key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-semibold text-slate-500 whitespace-nowrap hover:bg-slate-100 transition-colors">
                            {f} <ChevronRight size={10} className="rotate-90 text-slate-300" />
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-500">
                        <Filter size={12} /> Filtros
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="pl-5">Município</th>
                            <th>COBRADE</th>
                            <th>Data</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">Gravidade</th>
                            <th className="text-right pr-5">Afetados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOccurrences.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                                    Nenhuma ocorrência registrada no sistema.
                                </td>
                            </tr>
                        ) : (
                            recentOccurrences.map((r, i) => (
                                <tr key={i} className="cursor-pointer" onClick={() => setSelectedMun(r)}>
                                    <td className="pl-5">
                                        <p className="font-semibold text-slate-800 text-sm leading-tight">{r.municipio}</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">{r.cobrade || r.tipo}</p>
                                    </td>
                                    <td>
                                        <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                                            {r.tipo}
                                        </span>
                                    </td>
                                    <td className="text-[11px] text-slate-500 font-medium">{r.data_evento}</td>
                                    <td className="text-center">
                                        <span className={`pill ${r.status === 'draft' ? 'pill-warning' :
                                            r.status === 'synced' ? 'pill-success' :
                                                r.status === 'submitted' ? 'pill-info' : 'pill-info'
                                            }`}>
                                            {r.status === 'draft' ? 'RASCUNHO' :
                                                r.status === 'synced' ? 'SINCRONIZADO' :
                                                    r.status === 'submitted' ? 'ENVIADO' : r.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="text-[11px] font-bold text-slate-700">{r.gravidade}</span>
                                        {(r.gravidade === 'Crítica' || r.gravidade === 'Alta') && (
                                            <AlertCircle size={10} className="inline ml-1 text-red-500" />
                                        )}
                                    </td>
                                    <td className="text-right pr-5 font-bold text-slate-800 text-sm">
                                        {r.afetados?.toLocaleString('pt-BR') || '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {recentOccurrences.length} de {kpis?.activeOccurrences || 0} ocorrências
                    </span>
                    <button onClick={loadData} className="text-[10px] font-bold text-[#2a5299] hover:underline flex items-center gap-1">
                        <RefreshCw size={10} /> Atualizar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    ChevronRight,
    AlertCircle,
    ShieldCheck,
    FileBadge,
    Eye
} from 'lucide-react';
import { fetchMunicipalOccurrences } from '../services/api';
import OccurrenceDetail from '../components/OccurrenceDetail';

const Occurrences = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGravity, setFilterGravity] = useState('all');
    const [selectedOccurrence, setSelectedOccurrence] = useState(null);

    useEffect(() => {
        loadData();
        // Auto-refresh every 60 seconds
        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const occurrences = await fetchMunicipalOccurrences();
            setData(occurrences);
        } catch (error) {
            console.error('Failed to load occurrences:', error);
            // Mocking some data for visual if API fails in dev
            if (data.length === 0) {
                setData([
                    { id: 1, municipio: 'Santa Maria de Jetibá', tipo: 'VULNERABILIDADE GEOLÓGICA', gravidade: 'Crítica', data_evento: '24/04/2024', plano: true, apoio: true, decreto: true, status: 'Em Análise' },
                    { id: 2, municipio: 'Mimoso do Sul', tipo: 'INUNDAÇÃO', gravidade: 'Alta', data_evento: '20/03/2024', plano: true, apoio: false, decreto: true, status: 'Monitorando' },
                    { id: 3, municipio: 'Afonso Cláudio', tipo: 'DESLIZAMENTO', gravidade: 'Média', data_evento: '15/02/2024', plano: false, apoio: true, decreto: false, status: 'Finalizado' },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch = item.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tipo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGravity = filterGravity === 'all' || item.gravidade.includes(filterGravity);
        return matchesSearch && matchesGravity;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8">Ocorrências em Tempo Real</h2>
                    <p className="text-sm text-slate-500 font-medium mt-2">Gestão integrada das demandas municipais</p>
                </div>
                <button
                    onClick={loadData}
                    className="bg-white text-slate-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar Agora
                </button>
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Filtrar por município ou desastre..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        className="bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase px-3 py-2 outline-none"
                        value={filterGravity}
                        onChange={(e) => setFilterGravity(e.target.value)}
                    >
                        <option value="all">Todas Gravidades</option>
                        <option value="Crítica">Crítica</option>
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="py-4 pl-6">Município</th>
                                <th className="py-4">Tipo de Desastre</th>
                                <th className="py-4 text-center">Gravidade</th>
                                <th className="py-4 text-center">Protocolos</th>
                                <th className="py-4">Status Estadual</th>
                                <th className="py-4 pr-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredData.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group">
                                    <td className="py-5 pl-6">
                                        <p className="font-black text-slate-800 leading-none">{row.municipio}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{row.data_evento}</p>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-xs font-bold text-slate-600 italic bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                            {row.tipo}
                                        </span>
                                    </td>
                                    <td className="py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm
                      ${row.gravidade.includes('Crítica') ? 'bg-red-100 text-red-600 border border-red-200' :
                                                row.gravidade.includes('Alta') ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                                                    'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                                            {row.gravidade}
                                        </span>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            {row.plano && <ShieldCheck size={16} className="text-emerald-500" title="Plano Acionado" />}
                                            {row.decreto && <FileBadge size={16} className="text-indigo-500" title="Decreto Emitido" />}
                                            {row.apoio && <AlertCircle size={16} className="text-red-500" title="Apoio Solicitado" />}
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {row.status || 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="py-5 pr-6 text-right">
                                        <button
                                            onClick={() => setSelectedOccurrence(row)}
                                            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 opacity-0 group-hover:opacity-100 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                        >
                                            <Eye size={16} /> <span className="text-[9px] font-black uppercase">Detalhes</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Search size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhuma ocorrência encontrada para esses filtros.</p>
                    </div>
                )}
            </div>

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

export default Occurrences;

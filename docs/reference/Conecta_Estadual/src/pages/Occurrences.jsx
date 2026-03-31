import React, { useState, useEffect } from 'react';
import {
    Search, RefreshCw, ChevronRight, AlertCircle,
    Eye, Clock, Loader2
} from 'lucide-react';
import { fetchAllOccurrences } from '../services/api';
import OccurrenceDetail from '../components/OccurrenceDetail';

const Occurrences = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOccurrence, setSelectedOccurrence] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchAllOccurrences();
            setOccurrences(data || []);
        } catch (error) {
            console.error('[Occurrences] Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = data
        .filter(item => item.tipo_registro === 'ocorrencia')
        .filter(item =>
            (item.municipio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="space-y-6 anim-fade">
            <div className="flex items-end justify-between">
                <h2 className="text-xl font-extrabold text-slate-800">Ocorrências em Tempo Real</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                        <Search size={14} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filtrar município..."
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

            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5299] p-4 rounded-2xl text-white">
                    <p className="text-[10px] font-bold text-blue-200/70 uppercase mb-1">Total Registros</p>
                    <p className="text-lg font-extrabold">{data.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Afetados</p>
                    <p className="text-lg font-extrabold text-slate-800">
                        {data.reduce((sum, o) => sum + (o.afetados || 0), 0).toLocaleString('pt-BR')}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pedidos de Apoio</p>
                    <p className="text-lg font-extrabold text-slate-800">
                        {data.filter(o => o.apoio).length}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading && data.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className="animate-spin text-[#2a5299]" />
                        <span className="ml-3 text-sm text-slate-400">Carregando dados do Supabase...</span>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="pl-5">Município</th>
                                    <th>Tipo (COBRADE)</th>
                                    <th>Data</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Gravidade</th>
                                    <th className="text-right pr-5">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                                            {data.length === 0 ? 'Nenhum registro S2ID encontrado no banco.' : 'Nenhum resultado para este filtro.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row, i) => (
                                        <tr key={i}>
                                            <td className="pl-5">
                                                <p className="font-semibold text-slate-800 text-sm">{row.municipio}</p>
                                                <p className="text-[9px] text-slate-400">{row.id}</p>
                                            </td>
                                            <td>
                                                <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                                                    {row.tipo}
                                                </span>
                                            </td>
                                            <td className="text-[11px] text-slate-500 font-medium">
                                                <div className="flex items-center gap-1"><Clock size={11} className="text-slate-300" /> {row.data_evento}</div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`pill ${row.status === 'draft' ? 'pill-warning' :
                                                    row.status === 'synced' ? 'pill-success' : 'pill-info'
                                                    }`}>
                                                    {row.status === 'draft' ? 'RASCUNHO' : row.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-center text-[11px] font-bold text-slate-700">
                                                {row.gravidade}
                                                {row.gravidade === 'Crítica' && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 animate-pulse"></span>}
                                            </td>
                                            <td className="text-right pr-5">
                                                <button
                                                    onClick={() => setSelectedOccurrence(row)}
                                                    className="px-3 py-1.5 bg-[#2a5299] text-white rounded-lg text-[9px] font-bold flex items-center gap-1 ml-auto hover:bg-[#1e3c72] transition-colors"
                                                >
                                                    <Eye size={12} /> Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400">{filtered.length} ocorrências</span>
                            <button onClick={loadData} className="text-[10px] font-bold text-[#2a5299] hover:underline flex items-center gap-1">
                                <RefreshCw size={10} /> Atualizar do Supabase
                            </button>
                        </div>
                    </>
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

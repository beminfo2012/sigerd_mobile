import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Flame, Plus, Search, Map, Upload, FileText, ChevronRight, MapPin, Calendar, Activity } from 'lucide-react';
import { toast } from '../../components/ToastNotification';

const FiregisList = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('firegis')
                .select('*')
                .order('data_ocorrencia', { ascending: false });

            if (error) throw error;
            setIncidents(data || []);
        } catch (error) {
            console.error('Erro ao buscar ocorrências de incêndio:', error);
            // If table doesn't exist yet, it'll fail gracefully
            if (error.code === '42P01') {
                toast.error('Erro de Banco de Dados', 'A tabela firegis não existe no Supabase. Crie-a primeiro.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredIncidents = incidents.filter(i => 
        i.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.tipo_incendio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.codigo_ocorrencia?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        if (status === 'EM ANDAMENTO') return 'text-orange-600 bg-orange-100 border-orange-200';
        if (status === 'CONTROLADO') return 'text-blue-600 bg-blue-100 border-blue-200';
        if (status === 'EXTINTO') return 'text-emerald-600 bg-emerald-100 border-emerald-200';
        return 'text-slate-600 bg-slate-100 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-6 md:p-8 rounded-b-[2.5rem] shadow-lg sticky top-0 z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                <Flame size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">FIREGIS</h1>
                                <p className="text-white/80 text-sm font-medium">Gestão Integrada de Incêndios</p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => navigate('/firegis/dashboard')} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                <Map size={18} /> Dashboard
                            </button>
                            <button onClick={() => navigate('/firegis/importar')} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                <Upload size={18} /> Importar
                            </button>
                            <button onClick={() => navigate('/firegis/novo')} className="flex-1 md:flex-none bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all">
                                <Plus size={18} /> Novo Registro
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                {/* Search & Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por código, bairro ou tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-800 dark:text-white transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center p-12">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando Registros...</p>
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Flame className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Nenhum registro encontrado</h3>
                        <p className="text-sm text-slate-500 mt-1">Utilize o botão "Novo Registro" para adicionar uma ocorrência.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredIncidents.map(inc => (
                            <div key={inc.id} onClick={() => navigate(`/firegis/editar/${inc.id}`)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 cursor-pointer transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {inc.codigo_ocorrencia || 'S/ COD'}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${getStatusColor(inc.status)}`}>
                                        {inc.status || 'REGISTRADO'}
                                    </span>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div>
                                        <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                            {inc.tipo_incendio}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
                                            <MapPin size={14} className="shrink-0 text-orange-500" />
                                            <span className="truncate">{inc.bairro || 'Local não informado'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                {inc.data_ocorrencia ? new Date(inc.data_ocorrencia).toLocaleDateString('pt-BR') : '---'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Activity size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                Área: {inc.area_queimada_ha ? `${inc.area_queimada_ha} ha` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiregisList;

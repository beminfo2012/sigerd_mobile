import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, FileText, CheckCircle, Activity, Search, 
    Plus, Filter, Clock, MapPin, Map as MapIcon, BarChart3, List
} from 'lucide-react';
import { UserContext } from '../../App';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LimiteSMJLayer from '../../components/LimiteSMJLayer';

const NoprerDashboard = () => {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data based on the plan
    const [noprers, setNoprers] = useState([]);

    useEffect(() => {
        // Simulating data load
        const mockData = [
            {
                id: 1,
                numero_noprer: 'NOPRER-2026.000147',
                vistoria_id: 'VIST-2026.000312',
                data_emissao: '2026-06-18',
                risco: 'R2',
                tipo_risco: 'Geológico',
                descricao: 'Instabilidade de talude / movimento de massa',
                prazo_dias: 30,
                data_limite: '2026-07-18',
                status: 'EM ADEQUAÇÃO',
                endereco: 'Rodovia ES-080, km 22, Comunidade do Garrafão',
                lat: -20.040,
                lng: -40.700,
                criado_por: 'Bruno Pagel'
            },
            {
                id: 2,
                numero_noprer: 'NOPRER-2026.000148',
                vistoria_id: 'VIST-2026.000315',
                data_emissao: '2026-06-19',
                risco: 'R3',
                tipo_risco: 'Estrutural',
                descricao: 'Risco de colapso de telhado',
                prazo_dias: 15,
                data_limite: '2026-06-21', // Vencendo em 3 dias
                status: 'PRAZO VENCENDO',
                endereco: 'Rua Principal, Centro',
                lat: -20.035,
                lng: -40.710,
                criado_por: 'Agente Silva'
            }
        ];
        
        // In real usage, fetch from DB
        const stored = localStorage.getItem('@sigerd:noprers');
        if (stored) {
            setNoprers(JSON.parse(stored));
        } else {
            setNoprers(mockData);
            localStorage.setItem('@sigerd:noprers', JSON.stringify(mockData));
        }
    }, []);

    // KPIs Calculation
    const kpis = useMemo(() => {
        const total = noprers.length;
        const pendentes = noprers.filter(n => ['EMITIDA', 'NOTIFICADO', 'EM ADEQUAÇÃO', 'PRAZO VENCENDO'].includes(n.status)).length;
        const encerradas = noprers.filter(n => n.status === 'ENCERRADA').length;
        const convertidas = noprers.filter(n => n.status === 'CONVERTIDA EM INTERDIÇÃO').length;
        return { total, pendentes, encerradas, convertidas };
    }, [noprers]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'EMITIDA': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'NOTIFICADO': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'EM ADEQUAÇÃO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'PRAZO VENCENDO': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'VENCIDA': return 'bg-red-100 text-red-800 border-red-200';
            case 'REVISTORIADA': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ENCERRADA': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'CONVERTIDA EM INTERDIÇÃO': return 'bg-red-900 text-white border-red-800';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="text-blue-500" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Prevenção e Mitigação</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel NOPRER</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Notificação Preliminar de Risco - Gestão, Monitoramento e Revistorias.
                    </p>
                </div>
                
                {/* As NOPRERs são emitidas via Vistoria, este botão é atalho para listar vistorias */}
                <button 
                    onClick={() => navigate('/vistorias')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} />
                    Emitir a partir de Vistoria
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Emitidas', value: kpis.total, icon: <FileText size={20}/>, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Pendentes / Adequação', value: kpis.pendentes, icon: <Activity size={20}/>, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Encerradas', value: kpis.encerradas, icon: <CheckCircle size={20}/>, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Convertidas p/ Interdição', value: kpis.convertidas, icon: <AlertTriangle size={20}/>, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map((k, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${k.bg} ${k.color}`}>
                            {k.icon}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</div>
                            <div className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{k.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar por número, vistoria, endereço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <List size={16} /> Lista
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <MapIcon size={16} /> Mapa
                    </button>
                </div>
            </div>

            {/* Dynamic Content: List or Map */}
            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Documento</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Origem</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Risco</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Prazo (Limite)</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((noprer) => (
                                    <tr key={noprer.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{noprer.numero_noprer}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{new Date(noprer.data_emissao).toLocaleDateString('pt-BR')}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 inline-block px-2 py-1 rounded-md">
                                                {noprer.vistoria_id}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${noprer.risco === 'R2' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {noprer.risco}
                                                </span>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">{noprer.tipo_risco}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Clock size={14} className="text-slate-400" />
                                                <span className="font-medium">{new Date(noprer.data_limite).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(noprer.status)}`}>
                                                {noprer.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/noprer/detalhes/${noprer.id}`)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-[600px] overflow-hidden relative">
                    <MapContainer 
                        center={[-20.038, -40.733]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%', borderRadius: '20px' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LimiteSMJLayer />
                        {noprers.map(n => (
                            n.lat && n.lng && (
                                <Marker key={n.id} position={[n.lat, n.lng]}>
                                    <Popup>
                                        <div className="p-1 min-w-[200px]">
                                            <div className="font-bold text-sm mb-1">{n.numero_noprer}</div>
                                            <div className="text-xs text-slate-600 mb-2">{n.endereco}</div>
                                            <div className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${getStatusStyle(n.status)}`}>
                                                {n.status}
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/noprer/detalhes/${n.id}`)}
                                                className="mt-3 w-full text-center text-xs bg-blue-50 text-blue-600 py-1.5 rounded font-bold"
                                            >
                                                Ver Completo
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                </div>
            )}
        </div>
    );
};

export default NoprerDashboard;

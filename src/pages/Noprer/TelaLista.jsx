import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, AlertTriangle, CheckCircle, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { useNoprer } from './hooks/useNoprer';
import StatusBadge from './components/StatusBadge';
import GrauBadge from './components/GrauBadge';
import PrazoBar from './components/PrazoBar';
import DiasBadge from './components/DiasBadge';

const FILTROS = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'RASCUNHO', label: 'Rascunhos' },
    { id: 'EMITIDA', label: 'Emitidas' },
    { id: 'EM_PRAZO', label: 'Prazo Crítico' },
    { id: 'VENCIDA', label: 'Vencidas' },
    { id: 'REGULARIZADA', label: 'Regularizadas' },
    { id: 'ESCALADA', label: 'Escaladas' }
];

const TelaLista = () => {
    const navigate = useNavigate();
    const { fetchNoprers, loading } = useNoprer();
    const [dados, setDados] = useState([]);
    const [busca, setBusca] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('TODOS');

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        const result = await fetchNoprers();
        setDados(result || []);
    };

    // Estatísticas
    const stats = {
        total: dados.length,
        andamento: dados.filter(d => ['EMITIDA', 'EM_PRAZO'].includes(d.statusCalculado)).length,
        vencidas: dados.filter(d => d.statusCalculado === 'VENCIDA').length,
        regularizadas: dados.filter(d => d.statusCalculado === 'REGULARIZADA').length,
        escaladas: dados.filter(d => d.statusCalculado === 'ESCALADA').length,
    };

    // Filtragem para a tabela
    const dadosFiltrados = dados.filter(item => {
        // 1. Aplica o filtro de abas
        if (filtroAtivo !== 'TODOS' && item.statusCalculado !== filtroAtivo) return false;
        
        // 2. Aplica a busca por texto
        if (busca) {
            const termo = busca.toLowerCase();
            const num = (item.numero || '').toLowerCase();
            const notificado = (item.nome_notificado || '').toLowerCase();
            const endereco = (item.endereco || '').toLowerCase();
            return num.includes(termo) || notificado.includes(termo) || endereco.includes(termo);
        }
        
        return true;
    });

    return (
        <div className="bg-[#F1F5F9] min-h-screen p-4 md:p-6 pb-24 font-[Inter,sans-serif]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-[#1F3B5C] tracking-tight">NOPRER</h1>
                    <p className="text-sm text-[#64748B]">Notificações Preliminares de Risco</p>
                </div>
                <button 
                    onClick={() => navigate('/noprer/novo')}
                    className="bg-[#1F3B5C] hover:bg-[#2E5C8A] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors text-sm"
                >
                    <Plus size={18} />
                    Nova NOPRER
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard icon={<FileText size={18} />} label="Total" value={stats.total} cor="blue" />
                <StatCard icon={<Clock size={18} />} label="Em Andamento" value={stats.andamento} cor="indigo" />
                <StatCard icon={<AlertTriangle size={18} />} label="Vencidas" value={stats.vencidas} cor="red" />
                <StatCard icon={<CheckCircle size={18} />} label="Regularizadas" value={stats.regularizadas} cor="emerald" />
                <StatCard icon={<ShieldAlert size={18} />} label="Escaladas" value={stats.escaladas} cor="purple" />
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-t-xl border border-[#E2E8F0] border-b-0">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Abas */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-1">
                        {FILTROS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFiltroAtivo(f.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                                    filtroAtivo === f.id 
                                    ? 'bg-[#EBF1F8] text-[#1F3B5C]' 
                                    : 'text-[#64748B] hover:bg-slate-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Busca */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar NOPRER..." 
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#2E5C8A] focus:ring-1 focus:ring-[#2E5C8A]"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white border border-[#E2E8F0] rounded-b-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nº NOPRER</th>
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Endereço / Notificado</th>
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-center">Risco</th>
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Emissão</th>
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-40">Prazo / Progresso</th>
                                <th className="p-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-[#64748B] text-sm">Carregando dados...</td>
                                </tr>
                            ) : dadosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-[#64748B] text-sm">Nenhuma notificação encontrada.</td>
                                </tr>
                            ) : (
                                dadosFiltrados.map((noprer) => (
                                    <tr 
                                        key={noprer.id} 
                                        onClick={() => noprer.isDraft ? navigate(`/noprer/novo?draftId=${noprer.id}`) : navigate(`/noprer/detalhes/${noprer.id}`)}
                                        className={`border-b border-[#E2E8F0] hover:bg-[#FAFBFD] cursor-pointer transition-colors ${noprer.statusCalculado === 'VENCIDA' ? 'bg-[#FEF2F2]/30 hover:bg-[#FEF2F2]/50' : ''} ${noprer.isDraft ? 'bg-amber-50/30' : ''}`}
                                    >
                                        <td className="p-3 font-mono text-xs font-bold text-[#1F3B5C]">{noprer.numero}</td>
                                        <td className="p-3">
                                            <div className="text-xs font-bold text-slate-800 line-clamp-1">{noprer.endereco}</div>
                                            <div className="text-[10px] text-[#64748B] truncate max-w-[200px]">{noprer.nome_notificado}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <GrauBadge grau={noprer.grau_risco} />
                                        </td>
                                        <td className="p-3 text-xs text-slate-600">
                                            {new Date(noprer.data_emissao).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-slate-500 font-medium">Até {new Date(noprer.data_limite).toLocaleDateString('pt-BR')}</span>
                                                <DiasBadge diasRestantes={noprer.diasRestantes} isVencida={noprer.isVencida} status={noprer.status} />
                                            </div>
                                            <PrazoBar progresso={noprer.progresso} statusCalculado={noprer.statusCalculado} />
                                        </td>
                                        <td className="p-3">
                                            <StatusBadge status={noprer.statusCalculado} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <ChevronRight size={16} className="text-slate-400 inline-block" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, cor }) => {
    const cores = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    const estilos = cores[cor] || cores.blue;

    return (
        <div className={`p-3 rounded-xl border ${estilos} flex flex-col justify-between`}>
            <div className="flex items-center gap-1.5 opacity-80 mb-2">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
};

export default TelaLista;

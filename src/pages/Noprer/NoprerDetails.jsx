import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Printer, History, AlertOctagon, CheckCircle, 
    Calendar, MapPin, User, FileText, ArrowRight, ShieldAlert 
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const NoprerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [noprer, setNoprer] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);

    useEffect(() => {
        // Mock fetch
        const stored = localStorage.getItem('@sigerd:noprers');
        if (stored) {
            const parsed = JSON.parse(stored);
            const found = parsed.find(n => n.id === id);
            if (found) setNoprer(found);
        }
    }, [id]);

    if (!noprer) {
        return <div className="p-8 text-center text-slate-500 font-bold uppercase">Carregando detalhes...</div>;
    }

    const handlePrint = () => {
        window.open(`/noprer/imprimir/${noprer.id}`, '_blank');
    };

    const handleConvertToInterdicao = () => {
        // Update status to CONVERTIDA EM INTERDIÇÃO
        const stored = JSON.parse(localStorage.getItem('@sigerd:noprers') || '[]');
        const updated = stored.map(n => n.id === noprer.id ? { ...n, status: 'CONVERTIDA EM INTERDIÇÃO' } : n);
        localStorage.setItem('@sigerd:noprers', JSON.stringify(updated));
        
        // Pass the data to the Interdicao creation route
        // This is a mockup of the navigation. The Interdicao module should receive these parameters
        sessionStorage.setItem('interdicao_import_data', JSON.stringify({
            endereco: noprer.endereco,
            proprietario: noprer.solicitante,
            coordenadas: noprer.coordenadas,
            origem: noprer.origem_id,
            noprer: noprer.numero_noprer
        }));
        
        navigate('/interdicao'); 
    };

    const getStatusColor = (status) => {
        if (status === 'EMITIDA' || status === 'NOTIFICADO') return 'text-blue-500 bg-blue-50 border-blue-200';
        if (status === 'EM ADEQUAÇÃO') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
        if (status === 'PRAZO VENCENDO') return 'text-orange-500 bg-orange-50 border-orange-200';
        if (status === 'VENCIDA') return 'text-red-500 bg-red-50 border-red-200';
        if (status === 'CONVERTIDA EM INTERDIÇÃO') return 'text-white bg-red-800 border-red-900';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    // Mock Timeline History based on Plan
    const historyTimeline = [
        { date: '17/06/2026', type: 'vistoria', label: 'Vistoria Original', doc: noprer.origem_id },
        { date: new Date(noprer.data_emissao).toLocaleDateString('pt-BR'), type: 'noprer', label: 'Emissão NOPRER', doc: noprer.numero_noprer },
        { date: new Date(noprer.data_limite).toLocaleDateString('pt-BR'), type: 'prazo', label: 'Fim do Prazo', doc: '30 dias' },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/noprer')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-blue-600" /> 
                                Detalhes NOPRER
                            </h1>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                {noprer.numero_noprer}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
                        >
                            <Printer size={18} />
                            Relatório
                        </button>
                        {noprer.status !== 'CONVERTIDA EM INTERDIÇÃO' && (
                            <button 
                                onClick={() => setShowConvertModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                            >
                                <AlertOctagon size={18} />
                                Converter p/ Interdição
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Status Badge */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${getStatusColor(noprer.status)}`}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Status Atual</p>
                            <h2 className="text-2xl font-black">{noprer.status}</h2>
                        </div>
                        <CheckCircle size={32} className="opacity-50" />
                    </div>

                    {/* Resumo */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                            Identificação e Localização
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    {noprer.solicitante}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                    {noprer.endereco}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes Técnicos */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                            Avaliação Técnica
                        </h3>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risco e Tipo</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded mr-2">{noprer.risco}</span>
                                {noprer.tipo_risco}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                {noprer.descricao}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medidas Mitigatórias Exigidas</p>
                            <ul className="space-y-2 mt-2">
                                {noprer.medidas_mitigatorias?.map((medida, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        {medida}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar Timeline */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
                            <History size={16} className="text-blue-500" />
                            Histórico do Imóvel
                        </h3>
                        
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-8">
                            {historyTimeline.map((item, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 ${
                                        item.type === 'noprer' ? 'bg-blue-500' : 
                                        item.type === 'prazo' ? 'bg-orange-500' : 'bg-slate-400'
                                    }`}></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{item.date}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{item.label}</p>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.doc}</p>
                                </div>
                            ))}
                            
                            {noprer.status === 'CONVERTIDA EM INTERDIÇÃO' && (
                                <div className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 bg-red-600"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hoje</p>
                                    <p className="text-sm font-black text-red-600">Auto de Interdição</p>
                                    <p className="text-xs font-medium text-slate-500">Imóvel interditado definitivamente.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <ConfirmModal 
                isOpen={showConvertModal}
                onClose={() => setShowConvertModal(false)}
                onConfirm={handleConvertToInterdicao}
                title="Converter para Interdição"
                message="Esta ação migrará todo o histórico da NOPRER (fotos, endereço, coordenadas) para a geração de um Auto de Interdição oficial. Deseja prosseguir?"
                confirmText="Sim, Converter"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </div>
    );
};

export default NoprerDetails;

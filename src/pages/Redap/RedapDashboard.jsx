import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, FileText, Trash2, Edit3,
    ArrowLeft, Search, AlertCircle,
    Download, Clock, CheckCircle,
    ChevronRight, Globe, Shield, FileStack, RefreshCw,
    Calendar
} from 'lucide-react';
import RedapDocsModal from './components/RedapDocsModal';
import EventModal from './components/EventModal';
import * as redapService from '../../services/redapService';
import { syncPendingData } from '../../services/db';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';
import { UserContext } from '../../App';

const RedapDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTabInternal] = useState('relatorios'); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await redapService.getActiveEvents();
            if (data) {
                setEvents(data);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            if (!silent) toast('Falha ao carregar desastres REDAP.', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCreateEvent = async (eventData) => {
        try {
            const newEvent = await redapService.createEvent(eventData);
            setEvents(prev => [newEvent, ...prev]);
            setShowEventModal(false);
            toast.success('Evento criado com sucesso!');
        } catch (error) {
            toast.error('Erro ao criar evento.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        try {
            await redapService.deleteEvent(eventToDelete.id);
            setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
            setShowDeleteModal(false);
            setEventToDelete(null);
            toast.success('Evento excluído com sucesso!');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Erro ao excluir evento.');
        }
    };

    const handleManualSync = async () => {
        if (syncing) return;
        setSyncing(true);
        toast('Sincronizando dados...', 'info');
        try {
            const result = await syncPendingData();
            if (result.success) {
                toast.success('Sincronizado!');
                await loadEvents(true);
            }
        } catch (error) {
            toast.error('Falha na sincronização.');
        } finally {
            setSyncing(false);
        }
    };

    const filteredEvents = events.filter(e =>
        e.nome_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cobrade?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isDC = ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role);

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/menu')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-600 dark:text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-2">
                            REDAP <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                        </h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-tight">Gestão de Desastres</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className={`p-2.5 rounded-xl transition-all ${syncing ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95'}`}
                        title="Sincronizar"
                    >
                        <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                    </button>
                    {isDC && (
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="bg-blue-600 dark:bg-blue-500 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Abrir Desastre</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome do evento ou COBRADE..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Event List */}
                <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                        <div 
                            key={event.id} 
                            onClick={() => navigate(`/redap/evento/${event.id}`)}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all active:scale-[0.98] group cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest">
                                            {event.cobrade || 'Pendente'}
                                        </span>
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${event.status_evento === 'Finalizado' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                            {event.status_evento}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-xl leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {event.nome_evento || 'Evento sem Nome'}
                                    </h3>
                                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                                        <p className="flex items-center gap-1.5 font-bold">
                                            <Calendar size={14} className="text-slate-400 dark:text-slate-600" />
                                            {new Date(event.data_inicio).toLocaleDateString()}
                                        </p>
                                        <p className="flex items-center gap-1.5 font-bold">
                                            <Clock size={14} className="text-slate-400 dark:text-slate-600" />
                                            Aberto {Math.floor((new Date() - new Date(event.data_inicio)) / (1000 * 60 * 60 * 24))} dias atrás
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400 dark:text-slate-500">
                                        <ChevronRight size={24} />
                                    </div>
                                    {isDC && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEventToDelete(event);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                            title="Excluir Evento"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <div className="bg-slate-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                <Shield size={40} />
                            </div>
                            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Nenhum evento ativo</p>
                        </div>
                    )}
                </div>
            </main>

            <EventModal 
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                onSave={handleCreateEvent}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Excluir Evento"
                message={`Tem certeza que deseja excluir "${eventToDelete?.nome_evento}"? Todos os lançamentos e informações vinculadas serão removidos permanentemente.`}
                onConfirm={handleDeleteEvent}
                onClose={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                }}
                confirmText="Excluir Agora"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default RedapDashboard;

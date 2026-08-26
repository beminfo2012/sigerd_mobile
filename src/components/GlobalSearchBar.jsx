import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, X, Clock, FileText, AlertTriangle, ShieldAlert, 
    CheckSquare, Bell, UserCheck, Mail, AlertOctagon, ChevronRight, WifiOff 
} from 'lucide-react';
import { 
    executeGlobalSearch, 
    getRecentAccessedRecords, 
    trackRecordAccess 
} from '../services/globalSearchService';
import HighlightedText from './HighlightedText';

const TYPE_CONFIG = {
    vistoria: { label: 'Vistoria', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: FileText },
    ocorrencia: { label: 'Ocorrência', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle },
    interdicao: { label: 'Interdição', color: 'bg-red-100 text-red-700 border-red-300', icon: ShieldAlert },
    noprer: { label: 'NOPRER', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckSquare },
    alerta_cemaden: { label: 'Alerta CEMADEN', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Bell },
    alerta_inmet: { label: 'Alerta INMET', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Bell },
    credenciamento: { label: 'Credenciamento', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: UserCheck },
    oficio: { label: 'Ofício', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: Mail },
    redap: { label: 'REDAP', color: 'bg-rose-100 text-rose-700 border-rose-300', icon: AlertOctagon }
};

const GlobalSearchBar = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [recentRecords, setRecentRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Atalho de teclado global Ctrl+K ou Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        const handleOnlineStatus = () => setIsOffline(!navigator.onLine);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('online', handleOnlineStatus);
            window.removeEventListener('offline', handleOnlineStatus);
        };
    }, []);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Carregar recentes ao focar
    const handleFocus = () => {
        setIsOpen(true);
        if (!query.trim()) {
            setRecentRecords(getRecentAccessedRecords());
        }
    };

    // Debounce de 300ms para busca de sugestões
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setIsLoading(false);
            setRecentRecords(getRecentAccessedRecords());
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            const res = await executeGlobalSearch({ query, limit: 5 });
            setSuggestions(res.results.slice(0, 5));
            setIsOffline(res.isOffline);
            setIsLoading(false);
            setSelectedIndex(-1);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Submeter busca ao dar Enter
    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelectRecord(suggestions[selectedIndex]);
            return;
        }

        if (query.trim()) {
            setIsOpen(false);
            navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleSelectRecord = (record) => {
        trackRecordAccess(record);
        setIsOpen(false);
        setQuery('');
        const targetUrl = record.link_route || '/';
        window.open(window.location.origin + targetUrl, '_blank');
    };

    // Navegação via teclado (Setas, Enter, ESC)
    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const renderTypeBadge = (type) => {
        const config = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText };
        const IconComponent = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${config.color}`}>
                <IconComponent className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    return (
        <div 
            ref={containerRef} 
            className="relative transition-all duration-200"
            style={{ flex: '0 1 36%', minWidth: '220px', maxWidth: '600px' }}
        >
            <form onSubmit={handleSubmit} className="relative flex items-center">
                <Search className={`absolute left-3 w-4 h-4 pointer-events-none transition-colors ${isOpen ? 'text-slate-500' : 'text-white/80'}`} />
                
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="Pesquisar registros, vistorias, ocorrências (Ctrl+K)..."
                    className="w-full h-8 pl-9 pr-14 text-xs rounded-lg transition-all border outline-none bg-white/15 hover:bg-white/25 focus:bg-white text-white focus:text-slate-900 placeholder-white/70 focus:placeholder-slate-400 border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 shadow-sm"
                />

                <div className="absolute right-2.5 flex items-center gap-1">
                    {query ? (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 bg-white/10 border border-white/20 rounded shadow-xs">
                            Ctrl K
                        </kbd>
                    )}
                </div>
            </form>

            {/* Dropdown de Autocomplete e Recentes */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[5000] text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* Alerta de Modo Offline */}
                    {isOffline && (
                        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center gap-2 text-amber-800 text-[11px]">
                            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Modo Offline: resultados locais (podem estar desatualizados)</span>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Buscando registros...
                        </div>
                    ) : query.trim() ? (
                        /* Lista de Sugestões */
                        <div>
                            {suggestions.length > 0 ? (
                                <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                    {suggestions.map((item, index) => (
                                        <li
                                            key={`${item.record_type}-${item.id}-${index}`}
                                            onClick={() => handleSelectRecord(item)}
                                            className={`p-2.5 cursor-pointer flex items-center justify-between hover:bg-blue-50/80 transition-colors ${
                                                selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5 overflow-hidden">
                                                <div className="mt-0.5 shrink-0">
                                                    {renderTypeBadge(item.record_type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        <HighlightedText text={item.title} query={query} />
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        <HighlightedText text={item.description} query={query} />
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-xs text-slate-500">
                                    Nenhum registro encontrado para "<span className="font-semibold">{query}</span>"
                                </div>
                            )}

                            {/* Footer do Dropdown com acionador Enter */}
                            <div 
                                onClick={handleSubmit}
                                className="bg-slate-50 hover:bg-blue-600 hover:text-white transition-colors border-t border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 flex items-center justify-between cursor-pointer"
                            >
                                <span>Pressione <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-300 rounded text-slate-700 shadow-xs">Enter</kbd> para ver todos os resultados</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    ) : (
                        /* Histórico de Últimos 5 Acessados */
                        <div>
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Últimos acessados
                            </div>

                            {recentRecords.length > 0 ? (
                                <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                                    {recentRecords.map((item, idx) => (
                                        <li
                                            key={`recent-${item.id}-${idx}`}
                                            onClick={() => handleSelectRecord(item)}
                                            className="p-2.5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                {renderTypeBadge(item.record_type)}
                                                <span className="text-xs font-semibold text-slate-800 truncate">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-3 text-center text-xs text-slate-400">
                                    Nenhum histórico recente. Digite para pesquisar.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearchBar;

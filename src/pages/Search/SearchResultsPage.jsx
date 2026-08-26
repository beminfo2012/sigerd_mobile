import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
    Search, Filter, MapPin, Calendar, User, ArrowLeft, WifiOff, 
    FileText, AlertTriangle, ShieldAlert, CheckSquare, Bell, UserCheck, 
    Mail, AlertOctagon, ExternalLink 
} from 'lucide-react';
import { executeGlobalSearch, trackRecordAccess } from '../../services/globalSearchService';
import HighlightedText from '../../components/HighlightedText';

const TYPE_CONFIG = {
    all: { label: 'Todos os Módulos', color: 'bg-slate-800 text-white' },
    vistoria: { label: 'Vistorias', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: FileText },
    ocorrencia: { label: 'Ocorrências', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle },
    interdicao: { label: 'Interdições', color: 'bg-red-100 text-red-700 border-red-300', icon: ShieldAlert },
    noprer: { label: 'NOPRER', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckSquare },
    alerta_cemaden: { label: 'Alertas CEMADEN', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Bell },
    credenciamento: { label: 'Credenciamentos', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: UserCheck },
    oficio: { label: 'Ofícios', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: Mail },
    redap: { label: 'REDAP', color: 'bg-rose-100 text-rose-700 border-rose-300', icon: AlertOctagon }
};

const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const queryParam = searchParams.get('q') || '';
    const typeParam = searchParams.get('type') || 'all';

    const [queryInput, setQueryInput] = useState(queryParam);
    const [activeType, setActiveType] = useState(typeParam);
    const [allResults, setAllResults] = useState([]);
    const [counts, setCounts] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        setQueryInput(queryParam);
        setActiveType(typeParam);
        fetchResults(queryParam);
    }, [queryParam]);

    const fetchResults = async (q) => {
        if (!q.trim()) {
            setAllResults([]);
            setCounts({});
            return;
        }

        setIsLoading(true);
        // Sempre busca todos os tipos para ter a contagem agregada correta nas abas
        const res = await executeGlobalSearch({ query: q, type: 'all', limit: 100 });
        setAllResults(res.results || []);
        setCounts(res.countsByType || {});
        setIsOffline(res.isOffline);
        setIsLoading(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (queryInput.trim()) {
            setSearchParams({ q: queryInput.trim(), type: activeType });
        }
    };

    const handleTabChange = (typeKey) => {
        setActiveType(typeKey);
        setSearchParams({ q: queryParam, type: typeKey });
    };

    const handleNavigateToRecord = (record) => {
        trackRecordAccess(record);
        const targetUrl = record.link_route || '/';
        window.open(window.location.origin + targetUrl, '_blank');
    };

    const renderTypeBadge = (recordType) => {
        const config = TYPE_CONFIG[recordType] || { label: recordType, color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText };
        const IconComp = config.icon || FileText;
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border ${config.color}`}>
                <IconComp className="w-3.5 h-3.5" />
                {config.label}
            </span>
        );
    };

    // Filtrar resultados visíveis conforme a aba ativa
    const filteredResults = activeType === 'all' 
        ? allResults 
        : allResults.filter(r => r.record_type === activeType);

    const totalCountAll = allResults.length;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Cabeçalho do Painel de Busca */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/" 
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
                            title="Voltar ao início"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pesquisa Global SIGERD</h1>
                            <p className="text-xs text-slate-500">Localize registros operacionais em todos os módulos</p>
                        </div>
                    </div>

                    {/* Formulário de Busca da Página */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={queryInput}
                                onChange={(e) => setQueryInput(e.target.value)}
                                placeholder="Digite para buscar..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Banner de aviso Offline */}
                {isOffline && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 text-amber-900 shadow-xs">
                        <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-xs">
                            <p className="font-bold">Resultados offline — podem estar desatualizados</p>
                            <p className="text-amber-700">Seu dispositivo não está conectado à internet. Exibindo dados salvos no dispositivo.</p>
                        </div>
                    </div>
                )}

                {/* Abas de Filtros por Módulo */}
                {queryParam && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                            const count = key === 'all' ? totalCountAll : (counts[key] || 0);
                            const isActive = activeType === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleTabChange(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                                        isActive
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{cfg.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Resultados da Busca */}
                {isLoading ? (
                    <div className="py-16 text-center text-slate-500 space-y-3">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm font-medium">Buscando em todos os módulos do SIGERD...</p>
                    </div>
                ) : queryParam ? (
                    filteredResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredResults.map((record, index) => (
                                <div
                                    key={`${record.record_type}-${record.id}-${index}`}
                                    onClick={() => handleNavigateToRecord(record)}
                                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            {renderTypeBadge(record.record_type)}
                                            {record.status && (
                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                    {record.status}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                                            <span>
                                                <HighlightedText text={record.title} query={queryParam} />
                                            </span>
                                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>

                                        <p className="text-xs text-slate-600 line-clamp-2">
                                            <HighlightedText text={record.description} query={queryParam} />
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                                        <div className="flex items-center gap-3">
                                            {record.responsible && (
                                                <span className="flex items-center gap-1" title="Responsável / Solicitante">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <HighlightedText text={record.responsible} query={queryParam} />
                                                </span>
                                            )}
                                            {record.created_at && (
                                                <span className="flex items-center gap-1" title="Data de Criação">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(record.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Exibição de Coordenadas se Geom for Validada */}
                                        {record.latitude && record.longitude && record.fonte_geolocalizacao && (
                                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-[10px]" title={`Origem: ${record.fonte_geolocalizacao}`}>
                                                <MapPin className="w-3 h-3 text-emerald-600" />
                                                {Number(record.latitude).toFixed(4)}, {Number(record.longitude).toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                            <Search className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-base font-bold text-slate-800">Nenhum resultado encontrado</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Não encontramos correspondências para "<span className="font-semibold text-slate-700">{queryParam}</span>". 
                                Verifique a grafia ou tente buscar por palavras-chave mais genéricas.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                        <Search className="w-12 h-12 text-blue-500/40 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800">Digite um termo no campo acima</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Você pode pesquisar por número de vistoria, protocolo de ocorrência, código de interdição, nome de solicitante, bairro ou palavra-chave.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultsPage;

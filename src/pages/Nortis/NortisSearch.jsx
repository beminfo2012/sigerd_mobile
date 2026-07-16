import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, BookOpen, AlertCircle, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { nortisService } from '../../services/nortisService';
import { toast } from '../../components/ToastNotification';

export default function NortisSearch() {
  const navigate = useNavigate();
  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  const canEdit = ['Admin', 'Coordenador', 'admin', 'Coordenador de Proteção e Defesa Civil'].includes(userProfile?.role);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  
  const [filters, setFilters] = useState({
    termo: '',
    tipo: '',
    ambito: '',
    situacao: 'vigente'
  });

  const [showFilters, setShowFilters] = useState(false);

  // Load initial results
  useEffect(() => {
    handleSearch();
  }, []); // Run once on mount to get recent norms

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await nortisService.search(filters);
      setResults(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro', 'Falha ao buscar normas.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const renderBadgeSituacao = (situacao) => {
    switch(situacao) {
      case 'vigente':
        return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Vigente</span>;
      case 'revogada':
        return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12} /> Revogada</span>;
      case 'alterada':
        return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12} /> Alterada</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{situacao}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/nortis')}
              className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                <img src="/nortis_icon_white.png" className="w-6 h-6 object-contain" alt="NORTIS Logo" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  Consulta Normativa
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Módulo NORTIS
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              name="termo"
              value={filters.termo}
              onChange={handleChange}
              placeholder="Buscar por número, termo na ementa..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl animate-in slide-in-from-top-2">
              <select 
                name="tipo" 
                value={filters.tipo} 
                onChange={handleChange}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Todos os Tipos</option>
                <option value="lei">Lei</option>
                <option value="decreto">Decreto</option>
                <option value="portaria">Portaria</option>
                <option value="nbr">Norma Técnica (NBR)</option>
                <option value="parecer">Parecer</option>
              </select>

              <select 
                name="ambito" 
                value={filters.ambito} 
                onChange={handleChange}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Todos os Âmbitos</option>
                <option value="federal">Federal</option>
                <option value="estadual">Estadual</option>
                <option value="municipal">Municipal</option>
                <option value="institucional">Institucional</option>
              </select>

              <select 
                name="situacao" 
                value={filters.situacao} 
                onChange={handleChange}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
              >
                <option value="">Qualquer Situação</option>
                <option value="vigente">Vigente</option>
                <option value="revogada">Revogada</option>
              </select>
            </div>
          )}
          
          <button type="submit" className="hidden">Buscar</button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum documento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {item.tipo}
                    </span>
                    {item.ambito && (
                      <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {item.ambito}
                      </span>
                    )}
                    {renderBadgeSituacao(item.situacao)}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">
                  {item.tipo.toUpperCase()} {item.numero ? `Nº ${item.numero}` : ''} {item.ano ? `/ ${item.ano}` : ''}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                  {item.ementa}
                </p>
                
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => navigate(`/nortis/visualizar/${item.id}`)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 uppercase tracking-wider"
                  >
                    <BookOpen size={14} /> Visualizar
                  </button>

                  {canEdit && (
                    <button 
                      onClick={() => navigate(`/nortis/editar/${item.id}`)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <FileText size={14} /> Editar
                    </button>
                  )}
                  
                  {item.url_fonte_oficial && (
                    <a 
                      href={item.url_fonte_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <ExternalLink size={14} /> Fonte Oficial
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

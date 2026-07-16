import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ExternalLink, ArrowLeft, Filter } from 'lucide-react';
import { supabase } from '../services/supabase';
import { toast } from './ToastNotification';

export default function NortisQuickSearch({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    // Initial fetch of recent docs
    searchNormas('');
  }, []);

  const searchNormas = async (term) => {
    try {
      setLoading(true);
      let query = supabase
        .from('nortis_normas')
        .select('id, tipo, numero, ano, ambito, orgao_emissor, ementa, texto_integral, url_fonte_oficial')
        .order('ano', { ascending: false })
        .limit(20);

      if (term.trim() !== '') {
        const t = `%${term.trim()}%`;
        query = query.or(`numero.ilike.${t},ementa.ilike.${t},texto_integral.ilike.${t}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      let finalData = data || [];
      if (term.trim() !== '') {
        const normalize = str => {
          if (!str) return '';
          return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };
        const normTerm = normalize(term);
        
        finalData = finalData.filter(d => {
          const inNum = normalize(d.numero).includes(normTerm);
          const inEmenta = normalize(d.ementa).includes(normTerm);
          const inText = normalize(d.texto_integral).includes(normTerm);
          return inNum || inEmenta || inText;
        });
      }
      
      setResults(finalData);
    } catch (error) {
      console.error(error);
      toast.error('Erro', 'Falha ao buscar normas no NORTIS.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchNormas(searchTerm);
  };

  const getSnippets = (text, term) => {
    if (!text || !term) return [];
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    
    const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normTerm = normalize(term);
    
    const matches = paragraphs.filter(p => normalize(p).includes(normTerm));
    return matches; // Retorna todos os trechos onde a palavra aparece
  };

  const highlightTerm = (text, term) => {
    if (!term) return text;
    // Highlight case-insensitive, escaping special chars in term just in case
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-700 text-black dark:text-white px-1 rounded font-bold shadow-sm">$1</mark>');
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, index) => {
      let content = p.trimEnd();
      if (!content.trim()) return null;

      let className = "mb-3 text-sm text-slate-800 dark:text-slate-300 leading-relaxed text-justify";
      
      if (content.match(/^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s+/i)) {
         className = "mt-6 mb-3 font-black text-center text-slate-900 dark:text-white uppercase tracking-widest text-xs";
      } else if (content.match(/^LIVRO\s+/i)) {
         className = "mt-8 mb-4 font-black text-center text-sm text-slate-900 dark:text-white uppercase tracking-widest";
      } else if (content.trim().match(/^Art\.\s+\d+/i)) {
         className = "mt-4 mb-2 text-sm text-slate-800 dark:text-slate-200 text-justify";
      } else if (content.match(/^ {4}/) || content.match(/^[IVXLCDM]+\s*-/i) || content.match(/^[a-z]\)/i)) {
         className = "ml-6 mb-2 text-sm text-slate-700 dark:text-slate-400 text-justify";
      } else if (content.match(/^(Parágrafo|§)/i)) {
         className = "ml-3 mb-2 text-sm text-slate-800 dark:text-slate-300 text-justify";
      }
      
      const revogadoRegex = /\[REVOGADO:\s*([\s\S]*?)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = revogadoRegex.exec(content)) !== null) {
          if (match.index > lastIndex) parts.push(content.substring(lastIndex, match.index));
          parts.push(<del key={`rev-${index}-${match.index}`} className="text-slate-400 line-through">{match[1]}</del>);
          lastIndex = revogadoRegex.lastIndex;
      }
      if (lastIndex < content.length) parts.push(content.substring(lastIndex));

      const processedParts = parts.map((part, i) => {
          if (typeof part === 'string') {
              const pieces = part.split(/(Art\.\s*\d+º?-?[A-Z]*\s*\.?|§\s*\d+º?\s*-?|Parágrafo único\.?\s*|-?[IVXLCDM]+\s*-|[a-z]\s*\))/g);
              return pieces.map((piece, j) => {
                  if (piece && piece.match(/^(Art\.|§|Parágrafo único|-?[IVXLCDM]+\s*-|[a-z]\s*\))/i)) {
                      return <strong key={j} className="font-bold text-slate-900 dark:text-white">{piece}</strong>;
                  }
                  return piece;
              });
          }
          return part;
      });
      
      return <div key={index} className={className}>{processedParts}</div>;
    });
  };

  const normalizeStr = str => {
    if (!str) return '';
    return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };
  
  const normSearchTerm = searchTerm.trim() ? normalizeStr(searchTerm) : '';
  const displayResults = results.filter(doc => {
    if (!normSearchTerm) return true;
    return normalizeStr(doc.numero).includes(normSearchTerm) ||
           normalizeStr(doc.ementa).includes(normSearchTerm) ||
           normalizeStr(doc.texto_integral).includes(normSearchTerm);
  });

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div 
        className="w-full md:w-[600px] bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-indigo-900 text-white p-4 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-3 pr-10">
            <img src="/nortis_icon_white.png" alt="NORTIS Logo" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="font-bold text-lg leading-tight">NORTIS</h2>
              <p className="text-indigo-300 text-xs font-medium">Consulta Rápida de Legislação</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-indigo-800 hover:bg-indigo-700 rounded-full transition-colors shadow-md z-[210] flex items-center justify-center"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {!selectedDoc ? (
          <>
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Pesquisar leis, decretos, NBRs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
                <button type="submit" className="hidden" />
              </form>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900">
              {loading ? (
                <div className="text-center p-8 text-slate-500">Buscando base de dados...</div>
              ) : displayResults.length === 0 ? (
                <div className="text-center p-8 text-slate-500">Nenhum resultado encontrado para "{searchTerm}".</div>
              ) : (
                <div className="space-y-3">
                  {displayResults.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(doc)}
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                          {doc.tipo} {doc.ambito ? `· ${doc.ambito}` : ''}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Nº {doc.numero}/{doc.ano}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-3">
                        {doc.ementa}
                      </p>
                      
                      {searchTerm && (
                        <div className="mt-3 space-y-2">
                          {getSnippets(doc.texto_integral, searchTerm).map((snippet, idx) => (
                            <div key={idx} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-400 text-xs text-slate-700 dark:text-slate-300 leading-relaxed rounded-r-md">
                              <span dangerouslySetInnerHTML={{ __html: highlightTerm(snippet, searchTerm) }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Document Viewer */
          <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800 shrink-0">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600"
              >
                <ArrowLeft size={16} /> Voltar à Busca
              </button>
              {selectedDoc.url_fonte_oficial && (
                <a 
                  href={selectedDoc.url_fonte_oficial} 
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Fonte Oficial <ExternalLink size={12} />
                </a>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  {selectedDoc.tipo.toUpperCase()} Nº {selectedDoc.numero}/{selectedDoc.ano}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {selectedDoc.orgao_emissor}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 mb-6">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed text-justify">
                  "{selectedDoc.ementa}"
                </p>
              </div>

              {selectedDoc.texto_integral && (
                <div className="font-serif">
                  {renderFormattedText(selectedDoc.texto_integral)}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

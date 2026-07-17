import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Download, Calendar } from 'lucide-react';
import { nortisService } from '../../services/nortisService';
import { toast } from '../../components/ToastNotification';

export default function NortisView() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [norma, setNorma] = useState(null);

  useEffect(() => {
    if (id) {
      loadNorma(id);
    }
  }, [id]);

  const loadNorma = async (normaId) => {
    try {
      setLoading(true);
      const data = await nortisService.getById(normaId);
      if (data) {
        setNorma(data);
      }
    } catch (error) {
      toast.error('Erro', 'Falha ao carregar documento.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((p, index) => {
      let content = p.trimEnd(); // Mantemos espaços no início se houver
      if (!content.trim()) return null;

      let className = "mb-4 text-slate-800 dark:text-slate-300 leading-relaxed text-justify";
      
      // Identifica hierarquias estruturais
      if (content.match(/^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\s+/i)) {
         className = "mt-8 mb-4 font-black text-center text-slate-900 dark:text-white uppercase tracking-widest";
      } else if (content.match(/^LIVRO\s+/i)) {
         className = "mt-12 mb-6 font-black text-center text-xl text-slate-900 dark:text-white uppercase tracking-widest";
      } else if (content.trim().match(/^Art\.\s+\d+/i)) {
         className = "mt-6 mb-3 text-slate-800 dark:text-slate-200 text-justify";
      } else if (content.match(/^ {4}/) || content.match(/^[IVXLCDM]+\s*-/i) || content.match(/^[a-z]\)/i)) {
         className = "ml-8 mb-3 text-slate-700 dark:text-slate-400 text-justify";
      } else if (content.match(/^(Parágrafo|§)/i)) {
         className = "ml-4 mb-3 text-slate-800 dark:text-slate-300 text-justify";
      }
      
      // Processamento da Tag de Revogado
      const revogadoRegex = /\[REVOGADO:\s*([\s\S]*?)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = revogadoRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
              parts.push(content.substring(lastIndex, match.index));
          }
          parts.push(
              <del key={`rev-${index}-${match.index}`} className="text-slate-400 dark:text-slate-500 line-through">
                  {match[1]}
              </del>
          );
          lastIndex = revogadoRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
          parts.push(content.substring(lastIndex));
      }

      // Destacar palavras-chave jurídicas (Art., Incisos, Parágrafos) em negrito
      const processedParts = parts.map((part, i) => {
          if (typeof part === 'string') {
              // Regex separa a string mantendo o separador no array retornado
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
      
      return (
         <div key={index} className={className}>
             {processedParts}
         </div>
      );
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando...</div>;
  }

  if (!norma) {
    return <div className="p-8 text-center text-slate-500">Documento não encontrado.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              Visualização
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              NORTIS - Base Legal
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            {norma.url_fonte_oficial && (
            <a
                href={norma.url_fonte_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
            >
                <ExternalLink size={16} /> Fonte Oficial
            </a>
            )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <article className="max-w-7xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          
          <div className="mb-8 text-center">
            <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              {norma.tipo} {norma.ambito ? `· ${norma.ambito}` : ''}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4">
              {norma.tipo.toUpperCase()} {norma.numero ? `Nº ${norma.numero}` : ''} {norma.ano ? `/ ${norma.ano}` : ''}
            </h1>
            {norma.orgao_emissor && (
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {norma.orgao_emissor}
              </p>
            )}
            {norma.data_publicacao && (
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <Calendar size={12} /> Publicado em {new Date(norma.data_publicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ementa</h3>
            <p className="text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed text-lg">
              "{norma.ementa}"
            </p>
          </div>

          {norma.texto_integral && (
            <div className="mb-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">Texto Integral</h3>
                <div className="font-serif text-lg">
                    {renderFormattedText(norma.texto_integral)}
                </div>
            </div>
          )}

          {norma.arquivo_pdf_path && (
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Anexos</h3>
                  <a 
                    href={`https://seudominio.supabase.co/storage/v1/object/public/nortis_arquivos/${norma.arquivo_pdf_path}`} 
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                          <FileText size={24} />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-white">Documento Original.pdf</p>
                          <p className="text-xs text-slate-500">Visualizar anexo digitalizado</p>
                      </div>
                      <Download size={18} className="ml-4 text-slate-400" />
                  </a>
              </div>
          )}

        </article>
      </main>
    </div>
  );
}

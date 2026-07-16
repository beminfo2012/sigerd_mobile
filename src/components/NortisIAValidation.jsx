import React, { useState } from 'react';
import { Check, X, EyeOff, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import { nortisIaService } from '../services/nortisIaService';
import { toast } from './ToastNotification';

export default function NortisIAValidation({ sugestoesGeradas, onClose, onAcceptCitation, user, onReanalyze, isAnalyzing }) {
  const [decisions, setDecisions] = useState({});
  const [loadingAction, setLoadingAction] = useState(null);
  const [tipoPesquisa, setTipoPesquisa] = useState('interno');

  if (!sugestoesGeradas) return null;

  const handleAction = async (item, groupIndex, itemIndex, action) => {
    const key = `${groupIndex}-${itemIndex}`;
    setLoadingAction(key);
    
    try {
      // Registrar no banco (MVP simplificado: atualizar status geral ou apenas logar ação)
      // Idealmente a tabela de sugestoes guardaria cada item, mas aqui atualizamos a sugestão pai
      if (sugestoesGeradas._sugestao_id) {
        await nortisIaService.registrarRevisao(
            sugestoesGeradas._sugestao_id, 
            action === 'aceitar' ? 'aceita' : action === 'rejeitar' ? 'rejeitada' : 'ignorada', 
            user?.id,
            action === 'rejeitar' ? `Usuário rejeitou o item: ${item.referencia}` : null
        );
      }

      setDecisions(prev => ({ ...prev, [key]: action }));
      
      if (action === 'aceitar') {
        toast.success("Citação Adicionada", "A referência foi incorporada ao seu texto.");
        if (onAcceptCitation) {
            onAcceptCitation(`Segundo a ${item.referencia}: "${item.trecho_destacado}"`);
        }
      } else if (action === 'rejeitar') {
        toast.info("Rejeitada", "O NORTIS aprenderá a não sugerir esta referência em casos similares.");
      }
    } catch (error) {
      toast.error("Erro", "Falha ao registrar decisão.");
    } finally {
      setLoadingAction(null);
    }
  };

  const renderGroup = (title, items, groupIndex) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          {title}
        </h3>
        <div className="space-y-4">
          {items.map((item, itemIndex) => {
            const key = `${groupIndex}-${itemIndex}`;
            const decision = decisions[key];

            if (decision === 'ignorar') return null; // Esconde se ignorado

            return (
              <div 
                key={key} 
                className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm transition-all
                  ${decision === 'aceitar' ? 'border-green-500 bg-green-50/30 dark:bg-green-900/10' : 
                    decision === 'rejeitar' ? 'border-red-300 opacity-60 grayscale' : 'border-indigo-100 dark:border-indigo-900/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest
                        ${item.situacao === 'vigente' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {item.situacao || 'Vigente'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest
                        ${item.confianca === 'alta' ? 'bg-blue-100 text-blue-700' : 
                          item.confianca === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}
                      `}>
                        Confiança {item.confianca}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.referencia || item.tipo}
                    </h4>
                    {item.nivel_fonte && (
                          <div className="flex items-center gap-1 mt-1 mb-2">
                              {item.nivel_fonte === 'INTERNO' && <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Base NORTIS</span>}
                              {item.nivel_fonte === 'NIVEL_A' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Nível A - Oficial</span>}
                              {item.nivel_fonte === 'NIVEL_B' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Nível B - Técnico</span>}
                              {item.nivel_fonte === 'NIVEL_C' && <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Nível C - Informativo</span>}
                          </div>
                    )}
                  </div>
                  {(item.link_interno || item.link_externo) && (
                    <a href={item.link_interno || item.link_externo} target="_blank" rel="noreferrer" className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Acessar Fonte">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border-l-2 border-indigo-400 mb-3 text-sm text-slate-700 dark:text-slate-300 font-serif italic">
                  "{item.trecho_destacado}"
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
                  <span className="font-bold">Justificativa da IA:</span> {item.justificativa || item.resumo_similaridade}
                </p>

                {!decision ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleAction(item, groupIndex, itemIndex, 'aceitar')}
                      disabled={loadingAction === key || item.nivel_fonte === 'NIVEL_C'}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check size={14} /> {item.nivel_fonte === 'NIVEL_C' ? 'Bloqueado (Nível C)' : 'Aceitar (Copiar)'}
                    </button>
                    <button
                      onClick={() => handleAction(item, groupIndex, itemIndex, 'rejeitar')}
                      disabled={loadingAction === key}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <X size={14} /> Rejeitar (Ruim)
                    </button>
                    <button
                      onClick={() => handleAction(item, groupIndex, itemIndex, 'ignorar')}
                      disabled={loadingAction === key}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 py-2 rounded-lg text-xs font-bold transition-colors"
                      title="Ignorar"
                    >
                      <EyeOff size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center pt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Ação registrada: {decision}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full flex flex-col w-[400px] shrink-0 animate-in slide-in-from-right relative">
      <div className="p-4 bg-indigo-900 text-white flex items-center gap-3 shrink-0">
        <Sparkles size={24} className="text-indigo-300" />
        <div className="flex-1">
          <h2 className="font-bold leading-tight">Validação NORTIS IA</h2>
          <p className="text-xs text-indigo-300">Sugestões Contextuais Automáticas</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-indigo-800 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {onReanalyze && (
        <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Origem da Pesquisa</p>
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button 
                    onClick={() => { setTipoPesquisa('interno'); onReanalyze('interno'); }}
                    disabled={isAnalyzing}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tipoPesquisa === 'interno' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                >NORTIS</button>
                <button 
                    onClick={() => { setTipoPesquisa('externo'); onReanalyze('externo'); }}
                    disabled={isAnalyzing}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tipoPesquisa === 'externo' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                >WEB</button>
                <button 
                    onClick={() => { setTipoPesquisa('ambos'); onReanalyze('ambos'); }}
                    disabled={isAnalyzing}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tipoPesquisa === 'ambos' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                >HÍBRIDO</button>
            </div>
            {isAnalyzing && <p className="text-xs text-indigo-600 mt-2 text-center animate-pulse">Pesquisando...</p>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 flex gap-3 text-amber-800 dark:text-amber-400 text-xs leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{sugestoesGeradas.aviso || "Sugestão gerada por IA — validação humana obrigatória antes de uso em ato oficial."}</p>
        </div>

        {sugestoesGeradas.observacao && (
            <div className="mb-6 p-4 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm text-center text-slate-600 dark:text-slate-400 italic">
                {sugestoesGeradas.observacao}
            </div>
        )}

        {renderGroup("Legislação Aplicável", sugestoesGeradas.legislacao_aplicavel, 'leg')}
        {renderGroup("Normas Técnicas", sugestoesGeradas.normas_tecnicas_aplicaveis, 'norm')}
        {renderGroup("Casos Similares", sugestoesGeradas.casos_similares, 'casos')}
      </div>
    </div>
  );
}

import React from 'react';
import { Check, Clock, AlertTriangle, FileText, Send, ShieldAlert, Archive } from 'lucide-react';

const FASES_REDAP = [
    { id: 1, nome: 'Abertura & Preenchimento Setorial', responsavel_papel: 'DEFESA_CIVIL_SECRETARIAS' },
    { id: 2, nome: 'Consolidação & Parecer Técnico', responsavel_papel: 'ANALISTA_COMPDEC' },
    { id: 3, nome: 'Parecer Decisório do Coordenador', responsavel_papel: 'COORDENADOR_COMPDEC' },
    { id: 4, nome: 'Decretação & Geração Documental', responsavel_papel: 'PREFEITO_MUNICIPAL' },
    { id: 5, nome: 'Envio ao Estado & Exportação', responsavel_papel: 'COORDENADOR_COMPDEC' }
];

const FluxoAprovacaoTimeline = ({ 
    evento, 
    fases, 
    onEmitirParecerConsolidacao,
    onEmitirParecerDecisorio,
    onGerarDocumentos,
    onEnviarCepdec,
    onExportarPacote,
    isDefesaCivil,
    isPrefeito,
    userPapel
}) => {
    
    // Status terminal E (Encerrado sem Decretação)
    const isEncerradoSemDecretacao = evento?.status_geral === 'ENCERRADO_SEM_DECRETACAO';
    
    return (
        <div className="bg-white dark:bg-slate-900 p-7 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl space-y-6">
            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> 
                Fluxo de Aprovação e Validação (5 Fases)
            </h3>
            
            {isEncerradoSemDecretacao && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex items-start sm:items-center gap-4">
                    <Archive size={24} className="text-rose-600 dark:text-rose-500 shrink-0" />
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-rose-800 dark:text-rose-400 uppercase tracking-wide">Evento Encerrado sem Decretação</h4>
                        <p className="text-xs text-rose-600 dark:text-rose-300 font-medium mt-1">Este evento foi encerrado internamente. Os danos não justificaram declaração de anormalidade.</p>
                    </div>
                </div>
            )}

            <div className="relative pt-6 pb-4">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                    {FASES_REDAP.map((faseDef, index) => {
                        // Busca o status dessa fase nos dados passados
                        const faseData = fases.find(f => f.etapa == faseDef.id) || {};
                        const status = faseData.status || 'PENDENTE';
                        const isConcluida = status === 'CONCLUIDA';
                        const isEmAndamento = status === 'EM_ANDAMENTO';
                        const isFutura = status === 'PENDENTE' || status === 'NAO_APLICAVEL';
                        
                        // Bifurcação visual: se passou da fase 3 e está encerrado, fases 4 e 5 ficam cinzas ou ocultas
                        const isBifurcadaOut = isEncerradoSemDecretacao && faseDef.id > 3;

                        // Estilização dinâmica
                        let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'; // Pendente
                        if (isConcluida) {
                            colorClasses = 'bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500';
                        } else if (isEmAndamento && !isEncerradoSemDecretacao) {
                            colorClasses = 'bg-amber-500 text-white border-amber-600 dark:border-amber-500 shadow-lg shadow-amber-500/30';
                        } else if (isEncerradoSemDecretacao && faseDef.id === 3) {
                            colorClasses = 'bg-rose-500 text-white border-rose-600 dark:border-rose-500';
                        }

                        return (
                            <div key={faseDef.id} className={`flex flex-col items-center text-center space-y-3 ${isBifurcadaOut ? 'opacity-30 grayscale' : ''}`}>
                                {/* Bolota Numérica */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 z-10 transition-colors duration-300 ${colorClasses}`}>
                                    {isConcluida ? <Check size={20} /> : faseDef.id}
                                </div>
                                
                                {/* Título e Responsável */}
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 leading-tight">
                                        {faseDef.nome}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{faseData.responsavel_papel || faseDef.responsavel_papel}</p>
                                </div>

                                {/* Ações Contextuais (Apenas se a fase estiver em andamento) */}
                                {isEmAndamento && !isEncerradoSemDecretacao && (
                                    <div className="pt-2">
                                        {faseDef.id === 2 && isDefesaCivil && (
                                            <button onClick={onEmitirParecerConsolidacao} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                Emitir Parecer
                                            </button>
                                        )}
                                        {faseDef.id === 3 && isDefesaCivil && (
                                            <button onClick={onEmitirParecerDecisorio} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                Parecer Decisório
                                            </button>
                                        )}
                                        {faseDef.id === 4 && isPrefeito && (
                                            <button onClick={onGerarDocumentos} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                Gerar Documentos
                                            </button>
                                        )}
                                        {faseDef.id === 5 && isDefesaCivil && (
                                            <div className="flex flex-col gap-2">
                                                {evento?.nivel_intensidade_final !== 'NIVEL_I' && (
                                                    <button onClick={onEnviarCepdec} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                        Enviar à CEPDEC
                                                    </button>
                                                )}
                                                
                                                {evento?.nivel_intensidade_final === 'NIVEL_II' && (
                                                    <button onClick={() => alert('Apenas registrado internamente.')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                        Apenas Registrar (S2iD)
                                                    </button>
                                                )}

                                                <button onClick={onExportarPacote} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">
                                                    Exportar Pacote
                                                </button>
                                                
                                                {evento?.nivel_intensidade_final === 'NIVEL_III' && (
                                                    <p className="text-[9px] text-rose-500 font-bold uppercase text-center mt-1">
                                                        ⚠️ Envio Obrigatório (Nível III)
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Feedback Pós-Conclusão (Ex: Decisão da Fase 3) */}
                                {isConcluida && faseDef.id === 3 && faseData.decisao_registrada && (
                                    <div className="mt-2 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md uppercase">
                                        🟢 {faseData.decisao_registrada.tipo_decretacao === 'SE' ? 'Sit. Emergência' : 'Cal. Pública'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FluxoAprovacaoTimeline;

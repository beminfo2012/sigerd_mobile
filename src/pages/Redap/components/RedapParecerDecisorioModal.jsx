import React, { useState } from 'react';
import { 
    X, 
    AlertTriangle, 
    Info, 
    CheckCircle2, 
    XCircle,
    FileText,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import { useToast } from '../../../components/ToastNotification';

export default function RedapParecerDecisorioModal({ isOpen, onClose, onConfirm, user }) {
    const { toast } = useToast();
    const [passo, setPasso] = useState(1);
    
    // Opção principal (A/B)
    const [opcao, setOpcao] = useState(null); // 'A' (Recomenda) ou 'B' (Não Recomenda)
    
    // Dados da Opção A
    const [nivel, setNivel] = useState(null); // 'NIVEL_I', 'NIVEL_II', 'NIVEL_III'
    const [tipoDecreto, setTipoDecreto] = useState(null); // 'SE' ou 'ECP'
    const [motivacaoEcp, setMotivacaoEcp] = useState('');
    const [justificativa, setJustificativa] = useState('');
    const [isGeneratingIa, setIsGeneratingIa] = useState(false);

    if (!isOpen) return null;

    const handleSelectNivel = (n) => {
        setNivel(n);
        if (n === 'NIVEL_I' || n === 'NIVEL_II') {
            setTipoDecreto('SE');
        } else if (n === 'NIVEL_III') {
            setTipoDecreto('ECP');
        }
    };

    const handleAvancar = () => {
        if (passo === 1 && !opcao) {
            return toast.error('Selecione uma opção (A ou B).');
        }
        
        if (opcao === 'B') {
            // Opção B vai direto para preencher justificativa (passo final)
            if (passo === 1) setPasso(5);
        } else {
            // Opção A tem passos sequenciais
            if (passo === 2 && !nivel) {
                return toast.error('Selecione a classificação de intensidade.');
            }
            if (passo === 3 && nivel === 'NIVEL_III' && motivacaoEcp.length < 50) {
                return toast.error('Preencha a motivação do ECP com detalhes adequados.');
            }
            setPasso(p => p + 1);
        }
    };

    const handleSugerirIa = () => {
        setIsGeneratingIa(true);
        setTimeout(() => {
            let texto = '';
            if (opcao === 'B') {
                texto = "Após análise técnica minuciosa dos danos apresentados, conclui-se que o município possui plena capacidade de resposta e restabelecimento com seus próprios recursos ordinários, não caracterizando situação de anormalidade que justifique decretação.";
            } else if (nivel === 'NIVEL_I') {
                texto = "Considerando a ocorrência do desastre e os danos apurados no relatório técnico, recomenda-se a decretação de Situação de Emergência. Trata-se de desastre de pequena intensidade (Nível I), restabelecível mediante medidas administrativas locais excepcionais, sem a necessidade de aporte de recursos federais ou estaduais.";
            } else if (nivel === 'NIVEL_II') {
                texto = "Diante dos danos expressivos evidenciados, que extrapolam a capacidade de resposta isolada do município, recomenda-se a decretação de Situação de Emergência. O desastre é classificado como de média intensidade (Nível II), demandando apoio complementar para restabelecimento.";
            } else if (nivel === 'NIVEL_III') {
                texto = "Face à magnitude vultosa dos danos, que comprometeram severamente o funcionamento das instituições públicas locais e a continuidade dos serviços essenciais, recomenda-se a declaração de Estado de Calamidade Pública (Nível III).";
            }
            setJustificativa(texto);
            setIsGeneratingIa(false);
        }, 1500);
    };

    const handleSubmit = async () => {
        if (!justificativa.trim()) {
            return toast.error('A justificativa final é obrigatória.');
        }

        try {
            const data = {
                opcao,
                nivel_intensidade: opcao === 'A' ? nivel : null,
                tipo_decreto: opcao === 'A' ? tipoDecreto : null,
                motivacao_ecp: nivel === 'NIVEL_III' ? motivacaoEcp : null,
                justificativa,
                requer_reconhecimento: opcao === 'B' ? null : (nivel === 'NIVEL_I' ? 'NAO_REQUER' : (nivel === 'NIVEL_II' ? 'OPCIONAL' : 'OBRIGATORIO'))
            };

            await onConfirm(data);
            
            // Reset state
            setPasso(1);
            setOpcao(null);
            setNivel(null);
            setTipoDecreto(null);
            setMotivacaoEcp('');
            setJustificativa('');
            
        } catch (error) {
            console.error('Erro ao salvar parecer:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6 transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/40">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" />
                            Parecer Decisório do Coordenador
                        </h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Fase 3 • Redap Sigerd</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Passo 1: Escolha da Opção Principal */}
                    {passo === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">Qual a sua recomendação sobre este desastre?</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => setOpcao('A')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${opcao === 'A' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${opcao === 'A' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${opcao === 'A' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                OPÇÃO A — Recomenda Decretação
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Os danos confirmam situação de anormalidade. Prosseguir para escolha de nível e emissão de decreto (SE/ECP).
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setOpcao('B')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${opcao === 'B' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${opcao === 'B' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <XCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${opcao === 'B' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                OPÇÃO B — NÃO Recomenda Decretação
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Danos insuficientes. O evento será encerrado internamente sem fluxo de decretação.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Passo 2: Nível de Intensidade */}
                    {passo === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">Classificação de Intensidade (Art. 5º da Portaria MDR nº 260/2022)</h3>
                            <div className="space-y-3">
                                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${nivel === 'NIVEL_I' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <input type="radio" name="nivel" className="mt-1" checked={nivel === 'NIVEL_I'} onChange={() => handleSelectNivel('NIVEL_I')} />
                                        <div>
                                            <p className="font-bold text-blue-700 dark:text-blue-400">NÍVEL I — Pequena intensidade</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Situação de normalidade restabelecível com recursos locais (medidas excepcionais previstas na ordem jurídica).</p>
                                            <p className="text-xs font-black uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded inline-block mt-2">→ Habilita apenas: Situação de Emergência (SE)</p>
                                        </div>
                                    </div>
                                </label>
                                
                                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${nivel === 'NIVEL_II' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <input type="radio" name="nivel" className="mt-1" checked={nivel === 'NIVEL_II'} onChange={() => handleSelectNivel('NIVEL_II')} />
                                        <div>
                                            <p className="font-bold text-amber-700 dark:text-amber-500">NÍVEL II — Média intensidade</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Danos expressivos; restabelecimento exige recursos locais complementados por aporte estadual e/ou federal.</p>
                                            <p className="text-xs font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded inline-block mt-2">→ Habilita apenas: Situação de Emergência (SE)</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${nivel === 'NIVEL_III' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <input type="radio" name="nivel" className="mt-1" checked={nivel === 'NIVEL_III'} onChange={() => handleSelectNivel('NIVEL_III')} />
                                        <div>
                                            <p className="font-bold text-rose-700 dark:text-rose-500">NÍVEL III — Grande intensidade</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Danos vultosos com comprometimento das instituições públicas locais/regionais; exige mobilização das três esferas.</p>
                                            <p className="text-xs font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded inline-block mt-2">→ Habilita apenas: Estado de Calamidade Pública (ECP)</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Passo 3: Tipo Decreto & Reconhecimento & (ECP) Motivação */}
                    {passo === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">Modalidade de Decretação Selecionada</h3>
                                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="font-black text-slate-700 dark:text-slate-300 uppercase">
                                        {tipoDecreto === 'SE' ? 'Situação de Emergência (SE)' : 'Estado de Calamidade Pública (ECP)'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Determinada automaticamente pelo Nível escolhido.</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border ${nivel === 'NIVEL_I' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40' : nivel === 'NIVEL_II' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/40'}`}>
                                <div className="flex items-start gap-3">
                                    <Info className={nivel === 'NIVEL_I' ? 'text-blue-500' : nivel === 'NIVEL_II' ? 'text-amber-500' : 'text-rose-500'} size={20} />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {nivel === 'NIVEL_I' && "Este desastre, por ser Nível I, NÃO requer solicitação de reconhecimento estadual ou federal. Apenas o registro no sistema (S2iD) será necessário."}
                                        {nivel === 'NIVEL_II' && "Este desastre, por ser Nível II, PODE ter reconhecimento estadual e/ou federal solicitado, conforme a necessidade de recursos."}
                                        {nivel === 'NIVEL_III' && "Este desastre, por ser Nível III, DEVE ter reconhecimento solicitado, com motivação expressa no decreto."}
                                    </p>
                                </div>
                            </div>

                            {nivel === 'NIVEL_III' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Motivação da declaração de ECP <span className="text-rose-500">*</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">Obrigatória (Art. 5º, §3º). Este texto constará expressamente no decreto.</p>
                                    <textarea
                                        className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-blue-500 outline-none resize-none"
                                        rows={4}
                                        value={motivacaoEcp}
                                        onChange={(e) => setMotivacaoEcp(e.target.value)}
                                        placeholder="Detalhe a magnitude vultosa dos danos que comprometeram o funcionamento das instituições públicas..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Passo Final (5): Justificativa */}
                    {(passo === 4 || passo === 5) && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                    Justificativa do Parecer
                                </h3>
                                <button 
                                    onClick={handleSugerirIa}
                                    disabled={isGeneratingIa}
                                    className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20 px-3 py-1.5 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingIa ? (
                                        <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                                    ) : (
                                        <BrainCircuit size={14} />
                                    )}
                                    Sugerir com IA
                                </button>
                            </div>
                            <textarea
                                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 outline-none min-h-[160px] text-sm leading-relaxed"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                placeholder="Redija a justificativa técnica que embasa esta recomendação..."
                            />
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                                    Ao confirmar, o Parecer Decisório do Coordenador será gerado e anexado ao processo irreversivelmente (a menos que haja reabertura formal).
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-white dark:bg-slate-900">
                    <button 
                        onClick={() => passo > 1 ? setPasso(opcao === 'B' ? 1 : passo - 1) : onClose()}
                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {passo > 1 ? 'Voltar' : 'Cancelar'}
                    </button>
                    
                    {(passo === 4 || passo === 5) ? (
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} /> Emitir Parecer
                        </button>
                    ) : (
                        <button
                            onClick={handleAvancar}
                            className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Próximo <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

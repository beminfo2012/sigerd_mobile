// src/pages/Legado/NovoOficioModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Plus, Trash2, Link, FileText, AlertTriangle, ShieldCheck, Eye, Save, Send } from 'lucide-react';
import { getProximoNumero, saveRascunhoOficio, emitirOficio } from '../../services/oficiosService';

const NovoOficioModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [previewInfo, setPreviewInfo] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: initialData?.id || null,
        sigla_orgao: initialData?.sigla_orgao || 'PMSMJ/COMPDEC',
        ano: initialData?.ano || new Date().getFullYear(),
        data_emissao: initialData?.data_emissao || new Date().toISOString().split('T')[0],
        destinatario_nome: initialData?.destinatario_nome || '',
        destinatario_cargo: initialData?.destinatario_cargo || '',
        destinatario_orgao: initialData?.destinatario_orgao || '',
        assunto: initialData?.assunto || '',
        introducao: initialData?.introducao || 'Por determinação do Excelentíssimo Senhor Prefeito Municipal e;',
        considerandos: initialData?.considerandos || [
            'Considerando a necessidade de adoção de medidas preventivas de proteção e defesa civil;'
        ],
        corpo_paragrafos: initialData?.corpo_paragrafos || [
            'Solicitamos a Vossa Senhoria as providências cabíveis para o encaminhamento do pleito.'
        ],
        fecho: initialData?.fecho || 'Respeitosamente,',
        processo_edocs: initialData?.processo_edocs || '',
        documentos_referenciados: initialData?.documentos_referenciados || [],
        signatario_nome: initialData?.signatario_nome || 'BRUNO CESAR DE SOUZA',
        signatario_cargo: initialData?.signatario_cargo || 'Coordenador Municipal de Proteção e Defesa Civil',
        signatario_portaria: initialData?.signatario_portaria || 'Portaria nº 012/2025'
    });

    useEffect(() => {
        if (isOpen) {
            fetchProximoNumero();
        }
    }, [isOpen, formData.ano, formData.sigla_orgao]);

    const fetchProximoNumero = async () => {
        try {
            const info = await getProximoNumero(formData.ano, formData.sigla_orgao);
            setPreviewInfo(info);
        } catch (e) {
            console.error('Erro ao buscar próximo número:', e);
        }
    };

    if (!isOpen) return null;

    const handleAddConsiderando = () => {
        setFormData(prev => ({
            ...prev,
            considerandos: [...prev.considerandos, '']
        }));
    };

    const handleUpdateConsiderando = (index, value) => {
        setFormData(prev => {
            const next = [...prev.considerandos];
            next[index] = value;
            return { ...prev, considerandos: next };
        });
    };

    const handleRemoveConsiderando = (index) => {
        setFormData(prev => ({
            ...prev,
            considerandos: prev.considerandos.filter((_, i) => i !== index)
        }));
    };

    // Auto-sugestão vinculada a documento existente do SIGERD
    const handleVincularDocumento = (tipo) => {
        let text = '';
        if (tipo === 'VISTORIA') {
            text = 'Considerando o Laudo Técnico de Vistoria nº 024/2026, elaborado por esta Coordenadoria Municipal de Proteção e Defesa Civil;';
        } else if (tipo === 'INTERDICAO') {
            text = 'Considerando o Auto de Interdição nº 004/2026, que determinou a interdição total da estrutura por risco iminente;';
        } else if (tipo === 'EDOCS') {
            text = 'Considerando as informações e diretrizes constantes do Processo E-Docs nº 2026-3CJLT;';
        }
        if (text) {
            setFormData(prev => ({
                ...prev,
                considerandos: [...prev.considerandos, text]
            }));
        }
    };

    const handleSaveRascunho = async () => {
        setLoading(true);
        try {
            const saved = await saveRascunhoOficio(formData);
            alert(`Rascunho salvo com sucesso! (${saved.numero_formatado})`);
            if (onSuccess) onSuccess(saved);
            onClose();
        } catch (err) {
            console.error('Erro ao salvar rascunho:', err);
            alert('Erro ao salvar o rascunho.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmitir = async () => {
        if (!formData.destinatario_nome.trim()) {
            alert('Por favor, informe o Nome do Destinatário antes de emitir.');
            setStep(2);
            return;
        }
        if (!formData.assunto.trim()) {
            alert('Por favor, informe o Assunto do Ofício antes de emitir.');
            setStep(3);
            return;
        }

        const confirmMsg = `ATENÇÃO: A emissão irá reservar de forma ATÔMICA e IRREVERSÍVEL o número oficial ${previewInfo?.numero_formatado || ''} da COMPDEC para o ano de ${formData.ano}.\n\nO conteúdo do documento ficará congelado para auditoria.\n\nDeseja confirmar a emissão?`;
        
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const emitido = await emitirOficio(formData);
            alert(`Ofício EMITIDO com sucesso!\n\nNúmero Reservado: ${emitido.identificador_completo}`);
            if (onSuccess) onSuccess(emitido);
            onClose();
        } catch (err) {
            console.error('Erro na emissão:', err);
            alert(err.message || 'Erro ao emitir o ofício.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans">
                
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center font-black text-sm">
                            <FileText size={22} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight">Emissor de Ofícios COMPDEC</h2>
                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                                Modelo Institucional oficial • {previewInfo?.numero_formatado || 'Carregando numeração...'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Wizard Step Bar */}
                <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex justify-between items-center text-xs font-bold">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Cabeçalho</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Destinatário</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Assunto</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    <div className={`flex items-center gap-2 ${step >= 4 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Corpo</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    <div className={`flex items-center gap-2 ${step >= 5 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">5</span>
                        <span>Revisão</span>
                    </div>
                </div>

                {/* Body Content per Step */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Passo 1: Identificação & Numeração Prevista</h3>
                            
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                <ShieldCheck className="text-blue-600 shrink-0 mt-1" size={24} />
                                <div>
                                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                        Número oficial atribuído na emissão: <span className="font-black underline">{previewInfo?.identificador_completo}</span>
                                    </p>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                                        Garantia defensável TCE-ES: a sequência recomeça em 1 a cada ano novo e bloqueia lacunas.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Órgão Expedidor</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={formData.sigla_orgao}
                                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ano de Exercício</label>
                                    <input
                                        type="number"
                                        value={formData.ano}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ano: Number(e.target.value) }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data que constará impressa</label>
                                    <input
                                        type="date"
                                        value={formData.data_emissao}
                                        onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Passo 2: Dados do Destinatário</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome do Destinatário *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex.: Wagner Ponciano Correa"
                                        value={formData.destinatario_nome}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinatario_nome: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cargo / Função</label>
                                    <input
                                        type="text"
                                        placeholder="Ex.: Coordenador Municipal de Proteção e Defesa Civil"
                                        value={formData.destinatario_cargo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinatario_cargo: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Órgão / Entidade Destinatária</label>
                                    <input
                                        type="text"
                                        placeholder="Ex.: de Santa Leopoldina ou Ministério Público Estadual"
                                        value={formData.destinatario_orgao}
                                        onChange={(e) => setFormData(prev => ({ ...prev, destinatario_orgao: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Passo 3: Assunto & Processo E-Docs</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assunto do Ofício *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Ex.: Solicitação de manifestação técnica sobre a Ponte de Rio Bonito."
                                        value={formData.assunto}
                                        onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Número do Processo E-Docs (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex.: 2026-3CJLT"
                                        value={formData.processo_edocs}
                                        onChange={(e) => setFormData(prev => ({ ...prev, processo_edocs: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Passo 4: Considerandos & Conteúdo</h3>
                                <button
                                    onClick={handleAddConsiderando}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                >
                                    <Plus size={14} /> Adicionar Considerando
                                </button>
                            </div>

                            {/* Sugestões de Vínculo com SIGERD */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Link size={12} /> Pré-sugerir com vínculo a documentos do SIGERD:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleVincularDocumento('VISTORIA')}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500 transition-colors"
                                    >
                                        + Laudo de Vistoria
                                    </button>
                                    <button
                                        onClick={() => handleVincularDocumento('INTERDICAO')}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500 transition-colors"
                                    >
                                        + Auto de Interdição
                                    </button>
                                    <button
                                        onClick={() => handleVincularDocumento('EDOCS')}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500 transition-colors"
                                    >
                                        + Processo E-Docs
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Considerandos */}
                            <div className="space-y-3">
                                {formData.considerandos.map((c, index) => (
                                    <div key={index} className="flex items-start gap-2 group">
                                        <span className="text-xs font-black text-slate-400 mt-3">{index + 1}.</span>
                                        <textarea
                                            rows={2}
                                            value={c}
                                            onChange={(e) => handleUpdateConsiderando(index, e.target.value)}
                                            placeholder="Considerando que..."
                                            className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
                                        />
                                        <button
                                            onClick={() => handleRemoveConsiderando(index)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl mt-1 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Passo 5: Revisão Fiel do Documento</h3>
                            
                            {/* Preview visual estilizado */}
                            <div className="p-6 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-sans text-xs space-y-4 shadow-inner max-h-[50vh] overflow-y-auto">
                                <div className="text-center font-bold text-slate-900 dark:text-white border-b border-slate-300 pb-3">
                                    PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ<br />
                                    SECRETARIA DE DEFESA SOCIAL<br />
                                    COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL
                                </div>

                                <div className="font-black text-sm text-blue-600">
                                    {previewInfo?.identificador_completo}
                                </div>

                                <div className="text-right">
                                    Santa Maria de Jetibá, {new Date().getDate()} de {new Date().toLocaleString('pt-BR', { month: 'long' })} de {formData.ano}.
                                </div>

                                <div>
                                    Ao Senhor<br />
                                    <strong>{formData.destinatario_nome || '[Nome Destinatário]'}</strong><br />
                                    {formData.destinatario_cargo}<br />
                                    {formData.destinatario_orgao}
                                </div>

                                <div>
                                    <strong>Assunto:</strong> {formData.assunto || '[Assunto do Ofício]'}
                                </div>

                                <div className="text-justify indent-6">
                                    {formData.introducao}
                                </div>

                                {formData.considerandos.map((c, i) => (
                                    <div key={i} className="text-justify indent-12 text-slate-700 dark:text-slate-300">
                                        {c}
                                    </div>
                                ))}

                                <div className="mt-4">{formData.fecho}</div>

                                <div className="text-center pt-8 border-t border-slate-300/50 mt-6">
                                    <strong>{formData.signatario_nome}</strong><br />
                                    {formData.signatario_cargo}<br />
                                    <span className="text-[10px] text-slate-400">{formData.signatario_portaria}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-300 transition-colors"
                            >
                                <ArrowLeft size={16} /> Anterior
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveRascunho}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                            <Save size={16} /> Salvar Rascunho
                        </button>

                        {step < 5 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Próximo <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleEmitir}
                                disabled={loading}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                            >
                                <Send size={16} /> Emitir Ofício Definitivo
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NovoOficioModal;

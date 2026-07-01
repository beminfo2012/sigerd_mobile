import React, { useState, useRef } from 'react';
import {
    FileText, Upload, Trash2, CheckCircle, XCircle,
    AlertTriangle, Clock, Download, Eye, Plus, X,
    Paperclip, FileCheck, FileMinus, FilePlus, Edit3,
    BrainCircuit
} from 'lucide-react';
import {
    TIPOS_DOCUMENTO_REDAP,
    DOCS_OBRIGATORIOS_HOMOLOGACAO,
    saveDocumentoRedap,
    uploadArquivoDocumento,
    deleteDocumentoRedap,
    addHistoricoAcao,
    verificarDocumentosHomologacao
} from '../../../services/redapService';
import { useToast } from '../../../components/ToastNotification';
import { generateRedapDocumentIa } from '../../../services/ai';
import { buildRedapDocumentPrompt } from '../../../utils/redapDocumentPrompts';
import ReactMarkdown from 'react-markdown';

// ── Badge de obrigatoriedade ──────────────────────────────────
const ObrigBadge = ({ tipo }) => {
    const meta = TIPOS_DOCUMENTO_REDAP.find(t => t.value === tipo);
    if (!meta) return null;
    const map = {
        OBRIGATORIO: { label: 'Obrigatório', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
        CONDICIONAL:  { label: 'Condicional', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' },
        RECOMENDADO:  { label: 'Recomendado', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
        OPCIONAL:     { label: 'Opcional',    cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    };
    const { label, cls } = map[meta.obrigatoriedade] || map.OPCIONAL;
    return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
};

// ── Badge de status do documento ──────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ANEXADO:   { icon: <CheckCircle size={12} />, label: 'Anexado',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        DISPENSADO: { icon: <FileMinus size={12} />,   label: 'Dispensado', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
        PENDENTE:  { icon: <Clock size={12} />,        label: 'Pendente',  cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    const { icon, label, cls } = map[status] || map.PENDENTE;
    return (
        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
            {icon}{label}
        </span>
    );
};

// ── Modal de adição/edição de documento ───────────────────────
const DocumentoModal = ({ isOpen, onClose, onSave, eventoId, user, initialDoc = null, initialMode = 'create', onGenerateIa, isGeneratingIa }) => {
    const [mode, setMode] = useState(initialMode);
    const [tipo, setTipo] = useState(initialDoc?.tipo || TIPOS_DOCUMENTO_REDAP[0].value);
    const [nomePersonalizado, setNomePersonalizado] = useState(initialDoc?.nome_personalizado || TIPOS_DOCUMENTO_REDAP[0].value);
    const [numeroDoc, setNumeroDoc] = useState(initialDoc?.numero_documento || '');
    const [dataDoc, setDataDoc] = useState(initialDoc?.data_documento || '');
    const [observacao, setObservacao] = useState(initialDoc?.observacao || '');
    const [isDispensado, setIsDispensado] = useState(initialDoc?.status_documento === 'DISPENSADO');
    const [dispensadoMotivo, setDispensadoMotivo] = useState(initialDoc?.dispensado_motivo || '');
    const [arquivo, setArquivo] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();
    const { toast } = useToast();

    const mapTipoIa = {
        'Decreto de Situação de Emergência': 'DECRETO_SE',
        'Decreto de Estado de Calamidade Pública': 'DECRETO_ECP',
        'Ofício de Solicitação de Reconhecimento (SEDEC)': 'OFICIO_FEDERAL',
        'Ofício - Requerimento CEPDEC/ES': 'OFICIO_ESTADUAL',
        'Parecer Técnico da Defesa Civil': 'PARECER_TECNICO'
    };

    // Sincroniza o modo e os dados caso o modal seja reaberto
    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setTipo(initialDoc?.tipo || TIPOS_DOCUMENTO_REDAP[0].value);
            setNomePersonalizado(initialDoc?.nome_personalizado || (initialDoc?.tipo ? initialDoc.tipo : TIPOS_DOCUMENTO_REDAP[0].value));
            setNumeroDoc(initialDoc?.numero_documento || '');
            setDataDoc(initialDoc?.data_documento || '');
            setObservacao(initialDoc?.observacao || '');
            setIsDispensado(initialDoc?.status_documento === 'DISPENSADO');
            setDispensadoMotivo(initialDoc?.dispensado_motivo || '');
            setArquivo(null);
        }
    }, [isOpen, initialDoc, initialMode]);

    const handleTipoChange = (val) => {
        setTipo(val);
        if (val !== 'Outros') setNomePersonalizado(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (arquivo && arquivo.size > 20 * 1024 * 1024) {
            toast('Arquivo excede o limite de 20 MB.', 'error');
            return;
        }
        setSaving(true);
        try {
            const docPayload = {
                id: initialDoc?.id,
                evento_id: eventoId,
                tipo,
                nome_personalizado: nomePersonalizado || tipo,
                numero_documento: isDispensado ? '' : numeroDoc,
                data_documento: isDispensado ? null : (dataDoc || null),
                observacao,
                status_documento: isDispensado ? 'DISPENSADO' : (arquivo ? 'ANEXADO' : 'PENDENTE'),
                dispensado_motivo: isDispensado ? dispensadoMotivo : null,
            };

            const savedDoc = await saveDocumentoRedap(docPayload, user?.id);

            if (arquivo && savedDoc?.id) {
                await uploadArquivoDocumento(savedDoc.id, eventoId, arquivo);
            }

            // Registra no histórico
            await addHistoricoAcao({
                evento_id: eventoId,
                usuario_id: user?.id,
                usuario_nome: user?.full_name || 'Defesa Civil',
                acao: initialDoc?.id ? 'DOCUMENTO_ATUALIZADO' : 'DOCUMENTO_ADICIONADO',
                descricao: `Documento "${nomePersonalizado || tipo}" ${initialDoc?.id ? 'atualizado' : 'adicionado'}.`
            });

            onSave();
            onClose();
        } catch (err) {
            console.error('[Documentos] Erro completo:', err);
            toast(`Erro: ${err.message || 'Verifique as permissões ou a conexão.'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg border border-slate-200 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-black text-base uppercase tracking-wider">
                            {mode === 'view' ? 'Visualizar Documento' : mode === 'edit' ? 'Editar Documento' : 'Novo Documento'}
                        </h3>
                        <p className="text-blue-200 text-xs font-bold mt-0.5">Gestão Documental — REDAP</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Tipo e Gerador de IA */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Documento *</label>
                        <select
                            disabled={mode === 'view'}
                            value={tipo}
                            onChange={e => handleTipoChange(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed mb-2"
                        >
                            {TIPOS_DOCUMENTO_REDAP.map(t => (
                                <option key={t.value} value={t.value}>{t.value}</option>
                            ))}
                        </select>
                        
                        <div className="flex items-center gap-2">
                            <ObrigBadge tipo={tipo} />
                            {mapTipoIa[tipo] && mode !== 'view' && !isDispensado && (
                                <button
                                    type="button"
                                    onClick={() => onGenerateIa(mapTipoIa[tipo])}
                                    disabled={isGeneratingIa}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 transition-all hover:bg-purple-200 dark:hover:bg-purple-800/50 active:scale-95 disabled:opacity-50"
                                    title="Gerar rascunho com IA"
                                >
                                    {isGeneratingIa === mapTipoIa[tipo] ? <div className="w-3 h-3 border-2 border-purple-700 dark:border-purple-400 border-t-transparent rounded-full animate-spin" /> : <BrainCircuit size={12} />}
                                    Gerar por IA
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Botão Dispensar */}
                    {mode !== 'view' && (
                        <div className="py-1">
                            <button
                                type="button"
                                onClick={() => setIsDispensado(!isDispensado)}
                                className={`flex items-center justify-between w-full p-3 rounded-xl border text-xs font-bold transition-all ${isDispensado ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <FileMinus size={16} />
                                    Dispensar este documento
                                </span>
                                <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isDispensado ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDispensado ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Nome personalizado (para tipo "Outros") */}
                    {tipo === 'Outros' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nome do Documento *</label>
                            <input
                                type="text"
                                required
                                disabled={mode === 'view'}
                                value={nomePersonalizado}
                                onChange={e => setNomePersonalizado(e.target.value)}
                                placeholder="Descreva o tipo de documento"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                    )}

                    {!isDispensado && (
                        <div className="grid grid-cols-2 gap-3">
                            {/* Número */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Número (ex: Decreto nº 012)</label>
                                <input
                                    type="text"
                                    disabled={mode === 'view'}
                                    value={numeroDoc}
                                    onChange={e => setNumeroDoc(e.target.value)}
                                    placeholder="Nº do documento"
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                            {/* Data */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Data do Documento</label>
                                <input
                                    type="date"
                                    disabled={mode === 'view'}
                                    value={dataDoc}
                                    onChange={e => setDataDoc(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}

                    {/* Observação */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Observação</label>
                        <textarea
                            value={observacao}
                            disabled={mode === 'view'}
                            onChange={e => setObservacao(e.target.value)}
                            placeholder="Informações adicionais sobre o documento..."
                            rows={2}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Motivo da dispensa */}
                    {isDispensado && (
                        <div>
                            <label className="block text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1.5">Motivo da Dispensa * (obrigatório)</label>
                            <textarea
                                required
                                disabled={mode === 'view'}
                                value={dispensadoMotivo}
                                onChange={e => setDispensadoMotivo(e.target.value)}
                                placeholder="Justifique formalmente a ausência ou inaplicabilidade deste documento..."
                                rows={3}
                                className="w-full p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Upload de arquivo */}
                    {!isDispensado && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Arquivo (PDF, DOCX, JPG — máx. 20 MB)
                            </label>
                            <div
                                onClick={() => mode !== 'view' && fileRef.current?.click()}
                                className={`border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${mode === 'view' ? 'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'}`}
                            >
                                {arquivo ? (
                                    <>
                                        <FileCheck size={24} className="text-emerald-500" />
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center">{arquivo.name}</p>
                                        <p className="text-[10px] text-slate-400">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : initialDoc?.arquivo_url ? (
                                    <>
                                        <FileText size={24} className="text-blue-500" />
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Arquivo atual anexado</p>
                                        {mode !== 'view' && <p className="text-[10px] text-blue-500 mt-1">Clique para substituir</p>}
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-slate-400" />
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {mode === 'view' ? 'Nenhum arquivo anexado' : 'Clique para selecionar o arquivo'}
                                        </p>
                                    </>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    disabled={mode === 'view'}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={e => setArquivo(e.target.files[0] || null)}
                                />
                            </div>
                            {initialDoc?.arquivo_url && !arquivo && (
                                <a
                                    href={initialDoc.arquivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 hover:underline"
                                >
                                    <Download size={12} /> Ver arquivo atual
                                </a>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all"
                        >
                            {mode === 'view' ? 'Fechar' : 'Cancelar'}
                        </button>
                        {mode === 'view' ? (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode('edit'); }}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Edit3 size={14} /> Editar Documento
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all shadow-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileCheck size={14} />}
                                {saving ? 'Salvando...' : 'Salvar Documento'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────
const RedapDocumentosOficiais = ({ eventoId, user, documentos, eventData, onUpdate }) => {
    const { toast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [deletingId, setDeletingId] = useState(null);

    // AI States
    const [isGeneratingIa, setIsGeneratingIa] = useState(false);
    const [showIaModal, setShowIaModal] = useState(false);
    const [iaContent, setIaContent] = useState('');
    const [iaDocType, setIaDocType] = useState('');
    const [isSavingIa, setIsSavingIa] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const { liberado, pendentes } = verificarDocumentosHomologacao(documentos);

    const handleGenerateIa = async (docType) => {
        setIsGeneratingIa(docType);
        try {
            const prompt = buildRedapDocumentPrompt(eventData || {}, docType);
            const content = await generateRedapDocumentIa(prompt);
            
            if (content && !content.startsWith('ERROR:')) {
                setIaContent(content);
                setIaDocType(docType);
                setShowIaModal(true);
            } else {
                toast(content || 'Falha ao gerar o documento via IA. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('[Documentos AI] Erro:', error);
            toast('Erro inesperado ao gerar documento.', 'error');
        } finally {
            setIsGeneratingIa(false);
        }
    };

    const handleSaveIaDocument = async () => {
        setIsSavingIa(true);
        try {
            const mapIaToPayload = {
                'PARECER_TECNICO': { tipo: 'Parecer Técnico da Defesa Civil', nome: 'Parecer Técnico (Gerado por IA)', file: 'Parecer_Tecnico_IA.md' },
                'DECRETO_SE': { tipo: 'Decreto de Situação de Emergência', nome: 'Decreto Municipal SE (Gerado por IA)', file: 'Decreto_SE_IA.md' },
                'DECRETO_ECP': { tipo: 'Decreto de Estado de Calamidade Pública', nome: 'Decreto Municipal ECP (Gerado por IA)', file: 'Decreto_ECP_IA.md' },
                'OFICIO_FEDERAL': { tipo: 'Ofício de Solicitação de Reconhecimento (SEDEC)', nome: 'Ofício SEDEC (Gerado por IA)', file: 'Oficio_SEDEC_IA.md' },
                'OFICIO_ESTADUAL': { tipo: 'Ofício - Requerimento CEPDEC/ES', nome: 'Ofício CEPDEC/ES (Gerado por IA)', file: 'Oficio_CEPDEC_IA.md' }
            };
            const meta = mapIaToPayload[iaDocType] || mapIaToPayload['DECRETO_SE'];

            // Create a Text Blob representing the file
            const blob = new Blob([iaContent], { type: 'text/markdown;charset=utf-8' });
            // Criando um arquivo virtual do Blob
            const arquivo = new File([blob], meta.file, { type: 'text/markdown' });

            const docPayload = {
                evento_id: eventoId,
                tipo: meta.tipo,
                nome_personalizado: meta.nome,
                numero_documento: '',
                status_documento: 'ANEXADO',
                observacao: 'Documento base gerado por Inteligência Artificial.'
            };

            const savedDoc = await saveDocumentoRedap(docPayload, user?.id);

            if (savedDoc?.id) {
                await uploadArquivoDocumento(savedDoc.id, eventoId, arquivo);
                await addHistoricoAcao({
                    evento_id: eventoId,
                    usuario_id: user?.id,
                    usuario_nome: user?.full_name || 'Defesa Civil',
                    acao: 'DOCUMENTO_ADICIONADO',
                    descricao: `Documento gerado por IA "${docPayload.nome_personalizado}" salvo e anexado.`
                });
            }
            toast('Documento da IA salvo com sucesso!', 'success');
            setShowIaModal(false);
            onUpdate();
        } catch (error) {
            console.error('[Documentos AI] Save Error:', error);
            toast('Erro ao salvar o documento gerado.', 'error');
        } finally {
            setIsSavingIa(false);
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Excluir o documento "${doc.nome_personalizado}"?`)) return;
        setDeletingId(doc.id);
        try {
            await deleteDocumentoRedap(doc);
            await addHistoricoAcao({
                evento_id: eventoId,
                usuario_id: user?.id,
                usuario_nome: user?.full_name || 'Defesa Civil',
                acao: 'DOCUMENTO_EXCLUIDO',
                descricao: `Documento "${doc.nome_personalizado}" excluído.`
            });
            toast('Documento removido.', 'success');
            onUpdate();
        } catch {
            toast('Erro ao excluir documento.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip size={16} className="text-blue-500" /> Documentos Oficiais
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                        Exclusivo Defesa Civil / COMPDEC
                    </p>
                </div>
                <button
                    onClick={() => { setEditingDoc(null); setModalMode('create'); setShowModal(true); }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-1 shadow-md active:scale-95"
                >
                    <FilePlus size={14} /> Adicionar
                </button>
            </div>

            {/* Alerta de documentos obrigatórios pendentes */}
            {!liberado && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            ⚠ Para avançar para Homologação, os seguintes documentos precisam ser anexados ou dispensados:
                        </p>
                        <ul className="mt-1.5 space-y-0.5">
                            {pendentes.map(p => (
                                <li key={p} className="text-[11px] text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5">
                                    <XCircle size={10} /> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {liberado && documentos.length > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-2.5">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        Todos os documentos obrigatórios resolvidos — Homologação habilitada
                    </p>
                </div>
            )}



            {/* Modal de Texto IA */}
            {showIaModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[95vh] h-[90vh]">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between shrink-0">
                            <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                                <BrainCircuit size={16} /> Documento Gerado por IA
                            </h3>
                            <button onClick={() => setShowIaModal(false)} className="text-white/70 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shrink-0">
                            <button 
                                onClick={() => setShowPreview(true)}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${showPreview ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 bg-white dark:bg-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Eye size={14} className="inline mr-2" />
                                Visualizar Formatado
                            </button>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${!showPreview ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-white dark:bg-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Edit3 size={14} className="inline mr-2" />
                                Editar Texto Markdown
                            </button>
                        </div>

                        <div className="p-0 flex-1 overflow-y-auto bg-white dark:bg-slate-950 relative">
                            {showPreview ? (
                                <div className="p-6 md:p-8 prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none">
                                    <ReactMarkdown>{iaContent}</ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={iaContent}
                                    onChange={(e) => setIaContent(e.target.value)}
                                    className="w-full h-full min-h-[400px] p-6 bg-slate-50 dark:bg-slate-950 border-none text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
                                />
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowIaModal(false)} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase transition-all hover:bg-slate-300 dark:hover:bg-slate-600">
                                Cancelar
                            </button>
                            <button onClick={handleSaveIaDocument} disabled={isSavingIa} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50">
                                {isSavingIa ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                                Salvar como Anexo Oficial
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de documentos */}
            <div className="space-y-3">
                {documentos.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                        <FileText size={36} className="text-slate-200 dark:text-slate-700 mx-auto" />
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Nenhum documento cadastrado
                        </p>
                        <p className="text-[11px] text-slate-400">Adicione os documentos oficiais do processo</p>
                    </div>
                ) : (
                    documentos.map(doc => (
                        <div
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl shrink-0 mt-0.5">
                                    <FileText size={16} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{doc.nome_personalizado}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <StatusBadge status={doc.status_documento} />
                                        <ObrigBadge tipo={doc.tipo} />
                                        {doc.numero_documento && (
                                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {doc.numero_documento}
                                            </span>
                                        )}
                                        {doc.data_documento && (
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {new Date(doc.data_documento + 'T00:00').toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    {doc.status_documento === 'DISPENSADO' && doc.dispensado_motivo && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic truncate max-w-xs">
                                            Motivo: {doc.dispensado_motivo}
                                        </p>
                                    )}
                                    {doc.observacao && (
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">{doc.observacao}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {doc.arquivo_url && (
                                    <a
                                        href={doc.arquivo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                                        title="Baixar arquivo"
                                    >
                                        <Download size={14} />
                                    </a>
                                )}
                                <button
                                    onClick={() => { setEditingDoc(doc); setModalMode('view'); setShowModal(true); }}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                    title="Visualizar"
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
                                    title="Excluir"
                                >
                                    {deletingId === doc.id
                                        ? <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={14} />
                                    }
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de adição/edição */}
            <DocumentoModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingDoc(null); }}
                onSave={onUpdate}
                eventoId={eventoId}
                user={user}
                initialDoc={editingDoc}
                initialMode={modalMode}
                onGenerateIa={handleGenerateIa}
                isGeneratingIa={isGeneratingIa}
            />
        </div>
    );
};

export default RedapDocumentosOficiais;

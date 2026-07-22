import React, { useState, useEffect } from 'react';
import { 
    X, FileText, Send, Loader2, CheckCircle, AlertTriangle, 
    Paperclip, Trash2, Building2, Tag, Info, ShieldAlert,
    User, MapPin, Calendar, FileCheck, Image as ImageIcon, Save
} from 'lucide-react';
import { saveDespachoOffline, getNextDespachoId } from '../services/db';
import { generateDespachoPDF } from '../utils/despachoGenerator';

const SETORES_OPCOES = [
    'Defesa Civil',
    'Secretaria de Obras',
    'Secretaria de Assistência Social',
    'Secretaria de Meio Ambiente',
    'Procuradoria',
    'Fiscalização',
    'Gabinete',
    'Engenharia',
    'Prefeitura',
    'Outro'
];

const TIPOS_DESPACHO = [
    'Encaminhamento',
    'Solicitação de Providências',
    'Solicitação de Parecer',
    'Solicitação de Fiscalização',
    'Comunicação',
    'Informação',
    'Ciência',
    'Arquivamento',
    'Interdição',
    'Desinterdição',
    'Outro'
];

const DespachoModal = ({ isOpen, onClose, vistoriaData, userProfile, initialDespacho, onDespachoCreated }) => {
    if (!isOpen) return null;

    const [nextId, setNextId] = useState('...');
    const [destinatarios, setDestinatarios] = useState([]);
    const [outroDestinatario, setOutroDestinatario] = useState('');
    const [tipoDespacho, setTipoDespacho] = useState('Encaminhamento');
    const [outroTipo, setOutroTipo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [fundamentacao, setFundamentacao] = useState('');
    const [anexos, setAnexos] = useState([]);
    
    const [generating, setGenerating] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: Sucesso

    const isEditing = Boolean(initialDespacho);

    useEffect(() => {
        setStep(1);
        if (initialDespacho) {
            // Editing existing despacho
            const dId = initialDespacho.despachoId || initialDespacho.despacho_id || '---';
            setNextId(dId);

            const dests = Array.isArray(initialDespacho.destino) 
                ? initialDespacho.destino 
                : (initialDespacho.destino ? [initialDespacho.destino] : []);
            
            const knownDests = dests.filter(d => SETORES_OPCOES.includes(d));
            const customDests = dests.filter(d => !SETORES_OPCOES.includes(d));

            if (customDests.length > 0) {
                setDestinatarios([...knownDests, 'Outro']);
                setOutroDestinatario(customDests.join(', '));
            } else {
                setDestinatarios(knownDests);
            }

            if (TIPOS_DESPACHO.includes(initialDespacho.tipoDespacho)) {
                setTipoDespacho(initialDespacho.tipoDespacho);
            } else if (initialDespacho.tipoDespacho) {
                setTipoDespacho('Outro');
                setOutroTipo(initialDespacho.tipoDespacho);
            }

            setConteudo(initialDespacho.conteudo || '');
            setFundamentacao(initialDespacho.fundamentacao || '');
            setAnexos(initialDespacho.anexos || []);
        } else {
            // Creating new despacho
            getNextDespachoId().then(setNextId);
            setDestinatarios([]);
            setOutroDestinatario('');
            setTipoDespacho('Encaminhamento');
            setOutroTipo('');
            setFundamentacao('');
            setAnexos([]);

            if (vistoriaData) {
                const vistoriaIdStr = vistoriaData.vistoriaId || vistoriaData.id || '---';
                updateDefaultConteudo('Encaminhamento', vistoriaIdStr);
                if (vistoriaData.observacoes) {
                    setFundamentacao(`Constatou-se situação de risco registrada no relatório de vistoria nº ${vistoriaIdStr}.`);
                }
            }
        }
    }, [initialDespacho, vistoriaData, isOpen]);

    const updateDefaultConteudo = (tipo, vistoriaIdStr) => {
        const vId = vistoriaIdStr || vistoriaData?.vistoriaId || vistoriaData?.id || '---';
        let defaultText = '';
        
        switch (tipo) {
            case 'Encaminhamento':
                defaultText = `Considerando o Relatório de Vistoria Técnica nº ${vId}, encaminham-se os autos ao(s) setor(es) acima identificado(s) para adoção das providências cabíveis quanto às situações constatadas.`;
                break;
            case 'Solicitação de Providências':
                defaultText = `Tendo em vista as irregularidades/riscos apontados no Relatório de Vistoria Técnica nº ${vId}, solicita-se a adoção urgente de providências operacionais/estruturais.`;
                break;
            case 'Solicitação de Parecer':
                defaultText = `Solicita-se a emissão de parecer técnico/jurídico especializado referente às constatações descritas no Relatório de Vistoria Técnica nº ${vId}.`;
                break;
            case 'Solicitação de Fiscalização':
                defaultText = `Solicita-se vistoria e fiscalização in loco no endereço supracitado para verificação do cumprimento das normas técnicas e medidas mitigadoras.`;
                break;
            case 'Interdição':
                defaultText = `Determina-se a INTERDIÇÃO preventiva do imóvel/local indicado no Relatório de Vistoria nº ${vId}, até que sejam concluídas as obras de mitigação de risco.`;
                break;
            case 'Desinterdição':
                defaultText = `Diante do cumprimento das exigências técnicas comprovadas, determina-se a DESINTERDIÇÃO do imóvel/área vinculada ao Relatório nº ${vId}.`;
                break;
            default:
                defaultText = `Considerando o Relatório de Vistoria Técnica nº ${vId}, encaminham-se os autos ao setor acima identificado para as medidas cabíveis.`;
                break;
        }
        setConteudo(defaultText);
    };

    const handleTipoChange = (newTipo) => {
        setTipoDespacho(newTipo);
        if (newTipo !== 'Outro' && !isEditing) {
            updateDefaultConteudo(newTipo);
        }
    };

    const toggleDestinatario = (setor) => {
        if (destinatarios.includes(setor)) {
            setDestinatarios(destinatarios.filter(s => s !== setor));
        } else {
            setDestinatarios([...destinatarios, setor]);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newAnexos = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve({
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        type: file.type.includes('image') ? 'Foto' : file.type.includes('pdf') ? 'PDF' : 'Documento',
                        dataUrl: event.target.result
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newAnexos).then(loadedAnexos => {
            setAnexos(prev => [...prev, ...loadedAnexos]);
        });
    };

    const removeAnexo = (index) => {
        setAnexos(anexos.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        // Validation
        if (destinatarios.length === 0 && !outroDestinatario.trim()) {
            alert('Selecione ao menos um destinatário para o despacho.');
            return;
        }
        if (!conteudo.trim()) {
            alert('O conteúdo do despacho é obrigatório.');
            return;
        }

        setGenerating(true);
        try {
            const finalDestinatarios = destinatarios.map(d => d === 'Outro' ? outroDestinatario : d).filter(Boolean);
            if (destinatarios.includes('Outro') && outroDestinatario.trim()) {
                if (!finalDestinatarios.includes(outroDestinatario)) finalDestinatarios.push(outroDestinatario);
            }

            const finalTipo = tipoDespacho === 'Outro' ? (outroTipo || 'Despacho Administrativo') : tipoDespacho;

            const processoVal = vistoriaData?.processo || vistoriaData?.processo_origem || initialDespacho?.processo || '';
            const vistoriaRefVal = vistoriaData?.vistoriaId || vistoriaData?.id || initialDespacho?.vistoriaRef || '';
            const solicitanteVal = vistoriaData?.solicitante || initialDespacho?.solicitante || '';
            const interessadoVal = vistoriaData?.interessado || vistoriaData?.requerente || initialDespacho?.interessado || '';
            const enderecoVal = vistoriaData?.endereco || vistoriaData?.local || vistoriaData?.bairro || initialDespacho?.endereco || '';
            const riscoVal = vistoriaData?.grauRisco || vistoriaData?.classificacaoRisco || vistoriaData?.risco || initialDespacho?.classificacaoRisco || '';

            const despachoData = {
                ...(initialDespacho || {}),
                despachoId: nextId,
                despacho_id: nextId,
                processo: processoVal,
                vistoriaRef: vistoriaRefVal,
                vistoria_id: vistoriaRefVal,
                dataVistoria: vistoriaData?.dataHora || vistoriaData?.data_vistoria || initialDespacho?.dataVistoria || new Date().toISOString(),
                solicitante: solicitanteVal,
                interessado: interessadoVal,
                endereco: enderecoVal,
                classificacaoRisco: riscoVal,
                destino: finalDestinatarios,
                tipoDespacho: finalTipo,
                conteudo,
                fundamentacao,
                anexos,
                responsavel: userProfile?.full_name || userProfile?.nome || initialDespacho?.responsavel || 'Coordenador Defesa Civil',
                matricula: userProfile?.matricula || initialDespacho?.matricula || '---',
                assinatura: userProfile?.signature || userProfile?.assinatura || initialDespacho?.assinatura || '',
                dataEmissao: initialDespacho?.dataEmissao || new Date().toISOString()
            };

            // 1. Save locally to DB indexed store
            await saveDespachoOffline(despachoData);

            // 2. Generate and open PDF for printing
            await generateDespachoPDF(despachoData);

            if (onDespachoCreated) {
                onDespachoCreated(despachoData);
            }

            setStep(2);
        } catch (error) {
            console.error('Erro ao salvar/emitir despacho:', error);
            alert('Falha ao emitir despacho. Verifique os dados e tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const processoVal = vistoriaData?.processo || vistoriaData?.processo_origem || initialDespacho?.processo || '';
    const vistoriaRefVal = vistoriaData?.vistoriaId || vistoriaData?.id || initialDespacho?.vistoriaRef || '';
    const solicitanteVal = vistoriaData?.solicitante || initialDespacho?.solicitante || '';
    const interessadoVal = vistoriaData?.interessado || vistoriaData?.requerente || initialDespacho?.interessado || '';
    const enderecoVal = vistoriaData?.endereco || vistoriaData?.local || vistoriaData?.bairro || initialDespacho?.endereco || '';
    const riscoVal = vistoriaData?.grauRisco || vistoriaData?.classificacaoRisco || vistoriaData?.risco || initialDespacho?.classificacaoRisco || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header Modal */}
                <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2a5299] p-5 flex justify-between items-center text-white shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                            <FileText className="text-blue-200" size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg tracking-wide flex items-center gap-2">
                                {isEditing ? 'Editar Despacho Oficial' : 'Novo Despacho Oficial'}
                                <span className="bg-blue-400/30 text-blue-100 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                                    {nextId}
                                </span>
                            </h3>
                            <p className="text-xs text-blue-200 font-medium">Coordenadoria Municipal de Proteção e Defesa Civil</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                {step === 1 ? (
                    <div className="p-5 sm:p-7 space-y-7 overflow-y-auto custom-scrollbar flex-1">

                        {/* 1. Dados do Processo (Automáticos & Não editáveis) */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <FileCheck className="text-blue-600 dark:text-blue-400" size={18} />
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    1. Dados do Processo & Vistoria (Preenchimento Automático)
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block mb-0.5">Nº do Despacho</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                        {nextId}
                                    </span>
                                </div>
                                {processoVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Processo de Origem</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {processoVal}
                                        </span>
                                    </div>
                                )}
                                {vistoriaRefVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Relatório de Vistoria</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            Nº {vistoriaRefVal}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400 font-medium block mb-0.5">Data da Vistoria</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {vistoriaData?.dataHora 
                                            ? new Date(vistoriaData.dataHora).toLocaleDateString('pt-BR') 
                                            : new Date().toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                {solicitanteVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Solicitante</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {solicitanteVal}
                                        </span>
                                    </div>
                                )}
                                {interessadoVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Interessado</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {interessadoVal}
                                        </span>
                                    </div>
                                )}
                                {enderecoVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Local da Ocorrência</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {enderecoVal}
                                        </span>
                                    </div>
                                )}
                                {riscoVal && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-0.5">Classificação do Risco</span>
                                        <span className="inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                            <ShieldAlert size={12} />
                                            {riscoVal}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Destinatário (Multi-select) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 size={16} className="text-blue-600" />
                                    2. Destinatário (Múltiplos)
                                </label>
                                <span className="text-[11px] text-slate-400">Selecione um ou mais setores</span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                {SETORES_OPCOES.map((setor) => {
                                    const isSelected = destinatarios.includes(setor);
                                    return (
                                        <button
                                            key={setor}
                                            type="button"
                                            onClick={() => toggleDestinatario(setor)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {isSelected && <CheckCircle size={14} />}
                                            {setor}
                                        </button>
                                    );
                                })}
                            </div>

                            {destinatarios.includes('Outro') && (
                                <input
                                    type="text"
                                    placeholder="Digite o nome do setor ou destinatário..."
                                    className="mt-3 w-full p-3 bg-slate-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                                    value={outroDestinatario}
                                    onChange={e => setOutroDestinatario(e.target.value)}
                                />
                            )}
                        </div>

                        {/* 3. Tipo de Despacho */}
                        <div>
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-2">
                                <Tag size={16} className="text-blue-600" />
                                3. Tipo de Despacho
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {TIPOS_DESPACHO.map((tipo) => {
                                    const isSelected = tipoDespacho === tipo;
                                    return (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => handleTipoChange(tipo)}
                                            className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                                                isSelected 
                                                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow' 
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tipo}
                                        </button>
                                    );
                                })}
                            </div>

                            {tipoDespacho === 'Outro' && (
                                <input
                                    type="text"
                                    placeholder="Especifique o tipo de despacho..."
                                    className="mt-3 w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-white"
                                    value={outroTipo}
                                    onChange={e => setOutroTipo(e.target.value)}
                                />
                            )}
                        </div>

                        {/* 4. Conteúdo */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600" />
                                    4. Conteúdo do Despacho
                                </label>
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                                    {isEditing ? 'Edição' : 'Pré-preenchido'}
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                value={conteudo}
                                onChange={e => setConteudo(e.target.value)}
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed font-medium outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white resize-y"
                                placeholder="Digite o conteúdo do despacho..."
                            />
                        </div>

                        {/* 5. Fundamentação (Opcional) */}
                        <div>
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-2">
                                <Info size={16} className="text-amber-500" />
                                5. Fundamentação Técnica / Jurídica (Opcional)
                            </label>
                            <textarea
                                rows={2}
                                value={fundamentacao}
                                onChange={e => setFundamentacao(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed font-medium outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-white placeholder-slate-400"
                                placeholder="Ex: Constatou-se risco geológico decorrente de movimentação de massa..."
                            />
                        </div>

                        {/* 6. Anexos */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Paperclip size={16} className="text-blue-600" />
                                    6. Anexos (Fotos, Laudos, PDFs, Croquis)
                                </label>
                                <label className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                    <Paperclip size={14} /> + Adicionar Arquivo
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*,application/pdf,.doc,.docx"
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>

                            {anexos.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30">
                                    Nenhum anexo adicionado ainda. Clique acima para incluir fotos, PDFs ou documentos.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {anexos.map((anexo, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                {anexo.type === 'Foto' ? <ImageIcon size={16} className="text-emerald-500 shrink-0" /> : <FileText size={16} className="text-blue-500 shrink-0" />}
                                                <div className="truncate">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">{anexo.name}</span>
                                                    <span className="text-[10px] text-slate-400">{anexo.size} • {anexo.type}</span>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => removeAnexo(idx)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Informação sobre Assinatura */}
                        {!userProfile?.signature && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3.5 rounded-2xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800/40">
                                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                                <div>
                                    <span className="font-bold block">Assinatura Digital não configurada:</span>
                                    Você pode configurar sua assinatura visual no menu de perfil do usuário. O despacho será emitido com seus dados funcionais.
                                </div>
                            </div>
                        )}

                        {/* Botão Emissão / Salvar */}
                        <div className="pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#2a5299] hover:from-[#1e336b] hover:to-[#1e3a8a] text-white p-4 rounded-2xl font-extrabold flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all shadow-xl shadow-blue-900/20"
                            >
                                {generating ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? <Save size={20} /> : <Send size={20} />)}
                                {generating ? 'Processando Despacho e PDF...' : (isEditing ? 'Salvar Alterações e Gerar PDF' : 'Emitir Despacho Oficial')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
                            <CheckCircle size={44} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                {isEditing ? 'Despacho Atualizado com Sucesso!' : 'Despacho Emitido com Sucesso!'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto mt-2 leading-relaxed">
                                O despacho foi registrado no banco de dados, vinculado ao histórico desta vistoria e o documento PDF oficial foi gerado.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Fechar e Retornar à Vistoria
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DespachoModal;

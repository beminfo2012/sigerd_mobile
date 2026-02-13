import React, { useState, useEffect } from 'react';
import { X, FileText, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { saveDespachoOffline, getNextDespachoId } from '../services/db';
import { generateDespachoPDF } from '../utils/despachoGenerator';

const SETORES = [
    'Secretaria de Obras e Serviços Urbanos',
    'Secretaria de Assistência Social',
    'Secretaria de Meio Ambiente',
    'Secretaria de Saúde',
    'Secretaria de Educação',
    'Secretaria de Agricultura',
    'Procuradoria Geral',
    'Gabinete do Prefeito',
    'Outros'
];

const DespachoModal = ({ isOpen, onClose, vistoriaData, userProfile }) => {
    if (!isOpen) return null;

    const [destino, setDestino] = useState('');
    const [outroDestino, setOutroDestino] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [generating, setGenerating] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [nextId, setNextId] = useState('...');

    useEffect(() => {
        // Auto-fill suggestion based on vistoria
        if (vistoriaData) {
            setConteudo(`Considerando o Relatório de Vistoria Técnica nº ${vistoriaData.vistoriaId}, solicito avaliação para providências cabíveis quanto aos riscos identificados.`);
            if (vistoriaData.observacoes) {
                setObservacoes(`Notas da Vistoria: ${vistoriaData.observacoes.substring(0, 200)}...`);
            }
        }

        // Fetch next ID
        getNextDespachoId().then(setNextId);
    }, [vistoriaData]);

    const handleGenerate = async () => {
        if (!destino || (destino === 'Outros' && !outroDestino)) {
            alert('Selecione o setor de destino.');
            return;
        }
        if (!conteudo.trim()) {
            alert('O conteúdo do despacho é obrigatório.');
            return;
        }

        setGenerating(true);
        try {
            const finalDestino = destino === 'Outros' ? outroDestino : destino;

            const despachoData = {
                despachoId: nextId,
                processo: vistoriaData.processo || 'N/A',
                solicitante: vistoriaData.solicitante || 'Não Informado',
                cpf: vistoriaData.cpf || '---',
                endereco: vistoriaData.endereco || '---',
                vistoriaRef: vistoriaData.vistoriaId,
                dataVistoria: vistoriaData.dataHora,
                destino: finalDestino,
                conteudo,
                observacoes,
                responsavel: userProfile.full_name,
                matricula: userProfile.matricula,
                assinatura: userProfile.signature
            };

            // 1. Save to DB
            await saveDespachoOffline(despachoData);

            // 2. Generate PDF
            await generateDespachoPDF(despachoData);

            setStep(2);
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar despacho.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-[#2a5299] p-5 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="text-blue-200" />
                        Gerar Despacho
                        <span className="bg-blue-400/30 px-2 py-0.5 rounded text-xs font-mono">{nextId}</span>
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>

                {step === 1 ? (
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor de Destino</label>
                            <select
                                value={destino}
                                onChange={e => setDestino(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">Selecione...</option>
                                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {destino === 'Outros' && (
                                <input
                                    type="text"
                                    placeholder="Especifique o setor..."
                                    className="mt-2 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                    value={outroDestino}
                                    onChange={e => setOutroDestino(e.target.value)}
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Determinação / Conteúdo</label>
                            <textarea
                                rows={5}
                                value={conteudo}
                                onChange={e => setConteudo(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Descreva a determinação..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Adicionais (Opcional)</label>
                            <textarea
                                rows={3}
                                value={observacoes}
                                onChange={e => setObservacoes(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {!userProfile.signature && (
                            <div className="bg-yellow-50 p-3 rounded-xl flex items-start gap-2 text-yellow-700 text-xs font-bold border border-yellow-100">
                                <AlertTriangle size={16} className="shrink-0" />
                                Você não configurou sua assinatura digital no Menu. O documento sairá sem assinatura visual.
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full bg-[#2a5299] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3c72] active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                        >
                            {generating ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {generating ? 'Gerando Documento...' : 'Emitir Despacho Oficial'}
                        </button>
                    </div>
                ) : (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-12 duration-500">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Despacho Gerado!</h3>
                            <p className="text-slate-500 mt-2">O documento foi salvo no histórico e o PDF foi gerado para compartilhamento.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 text-slate-600 p-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Fechar e Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DespachoModal;

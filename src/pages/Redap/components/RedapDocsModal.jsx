import React, { useState, useEffect } from 'react';
import { X, FileStack, ChevronDown, ChevronUp, Download, Info } from 'lucide-react';
import { generateRedapDoc } from '../../../utils/redapDocTemplates';
import { saveRedapLocal } from '../../../services/redapDb';

const RedapDocsModal = ({ isOpen, onClose, record, onUpdate }) => {
    const [metadata, setMetadata] = useState(record?.data?.metadata_oficial || {});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setMetadata(record.data.metadata_oficial || {});
        }
    }, [record]);

    if (!isOpen || !record) return null;

    const updateMetadata = (field, value) => {
        setMetadata(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAndGenerate = async (type) => {
        try {
            setSaving(true);
            const updatedRecord = {
                ...record,
                data: {
                    ...record.data,
                    metadata_oficial: metadata
                }
            };

            // Save metadata first
            await saveRedapLocal(updatedRecord);
            if (onUpdate) onUpdate();

            // Generate document
            await generateRedapDoc(type, { ...record.data, ...metadata });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FileStack className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Documentos Oficiais</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.data.tipificacao.denominacao}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-10">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                        <Info className="text-blue-600 shrink-0" size={20} />
                        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                            Preencha as informações abaixo para que o sistema possa automatizar a geração dos documentos oficiais (Decreto, Ofício e Parecer Técnico). Os dados serão salvos no registro corrente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Configurações Gerais</h3>
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome do Prefeito</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                    value={metadata.nome_prefeito || ''}
                                    onChange={(e) => updateMetadata('nome_prefeito', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Cód. Protocolo REDAP</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="UF-F-0000000-00000-00000000"
                                    value={metadata.protocolo_redap || ''}
                                    onChange={(e) => updateMetadata('protocolo_redap', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Dados do Decreto</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nº Decreto</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        value={metadata.decreto_numero || ''}
                                        onChange={(e) => updateMetadata('decreto_numero', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Vigência (Dias)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        value={metadata.decreto_vigencia || '180'}
                                        onChange={(e) => updateMetadata('decreto_vigencia', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data Publicação D.O.</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="Ex: Edição 2432 de 12/02/2026"
                                    value={metadata.diario_oficial_info || ''}
                                    onChange={(e) => updateMetadata('diario_oficial_info', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-100 pb-2">Requerimento Federal</h3>
                        <div>
                            <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1.5 ml-1">Justificativa da Necessidade de Reconhecimento</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-indigo-100 rounded-xl text-xs min-h-[100px] focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="Descreva a motivação da necessidade do reconhecimento federal e os benefícios pleiteados..."
                                value={metadata.justificativa_federal || ''}
                                onChange={(e) => updateMetadata('justificativa_federal', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 gap-3 pt-6">
                        <button
                            onClick={() => handleSaveAndGenerate('decreto')}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 flex items-center justify-between group transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-blue-100"
                        >
                            <div className="text-left">
                                <p className="text-[11px] font-black uppercase tracking-tighter">1. Gerar Decreto Municipal</p>
                                <p className="text-[9px] text-blue-100 font-medium">Declaração de SE/ECP baseada no FIDE</p>
                            </div>
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        <button
                            onClick={() => handleSaveAndGenerate('oficio')}
                            disabled={saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-4 flex items-center justify-between group transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-indigo-100"
                        >
                            <div className="text-left">
                                <p className="text-[11px] font-black uppercase tracking-tighter">2. Gerar Ofício de Requerimento</p>
                                <p className="text-[9px] text-indigo-100 font-medium">Solicitação formal de Reconhecimento Federal</p>
                            </div>
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        <button
                            onClick={() => handleSaveAndGenerate('parecer')}
                            disabled={saving}
                            className="w-full bg-slate-700 hover:bg-slate-800 text-white rounded-2xl p-4 flex items-center justify-between group transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-slate-100"
                        >
                            <div className="text-left">
                                <p className="text-[11px] font-black uppercase tracking-tighter">3. Gerar Parecer Técnico</p>
                                <p className="text-[9px] text-slate-300 font-medium">Fundamentação técnica e conclusão operacional</p>
                            </div>
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                    >
                        Fechar Painel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedapDocsModal;

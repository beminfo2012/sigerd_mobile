import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { saveAreaAtuacao } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';

const AreaAtuacaoModal = ({ isOpen, onClose, areasDisponiveis, areasSelecionadas, onConfirm, onAreaCreated }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);
    
    // We keep track of the areas selected during this modal session
    // Initially, it could be empty, or we could pass the currently selected areas.
    // The user said: "e de para selecionar mais de uma, aparecendo a opção na frente apos a confirmação"
    const [tempSelected, setTempSelected] = useState([]);

    if (!isOpen) return null;

    // Filter out areas that are already in the main form's areasSelecionadas
    const availableToSelect = areasDisponiveis.filter(
        a => !areasSelecionadas.some(s => s.area_id === a.id)
    );

    const filteredAreas = availableToSelect.filter(a => 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.descricao && a.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSelection = (area) => {
        if (tempSelected.some(t => t.id === area.id)) {
            setTempSelected(tempSelected.filter(t => t.id !== area.id));
        } else {
            setTempSelected([...tempSelected, area]);
        }
    };

    const handleCreateNew = async () => {
        if (!searchTerm.trim()) return;
        setCreating(true);
        try {
            const newArea = await saveAreaAtuacao({ nome: searchTerm.trim(), descricao: '' });
            if (newArea) {
                toast.success('Nova área adicionada com sucesso!');
                onAreaCreated(newArea); // Update parent's areasDisponiveis
                setTempSelected([...tempSelected, newArea]);
                setSearchTerm(''); // Clear search
            }
        } catch (error) {
            toast.error('Erro ao criar área. Talvez já exista.');
        } finally {
            setCreating(false);
        }
    };

    const handleConfirm = () => {
        onConfirm(tempSelected);
        setTempSelected([]);
        setSearchTerm('');
        onClose();
    };

    const handleClose = () => {
        setTempSelected([]);
        setSearchTerm('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Adicionar Habilidades</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Selecione as áreas de atuação</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search / Create */}
                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar área ou digitar nova..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-bold text-sm text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    
                    {searchTerm.trim() && filteredAreas.length === 0 && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                "{searchTerm}" não encontrada.
                            </span>
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                disabled={creating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {creating ? 'Salvando...' : <><Plus size={14} /> Incluir Nova</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-2">
                    {filteredAreas.length > 0 ? (
                        filteredAreas.map((area) => {
                            const isSelected = tempSelected.some(t => t.id === area.id);
                            return (
                                <div 
                                    key={area.id}
                                    onClick={() => toggleSelection(area)}
                                    className={`p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                                        isSelected 
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                                        isSelected 
                                        ? 'bg-purple-500 border-purple-500 text-white' 
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                                    }`}>
                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black ${isSelected ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {area.nome}
                                        </p>
                                        {area.descricao && (
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-1">{area.descricao}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !searchTerm.trim() && (
                            <div className="text-center py-8 text-slate-400 text-sm font-medium">
                                Nenhuma área disponível para adicionar.
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={tempSelected.length === 0}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        Confirmar ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AreaAtuacaoModal;

import React, { useState, useEffect } from 'react';
import { getProgramasVoluntariado, saveProgramaVoluntariado, deleteProgramaVoluntariado } from '../../services/voluntariosService';
import { X, Plus, Edit2, Trash2, Check, Shield, Award, Users, Radio, HeartHandshake } from 'lucide-react';
import { useToast } from '../../components/ToastNotification';

const ICONS = ['Shield', 'Users', 'Radio', 'HeartHandshake', 'Award'];
const COLORS = ['blue', 'emerald', 'amber', 'rose', 'purple', 'indigo'];

const ProgramasModal = ({ onClose, onUpdate }) => {
    const { toast } = useToast();
    const [programas, setProgramas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProg, setEditingProg] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getProgramasVoluntariado();
            setProgramas(data);
        } catch (error) {
            toast.error('Erro ao carregar programas.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (prog) => {
        setEditingProg(prog ? { ...prog } : { nome: '', descricao: '', cor: 'blue', icone: 'Shield' });
    };

    const handleSave = async () => {
        if (!editingProg.nome.trim()) {
            toast.error('O nome do programa é obrigatório.');
            return;
        }
        try {
            await saveProgramaVoluntariado(editingProg);
            toast.success('Programa salvo com sucesso!');
            setEditingProg(null);
            loadData();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao salvar programa.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este programa? Os voluntários vinculados ficarão sem programa (Geral).')) {
            try {
                await deleteProgramaVoluntariado(id);
                toast.success('Programa excluído.');
                loadData();
                if (onUpdate) onUpdate();
            } catch (error) {
                toast.error('Erro ao excluir programa.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">Programas de Voluntariado</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {editingProg ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                                {editingProg.id ? 'Editar Programa' : 'Novo Programa'}
                            </h3>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Nome do Programa</label>
                                <input 
                                    type="text" 
                                    value={editingProg.nome} 
                                    onChange={(e) => setEditingProg({...editingProg, nome: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-medium text-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Descrição</label>
                                <textarea 
                                    value={editingProg.descricao || ''} 
                                    onChange={(e) => setEditingProg({...editingProg, descricao: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-medium text-slate-800 dark:text-white resize-none"
                                    rows="2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Cor Base</label>
                                    <div className="flex gap-2">
                                        {COLORS.map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setEditingProg({...editingProg, cor: c})}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${editingProg.cor === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: `var(--tw-colors-${c}-500, ${c})` }}
                                            >
                                                {/* Representação visual simples, no Tailwind a classe bg-${c}-500 seria ideal */}
                                                <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Ícone</label>
                                    <div className="flex gap-2">
                                        {ICONS.map(i => {
                                            const IconComp = { Shield, Users, Radio, HeartHandshake, Award }[i];
                                            return (
                                                <button 
                                                    key={i}
                                                    onClick={() => setEditingProg({...editingProg, icone: i})}
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${editingProg.icone === i ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <IconComp size={16} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button onClick={() => setEditingProg(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                <button onClick={handleSave} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
                                    <Check size={16} /> Salvar Programa
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={() => handleEdit(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl text-xs font-bold transition-colors">
                                    <Plus size={16} /> Adicionar Programa
                                </button>
                            </div>

                            {loading ? (
                                <p className="text-center text-slate-500 py-8">Carregando programas...</p>
                            ) : programas.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">Nenhum programa cadastrado.</p>
                            ) : (
                                <div className="space-y-3">
                                    {programas.map(prog => (
                                        <div key={prog.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-300 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{prog.nome}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{prog.descricao || 'Sem descrição'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(prog)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(prog.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgramasModal;

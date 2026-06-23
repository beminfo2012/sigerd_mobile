import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { getAreasAtuacao, saveAreaAtuacao, deleteAreaAtuacao } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';

const HabilidadesList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState({ id: null, nome: '', descricao: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = async () => {
        setLoading(true);
        try {
            const data = await getAreasAtuacao();
            setAreas(data);
        } catch (error) {
            toast.error('Erro ao carregar áreas de atuação.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (area = null) => {
        if (area) {
            setEditingArea({ id: area.id, nome: area.nome, descricao: area.descricao || '' });
        } else {
            setEditingArea({ id: null, nome: '', descricao: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingArea({ id: null, nome: '', descricao: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!editingArea.nome.trim()) {
            toast.warning('O nome da área é obrigatório.');
            return;
        }

        setSaving(true);
        try {
            await saveAreaAtuacao(editingArea);
            toast.success('Área salva com sucesso!');
            closeModal();
            loadAreas();
        } catch (error) {
            toast.error('Erro ao salvar. Pode ser que o nome já exista.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta área de atuação? Voluntários vinculados a ela poderão perder a referência.')) {
            try {
                await deleteAreaAtuacao(id);
                toast.success('Área excluída com sucesso.');
                loadAreas();
            } catch (error) {
                toast.error('Erro ao excluir. A área pode estar em uso.');
            }
        }
    };

    const filteredAreas = areas.filter(a => 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.descricao && a.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 transition-colors">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/voluntarios')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Habilidades e Especialidades</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{areas.length} cadastradas</p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 dark:shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Nova Área
                </button>
            </header>

            <main className="p-4 max-w-4xl mx-auto space-y-6 mt-4">
                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 border border-slate-200 dark:border-slate-800 flex items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar especialidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-purple-500 transition-colors font-medium text-sm text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredAreas.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 border border-slate-200 dark:border-slate-800">
                        <Award size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma área encontrada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAreas.map(area => (
                            <div key={area.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-purple-300 transition-all group">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{area.nome}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{area.descricao || 'Sem descrição'}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openModal(area)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(area.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">
                                {editingArea.id ? 'Editar Área' : 'Nova Área'}
                            </h3>
                            <button type="button" onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Nome da Especialidade *</label>
                                <input 
                                    type="text"
                                    value={editingArea.nome}
                                    onChange={(e) => setEditingArea({...editingArea, nome: e.target.value})}
                                    placeholder="Ex: Engenharia Civil"
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-purple-500 transition-colors font-bold text-sm text-slate-800 dark:text-slate-200"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Descrição Opcional</label>
                                <textarea 
                                    rows={3}
                                    value={editingArea.descricao}
                                    onChange={(e) => setEditingArea({...editingArea, descricao: e.target.value})}
                                    placeholder="Detalhes sobre esta especialidade..."
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-purple-500 transition-colors font-medium text-sm text-slate-800 dark:text-slate-200 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default HabilidadesList;

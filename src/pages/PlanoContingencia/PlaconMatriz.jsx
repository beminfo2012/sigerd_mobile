import React, { useState, useEffect, useContext } from 'react'
import { UserContext } from '../../App'
import { contingencyDb } from '../../services/contingencyDb'
import { supabase } from '../../services/supabase'
import { Shield, ChevronRight, CheckCircle, Search, Users } from 'lucide-react'

const PlaconMatriz = ({ isPublicMode }) => {
    const userProfile = useContext(UserContext)
    const [orgaos, setOrgaos] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrgao, setSelectedOrgao] = useState(null)
    const [orgaoData, setOrgaoData] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activePlan, setActivePlan] = useState(null)

    const isCoordenador = ['Admin', 'Administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(userProfile?.role) || isPublicMode

    useEffect(() => {
        loadOrgaos()
        loadActivePlan()
    }, [userProfile])

    const loadActivePlan = async () => {
        const plan = await contingencyDb.getActivePlan()
        setActivePlan(plan)
    }

    const loadOrgaos = async () => {
        setLoading(true)
        try {
            const data = await contingencyDb.getOrgaos(userProfile?.id, isCoordenador)
            setOrgaos(data)
            if (data && data.length > 0) {
                handleSelectOrgao(data[0].id)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOrgao = async (id) => {
        setSelectedOrgao(id)
        const full = await contingencyDb.getOrgaoCompleto(id)
        setOrgaoData(full)
    }

    const handleAddAtribuicao = async (fase) => {
        const texto = window.prompt(`Nova atribuição para a fase de ${fase}:`);
        if (!texto) return;
        try {
            await contingencyDb.createAtribuicao({
                orgao_id: orgaoData.id,
                fase: fase,
                texto: texto,
                ordem_exibicao: orgaoData.atribuicoes.length
            });
            handleSelectOrgao(orgaoData.id); // reload
        } catch (e) {
            console.error(e);
            alert("Erro ao adicionar atribuição");
        }
    }

    const handleAddRecurso = async () => {
        const mciId = window.prompt(`Cole o ID do Recurso MCI (UUID):`);
        if (!mciId) return;
        const categoria = window.prompt(`Categoria (Veículos, Materiais, Recursos Humanos, Instituições e Apoio Voluntário):`, 'Veículos');
        const alocado = window.prompt(`Quantidade alocada (número):`, '1');
        if (!categoria || !alocado) return;

        try {
            const { error } = await supabase.from('recursos_plano').insert([{
                orgao_id: orgaoData.id,
                mci_recurso_id: mciId.trim(),
                categoria: categoria,
                alocado_no_plano: parseInt(alocado) || 1
            }]);
            if (error) throw error;
            handleSelectOrgao(orgaoData.id); // reload
        } catch (e) {
            console.error(e);
            alert("Erro ao adicionar recurso. Verifique se o ID está correto.");
        }
    }

    const filteredOrgaos = orgaos.filter(o => o.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || o.nome_curto.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading) return <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">Carregando PLACON...</div>

    if (orgaos.length === 0) return (
        <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">
            Nenhum órgão vinculado ao seu perfil.
        </div>
    )

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 w-full overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Órgãos do Plano</h3>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg pl-8 pr-2 py-2 text-[10px] uppercase font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredOrgaos.map(o => (
                        <button 
                            key={o.id} 
                            onClick={() => handleSelectOrgao(o.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedOrgao === o.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: o.cor_hex || '#ccc' }}></div>
                                <span className={`text-[10px] font-black uppercase truncate ${selectedOrgao === o.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{o.nome_curto}</span>
                            </div>
                            <ChevronRight size={12} className={selectedOrgao === o.id ? 'text-blue-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {orgaoData && (
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        {/* Header */}
                        <div className="flex items-start gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: orgaoData.cor_hex || '#3b82f6' }}></div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                <Shield size={24} style={{ color: orgaoData.cor_hex || '#3b82f6' }} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{orgaoData.nome_completo}</h1>
                                <p className="text-[11px] font-bold uppercase text-slate-400 mt-1">{orgaoData.descricao_responsabilidade}</p>
                            </div>
                            {activePlan && !isPublicMode && (
                                <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Nível: {activePlan.nivel}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Atribuições */}
                            <div className="col-span-2 space-y-4">
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Matriz de Responsabilidades</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Prevenção', 'Preparação', 'Resposta'].map(fase => {
                                        const atrs = orgaoData.atribuicoes.filter(a => a.fase === fase)
                                        return (
                                            <div key={fase} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${fase === 'Prevenção' ? 'text-emerald-500' : fase === 'Preparação' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        <CheckCircle size={12} /> {fase}
                                                    </h3>
                                                    {isCoordenador && !isPublicMode && (
                                                        <button onClick={() => handleAddAtribuicao(fase)} className="text-[9px] font-bold uppercase text-slate-400 hover:text-blue-500">+ Adicionar</button>
                                                    )}
                                                </div>
                                                <ul className="space-y-3">
                                                    {atrs.map(a => (
                                                        <li key={a.id} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-1 shrink-0"></div>
                                                            <span>{a.texto}</span>
                                                        </li>
                                                    ))}
                                                    {atrs.length === 0 && <li className="text-[10px] italic text-slate-400">Nenhuma atribuição direta.</li>}
                                                </ul>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Contatos */}
                            <div className="col-span-1 space-y-4">
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Contatos Institucionais</h2>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                                    {orgaoData.contatos.map(c => (
                                        <div key={c.id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                <Users size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                                                    {c.nome} {c.is_responsavel_principal && <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-[8px] rounded uppercase">Titular</span>}
                                                </p>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase">{c.cargo}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1">{c.telefone} • {c.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {orgaoData.contatos.length === 0 && <p className="text-xs text-slate-400 italic">Sem contatos cadastrados.</p>}
                                </div>
                            </div>

                            {/* Recursos MCI */}
                            <div className="col-span-1 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        Capacidade Instalada <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[8px] rounded uppercase border border-blue-200 dark:border-blue-800">MCI</span>
                                    </h2>
                                    {isCoordenador && !isPublicMode && (
                                        <button onClick={handleAddRecurso} className="text-[9px] font-bold uppercase text-slate-400 hover:text-blue-500">+ Vincular MCI</button>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                                    {orgaoData.recursos.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate max-w-[200px]" title={r.mci_recursos ? r.mci_recursos.nome : `Recurso ID: ${r.mci_recurso_id}`}>{r.mci_recursos ? r.mci_recursos.nome : `Recurso ID: ${r.mci_recurso_id.split('-')[0]}`}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">{r.categoria}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-blue-600">{r.alocado_no_plano}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">Disponíveis</p>
                                            </div>
                                        </div>
                                    ))}
                                    {orgaoData.recursos.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum recurso mapeado no MCI.</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default PlaconMatriz

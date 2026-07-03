import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle, Users } from 'lucide-react'
import { contingencyDb } from '../../services/contingencyDb'

const PlaconPublico = () => {
    const [orgaos, setOrgaos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // isCoordenador = true ensures we get all organs
            const orgsList = await contingencyDb.getOrgaos(null, true)
            const fullOrgs = await Promise.all(orgsList.map(o => contingencyDb.getOrgaoCompleto(o.id)))
            setOrgaos(fullOrgs)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-10 shrink-0 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">SIGERD <span className="text-blue-600">PLACON 2026</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditoria e Prestação de Contas</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-blue-700 transition-all hidden sm:block">
                        Imprimir / PDF
                    </button>
                    <Link to="/login" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        Acesso Restrito
                    </Link>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {loading ? (
                    <div className="text-center p-10 text-slate-400 text-xs font-bold uppercase">Carregando dados públicos...</div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-12 pb-20">
                        {orgaos.map(orgaoData => (
                            <div key={orgaoData.id} className="space-y-6 page-break-after">
                                {/* Header do Órgão */}
                                <div className="flex items-start gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: orgaoData.cor_hex || '#3b82f6' }}></div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                        <Shield size={24} style={{ color: orgaoData.cor_hex || '#3b82f6' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{orgaoData.nome_completo}</h2>
                                        <p className="text-[11px] font-bold uppercase text-slate-400 mt-1">{orgaoData.descricao_responsabilidade}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Atribuições */}
                                    <div className="col-span-2 space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Matriz de Responsabilidades</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['Prevenção', 'Preparação', 'Resposta'].map(fase => {
                                                const atrs = orgaoData.atribuicoes.filter(a => a.fase === fase)
                                                return (
                                                    <div key={fase} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${fase === 'Prevenção' ? 'text-emerald-500' : fase === 'Preparação' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            <CheckCircle size={12} /> {fase}
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {atrs.map(a => (
                                                                <li key={a.id} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-1 shrink-0"></div>
                                                                    <span>{a.texto}</span>
                                                                </li>
                                                            ))}
                                                            {atrs.length === 0 && <li className="text-[10px] italic text-slate-400">Nenhuma atribuição mapeada.</li>}
                                                        </ul>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Contatos */}
                                    <div className="col-span-1 space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Contatos Institucionais</h3>
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
                                                    </div>
                                                </div>
                                            ))}
                                            {orgaoData.contatos.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum contato público mapeado.</p>}
                                        </div>
                                    </div>

                                    {/* Recursos (Ocultado dados sensíveis como QTD exata, apenas listar existências públicas) */}
                                    <div className="col-span-1 space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                                            Capacidade Instalada (Pública)
                                        </h3>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                                            {orgaoData.recursos.map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate max-w-[200px]" title={r.mci_recursos ? r.mci_recursos.nome : `Recurso ID: ${r.mci_recurso_id}`}>
                                                            {r.mci_recursos ? r.mci_recursos.nome : `Recurso ID: ${r.mci_recurso_id.split('-')[0]}`}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{r.categoria}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {orgaoData.recursos.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum recurso mapeado.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlaconPublico

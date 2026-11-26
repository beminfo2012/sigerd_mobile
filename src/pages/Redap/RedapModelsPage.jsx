import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, CheckCircle2, FileCode2 } from 'lucide-react';
import * as redapV3 from '../../services/redapV3Service';

const RedapModelsPage = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        redapV3.listRedapModels().then(list => {
            setModels(list || []);
            setSelected(list?.[0] || null);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Modelos Parametrizáveis REDAP</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configuração versionada dos formulários por secretaria (Seções 5 e 7.2 do Manual). O motor único renderiza cada formulário a partir desta definição.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2.5">
                    {models.map(m => (
                        <button
                            key={m.secretaria_key}
                            onClick={() => setSelected(m)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                selected?.secretaria_key === m.secretaria_key
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-sm text-slate-900 dark:text-white">{m.secretaria_nome}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    v{m.versao || 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                {m.piloto && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                        <Sparkles size={9} /> Piloto Manual
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600">
                                    <CheckCircle2 size={10} /> Ativo
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {selected && (
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers size={18} className="text-blue-600" />
                                    <h2 className="text-lg font-black">{selected.nome}</h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Chave: <code className="font-mono">{selected.secretaria_key}</code> • Versão {selected.versao || 1}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <span className="font-black uppercase text-[10px] text-slate-400 block mb-1.5">Seções Habilitadas</span>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold">Identificação</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-bold">Introdução (IA Revisável)</span>
                                    {selected.configuracao_json?.has_danos_humanos && (
                                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">Danos Humanos</span>
                                    )}
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold">Danos à Infraestrutura</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">Prejuízos Econômicos Públicos</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold">Atuação do Órgão (Compartilhado)</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">Considerações Finais & Fotos</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-black uppercase text-[10px] text-slate-400 block mb-1.5">Categorias de Infraestrutura</span>
                                <div className="space-y-2">
                                    {(selected.configuracao_json?.danos_infraestrutura_categorias || []).map((cat, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="font-black text-slate-800 dark:text-slate-100 mb-1">{cat.categoria}</div>
                                            <div className="text-slate-500">{(cat.items || []).join(' • ')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="font-black uppercase text-[10px] text-slate-400 block mb-1.5">Prejuízos Econômicos Públicos Previstos</span>
                                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
                                    {(selected.configuracao_json?.prejuizos_servicos || []).map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>

                            <div>
                                <span className="font-black uppercase text-[10px] text-slate-400 flex items-center gap-1 mb-1.5">
                                    <FileCode2 size={12} /> JSON de Configuração (v{selected.versao || 1})
                                </span>
                                <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] overflow-x-auto max-h-56">
                                    {JSON.stringify(selected.configuracao_json, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedapModelsPage;

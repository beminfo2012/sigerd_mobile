import React, { useEffect, useState } from 'react'
import { CloudRain, AlertTriangle, RefreshCw } from 'lucide-react'
import { cemadenService } from '../../services/cemaden'

const Monitoramento = () => {
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const loadData = async () => {
        setLoading(true);
        setError(false);
        const data = await cemadenService.getRainfallData();
        if (data && data.length > 0) {
            setStations(data);
        } else {
            setError(true);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <p className="text-slate-500 font-bold">Consultando Cemaden...</p>
        </div>
    )

    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-2xl m-4 border border-red-100">
            <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
            <h3 className="font-bold text-red-800">Cemaden em Manutenção</h3>
            <p className="text-sm text-red-600 mt-1">Não foi possível conectar ao portal de dados no momento.</p>
            <button
                onClick={loadData}
                className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
                Tentar Novamente
            </button>
        </div>
    )

    return (
        <div className="p-4" style={{ paddingBottom: '80px' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Estações Pluviométricas</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dados Reais - CEMADEN</p>
                </div>
                <button onClick={loadData} className="p-2 bg-slate-100 rounded-full text-slate-400 active:rotate-180 transition-all duration-500">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="grid gap-4">
                {stations.map(station => (
                    <div key={station.id} className="bg-white p-5 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative group overflow-hidden">
                        {/* Status bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${station.level === 'Extremo' ? 'bg-red-600' :
                                station.level === 'Alerta' ? 'bg-orange-500' :
                                    station.level === 'Atenção' ? 'bg-amber-400' : 'bg-green-500'
                            }`} />

                        <div className="flex justify-between items-center ml-2">
                            <h3 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition-colors uppercase">{station.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${station.level === 'Extremo' ? 'bg-red-50 text-red-600 border-red-100' :
                                    station.level === 'Alerta' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        station.level === 'Atenção' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                {station.level}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 mt-4 ml-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                                    <CloudRain size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-800 leading-none">{station.rain}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Acumulado 24h</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between ml-2">
                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse" />
                                Estação: {station.id}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                {new Date(station.updated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 text-center uppercase leading-relaxed">
                    Estação operada pelo Centro Nacional de Monitoramento e Alertas de Desastres Naturais.
                    Atualização automática a cada 60 minutos.
                </p>
            </div>
        </div>
    )
}

export default Monitoramento

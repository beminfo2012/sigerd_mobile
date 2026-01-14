import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { AlertTriangle, ChevronRight, CloudRain, CloudUpload, CheckCircle, Trash2, Truck, Wind, Droplets, Sun } from 'lucide-react'
import { getPendingSyncCount, syncPendingData, clearLocalData } from '../../services/db'

const Dashboard = () => {
    const navigate = useNavigate()
    const [weather, setWeather] = useState(null)
    const [syncCount, setSyncCount] = useState(0)
    const [syncing, setSyncing] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const pendingCount = await getPendingSyncCount().catch(() => 0)
                setSyncCount(pendingCount)

                const weatherData = await fetch('/api/weather').then(r => r.ok ? r.json() : null).catch(() => null)
                setWeather(weatherData)
            } catch (err) { console.error('Dashboard Error:', err) } finally { setLoading(false) }
        }
        load()
    }, [])

    const handleSync = async () => {
        if (syncing || syncCount === 0) return
        setSyncing(true)
        try { await syncPendingData(); window.location.reload() } catch (e) { alert('Erro na sincronização') } finally { setSyncing(false) }
    }

    const handleClearCache = async (e) => {
        e.stopPropagation()
        if (window.confirm('Deseja limpar os dados locais? Pendências não enviadas serão perdidas.')) {
            await clearLocalData()
            window.location.reload()
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold">Carregando...</div>

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">SIGERD Mobile</h1>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    B
                </div>
            </div>

            {/* Weather Card */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Sun size={48} className="text-amber-400" />
                            <div className="absolute bottom-0 right-[-5px] bg-slate-100 rounded-full p-1">
                                <CloudRain size={16} className="text-blue-400" />
                            </div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800">{weather?.temp || 26}<span className="text-lg text-slate-400 align-top">°C</span></div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Santa Maria de Jetibá</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CloudRain size={12} />
                            <span className="text-xs font-bold">{weather?.rain || '28%'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Droplets size={12} />
                            <span className="text-xs font-bold">{weather?.humidity || '69%'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Wind size={12} />
                            <span className="text-xs font-bold">{weather?.wind || '12'} km/h</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Indicadores Operacionais</h3>
                <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    Hoje
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Sync Status Card */}
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${syncCount === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                            {syncCount === 0 ? <CheckCircle size={20} /> : <CloudUpload size={20} />}
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">OK</span>
                    </div>
                    <div className="mb-4">
                        <div className="text-2xl font-black text-slate-800">{syncCount === 0 ? '100%' : `${syncCount}`}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{syncCount === 0 ? 'Sincronizado' : 'Pendentes'}</div>
                    </div>

                    <button onClick={handleClearCache} className="flex items-center gap-2 text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
                        <Trash2 size={10} />
                        Limpar Dados Locais
                    </button>
                </div>

                {/* Alerts Card */}
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative">
                    <div className="bg-red-50 w-10 h-10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="text-2xl font-black text-slate-800">0</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avisos</div>
                </div>
            </div>

            {/* Pluviometros Card */}
            <div onClick={() => navigate('/pluviometros')} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative cursor-pointer active:scale-95 transition-all mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500">
                            <CloudRain size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tempo Real</p>
                            <h3 className="text-lg font-black text-slate-800 leading-none">Pluviômetros</h3>
                            <p className="text-[10px] font-bold text-blue-500 mt-1">Ver índices CEMADEN</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">
                        <ChevronRight size={16} className="text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Iniciar Vistoria Card */}
            <div onClick={() => navigate('/vistorias')} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative cursor-pointer active:scale-95 transition-all mb-20">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 leading-none">Iniciar Vistoria</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Confirmar Prontidão</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">
                        <ChevronRight size={16} className="text-slate-400" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard

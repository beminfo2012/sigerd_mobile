import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Share2, CloudRain, Calendar, AlertTriangle, Waves, Activity, Plus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import html2canvas from 'html2canvas'
import { saveManualReading, getManualReadings } from '../../services/db'

// Mini Sparkline component for rain distribution
const MiniSparkline = ({ station, riskColor }) => {
    // Build incremental rainfall data from accumulated values
    // Each point = rain that fell in that specific window
    const accValues = [
        { key: '1h', acc: station.acc1hr || 0 },
        { key: '3h', acc: station.acc3hr || 0 },
        { key: '6h', acc: station.acc6hr || 0 },
        { key: '12h', acc: station.acc12hr || 0 },
        { key: '24h', acc: station.acc24hr || 0 },
        { key: '48h', acc: station.acc48hr || 0 },
        { key: '96h', acc: station.acc96hr || 0 },
    ]

    // Compute incremental rain per period (difference between consecutive accumulations)
    const data = accValues.map((item, i) => ({
        name: item.key,
        value: item.acc,
    }))

    // Only show if there's any data
    const hasData = data.some(d => d.value > 0)
    if (!hasData) return null

    const colorMap = {
        'text-green-600': { stroke: '#22c55e', fill: '#22c55e' },
        'text-yellow-600': { stroke: '#eab308', fill: '#eab308' },
        'text-orange-600': { stroke: '#f97316', fill: '#f97316' },
        'text-red-600': { stroke: '#ef4444', fill: '#ef4444' },
    }
    const colors = colorMap[riskColor] || colorMap['text-green-600']

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(15,23,42,0.9)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: '700',
                    backdropFilter: 'blur(4px)'
                }}>
                    {payload[0].payload.name}: {payload[0].value.toFixed(1)}mm
                </div>
            )
        }
        return null
    }

    return (
        <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Acumulado 1h → 96h</div>
            <ResponsiveContainer width="100%" height={45}>
                <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-${station.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.fill} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={colors.fill} stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={colors.stroke}
                        strokeWidth={2}
                        fill={`url(#grad-${station.id})`}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0, fill: colors.stroke }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

const Pluviometros = () => {
    const navigate = useNavigate()
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [manualModalOpen, setManualModalOpen] = useState(false)
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 16))
    const [manualVolume, setManualVolume] = useState('')
    const [manualPeriod, setManualPeriod] = useState('1h')
    const reportRef = useRef(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Fetch Manual Readings (SEDE)
            const manualReadings = await getManualReadings()

            // Calculate Accumulators for Manual Station
            const now = new Date()

            // Helper to get latest reading for a period within its window
            const getLatestForPeriod = (period, hours) => {
                const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000)
                const relevant = manualReadings.filter(r =>
                    (r.period === period || (!r.period && period === '1h')) && // Support legacy as 1h
                    new Date(r.date) > windowStart &&
                    new Date(r.date) <= now
                )
                return relevant.length > 0 ? parseFloat(relevant[0].volume) : 0
            }

            const manualAcc1h = getLatestForPeriod('1h', 1)
            const manualAcc24h = getLatestForPeriod('24h', 24)
            const manualAcc48h = getLatestForPeriod('48h', 48)
            const manualAcc96h = getLatestForPeriod('96h', 96)

            const lastManualDate = manualReadings.length > 0 ? manualReadings[0].date : null

            const manualStation = {
                id: 'SEDE_DEFESA_CIVIL',
                name: 'SEDE DEFESA CIVIL (Manual)',
                type: 'pluviometric',
                status: 'Online',
                acc1hr: manualAcc1h,
                acc24hr: manualAcc24h,
                acc48hr: manualAcc48h,
                acc96hr: manualAcc96h,
                level: 0,
                flow: 0,
                lastUpdate: lastManualDate,
                isManual: true
            }

            // 2. Fetch Automatic Data
            const res = await fetch('/api/pluviometros')
            let apiData = []
            if (res.ok) {
                apiData = await res.json()
            } else {
                console.warn("API fetch failed, showing only manual or cache")
            }

            // Merge: Manual Station First
            setStations([manualStation, ...apiData])

        } catch (err) {
            console.error(err)
            setError('Não foi possível carregar os dados.')
        } finally {
            setLoading(false)
        }
    }

    const shareImage = async () => {
        if (!reportRef.current) return

        try {
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#ffffff',
                scale: 2 // High resolution
            })

            canvas.toBlob(async (blob) => {
                const file = new File([blob], "pluviometros_smj.jpg", { type: "image/jpeg" })

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Defesa Civil - Índices Pluviométricos',
                            text: `Atualização: ${new Date().toLocaleString('pt-BR')}`,
                            files: [file]
                        })
                    } catch (e) {
                        // Share cancelled or failed, download instead
                        downloadImage(canvas)
                    }
                } else {
                    downloadImage(canvas)
                }
            }, 'image/jpeg')
        } catch (err) {
            console.error('Erro ao gerar imagem:', err)
            alert('Erro ao gerar imagem para compartilhamento.')
        }
    }

    const downloadImage = (canvas) => {
        const link = document.createElement('a')
        link.download = `pluviometros_${Date.now()}.jpg`
        link.href = canvas.toDataURL('image/jpeg')
        link.click()
    }

    const handleSaveManual = async () => {
        if (!manualVolume || isNaN(parseFloat(manualVolume))) {
            alert("Digite um volume válido")
            return
        }
        try {
            await saveManualReading(manualVolume, manualDate, manualPeriod)
            setManualModalOpen(false)
            setManualVolume('')
            setManualDate(new Date().toISOString().slice(0, 16))
            fetchData() // Refresh list
        } catch (e) {
            alert("Erro ao salvar leitura")
        }
    }

    const getRiskLevel = (acc24) => {
        if (acc24 >= 80) return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', label: 'ALERTA MÁXIMO' }
        if (acc24 >= 50) return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', label: 'ATENÇÃO' }
        if (acc24 >= 30) return { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', label: 'OBSERVAÇÃO' }
        return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', label: 'NORMAL' }
    }

    const [selectedStation, setSelectedStation] = useState(null)

    const RiskBadge = ({ level, size = 'sm' }) => {
        const colors = {
            'NORMAL': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
            'OBSERVAÇÃO': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
            'ATENÇÃO': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
            'ALERTA MÁXIMO': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
        }
        const style = colors[level] || colors['NORMAL']
        const sizeClass = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2 py-0.5 text-[10px]'

        return (
            <span className={`${style.bg} ${style.text} ${style.border} border ${sizeClass} font-black rounded-full uppercase tracking-wide`}>
                {level}
            </span>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">Pluviômetros</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setManualModalOpen(true)} className="p-2 text-[#2a5299] hover:bg-blue-50 rounded-full">
                        <Plus size={24} />
                    </button>
                    <button onClick={fetchData} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content to Capture */}
            <div ref={reportRef} className="p-5 bg-slate-50 pb-20">
                <div className="bg-[#2a5299] text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CloudRain size={120} />
                    </div>
                    <h2 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Defesa Civil</h2>
                    <h1 className="text-2xl font-black mb-4">Monitoramento Pluviométrico</h1>
                    <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                        <Calendar size={16} />
                        {new Date().toLocaleString('pt-BR')}
                    </div>
                    <div className="mt-4 text-xs opacity-75">
                        Dados: CEMADEN (Automático) / SEDE (Manual)
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Carregando dados das estações...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">
                        <AlertTriangle className="mx-auto mb-2" />
                        {error}
                        <button onClick={fetchData} className="block mx-auto mt-4 text-blue-600 font-bold underline">Tentar de novo</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {stations.map(station => {
                            const risk = getRiskLevel(station.acc24hr)
                            return (
                                <div
                                    key={station.id}
                                    onClick={() => setSelectedStation(station)}
                                    className={`bg-white p-5 rounded-2xl shadow-sm border ${risk.border} relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer`}
                                >
                                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl ${risk.bg} ${risk.text}`}>
                                        {risk.label}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 pr-20 truncate leading-relaxed py-1">{station.name}</h3>
                                    <div className="text-xs text-gray-400 mb-4">ID: {station.id}</div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-bold uppercase">Última Hora</div>
                                            <div className="text-2xl font-black text-gray-800">
                                                {station.acc1hr?.toFixed(1)} <span className="text-sm font-medium text-gray-400">mm</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1 font-bold uppercase">24 Horas</div>
                                            <div className={`text-2xl font-black ${risk.text}`}>
                                                {station.acc24hr?.toFixed(1)} <span className="text-sm font-medium text-gray-400">mm</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Sparkline */}
                                    <MiniSparkline station={station} riskColor={risk.text} />

                                    {station.type === 'fluviometric' && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                                    <Waves size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Nível</div>
                                                    <div className="text-lg font-black text-slate-700 leading-tight">{station.level} <span className="text-[10px] font-medium text-slate-400">cm</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Vazão</div>
                                                    <div className="text-lg font-black text-slate-700 leading-tight">{station.flow} <span className="text-[10px] font-medium text-slate-400">m³/s</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest">
                                        Toque para ver detalhes
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {stations.length > 0 && (
                    <div className="text-center mt-6 text-xs text-gray-400 font-medium">
                        Gerado via SIGERD Mobile
                    </div>
                )}
            </div>

            {/* Fab Button */}
            {!loading && (
                <div className="fixed bottom-24 right-6 z-20">
                    <button
                        onClick={shareImage}
                        className="bg-green-600 text-white p-4 rounded-full shadow-lg shadow-green-600/30 active:scale-95 transition-all flex items-center gap-2 font-bold pr-6"
                    >
                        <Share2 size={24} />
                        Compartilhar
                    </button>
                </div>
            )}

            {/* Manual Entry Modal */}
            {manualModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => setManualModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <h2 className="text-xl font-black text-gray-800 mb-1">Nova Leitura Manual</h2>
                        <p className="text-sm text-gray-500 mb-6">Sede Defesa Civil</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data e Hora</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={manualDate}
                                    onChange={e => setManualDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período Relacionado</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {['1h', '24h', '48h', '96h'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setManualPeriod(p)}
                                            className={`py-2 px-3 rounded-xl border font-bold transition-all ${manualPeriod === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-gray-500 border-gray-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Volume (mm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={manualVolume}
                                    onChange={e => setManualVolume(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleSaveManual}
                                className="w-full py-4 bg-[#2a5299] text-white font-bold rounded-xl shadow-lg mt-4 active:scale-95 transition-all"
                            >
                                Salvar Leitura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedStation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Detalhes da Estação</h3>
                                <h2 className="text-2xl font-black text-gray-800 leading-tight">{selectedStation.name}</h2>
                                <div className="text-sm text-gray-500 mt-1">ID: {selectedStation.id}</div>
                            </div>
                            <button
                                onClick={() => setSelectedStation(null)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="font-bold text-gray-600">Nível de Risco Atual</span>
                                <RiskBadge level={getRiskLevel(selectedStation.acc24hr).label} size="lg" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
                                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Última Hora</div>
                                    <div className="text-4xl font-black text-blue-600">
                                        {selectedStation.acc1hr?.toFixed(1)}
                                        <span className="text-lg font-medium text-blue-400 ml-1">mm</span>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-2xl border text-center ${getRiskLevel(selectedStation.acc24hr).bg} ${getRiskLevel(selectedStation.acc24hr).border}`}>
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${getRiskLevel(selectedStation.acc24hr).text} opacity-70`}>24 Horas</div>
                                    <div className={`text-4xl font-black ${getRiskLevel(selectedStation.acc24hr).text}`}>
                                        {selectedStation.acc24hr?.toFixed(1)}
                                        <span className={`text-lg font-medium ml-1 opacity-60`}>mm</span>
                                    </div>
                                </div>
                            </div>

                            {(selectedStation.acc48hr !== undefined || selectedStation.acc96hr !== undefined) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">48 Horas</div>
                                        <div className="text-2xl font-black text-slate-700">
                                            {selectedStation.acc48hr?.toFixed(1) || '0.0'}
                                            <span className="text-sm font-bold text-slate-400 ml-1">mm</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">96 Horas</div>
                                        <div className="text-2xl font-black text-slate-700">
                                            {selectedStation.acc96hr?.toFixed(1) || '0.0'}
                                            <span className="text-sm font-bold text-slate-400 ml-1">mm</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedStation.type === 'fluviometric' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                                            <Waves size={14} />
                                            Nível
                                        </div>
                                        <div className="text-3xl font-black text-slate-700">
                                            {selectedStation.level}
                                            <span className="text-sm font-bold text-slate-400 ml-1">cm</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
                                            <Activity size={14} />
                                            Vazão
                                        </div>
                                        <div className="text-3xl font-black text-slate-700">
                                            {selectedStation.flow}
                                            <span className="text-sm font-bold text-slate-400 ml-1">m³/s</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    Última Atualização
                                </h4>
                                <p className="text-gray-600 font-medium">
                                    {selectedStation.lastUpdate
                                        ? new Date(selectedStation.lastUpdate).toLocaleString('pt-BR')
                                        : 'Dados recentes (Automático)'}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedStation(null)}
                                className="w-full py-4 bg-[#2a5299] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Pluviometros

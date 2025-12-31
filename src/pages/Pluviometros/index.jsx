import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Share2, CloudRain, Calendar, AlertTriangle } from 'lucide-react'
import html2canvas from 'html2canvas'

const Pluviometros = () => {
    const navigate = useNavigate()
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const reportRef = useRef(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Try local function relative path, or direct if valid
            // Vercel routes /api/pluviometros to api/pluviometros.js
            const res = await fetch('/api/pluviometros')
            if (!res.ok) throw new Error('Falha ao carregar dados')
            const data = await res.json()
            setStations(data)
        } catch (err) {
            console.error(err)
            // Fallback mock data purely for demonstration if API fails locally
            setError('Não foi possível conectar ao CEMADEN. Tente novamente.')
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

    const getRiskLevel = (acc24) => {
        if (acc24 >= 80) return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', label: 'ALERTA MÁXIMO' }
        if (acc24 >= 50) return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', label: 'ATENÇÃO' }
        if (acc24 >= 30) return { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', label: 'OBSERVAÇÃO' }
        return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', label: 'NORMAL' }
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
                <button onClick={fetchData} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
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
                        Dados: CEMADEN (Automático)
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
                                <div key={station.id} className={`bg-white p-5 rounded-2xl shadow-sm border ${risk.border} relative overflow-hidden`}>
                                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl ${risk.bg} ${risk.text}`}>
                                        {risk.label}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 pr-20 truncate">{station.name}</h3>
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
            {!loading && !error && (
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
        </div>
    )
}

export default Pluviometros

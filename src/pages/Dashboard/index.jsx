import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronRight, CloudRain } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const result = await api.getDashboardData()
                setData(result)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return <div className="p-8 flex justify-center text-gray-400">Carregando indicadores...</div>
    if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24">

            {/* Header section */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Indicadores Operacionais</h1>
                <div className="flex items-center gap-1 bg-slate-200/50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500">
                    <Calendar size={14} />
                    <span>Hoje</span>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Vistorias Card */}
                <div className="bg-white p-5 rounded-[20px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative">
                    <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                        <ClipboardList size={20} strokeWidth={2.5} />
                    </div>
                    {data.stats.pendingVistoriasDiff && (
                        <div className="absolute top-5 right-5 bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                            {data.stats.pendingVistoriasDiff} urgentes
                        </div>
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none">{data.stats.pendingVistorias}</div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">Vistorias Pendentes</div>
                </div>

                {/* Ocorrências Card */}
                <div className="bg-white p-5 rounded-[20px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative">
                    <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                        <AlertTriangle size={20} strokeWidth={2.5} />
                    </div>
                    {data.stats.activeOccurrencesDiff && (
                        <div className="absolute top-5 right-5 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                            +{data.stats.activeOccurrencesDiff} novas
                        </div>
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none">{data.stats.activeOccurrences}</div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">Ocorrências Ativas</div>
                </div>
            </div>

            {/* Pluviômetros Card (Replácing Response Time) */}
            <div
                onClick={() => navigate('/pluviometros')}
                className="bg-white p-5 rounded-[20px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 mb-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-[#2a5299]">
                        <CloudRain size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 mb-0.5 uppercase tracking-wide">Monitoramento</div>
                        <div className="text-xl font-black text-slate-800">Pluviômetros</div>
                        <div className="text-xs font-medium text-blue-600">Ver índices automáticos</div>
                    </div>
                </div>
                <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                    <ChevronRight size={20} />
                </div>
            </div>

            {/* Bottom Section - Categories */}
            <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-sm">Tipos de Vistoria (Semanal)</h3>
                    <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Ver detalhes</a>
                </div>

                <div className="space-y-6">
                    {data.breakdown && data.breakdown.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${item.color.replace('bg-', 'text-') === 'text-orange-500' ? 'bg-orange-500' : (item.color.replace('bg-', 'text-') === 'text-blue-500' ? 'bg-blue-500' : 'bg-slate-400')}`}></div>
                                    <span className={`text-xs font-bold text-slate-500`}>{item.label}</span>
                                </div>
                                <div className="text-xs font-black text-slate-800">
                                    {item.percentage}% <span className="text-slate-400 font-medium">({item.count})</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-white p-4 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                <h3 className="font-bold text-slate-800 text-xs uppercase mb-3 ml-2">Concentração de Vistorias</h3>
                <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-100 relative z-0">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        {data.locations && data.locations.map((loc, idx) => (
                            <CircleMarker
                                key={idx}
                                center={[loc.lat, loc.lng]}
                                radius={8}
                                pathOptions={{
                                    color: loc.risk === 'Alto' ? '#ef4444' : '#f97316',
                                    fillColor: loc.risk === 'Alto' ? '#ef4444' : '#f97316',
                                    fillOpacity: 0.6,
                                    stroke: false
                                }}
                            />
                        ))}
                    </MapContainer>
                </div>
            </div>

        </div>
    )
}

export default Dashboard

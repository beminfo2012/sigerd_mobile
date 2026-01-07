import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { ArrowLeft, Filter, Flame, Map as MapIcon, Layers, Calendar, AlertTriangle } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../services/api'
import { getAllVistoriasLocal } from '../../services/db'

// Fix: Support Leaflet plugins that expect window.L
window.L = L;

// Custom component to handle the Heatmap layer directly via Leaflet
const HeatmapLayer = ({ points, show }) => {
    const map = useMap()

    useEffect(() => {
        if (!show || !points || !window.L || !window.L.heatLayer) return

        const heatData = points.map(p => [p.lat, p.lng, p.intensity || 0.5])
        const heatLayer = window.L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(map)

        return () => {
            map.removeLayer(heatLayer)
        }
    }, [map, points, show])

    return null
}

const GeoDashboard = () => {
    const navigate = useNavigate()
    const [vistorias, setVistorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState('heat') // 'heat' or 'points'
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterTime, setFilterTime] = useState('all') // '24h', '48h', 'all'

    useEffect(() => {
        const loadData = async () => {
            try {
                const [remote, local] = await Promise.all([
                    api.getDashboardData().then(d => d?.locations || []).catch(() => []),
                    getAllVistoriasLocal()
                ])

                const normalizedLocal = local.filter(v => v.coordenadas && typeof v.coordenadas === 'string' && v.coordenadas.includes(',')).map(v => {
                    try {
                        const [lat, lng] = v.coordenadas.split(',').map(n => parseFloat(n.trim()))
                        if (isNaN(lat) || isNaN(lng)) return null
                        return {
                            lat,
                            lng,
                            risk: v.categoriaRisco || v.categoria_risco || 'Outros',
                            details: Array.isArray(v.subtiposRisco) ? v.subtiposRisco.join(', ') : (v.subtipos_risco || ''),
                            date: v.data_hora || v.created_at || new Date().toISOString()
                        }
                    } catch (e) {
                        return null
                    }
                }).filter(Boolean)

                // Combine and deduplicate if necessary (simplified here)
                setVistorias([...remote, ...normalizedLocal])
            } catch (error) {
                console.error('Error loading geo data:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const filteredPoints = useMemo(() => {
        return vistorias.filter(p => {
            const matchesCat = filterCategory === 'all' || p.risk === filterCategory

            let matchesTime = true
            if (filterTime !== 'all') {
                const threshold = new Date()
                const hours = parseInt(filterTime)
                threshold.setHours(threshold.getHours() - hours)
                matchesTime = new Date(p.date) >= threshold
            }

            return matchesCat && matchesTime
        })
    }, [vistorias, filterCategory, filterTime])

    const categories = useMemo(() => {
        return ['all', ...new Set(vistorias.map(v => v.risk))].filter(Boolean)
    }, [vistorias])

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
    )

    return (
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
            {/* Header / Controls */}
            <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl pointer-events-auto border border-white">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Monitoramento Estratégico</h1>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Mapa de Calor em Tempo Real</div>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('heat')}
                                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'heat' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <Flame size={16} />
                                <span className="text-[10px] font-black uppercase">Calor</span>
                            </button>
                            <button
                                onClick={() => setViewMode('points')}
                                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'points' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <MapIcon size={16} />
                                <span className="text-[10px] font-black uppercase">Pontos</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
                        <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white gap-1 shrink-0">
                            <div className="p-1.5 text-slate-400 border-r border-slate-100 px-2 flex items-center gap-1">
                                <Filter size={14} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Filtros</span>
                            </div>
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="bg-transparent text-[10px] font-bold text-slate-700 outline-none px-2 py-1 uppercase"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat === 'all' ? 'Todas Tipologias' : cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white gap-1 shrink-0">
                            <div className="p-1.5 text-slate-400 border-r border-slate-100 px-2 flex items-center gap-1">
                                <Calendar size={14} />
                            </div>
                            <select
                                value={filterTime}
                                onChange={e => setFilterTime(e.target.value)}
                                className="bg-transparent text-[10px] font-bold text-slate-700 outline-none px-2 py-1 uppercase"
                            >
                                <option value="all">Todo o Período</option>
                                <option value="24">Últimas 24h</option>
                                <option value="48">Últimas 48h</option>
                                <option value="168">Última Semana</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Summary Card */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000] pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] shadow-2xl pointer-events-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white leading-none">{filteredPoints.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ocorrências Mapeadas</div>
                        </div>
                    </div>
                    {filteredPoints.length > 5 && (
                        <div className="bg-red-500/10 px-4 py-2 rounded-2xl border border-red-500/20 flex items-center gap-3">
                            <div className="relative">
                                <Flame size={20} className="text-red-500 animate-pulse" />
                                <div className="absolute inset-0 bg-red-500 blur-md opacity-20 animate-pulse"></div>
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">Alerta de Cluster</div>
                                <div className="text-[9px] font-bold text-red-400 uppercase tracking-tight mt-1 items-center flex gap-1">
                                    <AlertTriangle size={8} /> Alta densidade detectada
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 z-0">
                <MapContainer
                    center={[-20.0246, -40.7464]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    <HeatmapLayer points={filteredPoints} show={viewMode === 'heat'} />

                    {viewMode === 'points' && filteredPoints.map((loc, idx) => (
                        <CircleMarker
                            key={idx}
                            center={[loc.lat, loc.lng]}
                            radius={8}
                            pathOptions={{
                                color: loc.risk.includes('Alto') ? '#ef4444' : '#3b82f6',
                                fillColor: loc.risk.includes('Alto') ? '#ef4444' : '#3b82f6',
                                fillOpacity: 0.8,
                                stroke: true,
                                weight: 2
                            }}
                        >
                            <Popup blur={true}>
                                <div className="min-w-[150px] p-1">
                                    <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">{loc.risk}</div>
                                    <div className="text-xs font-bold text-slate-500 mb-2">{loc.details || 'Sem detalhes específicos'}</div>
                                    <div className="flex items-center justify-between mt-3 text-[10px] font-black text-slate-400 bg-slate-50 p-2 rounded-lg">
                                        <div className="flex items-center gap-1 uppercase tracking-tighter">
                                            <Calendar size={10} />
                                            {new Date(loc.date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .leaflet-popup-content-wrapper {
                    border-radius: 20px !important;
                    padding: 4px !important;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
                }
                .leaflet-popup-tip-container {
                    display: none !important;
                }
                .scrollbar-none::-webkit-scrollbar {
                    display: none;
                }
            ` }} />
        </div>
    )
}

export default GeoDashboard

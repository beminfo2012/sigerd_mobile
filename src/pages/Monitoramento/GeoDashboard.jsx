import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Filter, Flame, Map as MapIcon, Layers, Calendar, AlertTriangle, Car, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Marker } from 'react-leaflet'
import { wazeService } from '../../services/wazeService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../services/api'
import { getAllVistoriasLocal } from '../../services/db'
import HeatmapLayer from '../../components/HeatmapLayer'

// Fix: Support Leaflet plugins that expect window.L
window.L = L;

const GeoDashboard = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isFullscreen = location.search.includes('fullscreen=true')
    const [vistorias, setVistorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState('heat') // 'heat' or 'points'
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterTime, setFilterTime] = useState('all') // '24h', '48h', 'all'
    const [showWaze, setShowWaze] = useState(false)
    const [wazeData, setWazeData] = useState({ alerts: [], jams: [] })

    useEffect(() => {
        const loadData = async () => {
            try {
                const [remote, local] = await Promise.all([
                    api.getDashboardData().then(d => d?.locations || []).catch(() => []),
                    getAllVistoriasLocal()
                ])

                const normalizedLocal = local.filter(v => !v.synced && v.coordenadas && typeof v.coordenadas === 'string' && v.coordenadas.includes(',')).map(v => {
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

                // Deduplicate: If a local point has same date/coords as remote, remote wins
                const mergedMap = new Map()
                remote.forEach(r => mergedMap.set(`${r.lat},${r.lng}`, r))
                normalizedLocal.forEach(l => {
                    const key = `${l.lat},${l.lng}`
                    if (!mergedMap.has(key)) mergedMap.set(key, l)
                })

                setVistorias(Array.from(mergedMap.values()))
            } catch (error) {
                console.error('Error loading geo data:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()

        const loadWaze = async () => {
            const data = await wazeService.getIncidents();
            setWazeData(data);
        };
        loadWaze();
        const wazeInterval = setInterval(loadWaze, 5 * 60 * 1000); // Update every 5 min

        return () => clearInterval(wazeInterval);
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
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
            {/* Header / Controls */}
            <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
                <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl pointer-events-auto border border-white">
                        <div className="flex items-center gap-2 min-w-0">
                            {!isFullscreen && (
                                <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600 flex-shrink-0">
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="min-w-0 truncate">
                                <h1 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-tight truncate">Monitoramento Estratégico</h1>
                                <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Mapa de Calor em Tempo Real</div>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl flex-shrink-0 ml-2">
                            <button
                                onClick={() => setShowWaze(!showWaze)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 ${showWaze ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400'}`}
                            >
                                <Car size={16} />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase">Waze</span>
                            </button>
                            <div className="w-[1px] bg-slate-200 mx-1 my-1" />
                            <button
                                onClick={() => setViewMode('heat')}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'heat' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <Flame size={16} />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase">Calor</span>
                            </button>
                            <button
                                onClick={() => setViewMode('points')}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'points' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <MapIcon size={16} />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase">Pontos</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto px-1 -mx-1">
                        <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white gap-1 shrink-0">
                            <div className="p-1.5 text-slate-400 border-r border-slate-100 px-2 flex items-center gap-1">
                                <Filter size={14} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Filtros</span>
                            </div>
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="bg-transparent text-[10px] font-bold text-slate-700 outline-none px-2 py-1 uppercase max-w-[120px]"
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
            <div className="absolute bottom-4 left-3 right-3 z-[1000] pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-[28px] shadow-2xl pointer-events-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 w-11 h-11 rounded-2xl flex items-center justify-center text-blue-400">
                            <Layers size={22} />
                        </div>
                        <div>
                            <div className="text-xl font-black text-white leading-none">{filteredPoints.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registros</div>
                        </div>
                    </div>

                    {showWaze && wazeData.alerts.length > 0 && (
                        <div className="flex items-center gap-3 border-l border-white/10 pl-4 h-full">
                            <div className="bg-orange-500/20 w-11 h-11 rounded-2xl flex items-center justify-center text-orange-400">
                                <Car size={22} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-white leading-none">{wazeData.alerts.length}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acidentes/Hazard</div>
                            </div>
                        </div>
                    )}

                    {!showWaze && filteredPoints.length > 5 && (
                        <div className="bg-red-500/10 px-3 py-1.5 rounded-2xl border border-red-500/20 flex items-center gap-2">
                            <Flame size={18} className="text-red-500 animate-pulse" />
                            <div className="text-left">
                                <div className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Densidade</div>
                                <div className="text-[8px] font-bold text-red-400 uppercase tracking-tight mt-0.5">Cluster Detectado</div>
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

                    {/* Waze Layers */}
                    {showWaze && (
                        <>
                            {wazeData.jams.map(jam => (
                                <Polyline
                                    key={jam.id}
                                    positions={jam.path}
                                    pathOptions={{
                                        color: jam.level >= 4 ? '#ef4444' : '#f59e0b',
                                        weight: 6,
                                        opacity: 0.6,
                                        lineCap: 'round'
                                    }}
                                />
                            ))}

                            {wazeData.alerts.map(alert => (
                                <Marker
                                    key={alert.id}
                                    position={[alert.lat, alert.lng]}
                                    icon={L.divIcon({
                                        className: 'waze-icon',
                                        html: `
                                            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${alert.type === 'ACCIDENT' ? 'bg-red-500' : 'bg-orange-500'}">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                            </div>
                                        `
                                    })}
                                >
                                    <Popup>
                                        <div className="p-1">
                                            <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">
                                                Waze: {alert.type === 'ACCIDENT' ? 'Acidente' : 'Perigo na Via'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-2">{alert.description}</div>
                                            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 bg-slate-50 p-1.5 rounded-md uppercase">
                                                <span>Confiança: {alert.rating}/5</span>
                                                <a
                                                    href={`https://www.waze.com/ul?ll=${alert.lat},${alert.lng}&navigate=yes`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 flex items-center gap-1 hover:underline"
                                                >
                                                    <ExternalLink size={10} />
                                                    Abrir Waze
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </>
                    )}
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

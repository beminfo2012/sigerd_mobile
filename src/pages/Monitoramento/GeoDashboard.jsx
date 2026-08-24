import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Filter, Flame, Map as MapIcon, Layers, Calendar, AlertTriangle, Car, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Marker } from 'react-leaflet'
import LimiteSMJLayer from '../../components/LimiteSMJLayer'
import { wazeService } from '../../services/wazeService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../services/api'
import { getAllVistoriasLocal } from '../../services/db'
import HeatmapLayer from '../../components/HeatmapLayer'
import OrthofotsLayer from '../../components/OrthofotsLayer'

// Fix: Support Leaflet plugins that expect window.L
window.L = L;

const createCustomPin = (color) => {
    return L.divIcon({
        className: 'custom-pin-marker',
        html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center;">
                <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
                    <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

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
                const pDate = new Date(p.date)
                const now = new Date()
                const hours = (now - pDate) / (1000 * 60 * 60)
                if (filterTime === '24h') matchesTime = hours <= 24
                if (filterTime === '48h') matchesTime = hours <= 48
            }

            return matchesCat && matchesTime
        })
    }, [vistorias, filterCategory, filterTime])

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
            {/* Top Left Floating Controls */}
            <div className="absolute top-6 left-4 z-[1000] flex flex-col gap-2">
                <button onClick={() => navigate(-1)} className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-100 hover:bg-white active:scale-95 transition-all text-slate-700 flex items-center justify-center w-12 h-12">
                    <ArrowLeft size={20} />
                </button>
                <button onClick={() => setViewMode(viewMode === 'heat' ? 'points' : 'heat')} className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-100 hover:bg-white active:scale-95 transition-all text-slate-700 flex items-center justify-center w-12 h-12">
                    <Layers size={20} />
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-100 hover:bg-white active:scale-95 transition-all text-blue-600 flex items-center justify-center w-12 h-12">
                    <Crosshair size={20} />
                </button>
            </div>

            {/* Bottom Left Legend */}
            <div className="absolute bottom-6 left-4 z-[1000]">
                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-100/50 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Crítico (<span className="text-red-500">&gt;20</span>)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Atenção</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Normal</span>
                    </div>
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
                    <LimiteSMJLayer keyId="limite-smj-geo" />
                    <OrthofotsLayer />

                    <HeatmapLayer points={filteredPoints.filter(l => l && l.lat && l.lng && !isNaN(Number(l.lat)))} show={viewMode === 'heat'} />

                    {viewMode === 'points' && filteredPoints.filter(l => l && l.lat && l.lng && !isNaN(Number(l.lat))).map((loc, idx) => (
                        <Marker
                            key={idx}
                            position={[loc.lat, loc.lng]}
                            icon={createCustomPin(loc.risk.includes('Alto') ? '#ef4444' : '#3b82f6')}
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
                        </Marker>
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

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    useMap, 
    useMapEvents,
    ZoomControl, 
    LayersControl, 
    GeoJSON 
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { 
    Search, 
    Loader2, 
    Navigation, 
    MapPin, 
    RefreshCw, 
    UploadCloud, 
    Layers, 
    Zap, 
    Copy, 
    Check, 
    ShieldAlert, 
    Info, 
    ZoomIn,
    Eye,
    EyeOff
} from 'lucide-react'
import { georescue } from '../../services/supabase'
import { 
    searchInstallations, 
    getInstallationsCount, 
    importInstallations, 
    getInstallationsInBounds 
} from '../../services/db'
import { useToast } from '../../components/ToastNotification'
import { checkRiskArea } from '../../services/riskAreas'
import RiskAreaModal from '../../components/RiskAreaModal'
import OrthofotsLayer from '../../components/OrthofotsLayer'
import LimiteSMJLayer from '../../components/LimiteSMJLayer'

// GeoJSON Data for Layers
import cprmData from '../../data/risk_cprm.json'
import sedurbData from '../../data/risk_sedurb.json'

const { BaseLayer, Overlay } = LayersControl;
const MIN_ZOOM_FOR_POINTS = 15;

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for individual electrical installations
const createInstallationIcon = (isRisk = false) => {
    const bg = isRisk ? '#ef4444' : '#2563eb';
    const border = '#ffffff';
    return L.divIcon({
        className: 'custom-installation-marker',
        html: `
            <div style="
                position: relative;
                width: 24px;
                height: 24px;
                background: ${bg};
                border: 2px solid ${border};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 8px rgba(0,0,0,0.35);
                cursor: pointer;
                transition: transform 0.2s ease;
            ">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                ${isRisk ? '<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #ef4444; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
    });
};

// Custom cluster icon for electrical installations
const createInstallationClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const childMarkers = cluster.getAllChildMarkers();
    const hasRisk = childMarkers.some(m => m.options?.isRisk);
    const bg = hasRisk
        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
        : 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    const shadow = hasRisk
        ? '0 4px 14px rgba(239, 68, 68, 0.5)'
        : '0 4px 14px rgba(37, 99, 235, 0.45)';

    return L.divIcon({
        html: `
            <div class="marker-hover-effect" style="
                background: ${bg};
                color: #ffffff;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 13px;
                border: 2px solid #ffffff;
                box-shadow: ${shadow};
                cursor: pointer;
                transition: transform 0.2s ease;
            ">
                ${count}
            </div>
        `,
        className: 'custom-installation-cluster-icon',
        iconSize: L.point(36, 36, true),
    });
};

// Santa Maria de Jetibá municipality bounds & center
const SMJ_BOUNDS = [
    [-20.2274, -41.0361], // Sudoeste
    [-19.9460, -40.5953]  // Nordeste
];
const SMJ_CENTER = [-20.0246, -40.7464];

// Component to fit municipality bounds on initial load
const MapInitialBounds = () => {
    const map = useMap();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            map.fitBounds(SMJ_BOUNDS, { padding: [25, 25], maxZoom: 13 });
            initialized.current = true;
        }
    }, [map]);

    return null;
};

// Child component to update map view smoothly
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 18, { animate: true, duration: 1.2 });
        }
    }, [center, map]);
    return null;
};

// Map Viewport Tracker to listen to pan & zoom
const MapViewportListener = ({ onViewportChange }) => {
    const map = useMapEvents({
        moveend: () => onViewportChange(map),
        zoomend: () => onViewportChange(map)
    });

    useEffect(() => {
        onViewportChange(map);
    }, [map, onViewportChange]);

    return null;
};

const GeoRescue = () => {
    const { toast } = useToast()
    const [position, setPosition] = useState(SMJ_CENTER)
    const [userLocation, setUserLocation] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [importSuccess, setImportSuccess] = useState(null)
    const [selectedInstallation, setSelectedInstallation] = useState(null)
    const [mapCenterTarget, setMapCenterTarget] = useState(null)
    const [searching, setSearching] = useState(false)
    const [totalInstallations, setTotalInstallations] = useState(0)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    const syncInProgress = useRef(false)

    // Dynamic Viewport & Clustering States
    const [currentZoom, setCurrentZoom] = useState(12)
    const [visibleInstallations, setVisibleInstallations] = useState([])
    const [isLoadingPoints, setIsLoadingPoints] = useState(false)
    const [showPointsLayer, setShowPointsLayer] = useState(true)
    const debounceTimer = useRef(null)
    const mapRef = useRef(null)

    // Risk Area States
    const [detectedRiskArea, setDetectedRiskArea] = useState(null)
    const [showRiskModal, setShowRiskModal] = useState(false)

    useEffect(() => {
        // Attempt to get user location (for marker only, without shifting away from municipality)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude])
                },
                (err) => {
                    console.log('Location access denied or error:', err)
                },
                { enableHighAccuracy: true }
            )
        }
    }, [])

    // Viewport change handler with debounce for 60fps performance
    const handleViewportChange = useCallback((map) => {
        mapRef.current = map
        const zoom = map.getZoom()
        setCurrentZoom(zoom)

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        debounceTimer.current = setTimeout(async () => {
            if (zoom >= MIN_ZOOM_FOR_POINTS) {
                try {
                    setIsLoadingPoints(true)
                    const b = map.getBounds()
                    const bounds = {
                        south: b.getSouth(),
                        north: b.getNorth(),
                        west: b.getWest(),
                        east: b.getEast()
                    }
                    const points = await getInstallationsInBounds(bounds, 1500)
                    
                    // Attach risk area diagnostics
                    const pointsWithRisk = points.map(p => ({
                        ...p,
                        riskInfo: checkRiskArea(p.lat, p.lng)
                    }))

                    setVisibleInstallations(pointsWithRisk)
                } catch (err) {
                    console.error('[GeoRescue] Error fetching installations in bounds:', err)
                } finally {
                    setIsLoadingPoints(false)
                }
            } else {
                setVisibleInstallations([])
            }
        }, 200)
    }, [])

    // Quick Zoom In to threshold
    const zoomInToPoints = () => {
        if (mapRef.current) {
            mapRef.current.setZoom(MIN_ZOOM_FOR_POINTS)
        }
    }

    // Separate function to handle the import with UI feedback
    const startImport = async () => {
        try {
            setIsImporting(true)
            setImportProgress(0)

            console.log('Importing updated UC data (v4)...')
            const response = await fetch('/uc_db_v4.json?t=' + new Date().getTime())
            if (!response.ok) throw new Error('Failed to fetch DB file')

            const ucData = await response.json()

            await importInstallations(ucData, (current, total) => {
                const pct = Math.round((current / total) * 100)
                setImportProgress(pct)
            })

            const updatedCount = await getInstallationsCount()
            setTotalInstallations(updatedCount)

            localStorage.setItem('geo_db_version', 'v4')
            setImportSuccess({
                title: 'Banco Atualizado!',
                message: `${updatedCount} unidades consumidoras carregadas e prontas para uso offline.`
            })

            // Refresh current viewport if zoomed in
            if (mapRef.current) {
                handleViewportChange(mapRef.current)
            }

        } catch (e) {
            console.error('Import failed:', e)
            toast.error('Falha na atualização', 'Erro ao importar dados: ' + e.message)
        } finally {
            setIsImporting(false)
        }
    }

    // Background sync from Supabase
    const syncFromSupabase = useCallback(async () => {
        if (syncInProgress.current) return
        syncInProgress.current = true
        setIsSyncing(true)

        try {
            const { count: remoteCount, error: countError } = await georescue
                .from('electrical_installations')
                .select('*', { count: 'exact', head: true })

            if (countError) return

            const localCount = await getInstallationsCount()
            if (localCount === remoteCount && remoteCount > 0) {
                setTotalInstallations(localCount)
                return
            }

            const PAGE_SIZE = 1000
            let allData = []

            for (let offset = 0; offset < remoteCount; offset += PAGE_SIZE) {
                const { data, error } = await georescue
                    .from('electrical_installations')
                    .select('*')
                    .range(offset, offset + PAGE_SIZE - 1)

                if (error) break
                if (data) allData = allData.concat(data)
            }

            if (allData.length > 0) {
                await importInstallations(allData, null)
                const updatedCount = await getInstallationsCount()
                setTotalInstallations(updatedCount)

                if (mapRef.current) {
                    handleViewportChange(mapRef.current)
                }
            }
        } catch (e) {
            console.error('[GeoRescue] Background sync failed:', e)
        } finally {
            syncInProgress.current = false
            setIsSyncing(false)
        }
    }, [handleViewportChange])

    // Check on startup
    useEffect(() => {
        const checkAndImport = async () => {
            const dbVersion = localStorage.getItem('geo_db_version')
            const count = await getInstallationsCount()

            if (dbVersion !== 'v4' || count < 21000) {
                await startImport()
            } else {
                setTotalInstallations(count)
            }
            syncFromSupabase()
        }
        checkAndImport()
    }, [syncFromSupabase])

    const handleSearch = async (query) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const results = await searchInstallations(query)
            setSearchResults(results)

            if (results.length === 0 && query.length > 5) {
                const { data, error } = await georescue
                    .from('electrical_installations')
                    .select('*')
                    .or(`installation_number.ilike.%${query}%,name.ilike.%${query}%,address.ilike.%${query}%`)
                    .limit(50)

                if (!error && data) setSearchResults(data)
            }
        } catch (err) {
            console.error('Search failed:', err)
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }

    const getCoords = (inst) => {
        if (!inst) return null
        const lat = parseFloat(inst.lat || inst.lat_core || inst.pee_lat || inst.client_lat || inst.LATITUDE)
        const lng = parseFloat(inst.lng || inst.lng_core || inst.pee_lng || inst.client_lng || inst.LONGITUDE)
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng]
        return null
    }

    const handleRiskDetection = (lat, lng) => {
        const riskInfo = checkRiskArea(lat, lng)
        if (riskInfo) {
            setDetectedRiskArea(riskInfo)
        } else {
            setDetectedRiskArea(null)
        }
        return riskInfo
    }

    const selectInstallation = (installation, shouldFly = true) => {
        setSelectedInstallation(installation)
        setSearchResults([])
        setSearchQuery('')

        const coords = getCoords(installation)
        if (coords) {
            if (shouldFly) {
                setPosition(coords)
                setMapCenterTarget([...coords])
            }
            handleRiskDetection(coords[0], coords[1])
        }
    }

    const copyText = (text, message = 'Copiado para a área de transferência!') => {
        if (!text) return
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(String(text))
            toast.success('Copiado!', message)
        }
    }

    const openGoogleMapsFor = (inst) => {
        const coords = getCoords(inst)
        if (coords) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank')
        }
    }

    // Handler for cluster clicks: if markers share the exact same coordinates or are at max zoom, spiderfy them immediately
    const handleClusterClick = (clusterEvent) => {
        const cluster = clusterEvent.layer || clusterEvent.target;
        if (!cluster || !cluster.getAllChildMarkers) return;
        const markers = cluster.getAllChildMarkers();
        if (markers.length > 1) {
            const first = markers[0].getLatLng();
            const allSameCoords = markers.every(m => {
                const pos = m.getLatLng();
                return Math.abs(pos.lat - first.lat) < 0.000005 && Math.abs(pos.lng - first.lng) < 0.000005;
            });
            if (allSameCoords && typeof cluster.spiderfy === 'function') {
                cluster.spiderfy();
            }
        }
    };

    return (
        <div className="relative h-full overflow-hidden">
            {/* Import Overlay */}
            {isImporting && (
                <div className="absolute inset-0 z-[2000] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-white">
                    <Loader2 size={48} className="animate-spin mb-4 text-blue-400" />
                    <h3 className="text-xl font-bold mb-2 uppercase tracking-widest leading-none">Atualizando Base</h3>
                    <p className="text-[11px] text-slate-400 mb-8 text-center font-bold">Importando dados do GeoRescue (01/2026)...</p>

                    <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden mb-4 border border-slate-700">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            style={{ width: `${importProgress}%` }}
                        />
                    </div>
                    <div className="text-3xl font-black tabular-nums">{importProgress}%</div>
                </div>
            )}

            {/* Top Search Bar & Info */}
            <div className="absolute top-4 left-4 right-4 z-[1000] space-y-3 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl p-4 pointer-events-auto max-w-2xl mx-auto w-full transition-all duration-500 group focus-within:shadow-blue-500/10 rounded-3xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-blue-500/60 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Buscar UC por número ou endereço..."
                            className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold text-slate-700 placeholder:text-slate-400 text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searching && (
                            <Loader2 className="absolute right-4 top-4 text-blue-500 animate-spin" size={18} />
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                                <MapPin size={12} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-wider">{totalInstallations.toLocaleString()} Unidades</span>
                            </div>
                            {isSyncing && (
                                <div className="flex items-center gap-1.5 animate-pulse text-blue-600">
                                    <RefreshCw size={10} className="animate-spin" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">Sync...</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={startImport}
                            disabled={isSyncing}
                            className="bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-widest py-1.5 px-4 rounded-full hover:bg-blue-100 transition-all border border-blue-100/50 active:scale-95"
                        >
                            Atualizar Base Offline
                        </button>
                    </div>
                </div>

                {/* Floating Map Zoom / Points Indicator */}
                <div className="flex justify-center pointer-events-auto">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-md shadow-lg border text-xs font-bold flex items-center gap-2.5 transition-all ${
                        currentZoom >= MIN_ZOOM_FOR_POINTS
                            ? 'bg-white/95 text-slate-800 border-slate-200 shadow-blue-500/10'
                            : 'bg-slate-900/90 text-white border-slate-700/80 shadow-black/20'
                    }`}>
                        <div className="flex items-center gap-1.5">
                            <Zap size={14} className={currentZoom >= MIN_ZOOM_FOR_POINTS ? 'text-blue-600' : 'text-amber-400 animate-pulse'} />
                            {currentZoom >= MIN_ZOOM_FOR_POINTS ? (
                                <span>
                                    {isLoadingPoints ? (
                                        <span className="flex items-center gap-1.5 text-blue-600">
                                            <Loader2 size={12} className="animate-spin" />
                                            Carregando UCs na área...
                                        </span>
                                    ) : (
                                        <span>
                                            <strong>{visibleInstallations.length}</strong> UCs visíveis nesta área (Zoom {currentZoom}{currentZoom >= 18 ? ' - Máx' : ''})
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span>Aproxime o mapa para ver as UCs (Zoom {currentZoom}/{MIN_ZOOM_FOR_POINTS})</span>
                                    <button
                                        type="button"
                                        onClick={zoomInToPoints}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
                                        title="Aproximar para nível de exibição"
                                    >
                                        <ZoomIn size={11} /> Aproximar
                                    </button>
                                </span>
                            )}
                        </div>

                        {currentZoom >= MIN_ZOOM_FOR_POINTS && (
                            <button
                                type="button"
                                onClick={() => setShowPointsLayer(!showPointsLayer)}
                                className={`ml-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                                    showPointsLayer 
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={showPointsLayer ? 'Ocultar UCs' : 'Exibir UCs'}
                            >
                                {showPointsLayer ? <Eye size={11} /> : <EyeOff size={11} />}
                                <span>{showPointsLayer ? 'Visível' : 'Oculto'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto pointer-events-auto max-w-2xl mx-auto w-full animate-in slide-in-from-top-4 duration-300">
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                onClick={() => selectInstallation(result, true)}
                                className="p-5 border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all active:bg-blue-100/30 first:rounded-t-3xl last:rounded-b-3xl"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            {result.full_uc || result.installation_number || result.id}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                                            {result.name || result.NOME || 'Titular não informado'}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                                            {result.address || result.LOGRADOURO || 'Endereço indisponível'}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-[9px] font-black text-blue-600/60 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">UC CENTRAL</div>
                                        <div className="text-xs font-mono font-black text-slate-400 mt-1">{result.uc_core || '---'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Card: Selected UC (Complete Data) */}
            {selectedInstallation && (
                <div className="absolute bottom-6 left-4 right-4 z-[1000] pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl p-5 sm:p-6 pointer-events-auto max-w-md mx-auto w-full animate-in slide-in-from-bottom-6 duration-500 rounded-3xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-1">
                                        <Zap size={10} />
                                        UC SELECIONADA
                                    </span>
                                    {detectedRiskArea && (
                                        <button
                                            type="button"
                                            onClick={() => setShowRiskModal(true)}
                                            className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <ShieldAlert size={10} />
                                            ÁREA DE RISCO
                                        </button>
                                    )}
                                </div>
                                <h2 className="font-black text-slate-900 text-xl sm:text-2xl tracking-tight leading-none font-mono">
                                    {selectedInstallation.full_uc || selectedInstallation.installation_number}
                                </h2>
                                <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                                    {selectedInstallation.name || selectedInstallation.NOME || 'Titular não informado'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInstallation(null)}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0 ml-2"
                                title="Fechar detalhes"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Complete Address & Bairro */}
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-3 space-y-1.5">
                            <div className="flex gap-2 items-start">
                                <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-xs text-slate-700 font-semibold leading-snug">
                                        {selectedInstallation.address || selectedInstallation.LOGRADOURO || 'Endereço não disponível no cadastro.'}
                                    </p>
                                    {(selectedInstallation.bairro || selectedInstallation.NOME_BAIRRO) && (
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Bairro: <span className="font-bold text-slate-700">{selectedInstallation.bairro || selectedInstallation.NOME_BAIRRO}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Complete Technical Data Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Nº Instalação</span>
                                <span className="font-mono font-black text-slate-800">
                                    {selectedInstallation.installation_number || selectedInstallation['Instalação'] || '---'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status da UC</span>
                                <span className="font-bold text-slate-800">
                                    {selectedInstallation.status || selectedInstallation['Status da UC'] || 'Ativa'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Coordenadas</span>
                                    <span className="font-mono text-xs font-bold text-slate-700">
                                        {getCoords(selectedInstallation) 
                                            ? `${getCoords(selectedInstallation)[0].toFixed(6)}, ${getCoords(selectedInstallation)[1].toFixed(6)}`
                                            : 'Não localizadas'
                                        }
                                    </span>
                                </div>
                                {getCoords(selectedInstallation) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const coords = getCoords(selectedInstallation);
                                            copyText(`${coords[0]}, ${coords[1]}`, 'Coordenadas copiadas!');
                                        }}
                                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                        title="Copiar Coordenadas"
                                    >
                                        <Copy size={11} />
                                        <span>Copiar</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Risk Diagnosis Card if inside risk area */}
                        {detectedRiskArea && (
                            <div className="mb-3 p-3 bg-red-50/80 border border-red-200 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                                        <ShieldAlert size={15} className="text-red-600" />
                                        <span>{detectedRiskArea.source || 'Área de Risco'}: {detectedRiskArea.name}</span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-red-700">
                                    Grau de Risco: <span className="font-bold uppercase">{detectedRiskArea.riskLevel || 'Não especificado'}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRiskModal(true)}
                                    className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                                >
                                    Ver Detalhes do Laudo / Setor
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => openGoogleMapsFor(selectedInstallation)}
                                disabled={!getCoords(selectedInstallation)}
                                className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${getCoords(selectedInstallation)
                                    ? 'bg-slate-900 text-white hover:bg-black shadow-lg active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Navigation size={16} />
                                Rota Maps
                            </button>
                            <button
                                onClick={() => {
                                    const uc = selectedInstallation.full_uc || selectedInstallation.installation_number;
                                    copyText(uc, `UC ${uc} copiada!`);
                                }}
                                className="py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Copy size={16} />
                                Copiar UC
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Component - Locked to maxZoom 18 to avoid blank tiles */}
            <MapContainer
                center={SMJ_CENTER}
                zoom={12}
                maxZoom={18}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <MapInitialBounds />
                <LayersControl position="bottomright">
                    <BaseLayer checked name="Padrão">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={18}
                        />
                    </BaseLayer>
                    <BaseLayer name="Satélite">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            maxZoom={18}
                            maxNativeZoom={18}
                        />
                    </BaseLayer>
                    <BaseLayer name="Híbrido">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            maxZoom={18}
                            maxNativeZoom={18}
                        />
                    </BaseLayer>

                    <Overlay name="Áreas de Risco (SEDURB)">
                        <GeoJSON 
                            data={sedurbData} 
                            style={() => ({
                                color: '#ef4444',
                                weight: 2,
                                fillOpacity: 0.35,
                                fillColor: '#f87171'
                            })}
                        />
                    </Overlay>

                    <Overlay name="Complexos CPRM (Federal)">
                        <GeoJSON 
                            data={cprmData} 
                            style={() => ({
                                color: '#ea580c',
                                weight: 2,
                                fillOpacity: 0.25,
                                fillColor: '#fb923c'
                            })}
                        />
                    </Overlay>

                    <Overlay checked name="Limite Municipal (Santa Maria de Jetibá)">
                        <LimiteSMJLayer keyId="limite-smj-georescue" />
                    </Overlay>
                </LayersControl>

                <OrthofotsLayer />
                <ZoomControl position="bottomright" />
                <MapUpdater center={mapCenterTarget} />
                <MapViewportListener onViewportChange={handleViewportChange} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={L.divIcon({
                        className: 'user-location-marker',
                        html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>',
                        iconSize: [20, 20]
                    })}>
                        <Popup>Sua localização</Popup>
                    </Marker>
                )}

                {/* Clustered Installation Markers with automatic spiderfy */}
                {showPointsLayer && visibleInstallations.length > 0 && (
                    <MarkerClusterGroup
                        iconCreateFunction={createInstallationClusterIcon}
                        maxClusterRadius={45}
                        chunkedLoading={true}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                        spiderfyDistanceMultiplier={2.2}
                        spiderLegPolylineOptions={{ weight: 2.5, color: '#2563eb', opacity: 0.85 }}
                        onClusterClick={handleClusterClick}
                    >
                        {visibleInstallations.map((inst) => {
                            const coords = [inst.lat, inst.lng];
                            const isRisk = !!inst.riskInfo;
                            return (
                                <Marker
                                    key={inst.id || inst.installation_number || `${inst.lat}-${inst.lng}`}
                                    position={coords}
                                    icon={createInstallationIcon(isRisk)}
                                    isRisk={isRisk}
                                    eventHandlers={{
                                        click: () => {
                                            selectInstallation(inst, false);
                                        }
                                    }}
                                >
                                    <Popup className="custom-popup" minWidth={260}>
                                        <div className="p-1 space-y-2 font-sans">
                                            {/* Header */}
                                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Zap size={14} className={isRisk ? 'text-red-500' : 'text-blue-600'} />
                                                    <span className="font-black text-xs text-blue-600 tracking-tight font-mono">
                                                        {inst.full_uc || inst.installation_number}
                                                    </span>
                                                </div>
                                                {isRisk && (
                                                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                                        ÁREA DE RISCO
                                                    </span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-800 leading-tight">
                                                    {inst.name || inst.NOME || 'Titular não informado'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-start gap-1">
                                                    <MapPin size={11} className="shrink-0 mt-0.5 text-slate-400" />
                                                    <span className="line-clamp-2">
                                                        {inst.address || inst.LOGRADOURO || 'Endereço indisponível'}
                                                        {inst.bairro ? ` • ${inst.bairro}` : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Grid: Instalação & Status */}
                                            <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl text-[10px] text-slate-600 border border-slate-100">
                                                <div>
                                                    <span className="text-slate-400 block font-medium">Instalação:</span>
                                                    <span className="font-bold font-mono text-slate-700">{inst.installation_number || '---'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block font-medium">Status:</span>
                                                    <span className="font-bold text-slate-700">{inst.status || 'Ativa'}</span>
                                                </div>
                                            </div>

                                            {/* Coords */}
                                            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                                                <span>{inst.lat?.toFixed(5)}, {inst.lng?.toFixed(5)}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyText(`${inst.lat}, ${inst.lng}`, 'Coordenadas copiadas!');
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold cursor-pointer"
                                                >
                                                    <Copy size={10} /> Copiar
                                                </button>
                                            </div>

                                            {/* Risk Alert if inside risk area */}
                                            {isRisk && (
                                                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 space-y-1">
                                                    <div className="font-bold flex items-center gap-1 text-red-800">
                                                        <ShieldAlert size={12} className="shrink-0" />
                                                        <span className="truncate">{inst.riskInfo.source || 'Área de Risco'}: {inst.riskInfo.name || 'Setor'}</span>
                                                    </div>
                                                    <div className="text-[9px] text-red-600">
                                                        Grau de Risco: <strong>{inst.riskInfo.riskLevel || 'Não informado'}</strong>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetectedRiskArea(inst.riskInfo);
                                                            setShowRiskModal(true);
                                                        }}
                                                        className="w-full py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                                                    >
                                                        Ver Laudo do Risco
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openGoogleMapsFor(inst);
                                                    }}
                                                    className="py-2 px-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <Navigation size={12} />
                                                    <span>Rota Maps</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectInstallation(inst, false);
                                                    }}
                                                    className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors border border-blue-100 cursor-pointer"
                                                >
                                                    <Info size={12} />
                                                    <span>Detalhes</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MarkerClusterGroup>
                )}

                {/* Fallback Single Marker when selected via search and zoomed out */}
                {selectedInstallation && getCoords(selectedInstallation) && currentZoom < MIN_ZOOM_FOR_POINTS && (
                    <Marker position={getCoords(selectedInstallation)} icon={createInstallationIcon(!!detectedRiskArea)}>
                        <Popup className="custom-popup" minWidth={240}>
                            <div className="p-1 space-y-1">
                                <div className="font-black text-blue-600 uppercase text-[10px] tracking-widest">
                                    {selectedInstallation.full_uc || selectedInstallation.installation_number}
                                </div>
                                <div className="font-bold text-slate-800 text-xs leading-tight">
                                    {selectedInstallation.name || selectedInstallation.NOME || 'Titular não informado'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                    {selectedInstallation.address || selectedInstallation.LOGRADOURO}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Success Modal */}
            {importSuccess && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 p-10 max-w-sm w-full shadow-2xl rounded-3xl border-slate-100 dark:border-slate-700 text-center space-y-6 scale-in-center overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-2 transform rotate-12 transition-transform hover:rotate-0 duration-500">
                            <UploadCloud size={40} className="text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{importSuccess.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {importSuccess.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setImportSuccess(null)}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[2px] transition-all shadow-xl active:scale-95"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Risk Area Modal */}
            <RiskAreaModal 
                isOpen={showRiskModal}
                onClose={() => setShowRiskModal(false)}
                riskInfo={detectedRiskArea}
            />
        </div>
    )
}

export default GeoRescue

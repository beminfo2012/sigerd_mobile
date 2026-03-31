import React, { useEffect, useState, useRef, useCallback } from 'react'
// VERSION: MODv103 - Forced High Priority Refresh
import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    useMap, 
    ZoomControl, 
    LayersControl, 
    GeoJSON 
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Loader2, Navigation, MapPin, RefreshCw, UploadCloud, Layers } from 'lucide-react'
import { georescue } from '../../services/supabase'
import { searchInstallations, getInstallationsCount, importInstallations } from '../../services/db'
import { useToast } from '../../components/ToastNotification'
import { checkRiskArea } from '../../services/riskAreas'
import RiskAreaModal from '../../components/RiskAreaModal'

// GeoJSON Data for Layers
import cprmData from '../../data/risk_cprm.json'
import sedurbData from '../../data/risk_sedurb.json'

const { BaseLayer, Overlay } = LayersControl;

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

// Child component to update map view
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 18); // Higher zoom for GeoRescue precision
        }
    }, [center, map]);
    return null;
}

const GeoRescue = () => {
    const { toast } = useToast()
    const [position, setPosition] = useState([-20.3155, -40.3128]) // Default ES coords
    const [hasPosition, setHasPosition] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [importSuccess, setImportSuccess] = useState(null)
    const [selectedInstallation, setSelectedInstallation] = useState(null)
    const [searching, setSearching] = useState(false)
    const [totalInstallations, setTotalInstallations] = useState(0)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    const syncInProgress = useRef(false)

    // Risk Area States
    const [detectedRiskArea, setDetectedRiskArea] = useState(null)
    const [showRiskModal, setShowRiskModal] = useState(false)

    useEffect(() => {
        // Attempt to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude])
                    setHasPosition(true)
                },
                (err) => {
                    console.log('Location access denied or error:', err)
                },
                { enableHighAccuracy: true }
            )
        }
    }, [])

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

            localStorage.setItem('geo_db_version', 'v4');
            setImportSuccess({
                title: 'Banco Atualizado!',
                message: `${updatedCount} unidades consumidoras carregadas e prontas para uso offline.`
            });

        } catch (e) {
            console.error('Import failed:', e);
            toast.error('Falha na atualização', 'Erro ao importar dados: ' + e.message);
        } finally {
            setIsImporting(false);
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
            }
        } catch (e) {
            console.error('[GeoRescue] Background sync failed:', e)
        } finally {
            syncInProgress.current = false
            setIsSyncing(false)
        }
    }, [])

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
        const lat = parseFloat(inst.lat || inst.lat_core || inst.pee_lat || inst.client_lat)
        const lng = parseFloat(inst.lng || inst.lng_core || inst.pee_lng || inst.client_lng)
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng]
        return null
    }

    const handleRiskDetection = (lat, lng) => {
        const riskInfo = checkRiskArea(lat, lng)
        if (riskInfo) {
            setDetectedRiskArea(riskInfo)
            setShowRiskModal(true)
        }
    }

    const selectInstallation = (installation) => {
        setSelectedInstallation(installation)
        setSearchResults([])
        setSearchQuery('')

        const coords = getCoords(installation)
        if (coords) {
            setPosition(coords)
            handleRiskDetection(coords[0], coords[1])
        }
    }

    const openGoogleMaps = () => {
        const coords = getCoords(selectedInstallation)
        if (coords) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank')
        }
    }

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

            {/* Top Search Bar & Info - Lowered z-index slightly to play nice with Sidebar (z-5000) */}
            <div className="absolute top-4 left-4 right-4 z-[1000] space-y-3 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md rounded-[2rem] shadow-2xl border border-slate-100 p-4 pointer-events-auto max-w-2xl mx-auto w-full transition-all duration-500 group focus-within:shadow-blue-500/10">
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

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto pointer-events-auto max-w-2xl mx-auto w-full animate-in slide-in-from-top-4 duration-300">
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                onClick={() => selectInstallation(result)}
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

            {/* Bottom Card: Selected UC */}
            {selectedInstallation && (
                <div className="absolute bottom-6 left-4 right-4 z-[1000] pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 pointer-events-auto max-w-md mx-auto w-full animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">SELECIONADA</span>
                                    {checkRiskArea(getCoords(selectedInstallation)?.[0], getCoords(selectedInstallation)?.[1]) && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse">ÁREA DE RISCO</span>
                                    )}
                                </div>
                                <h2 className="font-black text-slate-900 text-2xl tracking-tight leading-none">
                                    {selectedInstallation.full_uc || selectedInstallation.installation_number}
                                </h2>
                                <p className="text-sm font-bold text-slate-600 uppercase tracking-tight">
                                    {selectedInstallation.name || selectedInstallation.NOME}
                                </p>
                                <div className="flex gap-2 items-start mt-2">
                                    <MapPin size={14} className="text-slate-400 mt-0.5" />
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                        {selectedInstallation.address || selectedInstallation.LOGRADOURO || 'Endereço não disponível no cadastro.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedInstallation(null)}
                                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-inner"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={openGoogleMaps}
                                disabled={!getCoords(selectedInstallation)}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-3 transition-all ${getCoords(selectedInstallation)
                                    ? 'bg-slate-900 text-white hover:bg-black shadow-xl active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Navigation size={18} />
                                Rota Google Maps
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Component */}
            <MapContainer
                center={position}
                zoom={14}
                zoomControl={false} // Custom control below
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <LayersControl position="bottomright">
                    <BaseLayer checked name="Padrão">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </BaseLayer>
                    <BaseLayer name="Satélite">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                        />
                    </BaseLayer>
                    <BaseLayer name="Híbrido">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
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
                </LayersControl>

                <ZoomControl position="bottomright" />
                <MapUpdater center={getCoords(selectedInstallation) || (hasPosition ? position : null)} />

                {/* User Location Marker */}
                {hasPosition && (
                    <Marker position={position} icon={L.divIcon({
                        className: 'user-location-marker',
                        html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>',
                        iconSize: [20, 20]
                    })}>
                        <Popup>Sua localização</Popup>
                    </Marker>
                )}

                {/* Selected Installation Marker */}
                {selectedInstallation && getCoords(selectedInstallation) && (
                    <Marker position={getCoords(selectedInstallation)}>
                        <Popup className="custom-popup">
                            <div className="p-2 space-y-1">
                                <div className="font-black text-blue-600 uppercase text-[10px] tracking-widest">{selectedInstallation.full_uc}</div>
                                <div className="font-bold text-slate-800 text-sm leading-tight">{selectedInstallation.name}</div>
                                <div className="text-xs text-slate-500 font-medium">{selectedInstallation.address}</div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Success Modal */}
            {importSuccess && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-6 scale-in-center overflow-hidden relative">
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

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Loader2, Navigation, MapPin } from 'lucide-react'
import { georescue } from '../../services/supabase'
import { searchInstallations, getInstallationsCount, importInstallations } from '../../services/db'

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
            map.flyTo(center, 16);
        }
    }, [center, map]);
    return null;
}

const GeoRescue = () => {
    const [position, setPosition] = useState([-20.3155, -40.3128]) // Default ES coords
    const [hasPosition, setHasPosition] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedInstallation, setSelectedInstallation] = useState(null)
    const [searching, setSearching] = useState(false)
    const [totalInstallations, setTotalInstallations] = useState(0)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)

    useEffect(() => {
        // Init handled by separate effect
        // initUCData()

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


            console.log('Importing updated UC data (v4 - 01.2026)...')
            // Cache busting to ensure we get new file
            const response = await fetch('/uc_db_v4.json?t=' + new Date().getTime())
            if (!response.ok) throw new Error('Failed to fetch DB file')

            const ucData = await response.json()

            await importInstallations(ucData, (current, total) => {
                const pct = Math.round((current / total) * 100)
                setImportProgress(pct)
            })

            const updatedCount = await getInstallationsCount()
            setTotalInstallations(updatedCount)

            // Mark as updated
            localStorage.setItem('geo_db_version', 'v4')

            alert(`Banco de dados atualizado com sucesso!\n${updatedCount} unidades carregadas.`)

        } catch (e) {
            console.error('Import failed:', e)
            alert('Falha ao importar dados: ' + e.message)
        } finally {
            setIsImporting(false)
        }
    }

    const handleSearch = async (query) => {
        setSearchQuery(query)

        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            // Priority: search in local IndexedDB (which now contains UC data)
            const results = await searchInstallations(query)
            setSearchResults(results)

            // If no local results, try remote
            if (results.length === 0 && query.length > 5) {
                const { data, error } = await georescue
                    .from('electrical_installations')
                    .select('*')
                    .or(`installation_number.ilike.%${query}%,name.ilike.%${query}%,address.ilike.%${query}%`)
                    .limit(50)

                if (!error && data) {
                    setSearchResults(data)
                }
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
        const lat = parseFloat(inst.lat || inst.pee_lat || inst.client_lat)
        const lng = parseFloat(inst.lng || inst.pee_lng || inst.client_lng)
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng]
        return null
    }

    const selectInstallation = (installation) => {
        setSelectedInstallation(installation)
        setSearchResults([])
        setSearchQuery('')

        const coords = getCoords(installation)
        if (coords) {
            setPosition(coords)
        }
    }

    const openGoogleMaps = () => {
        const coords = getCoords(selectedInstallation)
        if (coords) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank')
        }
    }

    return (
        <div className="relative h-full">
            {/* Import Overlay */}
            {isImporting && (
                <div className="absolute inset-0 z-[2000] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-white">
                    <Loader2 size={48} className="animate-spin mb-4 text-blue-400" />
                    <h3 className="text-xl font-bold mb-2">Atualizando Banco de Dados</h3>
                    <p className="text-sm text-slate-300 mb-6 text-center">Importando dados do GeoRescue (01/2026)...<br />Isso pode levar alguns segundos.</p>

                    <div className="w-full max-w-xs bg-slate-700 rounded-full h-4 overflow-hidden mb-2">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${importProgress}%` }}
                        />
                    </div>
                    <div className="text-2xl font-black tabular-nums">{importProgress}%</div>
                </div>
            )}
            {/* Search Bar */}
            <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Buscar UC ou Endereço..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-3.5 text-blue-500 animate-spin" size={20} />
                        )}
                    </div>

                    {/* Total Count Badge */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={14} />
                            <span className="font-bold">{totalInstallations.toLocaleString()}</span>
                            <span>unidades</span>
                        </div>
                        <button
                            onClick={startImport}
                            className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            Atualizar Base
                        </button>
                    </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                            <div
                                key={result.id}
                                onClick={() => selectInstallation(result)}
                                className="p-4 border-b border-gray-100 hover:bg-slate-50 cursor-pointer transition-colors last:border-0"
                            >
                                <div className="font-bold text-gray-800 text-sm">{result.full_uc || result.installation_number}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">UC Central: <span className="text-blue-600">{result.uc_core || '---'}</span></div>
                                <div className="text-xs text-gray-500 mt-0.5">{result.name || result.NOME}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{result.address || result.LOGRADOURO}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Installation Info */}
            {selectedInstallation && (
                <div className="absolute bottom-24 left-4 right-4 z-[1000]">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="text-xs text-blue-600 font-bold mb-1">UNIDADE CONSUMIDORA (UC) SELECIONADA</div>
                                <div className="font-black text-gray-800 text-lg">{selectedInstallation.full_uc || selectedInstallation.installation_number}</div>
                                <div className="text-sm text-gray-600 mt-1">{selectedInstallation.name || selectedInstallation.NOME}</div>
                                <div className="text-xs text-gray-400 mt-1">{selectedInstallation.address || selectedInstallation.LOGRADOURO || selectedInstallation.NOME_LOGRADOURO}</div>
                            </div>
                            <button
                                onClick={() => setSelectedInstallation(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <button
                            onClick={openGoogleMaps}
                            disabled={!getCoords(selectedInstallation)}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${getCoords(selectedInstallation)
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {getCoords(selectedInstallation) ? (
                                <>
                                    <Navigation size={20} />
                                    Rota Google Maps
                                </>
                            ) : (
                                <>
                                    <Navigation size={20} className="opacity-50" />
                                    Sem Localização
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Map */}
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={getCoords(selectedInstallation) || (hasPosition ? position : null)} />

                {/* User Location Marker */}
                <Marker position={position}>
                    <Popup>Sua localização</Popup>
                </Marker>

                {/* Selected Installation Marker */}
                {selectedInstallation && getCoords(selectedInstallation) && (
                    <Marker position={getCoords(selectedInstallation)}>
                        <Popup>
                            <div className="font-bold">{selectedInstallation.installation_number}</div>
                            <div className="text-sm">{selectedInstallation.name}</div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    )
}

export default GeoRescue

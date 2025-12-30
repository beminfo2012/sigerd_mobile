import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Loader2, Navigation, MapPin } from 'lucide-react'
import { georescue } from '../../services/supabase'

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
    const [position, setPosition] = useState([-20.0, -40.5]) // Default coords (ES)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedInstallation, setSelectedInstallation] = useState(null)
    const [searching, setSearching] = useState(false)
    const [totalInstallations, setTotalInstallations] = useState(0)

    useEffect(() => {
        // Get total count
        loadTotalCount()

        // Attempt to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude])
                },
                () => console.log('Location access denied')
            )
        }
    }, [])

    const loadTotalCount = async () => {
        try {
            const { count, error } = await georescue
                .from('electrical_installations')
                .select('*', { count: 'exact', head: true })

            if (!error) {
                setTotalInstallations(count || 0)
            }
        } catch (err) {
            console.error('Error loading count:', err)
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
            const { data, error } = await georescue
                .from('electrical_installations')
                .select('*')
                .or(`installation_number.ilike.%${query}%,name.ilike.%${query}%,address.ilike.%${query}%`)
                .limit(50)

            if (!error && data) {
                setSearchResults(data)
            } else {
                console.error('Search error:', error)
                setSearchResults([])
            }
        } catch (err) {
            console.error('Search failed:', err)
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }

    const selectInstallation = (installation) => {
        setSelectedInstallation(installation)
        setSearchResults([])
        setSearchQuery('')

        // Use PEE coordinates if available, otherwise client coordinates
        const lat = installation.pee_lat || installation.client_lat
        const lng = installation.pee_lng || installation.client_lng

        if (lat && lng) {
            setPosition([lat, lng])
        }
    }

    const openGoogleMaps = () => {
        if (selectedInstallation) {
            const lat = selectedInstallation.pee_lat || selectedInstallation.client_lat
            const lng = selectedInstallation.pee_lng || selectedInstallation.client_lng
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
        }
    }

    return (
        <div className="relative h-full">
            {/* Search Bar */}
            <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Buscar instalação..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-3.5 text-blue-500 animate-spin" size={20} />
                        )}
                    </div>

                    {/* Total Count Badge */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={14} />
                        <span className="font-bold">{totalInstallations.toLocaleString()}</span>
                        <span>instalações cadastradas</span>
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
                                <div className="font-bold text-gray-800 text-sm">{result.installation_number}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{result.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{result.address}</div>
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
                                <div className="text-xs text-blue-600 font-bold mb-1">INSTALAÇÃO SELECIONADA</div>
                                <div className="font-black text-gray-800 text-lg">{selectedInstallation.installation_number}</div>
                                <div className="text-sm text-gray-600 mt-1">{selectedInstallation.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{selectedInstallation.address}</div>
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
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
                        >
                            <Navigation size={20} />
                            Rota Google Maps
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
                <MapUpdater center={selectedInstallation ? position : null} />

                {/* User Location Marker */}
                <Marker position={position}>
                    <Popup>Sua localização</Popup>
                </Marker>

                {/* Selected Installation Marker */}
                {selectedInstallation && (
                    <Marker position={[
                        selectedInstallation.pee_lat || selectedInstallation.client_lat,
                        selectedInstallation.pee_lng || selectedInstallation.client_lng
                    ]}>
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

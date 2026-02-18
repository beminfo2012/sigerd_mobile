import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const StateMap = ({ occurrences = [] }) => {
    // Center of Espírito Santo
    const position = [-19.1833, -40.3];

    // Default data for SMJ if occurrences are empty (mock)
    const mapMarkers = occurrences;

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
            <MapContainer
                center={position}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapMarkers.map((m) => (
                    <React.Fragment key={m.id}>
                        <Marker position={[m.lat, m.lng]}>
                            <Popup className="premium-popup">
                                <div className="p-1">
                                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest border-b pb-2 mb-2">{m.name}</h4>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                            Gravidade: <span className={m.gravity === 'Crítica' ? 'text-red-600' : 'text-orange-600'}>{m.gravity}</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                            Afetados: <span className="text-blue-600">{m.afetados}</span>
                                        </p>
                                    </div>
                                    <button className="w-full mt-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Ver Detalhes</button>
                                </div>
                            </Popup>
                        </Marker>

                        <Circle
                            center={[m.lat, m.lng]}
                            radius={m.afetados * 2} // Simulated heat area
                            pathOptions={{
                                color: m.gravity === 'Crítica' ? '#ef4444' : '#f59e0b',
                                fillColor: m.gravity === 'Crítica' ? '#ef4444' : '#f59e0b',
                                fillOpacity: 0.2,
                                borderWidth: 1
                            }}
                        />
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};

export default StateMap;

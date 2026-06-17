/**
 * LimiteSMJLayer - Componente reutilizável para exibir o limite municipal
 * de Santa Maria de Jetibá em qualquer mapa Leaflet do SIGERD.
 *
 * Uso: <LimiteSMJLayer />
 * Deve ser colocado DENTRO de um <MapContainer> do react-leaflet.
 * Não requer props - carrega o GeoJSON automaticamente via fetch.
 */
import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'

const LIMITE_STYLE = {
    color: '#64748b',
    fillColor: 'transparent',
    fillOpacity: 0,
    weight: 2,
    dashArray: '8, 6',
    opacity: 0.75,
    lineCap: 'round',
    lineJoin: 'round'
}

// Cache em memória para evitar múltiplos fetches entre componentes
let _cachedData = null
let _fetchPromise = null

const fetchLimite = () => {
    if (_cachedData) return Promise.resolve(_cachedData)
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = fetch('/limite_smj.json')
        .then(res => res.json())
        .then(data => {
            _cachedData = data
            return data
        })
        .catch(err => {
            console.warn('[LimiteSMJLayer] Erro ao carregar limite SMJ:', err)
            _fetchPromise = null
            return null
        })
    return _fetchPromise
}

const LimiteSMJLayer = ({ style, keyId }) => {
    const [data, setData] = useState(_cachedData)

    useEffect(() => {
        if (!_cachedData) {
            fetchLimite().then(d => d && setData(d))
        }
    }, [])

    if (!data) return null

    return (
        <GeoJSON
            key={keyId || 'limite-smj'}
            data={data}
            style={() => ({ ...LIMITE_STYLE, ...style })}
            onEachFeature={(feature, layer) => {
                layer.bindPopup(
                    `<div style="font-family:sans-serif;font-size:11px;font-weight:700;color:#334155;padding:2px 4px;">
                        🗺️ Limite Municipal — Santa Maria de Jetibá
                    </div>`
                )
            }}
        />
    )
}

export default LimiteSMJLayer

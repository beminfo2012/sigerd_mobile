import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Ensure window.L is available for the heatmap plugin
if (typeof window !== 'undefined' && !window.L) {
    window.L = L
}

const HeatmapLayer = ({ points, show = true, options = {} }) => {
    const map = useMap()

    useEffect(() => {
        if (!show || !points || points.length === 0 || !window.L || !window.L.heatLayer) return

        const heatData = points.map(p => [p.lat, p.lng, p.intensity || 0.5])

        const defaultOptions = {
            radius: 20,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }

        const heatLayer = window.L.heatLayer(heatData, { ...defaultOptions, ...options }).addTo(map)

        return () => {
            if (map.hasLayer(heatLayer)) {
                map.removeLayer(heatLayer)
            }
        }
    }, [map, points, show, options])

    return null
}

export default HeatmapLayer

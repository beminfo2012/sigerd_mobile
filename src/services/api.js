import { supabase } from './supabase'
import { getRemoteVistoriasCache, saveRemoteVistoriasCache } from './db'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/sigerd/api'

export const api = {
    async getDashboardData() {
        try {
            // 1. Load from local cache first (Persistence/Offline)
            let cachedVistorias = await getRemoteVistoriasCache()

            // 2. Try to fetch only NEW vistorias from Supabase (Incremental Update)
            let allVistorias = [...cachedVistorias]

            if (navigator.onLine) {
                try {
                    let lastCreatedAt = '1970-01-01T00:00:00Z'
                    if (cachedVistorias.length > 0) {
                        lastCreatedAt = cachedVistorias.reduce((max, v) =>
                            (v.created_at || '1970') > max ? (v.created_at || '1970') : max, lastCreatedAt)
                    }

                    // Fetch records created AFTER our last cached record
                    let currentOffset = 0
                    let fetchedBatch = []

                    do {
                        const { data: batch, error: fetchError } = await supabase
                            .from('vistorias')
                            .select('*')
                            .gt('created_at', lastCreatedAt)
                            .order('created_at', { ascending: true })
                            .range(currentOffset, currentOffset + 999);

                        if (fetchError) {
                            console.error('Supabase fetch error:', fetchError)
                            break
                        }

                        if (batch && batch.length > 0) {
                            fetchedBatch = [...fetchedBatch, ...batch]
                            currentOffset += batch.length
                            if (batch.length < 1000) break
                        } else {
                            break
                        }
                    } while (true)

                    if (fetchedBatch.length > 0) {
                        await saveRemoteVistoriasCache(fetchedBatch)

                        const mergedMap = new Map()
                        // Use multiple keys for merging to be robust
                        allVistorias.forEach(v => {
                            const key = v.vistoria_id || v.vistoriaId || v.id || (v.coordenadas + v.created_at)
                            if (key) mergedMap.set(key, v)
                        })
                        fetchedBatch.forEach(v => {
                            const key = v.vistoria_id || v.vistoriaId || v.id || (v.coordenadas + v.created_at)
                            if (key) mergedMap.set(key, v)
                        })
                        allVistorias = Array.from(mergedMap.values())
                    }
                } catch (e) {
                    console.warn('Incremental fetch failed:', e)
                }
            }

            // Normalization for charts and maps
            const vistoriasData = allVistorias;
            const locations = vistoriasData
                .filter(v => (v.coordenadas && String(v.coordenadas).includes(',')) || (v.latitude && v.longitude))
                .map(v => {
                    let lat, lng;
                    if (v.coordenadas && String(v.coordenadas).includes(',')) {
                        const parts = String(v.coordenadas).split(',')
                        lat = parseFloat(parts[0])
                        lng = parseFloat(parts[1])
                    } else if (v.latitude && v.longitude) {
                        lat = parseFloat(v.latitude)
                        lng = parseFloat(v.longitude)
                    }

                    if (isNaN(lat) || isNaN(lng)) return null

                    const subtypes = v.subtipos_risco || []
                    const category = v.categoria_risco || 'Outros'

                    return {
                        lat,
                        lng,
                        risk: category,
                        details: subtypes.length > 0 ? subtypes.join(', ') : category,
                        date: v.created_at || v.data_hora || new Date().toISOString()
                    }
                })
                .filter(loc => loc !== null) || []

            // Calculate breakdown by Category
            const totalReports = vistoriasData.length;
            const counts = {};

            vistoriasData.forEach(v => {
                const cat = v.categoria_risco || 'Outros';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const breakdown = Object.keys(counts).map((label, idx) => ({
                label,
                count: counts[label],
                percentage: totalReports > 0 ? Math.round((counts[label] / totalReports) * 100) : 0,
                color: 'bg-blue-500' // Simple fallback color
            })).sort((a, b) => b.count - a.count);

            // Fetch INMET alerts
            let inmetAlerts = [];
            try {
                const inmetResp = await fetch('/api/inmet');
                if (inmetResp.ok) {
                    const alerts = await inmetResp.json();
                    inmetAlerts = Array.isArray(alerts) ? alerts : [];
                }
            } catch (e) { console.error('INMET fetch error:', e); }

            return {
                stats: {
                    totalVistorias: totalReports,
                    activeOccurrences: inmetAlerts.length,
                    inmetAlertsCount: inmetAlerts.length
                },
                breakdown,
                locations,
                alerts: inmetAlerts
            }
        } catch (error) {
            console.error('API Error:', error)
            return {
                stats: { totalVistorias: 0, activeOccurrences: 0, inmetAlertsCount: 0 },
                breakdown: [],
                locations: []
            }
        }
    }
}

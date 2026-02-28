import { supabase } from './supabase'
import { getRemoteVistoriasCache, saveRemoteVistoriasCache, getAllVistoriasLocal } from './db'
import { getOcorrenciasLocal } from './ocorrenciasDb'

const colorPalette = {
    'Geológico / Geotécnico': 'bg-orange-500',
    'Risco Geológico': 'bg-orange-500',
    'Hidrológico': 'bg-blue-500',
    'Inundação': 'bg-blue-500',
    'Alagamento': 'bg-blue-400',
    'Inundação/Alagamento': 'bg-blue-500',
    'Enxurrada': 'bg-blue-600',
    'Estrutural': 'bg-slate-400',
    'Estrutural/Predial': 'bg-slate-400',
    'Ambiental': 'bg-emerald-500',
    'Tecnológico': 'bg-amber-500',
    'Climático / Meteorológico': 'bg-sky-500',
    'Infraestrutura Urbana': 'bg-indigo-500',
    'Sanitário': 'bg-rose-500',
    'Deslizamento': 'bg-orange-500',
    'Vendaval': 'bg-sky-600',
    'Granizo': 'bg-indigo-400',
    'Incêndio': 'bg-red-500',
    'Outros': 'bg-slate-400'
};

const defaultColors = ['bg-slate-300', 'bg-slate-400', 'bg-slate-500'];

const processListToMapData = (list) => {
    return list
        .filter(v => (v.coordenadas && String(v.coordenadas).includes(',')) || (v.latitude && v.longitude) || (v.lat && v.lng))
        .map(v => {
            let lat, lng;
            if (v.coordenadas && String(v.coordenadas).includes(',')) {
                const parts = String(v.coordenadas).split(',')
                lat = parseFloat(parts[0])
                lng = parseFloat(parts[1])
            } else {
                lat = parseFloat(v.latitude || v.lat)
                lng = parseFloat(v.longitude || v.lng)
            }

            if (isNaN(lat) || isNaN(lng)) return null

            const subtypes = v.subtipos_risco || v.subtiposRisco || []
            const category = v.categoria_risco || v.categoriaRisco || 'Outros'

            return {
                id: v.id,
                formattedId: v.ocorrencia_id_format || v.ocorrencia_id || v.vistoria_id || v.vistoriaId || (v.id ? String(v.id).split('-')[0].toUpperCase() : ''),
                lat, lng,
                risk: category,
                status: v.status || 'Pendente',
                details: subtypes.length > 0 ? (Array.isArray(subtypes) ? subtypes.join(', ') : subtypes) : category,
                date: v.created_at || v.data_hora || v.dataHora || new Date().toISOString()
            }
        })
        .filter(loc => loc !== null);
};

const processBreakdown = (list) => {
    const counts = {};
    list.forEach(v => {
        const cat = v.categoria_risco || v.categoriaRisco || 'Outros';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: list.length > 0 ? Math.round((counts[label] / list.length) * 100) : 0,
        color: colorPalette[label] || defaultColors[idx % defaultColors.length]
    })).sort((a, b) => b.count - a.count);
};

const processLocalidadeBreakdown = (list) => {
    const counts = {};
    list.forEach(v => {
        const loc = v.bairro || v.comunidade || v.localidade || 'Não Informado';
        const label = loc.trim() || 'Não Informado';
        counts[label] = (counts[label] || 0) + 1;
    });

    const colors = [
        'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
        'bg-emerald-500', 'bg-teal-500', 'bg-orange-500',
        'bg-rose-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const total = list.length;

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
};

export const api = {
    async getDashboardData() {
        try {
            // 1. Fetch data in parallel
            const [remoteVistorias, remoteOcorrencias, localVistorias, localOcorrencias, inmetResp] = await Promise.all([
                navigator.onLine ? supabase.from('vistorias').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
                navigator.onLine ? supabase.from('ocorrencias_operacionais').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
                getAllVistoriasLocal().catch(() => []),
                getOcorrenciasLocal().catch(() => []),
                fetch('/api/inmet').catch(() => null)
            ]);

            // 2. Process Vistorias
            const vData = remoteVistorias.data || [];
            if (navigator.onLine && vData.length > 0) await saveRemoteVistoriasCache(vData).catch(() => { });
            const vistoriasCache = (!vData.length) ? await getRemoteVistoriasCache() : vData;

            const vMap = new Map();
            vistoriasCache.forEach(v => vMap.set(v.vistoria_id || v.id, v));
            localVistorias.filter(v => !v.synced).forEach(v => vMap.set(v.vistoriaId || v.id, v));
            const allVistorias = Array.from(vMap.values());

            // 3. Process Ocorrencias
            const oData = remoteOcorrencias.data || [];
            const oMap = new Map();
            oData.forEach(o => oMap.set(o.ocorrencia_id_format || o.ocorrencia_id || o.id, o));
            localOcorrencias.filter(o => !o.synced).forEach(o => oMap.set(o.ocorrencia_id_format || o.ocorrencia_id || o.id, o));
            const allOcorrencias = Array.from(oMap.values());

            // 4. INMET
            let inmetAlerts = [];
            if (inmetResp && inmetResp.ok) {
                const alerts = await inmetResp.json();
                inmetAlerts = Array.isArray(alerts) ? alerts : [];
            }

            // Stats for today
            const todayStr = new Date().toLocaleDateString('pt-BR');
            const todayOccurrences = allOcorrencias.filter(o => o.data_ocorrencia === todayStr).length;

            return {
                vistorias: {
                    stats: { total: allVistorias.length },
                    breakdown: processBreakdown(allVistorias),
                    localidadeBreakdown: processLocalidadeBreakdown(allVistorias),
                    locations: processListToMapData(allVistorias)
                },
                ocorrencias: {
                    stats: { total: allOcorrencias.length, today: todayOccurrences },
                    breakdown: processBreakdown(allOcorrencias),
                    localidadeBreakdown: processLocalidadeBreakdown(allOcorrencias),
                    locations: processListToMapData(allOcorrencias)
                },
                stats: {
                    totalVistorias: allVistorias.length,
                    activeOccurrences: todayOccurrences,
                    totalOccurrences: allOcorrencias.length,
                    inmetAlertsCount: inmetAlerts.length
                },
                // Maintaining top level for backward compat if needed
                breakdown: processBreakdown(allVistorias),
                locations: processListToMapData(allVistorias),
                alerts: inmetAlerts
            };

        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
}


import { supabase } from './supabase'
import { getRemoteVistoriasCache, saveRemoteVistoriasCache, getAllVistoriasLocal, getAllInterdicoesLocal } from './db'
import { getOcorrenciasLocal } from './ocorrenciasDb'

const colorPalette = {
    // Ocorrências Tipologias
    'Eventos Naturais / Climáticos': 'bg-sky-500',
    'EVENTOS NATURAIS / CLIMÁTICOS': 'bg-sky-500',
    'Climático / Meteorológico': 'bg-sky-500',
    'Quedas e Desabamentos': 'bg-orange-500',
    'QUEDAS E DESABAMENTOS': 'bg-orange-500',
    'Desabamento': 'bg-orange-500',
    'Reclamação de Rachadura/Trinca': 'bg-purple-500',
    'RECLAMAÇÃO DE RACHADURA/TRINCA': 'bg-purple-500',
    'Rachadura': 'bg-purple-500',
    'Salvamentos': 'bg-emerald-500',
    'SALVAMENTOS': 'bg-emerald-500',

    // Vistorias & Riscos Tipologias
    'Geológico / Geotécnico': 'bg-orange-500',
    'Risco Geológico': 'bg-orange-500',
    'Deslizamento': 'bg-orange-500',
    'Hidrológico': 'bg-blue-500',
    'Inundação': 'bg-blue-500',
    'Alagamento': 'bg-sky-400',
    'Inundação/Alagamento': 'bg-blue-500',
    'Enxurrada': 'bg-blue-600',
    'Estrutural': 'bg-purple-500',
    'Estrutural/Predial': 'bg-purple-500',
    'Ambiental': 'bg-emerald-500',
    'Tecnológico': 'bg-amber-500',
    'Infraestrutura Urbana': 'bg-indigo-500',
    'Sanitário': 'bg-rose-500',
    'Vendaval': 'bg-sky-600',
    'Granizo': 'bg-indigo-400',
    'Incêndio': 'bg-red-500',

    // Interdições Níveis / Grau de Risco
    'Muito Alto': 'bg-red-600',
    'MUITO ALTO': 'bg-red-600',
    'Alto': 'bg-red-500',
    'ALTO': 'bg-red-500',
    'Moderado': 'bg-amber-500',
    'MODERADO': 'bg-amber-500',
    'Baixo': 'bg-emerald-500',
    'BAIXO': 'bg-emerald-500',
    'Observação': 'bg-sky-500',
    'OBSERVAÇÃO': 'bg-sky-500',
    'Interdição': 'bg-rose-500',
    'Total': 'bg-red-600',
    'Parcial': 'bg-orange-500',

    'Outros': 'bg-indigo-400',
    'Outro': 'bg-indigo-400'
};

const defaultVibrantColors = [
    'bg-blue-500',
    'bg-orange-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-sky-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-red-500'
];

const processListToMapData = (list) => {
    return (list || [])
        .map(v => {
            if (!v) return null;
            
            const parseCoords = (input) => {
                const s = String(input || '');
                if (!s) return [null, null];
                // Support various formats: "-20,123 -40,123", "-20.123, -40.123", etc.
                const matches = s.match(/-?\d+[,.]\d+/g) || s.match(/-?\d+/g) || [];
                if (matches.length >= 2) {
                    return [
                        parseFloat(matches[0].replace(',', '.')),
                        parseFloat(matches[1].replace(',', '.'))
                    ];
                }
                return [null, null];
            };

            let lat = null, lng = null;
            
            // Try explicit fields first
            if (v.latitude && v.longitude) {
                lat = typeof v.latitude === 'string' ? parseFloat(v.latitude.replace(',', '.')) : parseFloat(v.latitude);
                lng = typeof v.longitude === 'string' ? parseFloat(v.longitude.replace(',', '.')) : parseFloat(v.longitude);
            } else if (v.lat && v.lng) {
                lat = typeof v.lat === 'string' ? parseFloat(v.lat.replace(',', '.')) : parseFloat(v.lat);
                lng = typeof v.lng === 'string' ? parseFloat(v.lng.replace(',', '.')) : parseFloat(v.lng);
            }
            
            // Fallback to coordinates string parsing if still null or invalid
            if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && v.coordenadas) {
                [lat, lng] = parseCoords(v.coordenadas);
            }

            if (!lat || !lng || isNaN(lat) || isNaN(lng) || Math.abs(lat) < 0.01) return null;

            let type = 'v';
            if (v.ocorrencia_id_format || v.ocorrencia_id || v.id_ocorrencia) type = 'o';
            else if (v.interdicao_id || v.interdicaoId || v.tipo_interdicao || v.id_interdicao || v.risco_tipo || v.medida_tipo || v.motivo_interdicao || v.status_interdicao) type = 'i';
            else if (v.vistoria_id || v.vistoriaId) type = 'v';

            const subtypes = v.subtipos_risco || v.subtiposRisco || [];
            const category = v.categoria_risco || v.categoriaRisco || v.risco_grau || v.riscoGrau || v.tipo_ocorrencia || v.tipoOcorrencia || (type === 'o' ? 'Ocorrência' : type === 'i' ? (v.risco_tipo || v.risco_grau || 'Interdição') : 'Vistoria');
            const nivelRisco = v.nivel_risco || v.nivelRisco || v.risco_grau || v.riscoGrau || category || 'Outros';

            return {
                id: v.id,
                formattedId: v.ocorrencia_id_format || v.ocorrencia_id || v.vistoria_id || v.vistoriaId || v.interdicao_id || v.interdicaoId || (v.id ? String(v.id).split('-')[0].toUpperCase() : ''),
                lat, lng,
                risk: category,
                nivelRisco,
                status: v.status || 'Pendente',
                details: subtypes.length > 0 ? (Array.isArray(subtypes) ? subtypes.join(', ') : subtypes) : (String(category || '')),
                date: v.created_at || v.data_hora || v.dataHora || new Date().toISOString(),
                type,
                risco_tipo: v.risco_tipo || v.riscoTipo,
                medida_tipo: v.medida_tipo || v.medidaTipo,
                coordenadas: v.coordenadas || `${lat},${lng}`,
                interdicao_id: v.interdicao_id || v.interdicaoId
            };
        })
        .filter(loc => loc !== null);
};

const processBreakdown = (list) => {
    const counts = {};
    list.forEach(v => {
        const cat = v.categoria_risco || v.categoriaRisco || v.tipo_ocorrencia || v.tipoOcorrencia || v.risco_grau || v.riscoGrau || v.risco_tipo || v.tipo_interdicao || v.medida_tipo || v.risk || 'Outros';
        const label = String(cat).trim() || 'Outros';
        counts[label] = (counts[label] || 0) + 1;
    });

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: list.length > 0 ? Math.round((counts[label] / list.length) * 100) : 0,
        color: colorPalette[label] || defaultVibrantColors[idx % defaultVibrantColors.length]
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
            // 1. Fetch data from Supabase in parallel with extended limits
            const [remoteVistorias, remoteOcorrencias, remoteInterdicoes, remoteDesinterdicoes, localVistorias, localOcorrencias, localInterdicoes, inmetResp] = await Promise.all([
                navigator.onLine ? supabase.from('vistorias')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1000) : Promise.resolve({ data: [] }),
                navigator.onLine ? supabase.from('ocorrencias_operacionais')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1000) : Promise.resolve({ data: [] }),
                navigator.onLine ? supabase.from('interdicoes')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1000) : Promise.resolve({ data: [] }),
                navigator.onLine ? supabase.from('desinterdicoes')
                    .select('*') : Promise.resolve({ data: [] }),
                getAllVistoriasLocal().catch(() => []),
                getOcorrenciasLocal().catch(() => []),
                getAllInterdicoesLocal().catch(() => []),
                fetch('/api/inmet').catch(() => null)
            ]);

            // 2. Process Vistorias (Supabase is source of truth when online)
            const vData = remoteVistorias.data || [];
            if (navigator.onLine && vData.length > 0) await saveRemoteVistoriasCache(vData).catch(() => { });
            const vistoriasCache = (!vData.length) ? await getRemoteVistoriasCache() : vData;
            const pendingLocalVistorias = (localVistorias || []).filter(v => v && !v.synced);

            const vMap = new Map();
            [...vistoriasCache, ...pendingLocalVistorias].forEach(v => {
                if (!v) return;
                const businessId = v.vistoria_id || v.vistoriaId || v.id_vistoria;
                const key = businessId ? String(businessId) : (v.id ? `tech-${v.id}` : `rnd-${Math.random()}`);
                vMap.set(key, v);
            });
            const allVistorias = Array.from(vMap.values());

            // 3. Process Ocorrencias
            const oData = remoteOcorrencias.data || [];
            const pendingLocalOcorrencias = (localOcorrencias || []).filter(o => o && !o.synced);
            const oMap = new Map();
            [...oData, ...pendingLocalOcorrencias].forEach(o => {
                if (!o) return;
                const businessId = o.ocorrencia_id_format || o.ocorrencia_id || o.id_ocorrencia;
                const key = businessId ? String(businessId) : (o.id ? `tech-${o.id}` : `rnd-${Math.random()}`);
                oMap.set(key, o);
            });
            const allOcorrencias = Array.from(oMap.values());

            // 4. Process Interdicoes (Filter out desinterdições to count ONLY active interdictions)
            const iData = remoteInterdicoes.data || [];
            const pendingLocalInterdicoes = (localInterdicoes || []).filter(i => i && !i.synced);
            const iMap = new Map();
            iData.forEach(i => {
                const key = i.id || i.interdicao_id || i.interdicaoId;
                if (key) iMap.set(key, i);
            });
            pendingLocalInterdicoes.forEach(i => {
                const key = i.id || i.interdicaoId || i.interdicao_id;
                if (key) iMap.set(key, i);
            });
            const rawInterdicoes = Array.from(iMap.values());

            const desintData = remoteDesinterdicoes.data || [];
            const localDesint = await (async () => {
                try {
                    const { initDB } = await import('./db');
                    const db = await initDB();
                    return (await db.getAll('desinterdicoes')) || [];
                } catch { return []; }
            })().catch(() => []);
            const allDesint = [...desintData, ...localDesint];

            const allInterdicoes = rawInterdicoes.filter(i => {
                if (!i) return false;
                const st = String(i.status || i.status_interdicao || i.situacao || i.tipo_documento || '').toLowerCase();
                if (st.includes('desinterdit') || st.includes('liberad') || st.includes('revogad') || st === 'cancelada' || st === 'excluido') {
                    return false;
                }
                const curId = String(i.interdicao_id || i.interdicaoId || i.id || '');
                const hasTotalDesint = allDesint.some(d => {
                    if (!d) return false;
                    const parentId = String(d.interdicao_id || d.interdicaoId || d.id_interdicao || '');
                    const tipoD = String(d.tipo_desinterdicao || d.tipoDesinterdicao || '').toUpperCase();
                    return (parentId && parentId === curId) && (tipoD === 'TOTAL' || tipoD.includes('TOTAL'));
                });
                return !hasTotalDesint;
            });

            // 5. INMET (fetch local with production fallback and database fallback)
            let inmetAlerts = [];
            try {
                if (inmetResp && inmetResp.ok) {
                    const alerts = await inmetResp.json();
                    inmetAlerts = Array.isArray(alerts) ? alerts : [];
                }
                // If local API is empty, fetch from production cached API
                if (inmetAlerts.length === 0) {
                    const prodResp = await fetch('https://sigerd-mobile.vercel.app/api/inmet').catch(() => null);
                    if (prodResp && prodResp.ok) {
                        const alerts = await prodResp.json();
                        inmetAlerts = Array.isArray(alerts) ? alerts : [];
                    }
                }
                // Database fallback to display active warnings from Supabase
                if (inmetAlerts.length === 0) {
                    const nowIso = new Date().toISOString();
                    const { data: dbAlerts } = await supabase
                        .from('alertas_inmet')
                        .select('*')
                        .gte('fim', nowIso)
                        .lte('inicio', nowIso)
                        .order('inicio', { ascending: false });
                    
                    if (dbAlerts && dbAlerts.length > 0) {
                        inmetAlerts = dbAlerts.map(a => ({
                            id: a.id,
                            tipo: a.tipo,
                            severidade: a.severidade,
                            inicio: a.inicio,
                            fim: a.fim,
                            riscos: a.riscos,
                            instrucoes: a.instrucoes,
                            msg: a.msg,
                            descricao: a.descricao
                        }));
                    }
                }
            } catch (e) {
                console.warn('[API] INMET load failed, fallback used:', e);
            }

            // Stats for today
            const todayStr = new Date().toLocaleDateString('pt-BR');
            const todayOccurrences = allOcorrencias.filter(o => o.data_ocorrencia === todayStr).length;

            const vistoriasLocations = processListToMapData(allVistorias);
            const ocorrenciasLocations = processListToMapData(allOcorrencias);
            const interdicoesLocations = processListToMapData(allInterdicoes.map(i => ({ ...i, categoriaRisco: i.risco_grau || i.riscoGrau })));

            return {
                vistorias: {
                    stats: { total: allVistorias.length },
                    breakdown: processBreakdown(allVistorias),
                    localidadeBreakdown: processLocalidadeBreakdown(allVistorias),
                    locations: vistoriasLocations
                },
                ocorrencias: {
                    stats: { total: allOcorrencias.length, today: todayOccurrences },
                    breakdown: processBreakdown(allOcorrencias),
                    localidadeBreakdown: processLocalidadeBreakdown(allOcorrencias),
                    locations: ocorrenciasLocations
                },
                interdicoes: {
                    stats: { total: allInterdicoes.length },
                    breakdown: processBreakdown(allInterdicoes.map(i => ({ ...i, categoriaRisco: i.risco_grau || i.riscoGrau }))),
                    localidadeBreakdown: processLocalidadeBreakdown(allInterdicoes),
                    locations: interdicoesLocations
                },
                stats: {
                    totalVistorias: allVistorias.length,
                    activeOccurrences: todayOccurrences,
                    totalOccurrences: allOcorrencias.length,
                    totalInterdicoes: allInterdicoes.length,
                    inmetAlertsCount: inmetAlerts.length
                },
                // Maintaining top level for backward compat if needed
                breakdown: processBreakdown(allVistorias),
                locations: [...vistoriasLocations, ...ocorrenciasLocations, ...interdicoesLocations],
                alerts: inmetAlerts
            };

        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
}


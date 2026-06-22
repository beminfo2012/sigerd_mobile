import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://flsppiyjmcrjqulosrqs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc3BwaXlqbWNyanF1bG9zcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDM2NTksImV4cCI6MjA4MjY3OTY1OX0.TmRPTae3ptQILfAvEvdVnKwnqIdI0FgFQ7jh1vev-gs';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
    const targetUrl = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';
    const targetGeocode = "3204559"; // Santa Maria de Jetibá

    try {
        const apiResponse = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        // Add server-side caching to prevent hitting rate limits too often
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

        // Handle rate limits or non-OK responses
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('INMET API Error Response:', errorText);
            return response.status(200).json([]); // Return empty list rather than 500 to keep UI stable
        }

        const rawText = await apiResponse.text();
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (jsonErr) {
            console.error('Failed to parse INMET JSON. Raw response:', rawText.substring(0, 500));
            return response.status(200).json([]);
        }

        const now = new Date();
        const alerts = [];

        const processList = (list) => {
            if (!list) return;

            list.forEach(alert => {
                // Strict filtering: display ONLY if the specific geocode for SMJ is present
                const hasGeocode = alert.geocodes && alert.geocodes.includes(targetGeocode);

                if (hasGeocode) {
                    // Alert that hasn't finished yet or starts soon (next 24h)
                    const endDate = new Date(alert.fim);
                    const startDate = new Date(alert.inicio);
                    const isRelevant = endDate >= now || (startDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000));

                    if (isRelevant) {
                        alerts.push({
                            id: alert.id,
                            tipo: alert.aviso_tipo || alert.descricao,
                            severidade: alert.aviso_severidade || alert.severidade,
                            inicio: alert.inicio,
                            fim: alert.fim,
                            riscos: alert.riscos,
                            instrucoes: alert.instrucoes,
                            msg: alert.msg,
                            descricao: alert.descricao || alert.aviso_tipo
                        });
                    }
                }
            });
        };

        if (data.hoje) processList(data.hoje);
        if (data.amanha) processList(data.amanha);
        if (data.futuro) processList(data.futuro);

        // Deduplicate and sort by severity/date
        const uniqueAlerts = Array.from(new Map(alerts.map(a => [a.id, a])).values());

        // Save to Supabase (alertas_inmet) if uniqueAlerts is not empty
        if (uniqueAlerts.length > 0) {
            try {
                const upsertData = uniqueAlerts.map(a => ({
                    id: String(a.id),
                    tipo: a.tipo || a.descricao || 'Meteorológico',
                    severidade: a.severidade || 'ALERTA',
                    inicio: a.inicio,
                    fim: a.fim,
                    riscos: Array.isArray(a.riscos) ? a.riscos.join('\n') : (a.riscos || ''),
                    instrucoes: Array.isArray(a.instrucoes) ? a.instrucoes.join('\n') : (a.instrucoes || ''),
                    msg: a.msg || '',
                    descricao: a.descricao || a.tipo || '',
                    atualizado_em: new Date().toISOString()
                }));

                const { error: upsertError } = await supabase
                    .from('alertas_inmet')
                    .upsert(upsertData, { onConflict: 'id' });

                if (upsertError) {
                    console.error('[INMET] Supabase upsert error:', upsertError.message);
                } else {
                    console.log(`[INMET] Successfully saved ${upsertData.length} alerts to Supabase.`);
                }
            } catch (dbErr) {
                console.error('[INMET] Supabase exception:', dbErr);
            }
        }

        // Enable CORS
        response.setHeader('Access-Control-Allow-Credentials', true)
        response.setHeader('Access-Control-Allow-Origin', '*')
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        response.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )

        response.status(200).json(uniqueAlerts);

    } catch (error) {
        console.error('INMET Handler Exception:', error);
        response.status(200).json([]);
    }
}

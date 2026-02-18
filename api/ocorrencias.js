import { supabase } from '../src/services/supabase';

export default async function handler(request, response) {
    // Enable CORS for the Estadual Panel
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        // Fetch all S2ID records from Supabase
        // Note: Real-world scenario would filter at DB level, but since criteria is inside JSONB 'data', 
        // we'll filter in memory or use Supabase JSON operators if performance allows.
        const { data: records, error } = await supabase
            .from('s2id_records')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const visibleOccurrences = [];

        for (const record of records) {
            const rd = record.data;
            if (!rd) continue;

            const metadata = rd.metadata_oficial || {};
            const intens = metadata.intensidade || '';
            const decreto = metadata.decreto_numero || '';
            const plano = metadata.plano_acionado || false;
            const apoio = metadata.necessita_apoio || false;

            // Visibility Criteria:
            const isVisible =
                intens.includes('II') || intens.includes('III') || // Alta ou Crítica
                plano === true ||
                apoio === true ||
                (decreto && decreto.trim() !== '');

            if (isVisible) {
                // Calculate totals
                const danos = rd.danos_humanos || {};
                const totalAfetados =
                    (danos.mortos || 0) +
                    (danos.feridos || 0) +
                    (danos.enfermos || 0) +
                    (danos.desabrigados || 0) +
                    (danos.desalojados || 0) +
                    (danos.desaparecidos || 0) +
                    (danos.outros_afetados || 0);

                visibleOccurrences.push({
                    id_ocorrencia: record.s2id_id || record.id,
                    municipio: 'Santa Maria de Jetibá', // Hardcoded as this is SMJ's backend
                    gravidade: intens,
                    tipo: rd.tipificacao?.cobrade || 'N/A',
                    denominacao: rd.tipificacao?.denominacao || 'N/A',
                    data_evento: rd.data_ocorrencia ? `${rd.data_ocorrencia.dia}/${rd.data_ocorrencia.mes}/${rd.data_ocorrencia.ano}` : 'N/A',
                    plano_acionado: plano,
                    decreto_emitido: !!decreto,
                    necessita_apoio: apoio,
                    total_afetados: totalAfetados,
                    total_desabrigados: danos.desabrigados || 0,
                    status_municipal: record.status,
                    created_at: record.created_at,
                    // Sending full data for detail view (Read Only)
                    full_data: rd
                });
            }
        }

        response.status(200).json(visibleOccurrences);

    } catch (error) {
        console.error('State API Error:', error);
        response.status(500).json({ error: 'Failed to fetch occurrences for state panel' });
    }
}

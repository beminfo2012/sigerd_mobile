/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || "", 
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function handler(request, response) {
    console.log("[SYNC] Iniciando sincronização em paralelo...");
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return response.status(500).json({ error: "Variáveis de ambiente do Supabase não configuradas na Vercel." });
    }

    const ESTACOES_METADATA = [
        // CEMADEN
        { id: '320455901', nome: 'Alto Rio Possmoser', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.067, lng: -40.840 },
        { id: '320455902', nome: 'Vila de Jetibá', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.019, lng: -40.760 },
        { id: '320455903', nome: 'São João do Garrafão', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.156, lng: -40.941 },
        { id: '320455904', nome: 'São Luis', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.003, lng: -40.737 },
        { id: '320455905', nome: 'Baixo São Sebastião', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.056, lng: -40.689 },
        { id: '320455902A', nome: 'Vila de Jetibá (A)', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.019, lng: -40.760 },
        { id: '320455901A', nome: 'Alto Rio Possmoser (A)', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.067, lng: -40.840 },
        { id: '320455903A', nome: 'São Luís / Garrafão (A)', tipo: 'pluviometric', fonte: 'CEMADEN', lat: -20.156, lng: -40.941 },
        
        // ANA
        { id: '02040007', nome: 'SANTA MARIA DO JETIBÁ (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.028, lng: -40.744 },
        { id: '02040047', nome: 'PCH RIO BONITO MONTANTE 1 (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.049, lng: -40.748 },
        { id: '02040048', nome: 'PCH RIO BONITO BARRAMENTO (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.061, lng: -40.643 },
        { id: '02040055', nome: 'PCH RIO BONITO JUSANTE (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.057, lng: -40.617 },
        { id: '02040208', nome: 'POSSMOUSER (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.070, lng: -40.792 },
        { id: '02040209', nome: 'SÃO JOÃO DE GARRAFÃO (Pluv)', tipo: 'pluviometric', fonte: 'ANA', lat: -20.147, lng: -40.960 },
        { id: '57090000', nome: 'SÃO JOÃO DE GARRAFÃO (Flu)', tipo: 'fluviometric', fonte: 'ANA', lat: -20.147, lng: -40.960 },
        { id: '57100000', nome: 'PRÓXIMO EMATER', tipo: 'fluviometric', fonte: 'ANA', lat: -20.052, lng: -40.764 },
        { id: '57115000', nome: 'SANTA MARIA DE JETIBÁ', tipo: 'fluviometric', fonte: 'ANA', lat: -20.038, lng: -40.729 },
        { id: '57117000', nome: 'PCH RIO BONITO MONTANTE 2', tipo: 'fluviometric', fonte: 'ANA', lat: -20.114, lng: -40.815 },
        { id: '57118000', nome: 'POSSMOUSER', tipo: 'fluviometric', fonte: 'ANA', lat: -20.070, lng: -40.792 },
        { id: '57118080', nome: 'PCH RIO BONITO MONTANTE 1', tipo: 'fluviometric', fonte: 'ANA', lat: -20.049, lng: -40.748 },
        { id: '57119000', nome: 'PCH RIO BONITO BARRAMENTO', tipo: 'fluviometric', fonte: 'ANA', lat: -20.061, lng: -40.643 },
        { id: '57119500', nome: 'PCH RIO BONITO JUSANTE', tipo: 'fluviometric', fonte: 'ANA', lat: -20.057, lng: -40.617 }
    ];

    try {
        const results = { stationsUpdated: 0, readingsSynced: 0, errors: [] };

        // 1. Atualizar Metadados (Upsert)
        await supabase.from('pluviometros_estacoes').upsert(ESTACOES_METADATA, { onConflict: 'id' });
        results.stationsUpdated = ESTACOES_METADATA.length;

        // 2. CEMADEN
        const cemadenTask = async () => {
            try {
                const resCemaden = await fetch("https://sws.cemaden.gov.br/PED/rest/pcds/pcds-dados-recentes");
                if (!resCemaden.ok) return 0;
                const cemadenRaw = await resCemaden.json();
                const cemadenReadings = cemadenRaw
                    .filter(s => s.municipio?.toLowerCase().includes("maria de jetib"))
                    .map(s => ({ station_id: s.codestacao, data_hora: s.datahora, chuva: parseFloat(s.chuva) || 0 }));
                
                if (cemadenReadings.length > 0) {
                    await supabase.from('pluviometros_leituras').upsert(cemadenReadings, { onConflict: 'station_id, data_hora' });
                }
                return cemadenReadings.length;
            } catch (e) { results.errors.push(`CEMADEN: ${e.message}`); return 0; }
        };

        // 3. ANA (Em paralelo)
        const anaTasks = ESTACOES_METADATA.filter(e => e.fonte === 'ANA').map(async (station) => {
            try {
                const now = new Date();
                const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                const dI = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
                const dF = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

                const soapUrl = `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=${station.id}&dataInicio=${dI}&dataFim=${dF}`;
                const resAna = await fetch(soapUrl);
                if (!resAna.ok) return 0;

                const xml = await resAna.text();
                const matches = [...xml.matchAll(/<DadosHidrometereologicos[^>]*>([\s\S]*?)<\/DadosHidrometereologicos>/g)];
                const readings = matches.map(m => {
                    const content = m[1];
                    const get = tag => (content.match(new RegExp(`<${tag}>(.*?)</${tag}>`)) || [])[1]?.trim() || "";
                    return { station_id: station.id, data_hora: get("DataHora"), chuva: parseFloat(get("Chuva")) || 0, nivel: parseFloat(get("Nivel")) || null, vazao: parseFloat(get("Vazao")) || null };
                }).filter(i => i.data_hora);

                if (readings.length > 0) {
                    await supabase.from('pluviometros_leituras').upsert(readings, { onConflict: 'station_id, data_hora' });
                }
                return readings.length;
            } catch (e) { results.errors.push(`ANA ${station.id}: ${e.message}`); return 0; }
        });

        // Executar tudo em paralelo!
        const [cemadenCount, ...anaCounts] = await Promise.all([cemadenTask(), ...anaTasks]);
        results.readingsSynced = cemadenCount + anaCounts.reduce((acc, current) => acc + current, 0);

        return response.status(200).json({ success: true, timestamp: new Date().toISOString(), ...results });

    } catch (err) {
        return response.status(500).json({ success: false, error: err.message });
    }
}

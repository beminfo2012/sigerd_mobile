/**
 * Utilitário de Compartilhamento Textual de Dados Pluviométricos
 * Sistema SIGERD - Defesa Civil
 * 
 * Utiliza sequências unicode para garantir imunidade a corrupções de codificação de arquivos.
 */

// Emojis codificados explicitamente via unicode escapes (ASCII seguro)
const EMOJI_CHART = '\u{1F4CA}';
const EMOJI_PIN = '\u{1F4CD}';
const EMOJI_WARNING = '\u{26A0}\u{FE0F}';
const EMOJI_RAIN = '\u{1F327}\u{FE0F}';
const EMOJI_WAVE = '\u{1F30A}';
const EMOJI_DROP = '\u{1F4A7}';
const EMOJI_CLOCK = '\u{1F550}';

/**
 * Verifica se uma estação está ativa/online (não offline).
 */
export function isStationActive(station) {
    if (!station) return false;
    if (station.isManual) return true;
    if (station.status === 'Offline') return false;

    if (station.lastUpdate) {
        const lastUpdateDate = new Date(station.lastUpdate);
        if (!isNaN(lastUpdateDate.getTime())) {
            const diffHrs = (new Date() - lastUpdateDate) / (1000 * 60 * 60);
            return diffHrs <= 48;
        }
    }
    return true;
}

/**
 * Copia um texto para a área de transferência com fallback seguro.
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) {
        console.warn('navigator.clipboard.writeText falhou, tentando fallback:', e);
    }

    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Erro no fallback do clipboard:', err);
        return false;
    }
}

/**
 * Formata os dados de uma única estação pluviométrica para compartilhamento textual.
 */
export function formatSingleStationText(station, userProfile = null) {
    if (!station) return '';

    const municipio = station.municipio || userProfile?.municipio || userProfile?.municipio_nome || 'Santa Maria de Jetibá';
    const lat = station.lat != null ? Number(station.lat).toFixed(5) : 'N/A';
    const lon = (station.lng != null ? station.lng : station.lon) != null ? Number(station.lng ?? station.lon).toFixed(5) : 'N/A';

    const fuente = station.isManual 
        ? 'Manual (Defesa Civil)' 
        : (station.fonte || 'CEMADEN');

    const nivelRisco = station.level || (
        (station.acc24hr || 0) >= 80 ? 'Extremo' :
        (station.acc24hr || 0) >= 50 ? 'Alerta' :
        (station.acc24hr || 0) >= 30 ? 'Atenção' : 'Normal'
    );

    const acc1h = (station.acc1hr || 0).toFixed(1);
    const acc24h = (station.acc24hr || station.rainRaw || 0).toFixed(1);

    const isFluvio = station.type === 'fluviometric' || station.flow != null;
    const riverStatus = isFluvio ? (typeof station.level === 'number' ? `${station.level} cm` : (station.level || 'Normal')) : (station.riverStatus || 'Normal');
    const riverFlow = isFluvio ? `${station.flow || 0} m³/s` : 'N/A';

    const lastDateStr = station.lastUpdate 
        ? new Date(station.lastUpdate).toLocaleString('pt-BR') 
        : new Date().toLocaleString('pt-BR');

    return (
        `${EMOJI_CHART} *BOLETIM PLUVIOMÉTRICO - DEFESA CIVIL*\n` +
        `*${municipio}*\n\n` +
        `${EMOJI_PIN} *${(station.name || 'Estação Pluviométrica').toUpperCase()}*\n` +
        `Estação: ${station.id || 'N/A'} | Fonte: ${fuente}\n` +
        `Coordenadas: ${lat}, ${lon}\n\n` +
        `${EMOJI_WARNING} Nível de risco: *${nivelRisco}*\n\n` +
        `${EMOJI_RAIN} Acumulado 1h: ${acc1h} mm\n` +
        `${EMOJI_RAIN} Acumulado 24h: ${acc24h} mm\n` +
        `${EMOJI_WAVE} Nível do rio: ${riverStatus}\n` +
        `${EMOJI_DROP} Vazão estimada: ${riverFlow}\n\n` +
        `${EMOJI_CLOCK} Última leitura: ${lastDateStr}\n\n` +
        `_Emitido via SIGERD | COMPDEC ${municipio}_`
    );
}

/**
 * Formata os dados de múltiplas estações para compartilhamento textual consolidado.
 * Estações offline são completamente ignoradas.
 * Estações online com acumulado > 0.0 mm são listadas no topo.
 * Estações online com 0.0 mm são listadas no ponto final ("Estações sem registro de chuva").
 */
export function formatMultiStationText(stations = [], userProfile = null) {
    const municipio = userProfile?.municipio || userProfile?.municipio_nome || 'Santa Maria de Jetibá';
    const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    // Regra: Estações offline NÃO devem ser exibidas
    const onlineStations = stations.filter(s => isStationActive(s));

    if (onlineStations.length === 0) {
        return null;
    }

    // Estações online registrando chuva (> 0.0 mm)
    const rainStations = onlineStations.filter(s => (s.acc24hr || s.rainRaw || 0) > 0);

    // Estações online sem chuva (0.0 mm)
    const zeroStations = onlineStations.filter(s => (s.acc24hr || s.rainRaw || 0) <= 0);

    let rainLines = '';
    if (rainStations.length > 0) {
        rainLines = rainStations.map(s => {
            const acc24 = (s.acc24hr || s.rainRaw || 0).toFixed(1);
            return `${EMOJI_RAIN} *${s.name}*: ${acc24} mm (24h)`;
        }).join('\n');
    } else {
        rainLines = `${EMOJI_RAIN} *Nenhuma estação registrou chuva nas últimas 24h.*`;
    }

    let zeroSection = '';
    if (zeroStations.length > 0) {
        const zeroList = zeroStations.map(s => `• ${s.name}`).join('\n');
        zeroSection = `\n\n${EMOJI_WARNING} *Estações sem registro de chuva nas últimas 24h (0.0 mm):*\n${zeroList}`;
    }

    return (
        `${EMOJI_CHART} *BOLETIM PLUVIOMÉTRICO - DEFESA CIVIL*\n` +
        `*${municipio}* | ${nowStr}\n\n` +
        `${rainLines}` +
        `${zeroSection}\n\n` +
        `_Emitido via SIGERD | COMPDEC ${municipio}_`
    );
}

/**
 * Função principal de compartilhamento de boletins pluviométricos.
 */
export async function sharePluviometricReport({ station = null, stations = [], userProfile = null, isSingle = true }) {
    let text = '';

    if (isSingle && station) {
        text = formatSingleStationText(station, userProfile);
    } else {
        text = formatMultiStationText(stations, userProfile);
        if (!text) {
            alert('Nenhuma estação ativa/online encontrada para gerar o boletim.');
            return false;
        }
    }

    // Copia o texto para a área de transferência
    await copyToClipboard(text);

    // Abre o WhatsApp diretamente via api.whatsapp.com para preservar a codificação UTF-8 de emojis
    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waLink, '_blank');

    return true;
}

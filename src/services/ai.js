// SIGERD AI Service - Multi-Version Strategy v3.0
// Tries different API versions (v1/v1beta) to find a working endpoint

const RAW_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const API_KEY = RAW_API_KEY ? RAW_API_KEY.trim() : null;

// Diagnostic function to see what the key can actually see
const listAvailableModels = async () => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            return data.models?.map(m => m.name.replace('models/', '')) || [];
        }
    } catch (e) {
        return [];
    }
    return [];
};

export const refineReportText = async (text, category = 'Geral', context = '', type = 'refine') => {
    if (!text && type === 'refine') return null;

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, category, context, type })
        });

        if (response.ok) {
            const refinedText = await response.text();
            return refinedText;
        } else {
            const errData = await response.json().catch(() => ({}));
            const detail = errData.detail ? `\n\nDetalhe: ${errData.detail}` : '';
            return `ERROR: ${errData.error || 'Falha na comunicação com o servidor de IA.'}${detail}`;
        }
    } catch (e) {
        console.error('AI Refine Error:', e);
        return `ERROR: Erro de conexão com o serviço de refinamento.`;
    }
};


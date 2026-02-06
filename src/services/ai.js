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

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;
    if (!API_KEY) return "ERROR: Chave de API não encontrada (VITE_GOOGLE_API_KEY).";

    const prompt = `
    Atue como Engenheiro Civil Sênior de Defesa Civil.
    Reescreva o texto abaixo em linguagem técnica formal para laudo oficial.
    
    ENTRADA: "${text}"
    CONTEXTO: ${category} | ${context}
    
    REGRAS:
    1. Mantenha os fatos, melhore o vocabulário.
    2. Voz passiva e impessoal.
    3. Responda APENAS o texto reescrito.
    `;

    // Priority list: Model + API Version
    // Gemini 1.5 Flash is now stable on v1
    const CANDIDATES = [
        { model: 'gemini-2.5-flash-lite', version: 'v1' },
        { model: 'gemini-2.0-flash-lite', version: 'v1' },
        { model: 'gemini-2.0-flash', version: 'v1' },
        { model: 'gemini-1.5-flash', version: 'v1beta' }
    ];

    let errors = [];

    const fetchWithTimeout = async (url, options, timeout = 20000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    };

    for (const cand of CANDIDATES) {
        try {
            const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${API_KEY}`;

            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const refined = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (refined) return refined.trim();
            } else {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error?.message || response.statusText;
                errors.push(`${cand.model} (${cand.version}): ${response.status} - ${msg}`);
            }

        } catch (error) {
            errors.push(`${cand.model}: ${error.message}`);
        }
    }

    // Try discovery as last resort
    const discovered = await listAvailableModels();
    const discoveryMsg = discovered.length > 0
        ? `\n\nModelos visíveis pela sua chave: ${discovered.slice(0, 5).join(', ')}`
        : "\n\nSua chave não parece ter acesso a nenhum modelo Gemini (Verifique se a API de Linguagem Generativa está ativa no Cloud Console).";

    return `ERROR: Falha técnica na IA.${discoveryMsg}\n\nDetalhes:\n${errors.join('\n')}`;
};

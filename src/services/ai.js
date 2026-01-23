// SIGERD AI Service - Multi-Version Strategy v3.0
// Tries different API versions (v1/v1beta) to find a working endpoint

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;
    if (!API_KEY) return "ERROR: Chave de API não encontrada. Verifique VITE_GOOGLE_API_KEY.";

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
    // Keys created in Google AI Studio often support v1beta better for new models
    // But old/restricted keys might only work on v1 stable with legacy models
    const CANDIDATES = [
        { model: 'gemini-1.5-flash', version: 'v1beta' },
        { model: 'gemini-1.5-flash-latest', version: 'v1beta' },
        { model: 'gemini-pro', version: 'v1' },           // STABLE V1 (Critical Fallback)
        { model: 'gemini-1.0-pro', version: 'v1beta' },
        { model: 'gemini-pro', version: 'v1beta' }
    ];

    let errors = [];

    // [SAFETY] 25s Timeout Wrapper
    const fetchWithTimeout = async (url, options, timeout = 25000) => {
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
            console.log(`[SIGERD AI] Tentando ${cand.model} via ${cand.version}...`);

            const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${API_KEY}`;

            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error?.message || response.statusText;
                console.warn(`[SIGERD AI] Falha ${response.status} em ${cand.model}:`, msg);
                throw new Error(`${cand.model} (${cand.version}): HTTP ${response.status} - ${msg}`);
            }

            const data = await response.json();
            const refined = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (refined) {
                return refined.trim();
            } else {
                throw new Error("Resposta vazia.");
            }

        } catch (error) {
            errors.push(error.message);
        }
    }

    // Return explicit error for the UI to display
    return `ERROR: Falha em todas as tentativas.\n\n${errors.join('\n')}`;
};

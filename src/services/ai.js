// SIGERD AI Service - Direct REST Implementation v2.0 (No SDK)
// Bypasses library issues by calling Google API directly via fetch

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

    // Priority list of models to try via RAW HTTP
    const MODELS = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.0-pro',
        'gemini-pro'
    ];

    let errors = [];

    // [SAFETY] 20s Timeout Wrapper
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

    for (const model of MODELS) {
        try {
            console.log(`[SIGERD AI] Tentando conexão direta com ${model}...`);

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Extract text safe path
            const refined = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (refined) {
                return refined.trim();
            } else {
                throw new Error("Resposta da IA vazia/inválida.");
            }

        } catch (error) {
            console.warn(`[SIGERD AI] Falha em ${model}:`, error.message);
            errors.push(`${model}: ${error.message}`);
        }
    }

    // Return explicit error for the UI to display
    return `ERROR: Falha em todos os modelos.\n\nDetalhes:\n${errors.join('\n')}`;
};

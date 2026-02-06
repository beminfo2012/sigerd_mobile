export default async function handler(request, response) {
    const API_KEY = (process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "").trim();

    console.log('--- AI PROXY DIAGNOSTICS ---');
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('KEY')));
    console.log('API_KEY found & trimmed:', !!API_KEY);

    if (!API_KEY) {
        const detectedKeys = Object.keys(process.env).filter(k => k.includes('KEY')).join(', ');
        return response.status(500).json({
            error: "Chave de API não configurada no servidor Vercel.",
            detail: `Nenhuma das chaves (GOOGLE_API_KEY ou VITE_GOOGLE_API_KEY) foi encontrada. Chaves com 'KEY' detectadas: ${detectedKeys || 'Nenhuma'}. Certifique-se de fazer um REDEPLOY na Vercel.`
        });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Método não permitido" });
    }

    const { text, category, context } = request.body;

    const prompt = `
    Transforme este relato de campo em uma descrição técnica de engenharia civil densa e formal: "${text}".
    
    CATEGORIA: ${category || 'Geral'}
    CONTEXTO: ${context || ''}
    
    REGRAS RÍGIDAS:
    - Retorne APENAS o texto técnico, sem títulos, sem cabeçalhos e sem introduções.
    - O texto deve ser uma narrativa técnica profissional em voz passiva.
    - COMPLEMENTE com termos técnicos e riscos prováveis baseados na Categoria informada.
    - NÃO use "Relatório", "Evento" ou campos de preenchimento.
    - Use terminologia normativa: recalque, lixiviação, saturação, escorregamento, coesão, pressões neutras.
    `;

    const CANDIDATES = [
        { model: 'gemini-1.5-flash', version: 'v1' },
        { model: 'gemini-1.5-pro', version: 'v1' },
        { model: 'gemini-1.0-pro', version: 'v1' }
    ];

    let errors = [];

    for (const cand of CANDIDATES) {
        try {
            const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${API_KEY}`;

            const apiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (apiRes.ok) {
                const data = await apiRes.json();
                const refined = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (refined) {
                    return response.status(200).send(refined.trim());
                }
            } else {
                const errData = await apiRes.json().catch(() => ({}));
                const msg = errData.error?.message || apiRes.statusText;
                errors.push(`${cand.model}(${cand.version}): ${msg}`);
            }
        } catch (e) {
            errors.push(`${cand.model}(${cand.version}): ${e.message}`);
        }
    }

    return response.status(500).json({
        error: "Falha geral nos modelos de IA.",
        detail: `Erros por modelo:\n${errors.join('\n')}`
    });
}

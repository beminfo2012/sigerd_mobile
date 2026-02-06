import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
    const API_KEY = (process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "").trim();

    if (!API_KEY) {
        return response.status(500).json({
            error: "Chave de API não configurada no servidor Vercel.",
            detail: "Certifique-se de configurar GOOGLE_API_KEY nas variáveis de ambiente da Vercel e fazer um Redeploy."
        });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { text, category, context } = request.body;

        const genAI = new GoogleGenerativeAI(API_KEY);

        // Define models to try in order of preference
        const MODELS_TO_TRY = [
            "gemini-pro",         // PRIMARY: Classic stable model (most compatible)
            "gemini-1.5-flash",   // Second try
            "gemini-1.5-pro",
            "gemini-1.0-pro"
        ];

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

        let lastError = null;
        let errors = [];

        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`[AI Proxy v3.1] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const refinedText = result.response.text();

                if (refinedText) {
                    return response.status(200).send(refinedText.trim());
                }
            } catch (e) {
                console.warn(`[AI Proxy v3.1] Failed with ${modelName}:`, e.message);
                lastError = e;
                errors.push(`${modelName}: ${e.message}`);

                // If it's an API Key error, no point trying other models
                if (e.message?.includes('API key not valid')) {
                    throw e;
                }
            }
        }

        // If we get here, all models failed. 
        // Let's diagnose by listing available models.
        let availableModels = "Unable to list models";
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
            if (listRes.ok) {
                const listData = await listRes.json();
                availableModels = listData.models
                    ? listData.models.map(m => m.name.replace('models/', '')).join(', ')
                    : "No models returned";
            } else {
                availableModels = `List failed: ${listRes.status}`;
            }
        } catch (listErr) {
            availableModels = `List error: ${listErr.message}`;
        }

        console.error('All models failed. Available:', availableModels);

        throw new Error(
            `Falha em todos os modelos (${MODELS_TO_TRY.join(', ')}).\n` +
            `Erros: ${errors.join(' | ')}\n` +
            `Modelos disponíveis para esta chave/região: [${availableModels}]`
        );

    } catch (error) {
        console.error('AI SDK Error:', error);

        return response.status(500).json({
            error: "Erro Diagnóstico AI (v4.0)",
            detail: error.message
        });
    }
}

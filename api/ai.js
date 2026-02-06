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
        // Based on Diagnostic v5.0: User has access to Gemini 2.0/2.5 series
        const MODELS_TO_TRY = [
            "gemini-2.0-flash",       // PRIMARY: Detected available
            "gemini-2.0-flash-lite",  // Fallback 1
            "gemini-2.5-flash",       // Fallback 2 (Experimental)
            "gemini-2.5-pro"          // Fallback 3 (Experimental)
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
        // Let's diagnose by listing available models using v1 (stable).
        let availableModels = "Unable to list";
        let modelCount = 0;
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
            if (listRes.ok) {
                const listData = await listRes.json();
                if (listData.models) {
                    modelCount = listData.models.length;
                    // Get just the base names, e.g. "gemini-pro"
                    availableModels = listData.models
                        .map(m => m.name.replace('models/', ''))
                        .filter(n => n.includes('gemini'))
                        .join(', ');
                } else {
                    availableModels = "No models found";
                }
            } else {
                availableModels = `List failed: ${listRes.status}`;
            }
        } catch (listErr) {
            availableModels = `List error: ${listErr.message}`;
        }

        console.error('All models failed. Available:', availableModels);

        // Throw a concise error for mobile alerts
        throw new Error(
            `DIAGNÓSTICO (v5.0):\n` +
            `Modelos Disponíveis (${modelCount}): [${availableModels}]\n\n` +
            `Tentativas falharam em: ${MODELS_TO_TRY.join(', ')}`
        );

    } catch (error) {
        console.error('AI SDK Error:', error);

        return response.status(500).json({
            error: "Erro de Conectividade AI (v5.0)",
            detail: error.message
        });
    }
}

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
        const { text, category, context, type = 'refine' } = request.body;

        const genAI = new GoogleGenerativeAI(API_KEY);

        const MODELS_TO_TRY = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.5-pro"
        ];

        let prompt = "";

        if (type === 'introducao') {
            prompt = `
            Com base nos dados do desastre abaixo, escreva uma INTRODUÇÃO formal e técnica para um relatório de danos.
            O texto deve ser uma narrativa densa, profissional e em voz passiva.
            
            COBRADE/DENOMINAÇÃO: ${category}
            DADOS DO RELATÓRIO: ${context}
            RELATO DO CAMPO: ${text}
            
            REGRAS:
            - Retorne APENAS o texto da introdução.
            - Seja direto e técnico (linguagem de Defesa Civil/Engenharia).
            - Não use "Olá", "Aqui está" ou títulos.
            `;
        } else if (type === 'consideracoes') {
            prompt = `
            Com base nos danos e prejuízos relatados abaixo, escreva as CONSIDERAÇÕES FINAIS técnicas para o relatório.
            Destaque os impactos socioeconômicos e a necessidade de apoio.
            
            DADOS: ${context}
            OBSERVAÇÕES: ${text}
            
            REGRAS:
            - Retorne APENAS o texto das considerações finais.
            - Use tom formal, conclusivo e urgente (padrão S2id).
            `;
        } else {
            prompt = `
            Transforme este relato de campo em uma descrição técnica de engenharia civil densa e formal: "${text}".
            CATEGORIA: ${category || 'Geral'}
            CONTEXTO: ${context || ''}
            REGRAS RÍGIDAS:
            - Retorne APENAS o texto técnico, sem títulos e sem introduções.
            - Narrativa técnica profissional em voz passiva.
            `;
        }

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

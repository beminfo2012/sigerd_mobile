import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyAGUmakglCOdr4Wsl9VN_nnyqFzqKma1uY";
const genAI = new GoogleGenerativeAI(API_KEY);

// [VER: 1.31] Comprehensive multi-model fallback strategy
const MODELS_TO_TRY = [
    { name: "gemini-1.5-flash", version: "v1" },
    { name: "gemini-1.5-pro", version: "v1" },
    { name: "gemini-1.0-pro", version: "v1" },
    { name: "gemini-1.5-flash", version: "v1beta" }
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    let lastError = null;

    // Try each model until one works
    for (const modelConfig of MODELS_TO_TRY) {
        try {
            const model = genAI.getGenerativeModel(
                { model: modelConfig.name },
                { apiVersion: modelConfig.version }
            );

            const prompt = `
            Você é um Engenheiro Civil especialista em Defesa Civil e Gestão de Riscos.
            Sua tarefa é refinar e reescrever o seguinte relato de campo, transformando-o em um texto técnico, formal e preciso para um Relatório Oficial.

            CONTEXTO:
            Categoria do Risco: ${category}
            ${context ? `Dados do Local/Solicitante: ${context}` : ''}

            TEXTO ORIGINAL (Informal):
            "${text}"

            DIRETRIZES:
            1. Use terminologia técnica adequada (ex: 'colapso' em vez de 'caiu', 'patologias' em vez de 'problemas').
            2. Seja objetivo e impessoal (use voz passiva: 'Observou-se...', 'Constatou-se...').
            3. Mantenha as informações factuais, mas melhore a clareza e coesão.
            4. Se o texto original for muito curto, expanda com termos técnicos prováveis para aquele contexto.
            5. O resultado deve ser APENAS o parágrafo reescrito, sem introduções ou explicações.

            TEXTO REFINADO:
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const refinedText = response.text().trim();

            if (refinedText) return refinedText;
        } catch (error) {
            console.warn(`Tentativa com ${modelConfig.name} (${modelConfig.version}) falhou:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    // If all models fail, raise the final descriptive error
    throw new Error(`[IA-v1.31] Falha em todos os modelos. Último erro (${MODELS_TO_TRY[MODELS_TO_TRY.length - 1].name}): ${lastError?.message || 'Erro desconhecido'}`);
};

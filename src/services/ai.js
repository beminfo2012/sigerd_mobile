import { GoogleGenerativeAI } from "@google/generative-ai";

// [VER: 1.33] FINAL FIX - Using verified Gemini 2.5 models available for this account
const API_KEY = "AIzaSyAGUmakglCOdr4Wsl9VN_nnyqFzqKma1uY";
const genAI = new GoogleGenerativeAI(API_KEY);

// Fallback list using only verified models from diagnostic v1.32
const MODELS_TO_TRY = [
    { name: "gemini-2.5-flash", version: "v1" },
    { name: "gemini-2.5-pro", version: "v1" },
    { name: "gemini-2.0-flash", version: "v1" }
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    let lastError = null;

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
            return response.text().trim();
        } catch (error) {
            console.warn(`Tentativa v1.33 com ${modelConfig.name} falhou:`, error.message);
            lastError = error;
        }
    }

    throw new Error(`[IA-v1.33] Erro final: ${lastError?.message || 'Falha na IA'}`);
};

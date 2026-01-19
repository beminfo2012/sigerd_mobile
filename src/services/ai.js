// SIGERD AI Service - Stable Build v1.36
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// The GoogleGenerativeAI constructor from @google/generative-ai defaults to v1beta.
// To use v1, we can try to pass it if the version supports it, or use the stable model nomenclature.
const genAI = new GoogleGenerativeAI(API_KEY);

// SIGERD AI Service - Optimized for Stability
console.log("SIGERD AI: v1.36 initialized");
const MODELS_TO_TRY = [
    { name: "gemini-1.5-flash" },
    { name: "gemini-pro" }
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    let lastError = null;

    for (const modelConfig of MODELS_TO_TRY) {
        try {
            // Explicitly requesting v1 API version to avoid v1beta 404
            const model = genAI.getGenerativeModel(
                { model: modelConfig.name },
                { apiVersion: 'v1' }
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
            console.warn(`Tentativa com ${modelConfig.name} falhou:`, error.message);
            lastError = error;
        }
    }

    throw new Error(`Erro ao refinar texto: ${lastError?.message || 'Todos os modelos falharam'}`);
};

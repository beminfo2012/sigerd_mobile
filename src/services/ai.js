import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// WARNING: In a production app, this key should be in an environment variable (import.meta.env.VITE_GOOGLE_API_KEY)
// For this quick fix, we are using the provided key directly.
const API_KEY = "AIzaSyAxTyNhjuow54hCB-g_RAtRXZ52zybKgpU";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    try {
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
        4. Se o texto original for muito curto, expanda com termos técnicos prováveis para aquele contexto, mas sem inventar fatos inverídicos.
        5. O resultado deve ser APENAS o parágrafo reescrito, sem introduções ou explicações.

        TEXTO REFINADO:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Erro ao chamar Gemini:", error);
        throw new Error("Falha ao comunicar com a IA do Google.");
    }
};

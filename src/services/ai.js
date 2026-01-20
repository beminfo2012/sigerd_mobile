// SIGERD AI Service - High Availability Build v1.50
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define rotation of model configurations to bypass potential 404s
const ATTEMPTS = [
    { model: "gemini-1.5-flash-001", version: 'v1beta' }, // Explicit version often resolves 404s
    { model: "gemini-pro", version: 'v1beta' },           // Stable 1.0 Pro model
    { model: "gemini-1.5-flash", version: 'v1beta' },     // Generic Flash (fallback)
    { model: "gemini-1.5-pro", version: 'v1beta' }        // Pro 1.5 (last resort)
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    let errors = [];

    for (const config of ATTEMPTS) {
        try {
            console.log(`SIGERD AI: Autenticando com ${config.model} (${config.version})...`);

            const model = genAI.getGenerativeModel(
                { model: config.model },
                { apiVersion: config.version }
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
            const refined = response.text().trim();

            if (refined) {
                console.log(`SIGERD AI: Sucesso com ${config.model}`);
                return refined;
            }
        } catch (error) {
            console.warn(`SIGERD AI: Falha em ${config.model} (${config.version}):`, error.message);
            errors.push(`${config.model}/${config.version}: ${error.message}`);
        }
    }

    throw new Error(`A IA não pôde processar o texto após várias tentativas.\nDetalhes:\n${errors.join('\n')}`);
};

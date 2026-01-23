// SIGERD AI Service - High Availability Build v1.50
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define rotation of model configurations to bypass potential 404s
const ATTEMPTS = [
    { model: "gemini-1.5-flash", version: 'v1beta' },     // Latest Flash (Best Speed/Cost)
    { model: "gemini-1.5-pro", version: 'v1beta' },       // Latest Pro (Best Quality)
    { model: "gemini-pro", version: 'v1beta' }            // Legacy Fallback
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    // [SAFETY] Race against a strict timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: A IA demorou muito para responder (15s).')), 15000)
    );

    const callAI = async () => {
        for (const config of ATTEMPTS) {
            try {
                // Check connectivity first
                if (!navigator.onLine) throw new Error('Sem conexão com a internet');

                console.log(`SIGERD AI: Tentando modelo ${config.model}...`);
                const model = genAI.getGenerativeModel({ model: config.model }, { apiVersion: config.version });

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

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const refined = response.text().trim();

                if (refined) return refined;
            } catch (error) {
                console.warn(`SIGERD AI: Falha leve em ${config.model}:`, error.message);
                errors.push(error.message);
            }
        }
        throw new Error('Falha em todos os modelos de IA.');
    };

    try {
        return await Promise.race([callAI(), timeoutPromise]);
    } catch (finalError) {
        console.error('SIGERD AI Error:', finalError);
        // Return null instead of throwing to prevent app crash
        return null;
    }
};

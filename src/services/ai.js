// SIGERD AI Service - High Availability Build v1.50
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define rotation of model configurations to bypass potential 404s or version mismatches
const ATTEMPTS = [
    { model: "gemini-1.5-flash-001" },                  // Pinned Flash (Often required for v1beta)
    { model: "gemini-1.5-flash-002" },                  // Newer Flash
    { model: "gemini-1.5-pro-001" },                    // Pinned Pro
    { model: "gemini-1.0-pro" },                        // Legacy Stable 1.0 (Most widely available)
    { model: "gemini-pro" }                             // Alias Fallback
];

export const refineReportText = async (text, category = 'Geral', context = '') => {
    if (!text) return null;

    // [SAFETY] Race against a strict timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: A IA demorou muito para responder (25s).')), 25000)
    );

    const callAI = async () => {
        let errors = []; // [FIX] Declare the array so we can collect errors
        for (const config of ATTEMPTS) {
            try {
                // Check connectivity first
                if (!navigator.onLine) throw new Error('Sem conexão com a internet');

                console.log(`SIGERD AI: Tentando modelo ${config.model}...`);
                // Let SDK decide the best version if not specified
                const modelOpts = { model: config.model };
                if (config.version) modelOpts.apiVersion = config.version;

                const model = genAI.getGenerativeModel(modelOpts);

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
                errors.push(`${config.model}: ${error.message}`);
            }
        }
        throw new Error(`Falha em todos os modelos. Detalhes: ${errors.join(' | ')}`);
    };

    try {
        return await Promise.race([callAI(), timeoutPromise]);
    } catch (finalError) {
        console.error('SIGERD AI Error:', finalError);
        // [DEBUG] Return error string to show in UI
        return `ERROR: ${finalError.message}`;
    }
};

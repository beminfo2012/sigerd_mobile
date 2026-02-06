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

        // Use gemini-1.5-flash as the primary fast and reliable model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const result = await model.generateContent(prompt);
        const refinedText = result.response.text();

        return response.status(200).send(refinedText.trim());

    } catch (error) {
        console.error('AI SDK Error:', error);

        // Provide clear error message for the user based on the SDK error
        let userMessage = error.message;
        if (error.message?.includes('API key not valid')) {
            userMessage = "A Chave de API fornecida é inválida. Verifique na Vercel.";
        } else if (error.message?.includes('quota')) {
            userMessage = "Cota de uso da IA excedida. Tente novamente mais tarde.";
        }

        return response.status(500).json({
            error: "Erro no processamento da IA (SDK)",
            detail: userMessage
        });
    }
}

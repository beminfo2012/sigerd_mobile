import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(request, response) {
    const API_KEY = (process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "").trim();

    if (!API_KEY) {
        return response.status(500).json({
            error: "Chave de API não configurada",
            detail: "Configure GOOGLE_API_KEY nas variáveis de ambiente."
        });
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Método não permitido" });
    }

    try {
        const { imageBase64, prompt } = request.body;

        if (!imageBase64) {
            return response.status(400).json({ error: "Imagem não fornecida" });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();

        return response.status(200).send(text);

    } catch (error) {
        console.error('OCR API Error:', error);
        return response.status(500).json({
            error: "Erro no processamento da imagem",
            detail: error.message
        });
    }
}

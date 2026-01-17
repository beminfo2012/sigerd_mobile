import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAGUmakglCOdr4Wsl9VN_nnyqFzqKma1uY";

// Initialize Gemini 2.5 Pro for OCR (superior accuracy)
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ]
}, { apiVersion: "v1" });

/**
 * Converts a File object to a GoogleGenerativeAI Part object (Base64)
 */
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Performs OCR on an image using Google Gemini 2.5 Pro
 */
export async function performOCR(imageFile) {
    try {
        const imagePart = await fileToGenerativePart(imageFile);

        const prompt = `
            Você é um assistente especializado em digitalização de documentos da Defesa Civil.
            Extraia TODO o texto desta imagem de forma estruturada e precisa.
            
            DIRETRIZES:
            1. Mantenha a formatação original onde possível.
            2. Se houver formulários ou tabelas, tente representar a relação entre campos e valores.
            3. Não adicione comentários, apenas o conteúdo extraído.
            4. Se houver assinaturas ou carimbos, apenas indique [Assinatura] ou [Carimbo].
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro no OCR Gemini 2.5 Pro:", error);
        throw new Error("Não foi possível processar a imagem com IA. Verifique sua conexão e tente novamente.");
    }
}
/**
 * Scans a document and returns structured data
 */
export async function scanDocument(file) {
    try {
        const imagePart = await fileToGenerativePart(file);

        const prompt = `
            Extraia os seguintes dados deste documento de identificação (RG/CPF/CNH/Documento do Abrigo):
            - Nome Completo
            - CPF (somente números)
            - Idade (se disponível, ou calcule a partir da data de nascimento)
            - Gênero (masculino/feminino/outro)

            Responda APENAS em formato JSON puro, sem markdown:
            {
                "full_name": "NOME",
                "cpf": "00000000000",
                "age": "00",
                "gender": "masculino/feminino/outro"
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        // Cleanup potential markdown backticks if Gemini includes them
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("Erro no scanDocument:", error);
        throw error;
    }
}

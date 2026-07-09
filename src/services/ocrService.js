import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize Gemini 1.5 Flash for multimodal OCR
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ]
});

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
                    mimeType: file.type || 'image/jpeg'
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
        // First convert File to base64 for compression
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Compress image to ensure it's not too large for Gemini API (max 1600px width)
        const compressImage = async (base64) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = base64;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const maxWidth = 1600;
                    if (width > maxWidth || height > maxWidth) {
                        if (width > height) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        } else {
                            width *= maxWidth / height;
                            height = maxWidth;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = () => resolve(base64); // Fallback to original
            });
        };

        const compressedBase64 = await compressImage(base64Data);
        
        const imagePart = {
            inlineData: {
                data: compressedBase64.split(',')[1],
                mimeType: 'image/jpeg'
            }
        };

        const prompt = `
            Extraia os seguintes dados deste documento de identificação (RG/CPF/CNH/Documento do Abrigo):
            - Nome Completo
            - CPF (somente números)
            - Data de Nascimento (no formato YYYY-MM-DD)
            - Idade (se disponível, ou calcule a partir da data de nascimento)
            - Gênero (masculino/feminino/outro)

            Responda APENAS em formato JSON puro, sem markdown:
            {
                "full_name": "NOME",
                "cpf": "00000000000",
                "birth_date": "YYYY-MM-DD",
                "age": "00",
                "gender": "masculino"
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();
        
        console.log("[OCR] Gemini Response:", text);

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

import { GoogleGenerativeAI } from "@google/generativeAI";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize Gemini (using Flash for speed/efficiency with images)
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Smart OCR Service using Gemini Flash
 * Much more accurate than Tesseract for structured documents
 */
export const scanDocument = async (imageFile) => {
    try {
        if (!API_KEY) {
            throw new Error("Chave de API do Google não configurada (VITE_GOOGLE_API_KEY).");
        }

        const imagePart = await fileToGenerativePart(imageFile);

        const prompt = `
        Analise esta imagem de um documento brasileiro (RG ou CNH).
        Extraia os seguintes dados e retorne APENAS um objeto JSON válido, sem markdown, sem code blocks:
        {
            "full_name": "Nome completo exato",
            "cpf": "000.000.000-00",
            "birth_date": "DD/MM/YYYY",
            "gender": "masculino" ou "feminino" (se não constar, coloque null)
        }
        Se algum campo não estiver visível ou legível, retorne null neles.
        Para gênero, tente inferir pelo nome se não explícito, ou retorne null.
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Sanitize and parse JSON
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return processExtractedData(data);

    } catch (error) {
        console.error("Gemini OCR Error:", error);
        throw new Error("Falha ao processar o documento com IA. Tente uma foto mais nítida.");
    }
};

const processExtractedData = (data) => {
    const result = {
        full_name: data.full_name || '',
        cpf: data.cpf || '',
        age: '',
        gender: data.gender || 'nao_informado'
    };

    // Calculate Age from birth_date
    if (data.birth_date) {
        const parts = data.birth_date.split(/[\/\-\.]/);
        if (parts.length === 3) {
            // Assume DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);

            const birth = new Date(year, month, day);
            const today = new Date();

            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            if (age > 0 && age < 120) result.age = age.toString();
        }
    }

    // Normalize Gender
    if (result.gender) {
        const g = result.gender.toLowerCase();
        if (g.includes('masc')) result.gender = 'masculino';
        else if (g.includes('fem')) result.gender = 'feminino';
        else result.gender = 'nao_informado';
    }

    return result;
};

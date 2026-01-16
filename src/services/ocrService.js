import Tesseract from 'tesseract.js';

/**
 * OCR Service to extract data from documents (RG/CNH)
 */

export const scanDocument = async (imageFile) => {
    try {
        const result = await Tesseract.recognize(
            imageFile,
            'por', // Portuguese
            { logger: m => console.log(m) }
        );

        const text = result.data.text;
        console.log("OCR Extracted Text:", text);

        return parseDocumentText(text);
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Falha ao processar imagem do documento.");
    }
};

const parseDocumentText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const data = {
        full_name: '',
        cpf: '',
        age: '',
        gender: ''
    };

    // 1. CPF (Strict Regex)
    const cpfMatch = text.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
    if (cpfMatch) {
        data.cpf = cpfMatch[0].replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // 2. Date of Birth -> Age
    const dateMatch = text.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
    if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        const birthDate = new Date(`${year}-${month}-${day}`);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age > 0 && age < 120) {
            data.age = age.toString();
        }
    }

    // 3. Gender (Heuristic)
    if (text.match(/Feminino|FEMININO|Mulher/i)) data.gender = 'feminino';
    else if (text.match(/Masculino|MASCULINO|Homem/i)) data.gender = 'masculino';

    // 4. Name (Heuristic - HARDEST PART)
    // Strategy: Look for lines that are all uppercase (common in IDs) and exclude known labels
    const blacklist = ['REPUBLICA', 'FEDERATIVA', 'BRASIL', 'NOME', 'CPF', 'DATA', 'DOC', 'VALIDADE', 'SSP', 'DETRAN', 'CARTEIRA', 'HABILITACAO', 'IDENTIDADE', 'MINISTERIO'];

    for (const line of lines) {
        const upperLine = line.toUpperCase();
        // Assume name is long, mostly letters, and not a blacklist word
        if (upperLine.length > 5 && /^[A-Z\s]+$/.test(upperLine)) {
            const words = upperLine.split(/\s+/);
            const isBlacklisted = words.some(w => blacklist.some(b => w.includes(b)));

            if (!isBlacklisted && words.length >= 2) {
                // If we haven't found a name yet, take this candidate
                // Refinement: usually name comes before CPF or birth date in simple parsing flow but random ordering happens
                if (!data.full_name) {
                    data.full_name = line; // Use original casing if available, or just upper
                }
            }
        }
    }

    return data;
};

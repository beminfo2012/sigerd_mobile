import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

/**
 * Utility to generate S2ID Official Documents
 */

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Template not found: ${path}`);
    return await response.arrayBuffer();
};

const getMonthExtenso = (mes) => {
    const meses = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return meses[parseInt(mes) - 1] || mes;
};

export const generateS2idDoc = async (type, data) => {
    try {
        let templatePath = "";
        let filename = "";

        switch (type) {
            case "decreto":
                templatePath = "/templates/Modelo de Decreto Municipal.docx";
                filename = `Decreto_Municipal_${data.decreto_numero || "SEM_NUMERO"}.docx`;
                break;
            case "oficio":
                templatePath = "/templates/Modelo de oficio requerimento reconhecimento Federal.docx";
                filename = `Oficio_Reconhecimento_${data.protocolo_s2id || "SEM_PROTOCOLO"}.docx`;
                break;
            case "parecer":
                templatePath = "/templates/Modelo de Parecer Técnico.docx";
                filename = `Parecer_Tecnico_${data.parecer_numero || "SEM_NUMERO"}.docx`;
                break;
            default:
                throw new Error("Invalid document type");
        }

        const content = await fetchTemplate(templatePath);
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Prepare data for template
        const templateData = {
            ...data,
            municipio: "Santa Maria de Jetibá",
            estado: "Espírito Santo",
            orgao_defesa_civil: "Coordenadoria Municipal de Proteção e Defesa Civil (COMPDEC)",
            dia_extenso: data.decreto_data ? data.decreto_data.split("-")[2] : new Date().getDate(),
            mes_extenso: data.decreto_data ? getMonthExtenso(data.decreto_data.split("-")[1]) : getMonthExtenso(new Date().getMonth() + 1),
            ano: data.decreto_data ? data.decreto_data.split("-")[0] : new Date().getFullYear(),
        };

        // If it's the Decreto, we might need to map specific FIDE summaries
        if (type === "decreto") {
            templateData.desastre_nome_cobrade = `${data.tipificacao.cobrade} - ${data.tipificacao.denominacao}`;
            templateData.descricao_fatos = `evento adverso ocorrido em ${data.data_ocorrencia.dia}/${data.data_ocorrencia.mes}/${data.data_ocorrencia.ano} às ${data.data_ocorrencia.horario}`;
            templateData.resumo_danos = `Danos Humanos (${data.danos_humanos.mortos} mortos, ${data.danos_humanos.feridos} feridos), Danos Materiais em habitações e infraestrutura, e Danos Ambientais diversos.`;
            templateData.vigencia_dias = data.metadata_oficial.decreto_vigencia;
        }

        // Render the document
        doc.render(templateData);

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        saveAs(out, filename);
        return true;
    } catch (error) {
        console.error("Error generating docx:", error);
        throw error;
    }
};

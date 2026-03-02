import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

const getBase64Image = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
};

export const generateConsolidatedReport = async (records, dateStr) => {
    try {
        const pdf = new jsPDF('l', 'mm', 'a4'); // Paisagem para caber mais colunas

        let logoDefesaCivilStr = null;
        let logoSigerdStr = null;

        try {
            [logoDefesaCivilStr, logoSigerdStr] = await Promise.all([
                getBase64Image(LOGO_DEFESA_CIVIL),
                getBase64Image(LOGO_SIGERD)
            ]);
        } catch (e) {
            console.warn('Logos indisponíveis para o relatorio consolidado.');
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const headerHeight = 35;

        // Cabeçalho Oficial
        if (logoDefesaCivilStr) {
            pdf.addImage(logoDefesaCivilStr, 'PNG', 15, 5, 20, 25);
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(42, 82, 153); // Azul Defesa Civil #2a5299
        pdf.text("PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ", pageWidth / 2, 12, { align: "center" });

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text("COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL", pageWidth / 2, 18, { align: "center" });

        pdf.setFontSize(12);
        pdf.setTextColor(42, 82, 153);
        pdf.text(`RELATÓRIO CONSOLIDADO DE OCORRÊNCIAS - ${dateStr}`, pageWidth / 2, 26, { align: "center" });

        if (logoSigerdStr) {
            pdf.addImage(logoSigerdStr, 'PNG', pageWidth - 35, 5, 20, 25);
        }

        // Tabela de Dados
        const tableBody = records.map((r, i) => {
            const dataHora = new Date(r.created_at).toLocaleString('pt-BR');
            const endereco = `${r.endereco || 'SC'}, Bairro: ${r.bairro || 'SC'}`;
            const subtipos = Array.isArray(r.subtiposRisco || r.subtipos_risco) ? (r.subtiposRisco || r.subtipos_risco).join(', ') : (r.subtiposRisco || r.subtipos_risco || '');

            return [
                (i + 1).toString(),
                r.ocorrencia_id_format || r.id,
                dataHora,
                r.solicitante || 'Não Identificado',
                (r.categoriaRisco || r.categoria_risco || ''),
                subtipos,
                endereco,
                r.status || 'Pendente'
            ];
        });

        pdf.autoTable({
            startY: headerHeight,
            head: [['Nº', 'ID', 'Data/Hora', 'Solicitante', 'Tipo (Categoria)', 'Subtipo', 'Endereço', 'Status']],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                font: 'helvetica'
            },
            headStyles: {
                fillColor: [42, 82, 153],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [241, 245, 249] // Tailwind slate-50
            },
            margin: { top: headerHeight, left: 10, right: 10, bottom: 15 }
        });

        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            const str = `Gerado pelo SIGERD Mobile em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${totalPages}`;
            pdf.text(str, pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: "center" });
        }

        const dateFilename = dateStr.replace(/\//g, '-');
        pdf.save(`Relatorio_Ocorrencias_${dateFilename}.pdf`);

        return true;
    } catch (e) {
        console.error("Consolidated report error:", e);
        return false;
    }
};

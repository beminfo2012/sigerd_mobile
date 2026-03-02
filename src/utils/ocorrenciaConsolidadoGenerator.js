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
        // Skip logo loading if base64 conversion fails to prevent PDF generation crash
        const headerHeight = 25;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(42, 82, 153);
        pdf.text("PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ", pageWidth / 2, 12, { align: "center" });

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text("COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL", pageWidth / 2, 18, { align: "center" });

        pdf.setFontSize(12);
        pdf.setTextColor(42, 82, 153);
        pdf.text(`RELATÓRIO CONSOLIDADO DE OCORRÊNCIAS - ${String(dateStr || 'Geral')}`, pageWidth / 2, 26, { align: "center" });

        // Tabela de Dados
        const tableBody = records.map((r, i) => {
            let dataHora = '---';
            if (r.created_at || r.data_ocorrencia) {
                try {
                    dataHora = new Date(r.created_at || r.data_ocorrencia).toLocaleString('pt-BR').substring(0, 16);
                } catch (e) {
                    dataHora = String(r.data_ocorrencia || '---');
                }
            }

            const endereco = String(r.endereco || 'S/E').substring(0, 50);
            const bairro = String(r.bairro || 'S/B');

            let subtipos = '';
            const s = r.subtiposRisco || r.subtipos_risco || [];
            if (Array.isArray(s)) {
                subtipos = s.join(', ');
            } else if (typeof s === 'string') {
                try {
                    const parsed = JSON.parse(s);
                    subtipos = Array.isArray(parsed) ? parsed.join(', ') : s;
                } catch (e) {
                    subtipos = s;
                }
            }

            return [
                (i + 1).toString(),
                String(r.ocorrencia_id_format || r.id_local || r.id || '---'),
                dataHora,
                String(r.solicitante || 'N/I').substring(0, 30),
                String(r.categoriaRisco || r.categoria_risco || r.tipo_info || '---'),
                String(subtipos).substring(0, 60),
                `${endereco} (${bairro})`,
                String(r.status || 'Pendente')
            ];
        });

        pdf.autoTable({
            startY: 32,
            head: [['Nº', 'ID', 'Data/Hora', 'Solicitante', 'Tipo', 'Subtipo', 'Localização (Endereço/Bairro)', 'Status']],
            body: tableBody,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1, font: 'helvetica' },
            headStyles: { fillColor: [42, 82, 153], textColor: [255, 255, 255] },
            margin: { left: 5, right: 5 }
        });

        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`SIGERD Mobile - Página ${i}/${totalPages}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: "center" });
        }

        const dateFilename = dateStr.replace(/\//g, '-');
        pdf.save(`Relatorio_Ocorrencias_${dateFilename}.pdf`);

        return true;
    } catch (e) {
        console.error("Consolidated report error:", e);
        return false;
    }
};

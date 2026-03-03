import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from './logoBase64';

/**
 * Gera um relatório PDF consolidado de ocorrências formatado para impressão.
 * @param {Array} occurrences - Lista de ocorrências filtradas.
 * @param {string} dateRange - Período ou data selecionada para exibição no título.
 */
export const generateConsolidatedReport = async (occurrences, dateRange = 'Geral') => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.width;

        // Configurações de cores (Paleta Profissional)
        const colors = {
            primary: [0, 51, 102], // Marinho
            secondary: [240, 240, 240], // Cinza Claro
            accent: [255, 102, 0], // Laranja Defesa Civil
            text: [60, 60, 60],
            tableHead: [0, 64, 128]
        };

        // --- CABEÇALHO ---
        // Logo (usando Base64 local para evitar erros de rede/CORS)
        try {
            pdf.addImage(LOGO_BASE64, 'PNG', 15, 10, 25, 25);
        } catch (e) {
            console.error('Erro ao carregar logo no PDF:', e);
        }

        // Títulos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(...colors.primary);
        pdf.text('DEFESA CIVIL', 45, 18);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('SISTEMA DE GESTÃO DE RISCOS E DESASTRES - SIGERD', 45, 24);

        pdf.setFontSize(14);
        pdf.setTextColor(...colors.text);
        pdf.text('Relatório Consolidado de Ocorrências', 45, 32);

        // Linha divisória
        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.5);
        pdf.line(15, 38, pageWidth - 15, 38);

        // Informações do Relatório
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Filtro aplicado: ${dateRange}`, 15, 45);
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 15, 45, { align: 'right' });
        pdf.text(`Total de registros: ${occurrences.length}`, 15, 50);

        // --- CORPO DO RELATÓRIO (TABELA) ---
        const tableColumn = ["Protocolo", "Data/Hora", "Tipo", "Natureza", "Bairro", "Status"];
        const tableRows = occurrences.map(occ => [
            String(occ.numero_protocolo || occ.numero_ocorrencia || 'S/N').toUpperCase(),
            formatDate(occ.data_ocorrencia || occ.data_cadastro || occ.created_at),
            String(occ.tipo || occ.tipo_ocorrencia || 'N/I'),
            String(occ.natureza || 'N/I'),
            String(occ.bairro || 'N/I'),
            translateStatus(occ.status)
        ]);

        autoTable(pdf, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: {
                fillColor: colors.tableHead,
                textColor: [255, 255, 255],
                fontSize: 9,
                halign: 'center',
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Protocolo
                1: { cellWidth: 35 }, // Data
                2: { cellWidth: 25 }, // Tipo
                3: { cellWidth: 40 }, // Natureza
                4: { cellWidth: 35 }, // Bairro
                5: { cellWidth: 25, halign: 'center' } // Status
            },
            alternateRowStyles: {
                fillColor: colors.secondary
            },
            margin: { left: 15, right: 15, bottom: 20 }
        });

        // --- RODAPÉ ---
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            const footerText = `Página ${i} de ${pageCount} | Documento emitido pelo Sistema SIGERD Mobile`;
            pdf.text(footerText, pageWidth / 2, pdf.internal.pageSize.height - 10, { align: 'center' });
        }

        // --- SALVAMENTO ---
        const safeDate = String(dateRange).replace(/\//g, '-').replace(/ /g, '_');
        pdf.save(`Relatorio_Ocorrencias_${safeDate}.pdf`);
        return true;
    } catch (error) {
        console.error('Erro ao gerar PDF consolidado:', error);
        return false;
    }
};

// Funções auxiliares sanitizadas
const formatDate = (dateValue) => {
    if (!dateValue) return 'N/I';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return String(dateValue);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'N/I';
    }
};

const translateStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'atendida' || s === 'concluida') return 'Concluída';
    if (s === 'em_andamento' || s === 'em curso') return 'Em Curso';
    if (s === 'pendente') return 'Pendente';
    return status || 'Pendente';
};

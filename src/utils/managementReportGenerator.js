import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateManagementReport = async (stats, timeframe, userProfile) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [42, 82, 153];
    const secondaryColor = [249, 115, 22];
    const textColor = [30, 41, 59];

    // Helper: Header
    const drawHeader = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('RELATÓRIO DE GESTÃO ESTRATÉGICA', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`DEFESA CIVIL MUNICIPAL - SANTA MARIA DE JETIBÁ`, 105, 28, { align: 'center' });
    };

    // 1. Cover / Executive Summary
    drawHeader();

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMÁRIO EXECUTIVO', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryText = `Este documento apresenta o consolidado das atividades operacionais da Defesa Civil durante o período: ${timeframe.toUpperCase()}. \n\nAtravés da análise de indicadores de impacto social e severidade de riscos, este relatório visa subsidiar a tomada de decisão das autoridades municipais em ações de prevenção e resposta a desastres.`;
    const splitSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(splitSummary, 20, 65);

    // 2. Key Indicators (KPIs)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 95, 80, 40, 5, 5, 'F');
    doc.roundedRect(110, 95, 80, 40, 5, 5, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${stats.total}`, 60, 115, { align: 'center' });
    doc.text(`${Math.round(stats.familiesAfected)}`, 150, 115, { align: 'center' });

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.text('VISTORIAS REALIZADAS', 60, 125, { align: 'center' });
    doc.text('PESSOAS ASSISTIDAS (EST.)', 150, 125, { align: 'center' });

    // 3. Risk Distribution Table (instead of complex chart draws)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIÇÃO DE RISCOS', 20, 155);

    const riskData = stats.riskChart.map(r => [r.name, r.value, `${Math.round((r.value / stats.total) * 100)}%`]);

    doc.autoTable({
        startY: 165,
        head: [['Nível de Risco', 'Ocorrências', 'Porcentagem']],
        body: riskData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor },
        margin: { left: 20, right: 20 }
    });

    // 4. Footnote
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado eletronicamente pelo SIGERD MOBILE em ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
    doc.text(`Responsável: ${userProfile?.full_name || 'Usuário do Sistema'}`, 105, 290, { align: 'center' });

    // Save
    doc.save(`Relatorio_Gestao_${timeframe}_${new Date().getTime()}.pdf`);
};

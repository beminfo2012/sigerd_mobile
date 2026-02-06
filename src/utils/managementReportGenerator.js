import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateManagementReport = async (stats, timeframe, userProfile) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [30, 58, 138]; // Darker blue for higher fidelity
    const secondaryColor = [249, 115, 22]; // Orange
    const accentColor = [220, 38, 38]; // Red for interdictions
    const textColor = [30, 41, 59];

    // Helper: Header
    const drawHeader = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('BALANÇO DE GESTÃO ESTRATÉGICA', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`DEFESA CIVIL MUNICIPAL - SANTA MARIA DE JETIBÁ / ES`, 105, 30, { align: 'center' });
        doc.text(`SISTEMA SIGERD MOBILE - RELATÓRIO EXECUTIVO`, 105, 35, { align: 'center' });
    };

    // 1. Cover / Executive Summary
    drawHeader();

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. SUMÁRIO EXECUTIVO', 20, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summaryText = `Este documento consolida as atividades operacionais, impactos sociais e medidas preventivas da Defesa Civil no período: ${timeframe.toUpperCase()}. \n\nA análise foca na severidade dos riscos mapeados, na eficácia das medidas de interdição e na assistência humanitária prestada para garantir a segurança da população em áreas de vulnerabilidade.`;
    const splitSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(splitSummary, 20, 70);

    // 2. Main Indicators Grid
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 100, 80, 45, 5, 5, 'F');
    doc.roundedRect(110, 100, 80, 45, 5, 5, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${stats.total}`, 60, 122, { align: 'center' });
    doc.setTextColor(5, 150, 105); // Green for assist
    doc.text(`${Math.round(stats.familiesAfected)}`, 150, 122, { align: 'center' });

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VISTORIAS REALIZADAS', 60, 132, { align: 'center' });
    doc.text('CIDADÃOS IMPACTADOS', 150, 132, { align: 'center' });

    // 3. Humanitarian & Interdictions Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('2. IMPACTO E MEDIDAS RESTRITIVAS', 20, 165);

    const impactTableData = [
        ['Interdições Realizadas (Atos Legais)', stats.interdicoes, 'Medidas de proteção à vida'],
        ['Desabrigados (Em Abrigos Públicos)', stats.desabrigados, 'Assistência em abrigos oficiais'],
        ['Desalojados (Casa de Parentes)', stats.desalojados, 'Remoção temporária preventiva']
    ];

    doc.autoTable({
        startY: 175,
        head: [['Indicador Operacional', 'Total', 'Status / Contexto']],
        body: impactTableData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 10 },
        margin: { left: 20, right: 20 }
    });

    // 4. Risk Profile Table
    const lastY = doc.lastAutoTable.finalY || 165;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. PERFIL DE SEVERIDADE', 20, lastY + 20);

    const totalStats = stats.riskChart.reduce((acc, curr) => acc + curr.value, 0);
    const riskData = stats.riskChart.map(r => [
        r.name,
        r.value,
        `${Math.round((r.value / totalStats) * 100)}%`
    ]);

    doc.autoTable({
        startY: lastY + 30,
        head: [['Nível de Risco', 'Ocorrências', 'Representatividade']],
        body: riskData,
        theme: 'grid',
        headStyles: { fillColor: [185, 28, 28] }, // Red for risks
        margin: { left: 20, right: 20 }
    });

    // 5. Footnote
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado via SIGERD MOBILE Intelligence em ${new Date().toLocaleString('pt-BR')}`, 105, 280, { align: 'center' });
    doc.text(`Responsável Institucional: ${userProfile?.full_name || 'Usuário do Sistema'}`, 105, 285, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório para fins de Gestão e Tomada de Decisão Estratégica', 105, 290, { align: 'center' });

    // Save
    doc.save(`Relatorio_Gestao_Estrategica_${timeframe}_${new Date().getTime()}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from './logoBase64';

/**
 * Gera o Relatório Consolidado de Ocorrências em PDF conforme o modelo oficial SIGERD:
 * - Cabeçalho institucional (Santa Maria de Jetibá – ES) + Metadados (Período, Filtros, Emissão, Origem)
 * - Resumo Operacional (Total, Pendentes, Em Atendimento, Encerradas)
 * - Distribuição por Tipo de Ocorrência (Tipo, Quantidade, Participação %)
 * - Relação de Ocorrências (Nº / Protocolo, Data/Hora, Tipo de Ocorrência, Localidade, Situação)
 * - Cabeçalho de continuação automático nas páginas subsequentes
 */
export const generateConsolidatedReport = async (occurrences = [], options = 'Todo o Período') => {
    try {
        const opts = typeof options === 'string'
            ? { periodoLabel: options, filtrosLabel: 'Geral' }
            : (options || {});

        const periodoLabel = opts.periodoLabel || 'Todo o Período';
        const filtrosLabel = opts.filtrosLabel || 'Geral';
        const now = new Date();
        const emitidoEm = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const consultaId = `CON-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

        // Ordenar por data decrescente (mais recentes primeiro)
        const sortedOccurrences = [...occurrences].sort((a, b) => {
            const da = parseFlexibleTimestamp(a.data_ocorrencia || a.data_chamado || a.created_at);
            const db = parseFlexibleTimestamp(b.data_ocorrencia || b.data_chamado || b.created_at);
            return db - da;
        });

        // Contadores do Resumo Operacional
        const total = sortedOccurrences.length;
        let pendentes = 0;
        let emAtendimento = 0;
        let encerradas = 0;

        sortedOccurrences.forEach(occ => {
            const s = normalizeStatusKey(occ.status);
            if (s === 'encerrada') encerradas += 1;
            else if (s === 'em_atendimento') emAtendimento += 1;
            else pendentes += 1;
        });

        // Distribuição por Tipo de Ocorrência
        const typeCounts = new Map();
        sortedOccurrences.forEach(occ => {
            const tipo = getOccurrenceType(occ);
            typeCounts.set(tipo, (typeCounts.get(tipo) || 0) + 1);
        });
        const typeRows = Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tipo, qtd]) => {
                const pct = total > 0 ? ((qtd / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                return [tipo, String(qtd).padStart(2, '0'), `${pct}%`];
            });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginX = 14;
        const contentWidth = pageWidth - marginX * 2;

        const colors = {
            navy: [11, 31, 58],       // #0B1F3A
            blue: [26, 111, 191],     // #1A6FBF
            ice: [232, 241, 250],     // #E8F1FA
            ice2: [212, 229, 245],    // #D4E5F5
            grayBg: [244, 246, 249],  // #F4F6F9
            border: [200, 208, 220],  // #C8D0DC
            text: [26, 35, 50],       // #1A2332
            muted: [90, 102, 120],
            red: [184, 50, 50],
            amber: [180, 110, 10],
            green: [26, 122, 72],
        };

        // --- CABEÇALHO (PÁGINA 1) ---
        try {
            pdf.addImage(LOGO_BASE64, 'PNG', marginX, 10, 18, 18);
        } catch (e) {
            console.warn('Logo não carregado no PDF:', e);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(...colors.navy);
        pdf.text('RELATÓRIO CONSOLIDADO DE OCORRÊNCIAS', marginX + 22, 17);

        pdf.setFontSize(9.5);
        pdf.setTextColor(...colors.blue);
        pdf.text('SANTA MARIA DE JETIBÁ – ES', marginX + 22, 22.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.muted);
        pdf.text('Coordenadoria Municipal de Proteção e Defesa Civil • COMPDEC', marginX + 22, 27);

        pdf.setDrawColor(...colors.navy);
        pdf.setLineWidth(0.7);
        pdf.line(marginX, 31, pageWidth - marginX, 31);

        // --- GRADE DE METADADOS (2x2) ---
        autoTable(pdf, {
            startY: 34,
            theme: 'grid',
            margin: { left: marginX, right: marginX },
            styles: {
                fontSize: 8,
                cellPadding: 2.5,
                lineColor: colors.border,
                lineWidth: 0.25,
                textColor: colors.text,
            },
            body: [
                [
                    { content: `PERÍODO CONSULTADO\n${periodoLabel}`, styles: { fontStyle: 'bold' } },
                    { content: `FILTROS APLICADOS\n${filtrosLabel}`, styles: { fontStyle: 'bold' } },
                ],
                [
                    { content: `EMITIDO EM\n${emitidoEm}`, styles: { fillColor: colors.grayBg } },
                    { content: `ORIGEM\nSistema SIGERD – Módulo de Ocorrências`, styles: { fillColor: colors.grayBg } },
                ],
            ],
            columnStyles: {
                0: { cellWidth: contentWidth / 2 },
                1: { cellWidth: contentWidth / 2 },
            },
        });

        let cursorY = pdf.lastAutoTable.finalY + 6;

        // --- RESUMO OPERACIONAL (4 CARDS KPI) ---
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...colors.navy);
        pdf.text('RESUMO OPERACIONAL', marginX, cursorY);
        pdf.setDrawColor(...colors.navy);
        pdf.setLineWidth(0.4);
        pdf.line(marginX, cursorY + 1.5, pageWidth - marginX, cursorY + 1.5);

        cursorY += 4;
        const cardGap = 3;
        const cardW = (contentWidth - cardGap * 3) / 4;
        const cardH = 18;
        const kpiCards = [
            { value: String(total).padStart(3, '0'), label: 'TOTAL DE OCORRÊNCIAS', color: colors.navy, bg: colors.ice },
            { value: String(pendentes).padStart(3, '0'), label: 'PENDENTES', color: colors.red, bg: [253, 234, 234] },
            { value: String(emAtendimento).padStart(3, '0'), label: 'EM ATENDIMENTO', color: colors.amber, bg: [254, 245, 224] },
            { value: String(encerradas).padStart(3, '0'), label: 'ENCERRADAS', color: colors.green, bg: [234, 247, 239] },
        ];

        kpiCards.forEach((card, idx) => {
            const x = marginX + idx * (cardW + cardGap);
            pdf.setFillColor(...card.bg);
            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.25);
            pdf.roundedRect(x, cursorY, cardW, cardH, 2, 2, 'FD');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.setTextColor(...card.color);
            pdf.text(card.value, x + cardW / 2, cursorY + 9, { align: 'center' });

            pdf.setFontSize(6.5);
            pdf.setTextColor(...colors.text);
            pdf.text(card.label, x + cardW / 2, cursorY + 14.5, { align: 'center' });
        });

        cursorY += cardH + 7;

        // --- DISTRIBUIÇÃO POR TIPO DE OCORRÊNCIA ---
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...colors.navy);
        pdf.text('DISTRIBUIÇÃO POR TIPO DE OCORRÊNCIA', marginX, cursorY);
        pdf.setDrawColor(...colors.navy);
        pdf.setLineWidth(0.4);
        pdf.line(marginX, cursorY + 1.5, pageWidth - marginX, cursorY + 1.5);

        autoTable(pdf, {
            startY: cursorY + 3.5,
            theme: 'grid',
            margin: { left: marginX, right: marginX },
            head: [['TIPO DE OCORRÊNCIA', 'QUANTIDADE', 'PARTICIPAÇÃO']],
            body: typeRows.length > 0 ? typeRows : [['Nenhuma ocorrência registrada no período', '00', '0,0%']],
            headStyles: {
                fillColor: colors.ice2,
                textColor: colors.navy,
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'left',
            },
            styles: {
                fontSize: 8,
                cellPadding: 2.2,
                lineColor: colors.border,
                lineWidth: 0.25,
                textColor: colors.text,
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.62 },
                1: { cellWidth: contentWidth * 0.19, halign: 'center', fontStyle: 'bold' },
                2: { cellWidth: contentWidth * 0.19, halign: 'center' },
            },
            alternateRowStyles: { fillColor: colors.grayBg },
        });

        cursorY = pdf.lastAutoTable.finalY + 7;

        // --- RELAÇÃO DE OCORRÊNCIAS ---
        if (cursorY > pageHeight - 40) {
            pdf.addPage();
            cursorY = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...colors.navy);
        pdf.text('RELAÇÃO DE OCORRÊNCIAS', marginX, cursorY);
        pdf.setDrawColor(...colors.navy);
        pdf.setLineWidth(0.4);
        pdf.line(marginX, cursorY + 1.5, pageWidth - marginX, cursorY + 1.5);

        const listRows = sortedOccurrences.map((occ, idx) => [
            getProtocolNumber(occ, idx),
            formatOccurrenceDatePeriod(occ),
            getOccurrenceType(occ),
            getLocalidade(occ),
            formatStatusLabel(occ.status),
        ]);

        const firstListPage = pdf.internal.getNumberOfPages();

        autoTable(pdf, {
            startY: cursorY + 3.5,
            theme: 'grid',
            margin: { top: 24, left: marginX, right: marginX, bottom: 18 },
            head: [['Nº / PROTOCOLO', 'DATA/HORA', 'TIPO DE OCORRÊNCIA', 'LOCALIDADE', 'SITUAÇÃO']],
            body: listRows.length > 0 ? listRows : [['—', '—', 'Nenhuma ocorrência encontrada no período consultado', '—', '—']],
            headStyles: {
                fillColor: colors.navy,
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center',
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2.3,
                lineColor: colors.border,
                lineWidth: 0.25,
                textColor: colors.text,
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 28, halign: 'center' },
                2: { cellWidth: 52 },
                3: { cellWidth: 48 },
                4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
            },
            alternateRowStyles: { fillColor: colors.grayBg },
            didDrawPage: (data) => {
                // Cabeçalho de continuação nas páginas seguintes da tabela
                if (data.pageNumber > firstListPage) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(9);
                    pdf.setTextColor(...colors.navy);
                    pdf.text('RELAÇÃO DE OCORRÊNCIAS — CONTINUAÇÃO', marginX, 12);

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(...colors.muted);
                    pdf.text(`Período: ${periodoLabel}  |  Protocolo/consulta: ${consultaId}`, marginX, 17);

                    pdf.setDrawColor(...colors.navy);
                    pdf.setLineWidth(0.35);
                    pdf.line(marginX, 19.5, pageWidth - marginX, 19.5);
                }
            },
        });

        // --- RODAPÉ EM TODAS AS PÁGINAS ---
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.25);
            pdf.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(...colors.muted);
            pdf.text(
                `COMPDEC / SIGERD — Santa Maria de Jetibá/ES  |  Emitido em ${emitidoEm}`,
                marginX,
                pageHeight - 8
            );
            pdf.text(`Página ${i} de ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
        }

        // Abre em nova aba ou baixa
        const safePeriod = String(periodoLabel)
            .replace(/\//g, '-')
            .replace(/[^\w\-]+/g, '_')
            .replace(/_+/g, '_');
        const fileName = `Relatorio_Consolidado_Ocorrencias_${safePeriod}.pdf`;
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const viewer = window.open(blobUrl, '_blank');
        if (!viewer || viewer.closed || typeof viewer.closed === 'undefined') {
            pdf.save(fileName);
        }
        return true;
    } catch (error) {
        console.error('Erro ao gerar PDF consolidado de ocorrências:', error);
        return false;
    }
};

const getProtocolNumber = (occ, idx) => {
    const raw =
        occ.ocorrencia_id_format ||
        occ.numero_protocolo ||
        occ.numero_ocorrencia ||
        occ.ocorrencia_id ||
        occ.id;
    if (!raw) return String(idx + 1).padStart(5, '0');
    const str = String(raw);
    return str.length > 14 ? str.slice(0, 12).toUpperCase() : str.toUpperCase();
};

const getOccurrenceType = (occ) => {
    return (
        occ.tipo_ocorrencia ||
        occ.tipoOcorrencia ||
        occ.cobrade_subtipo ||
        occ.categoriaRisco ||
        occ.categoria_risco ||
        occ.tipo ||
        occ.tipo_info ||
        'Outros'
    );
};

const getLocalidade = (occ) => {
    const parts = [occ.bairro, occ.endereco].filter(Boolean);
    return parts.length > 0 ? parts.join(' — ') : 'Não informada';
};

const normalizeStatusKey = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s.includes('finaliz') || s.includes('encerr') || s.includes('conclu') || s.includes('cancel')) {
        return 'encerrada';
    }
    if (s.includes('atend') || s.includes('monitor') || s.includes('curso') || s.includes('andamento')) {
        return 'em_atendimento';
    }
    return 'pendente';
};

const formatStatusLabel = (status) => {
    const s = String(status || '').trim();
    if (!s) return 'Pendente';
    const low = s.toLowerCase();
    if (low === 'finalizada' || low === 'concluida') return 'Encerrada';
    return s;
};

const parseFlexibleDate = (raw) => {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
    }
    const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (brMatch) {
        return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]), 12, 0, 0);
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const parseFlexibleTimestamp = (raw) => {
    const d = parseFlexibleDate(raw);
    return d ? d.getTime() : 0;
};

const formatDateOnlyBR = (raw) => {
    const d = parseFlexibleDate(raw);
    return d ? d.toLocaleDateString('pt-BR') : (raw ? String(raw) : '—');
};

const formatOccurrenceDatePeriod = (occ) => {
    const startRaw = occ.data_ocorrencia || occ.data_chamado || occ.created_at;
    if (!startRaw) return '—';

    const startDateStr = formatDateOnlyBR(startRaw);
    let startTimeStr = occ.horario_ocorrencia ? String(occ.horario_ocorrencia).trim() : '';

    // Se não houver horario_ocorrencia explícito e a data vier de created_at ISO com hora
    if (!startTimeStr && !occ.data_ocorrencia && String(startRaw).includes('T')) {
        const d = parseFlexibleDate(startRaw);
        if (d) {
            startTimeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    const startFull = startTimeStr ? `${startDateStr} ${startTimeStr}` : startDateStr;

    const endRaw = occ.data_fim_ocorrencia;
    const endTimeStr = occ.horario_fim_ocorrencia ? String(occ.horario_fim_ocorrencia).trim() : '';
    if (endRaw || endTimeStr) {
        const endDateStr = endRaw ? formatDateOnlyBR(endRaw) : startDateStr;
        if (endDateStr !== startDateStr || endTimeStr) {
            const endFull = endTimeStr ? `${endDateStr} ${endTimeStr}` : endDateStr;
            return `${startFull}\na ${endFull}`;
        }
    }

    return startFull;
};

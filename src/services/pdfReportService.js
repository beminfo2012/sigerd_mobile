import { jsPDF } from 'jspdf';

/**
 * Converte uma imagem de uma URL para uma string Base64.
 */
function shelterImageUrlToBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = () => {
            console.warn(`Imagem não encontrada ou erro de CORS: ${url}`);
            resolve(null);
        };
        img.src = url;
    });
}

// Função utilitária para quebrar texto e adicionar páginas
function shelterAddWrappedText(doc, text, x, currentY, maxWidth, lh) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    for (let i = 0; i < lines.length; i++) {
        if (currentY > 780) { // Margem inferior
            doc.addPage();
            currentY = 40;
        }
        doc.text(lines[i], x, currentY);
        currentY += lh;
    }
    return currentY;
}

// Função para adicionar título de seção
function shelterAddSectionTitle(doc, title, y) {
    doc.setFillColor(230, 239, 255); // Azul claro
    doc.rect(35, y - 12, doc.internal.pageSize.getWidth() - 70, 20, 'F');
    doc.setFontSize(14);
    doc.setTextColor(30, 60, 114); // Azul escuro
    doc.text(title, 40, y);
    doc.setTextColor(51, 51, 51); // Reseta cor
    return y + 25;
}

/**
 * Função Principal de Geração do Relatório
 */
export async function generateShelterReport(shelters = [], donations = [], occupants = []) {
    try {
        console.log("Iniciando geração do relatório de abrigos...");

        // Preparar PDF
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 40;
        const lineHeight = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableWidth = pageWidth - marginLeft * 2;

        // --- Cabeçalho ---
        doc.setFontSize(18);
        doc.setTextColor(30, 60, 114);
        doc.text('Relatório de Gestão de Abrigos', pageWidth / 2, 50, { align: 'center' });

        y = 80;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const nowStr = new Date().toLocaleString('pt-BR');
        doc.text(`Gerado em: ${nowStr}`, pageWidth / 2, y, { align: 'center' });
        doc.setTextColor(51, 51, 51); // Reset
        y += 30;

        // --- 1. Resumo Estatístico ---
        y = shelterAddSectionTitle(doc, '1. Resumo Situacional', y);
        doc.setFontSize(11);

        const totalShelters = shelters.length;
        const activeShelters = shelters.filter(s => s.status === 'active').length;
        const fullShelters = shelters.filter(s => s.status === 'full').length;

        let totalCapacity = 0;
        let totalOccupants = 0;

        shelters.forEach(s => {
            totalCapacity += parseInt(s.capacity || 0);
            totalOccupants += parseInt(s.current_occupancy || 0);
        });

        const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;
        const totalDonations = donations.length;

        // Grid de Estatísticas
        y = shelterAddWrappedText(doc, `• Total de Abrigos Cadastrados: ${totalShelters}`, marginLeft, y, usableWidth, lineHeight);
        y = shelterAddWrappedText(doc, `• Abrigos Ativos: ${activeShelters}`, marginLeft, y, usableWidth, lineHeight);
        y = shelterAddWrappedText(doc, `• Abrigos Lotados: ${fullShelters}`, marginLeft, y, usableWidth, lineHeight);
        y += 10;
        y = shelterAddWrappedText(doc, `• Capacidade Total do Município: ${totalCapacity} vagas`, marginLeft, y, usableWidth, lineHeight);
        y = shelterAddWrappedText(doc, `• Total de Pessoas Abrigadas: ${totalOccupants}`, marginLeft, y, usableWidth, lineHeight);
        y = shelterAddWrappedText(doc, `• Taxa de Ocupação Global: ${occupancyRate}%`, marginLeft, y, usableWidth, lineHeight);
        y += 10;
        y = shelterAddWrappedText(doc, `• Registros de Doações: ${totalDonations}`, marginLeft, y, usableWidth, lineHeight);

        y += 20;

        // --- 2. Detalhamento dos Abrigos ---
        y = shelterAddSectionTitle(doc, '2. Situação por Abrigo', y);

        if (shelters.length === 0) {
            y = shelterAddWrappedText(doc, "Nenhum abrigo cadastrado até o momento.", marginLeft, y, usableWidth, lineHeight);
        } else {
            shelters.forEach((shelter, index) => {
                // Verifica quebra de página
                if (y > 700) {
                    doc.addPage();
                    y = 40;
                }

                const occCurrent = parseInt(shelter.current_occupancy || 0);
                const cap = parseInt(shelter.capacity || 0);
                const perc = cap > 0 ? Math.round((occCurrent / cap) * 100) : 0;

                let statusLabel = (shelter.status || 'unknown').toUpperCase();

                // Título do Abrigo
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${shelter.name} [${statusLabel}]`, marginLeft, y);
                y += 15;

                // Detalhes
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const details = [
                    `Localização: ${shelter.address || 'Não informado'}`,
                    `Responsável: ${shelter.responsible || 'Não informado'} - Contato: ${shelter.phone || '-'}`,
                    `Ocupação: ${occCurrent} pessoas de ${cap} vagas (${perc}%)`
                ];

                details.forEach(line => {
                    y = shelterAddWrappedText(doc, line, marginLeft + 10, y, usableWidth - 10, lineHeight);
                });

                y += 10; // Espaço entre abrigos
            });
        }

        y += 20;

        // --- 3. Doações Recentes ---
        y = shelterAddSectionTitle(doc, '3. Doações Recentes', y);

        if (donations.length === 0) {
            y = shelterAddWrappedText(doc, "Nenhuma doação registrada recentemente.", marginLeft, y, usableWidth, lineHeight);
        } else {
            const recent = donations.slice(0, 10);

            recent.forEach(d => {
                const dateStr = d.date ? new Date(d.date).toLocaleDateString('pt-BR') : '-';
                const txt = `• [${dateStr}] ${d.item} (${d.quantity} ${d.unit || 'un'}) - Doador: ${d.donor || 'Anônimo'}`;
                y = shelterAddWrappedText(doc, txt, marginLeft, y, usableWidth, lineHeight);
            });

            if (donations.length > 10) {
                doc.setFont(undefined, 'italic');
                y += 5;
                doc.text(`... e mais ${donations.length - 10} doações registradas.`, marginLeft + 15, y);
                doc.setFont(undefined, 'normal');
                y += 14;
            }
        }

        // --- Rodapé ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginLeft, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
            doc.text(`SIGERD MOBILE - Gestão de Riscos e Desastres`, marginLeft, doc.internal.pageSize.getHeight() - 20);
        }

        // 4. Salvar PDF
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        doc.save(`Relatorio_Abrigos_${ts}.pdf`);

        return true;

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        alert("Erro ao gerar relatório: " + error.message);
        return false;
    }
}

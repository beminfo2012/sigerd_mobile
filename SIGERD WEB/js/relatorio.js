/**
 * Converte uma imagem de uma URL para uma string Base64.
 * @param {string} url O URL da imagem.
 * @returns {Promise<string>} Uma promessa que resolve com a string Base-64 da imagem.
 */
function imageUrlToBase64(url) {
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
        img.onerror = reject;
        img.src = url;
    });
}

// Função utilitária para quebrar texto e adicionar páginas
function addWrappedText(doc, text, x, currentY, maxWidth, lh) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    for (let i = 0; i < lines.length; i++) {
        if (currentY > 780) { // Margem inferior (aprox. 2cm de 841pt)
            doc.addPage();
            currentY = 40;
        }
        doc.text(lines[i], x, currentY);
        currentY += lh;
    }
    return currentY;
}

// Função para adicionar um título de seção estilizado
function addSectionTitle(doc, title, y) {
    doc.setFillColor(230, 239, 255); // Azul claro
    doc.rect(35, y - 12, doc.internal.pageSize.getWidth() - 70, 20, 'F');
    doc.setFontSize(14);
    doc.setTextColor(30, 60, 114); // Azul escuro
    doc.text(title, 40, y);
    doc.setTextColor(51, 51, 51); // Reseta para cor de texto padrão
    return y + 25;
}

async function generateSituationalReport(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginLeft = 40;
    let y = 40;
    const lineHeight = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - marginLeft * 2;

    // --- Carregamento das imagens (temporariamente desativado) ---
    // const logoDefesaCivilUrl = '/assets/img/logo-defesa-civil.png';
    // const logoCigerdUrl = '/assets/img/Logo_Cigerd.png';
    // const logoDefesaCivilBase64 = await imageUrlToBase64(logoDefesaCivilUrl);
    // const logoCigerdBase64 = await imageUrlToBase64(logoCigerdUrl);

    // --- Cabeçalho do Relatório ---
    // Adiciona logo da Defesa Civil na esquerda
    // doc.addImage(logoDefesaCivilBase64, 'PNG', marginLeft, 20, 80, 80);
    // Adiciona logo do SIGERD na direita
    // doc.addImage(logoCigerdBase64, 'PNG', pageWidth - marginLeft - 80, 20, 80, 80);

    // Título Centralizado
    doc.setFontSize(18);
    doc.text('Relatório Situacional', pageWidth / 2, 50, { align: 'center' });
    y = 110; // Posição inicial abaixo dos logos

    doc.setFontSize(10);
    const nowStr = new Date().toLocaleString('pt-BR');
    doc.text(`Situação no Momento da Geração`, pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.text(`Gerado em: ${nowStr}`, pageWidth / 2, y, { align: 'center' });
    y += 25;

    // --- Seção de Alertas ---
    y = addSectionTitle(doc, '1. Alertas e Avisos Vigentes', y);
    doc.setFontSize(11);

    // Filtra alertas que ainda estão vigentes (sem data de fim ou com data de fim no futuro)
    const now = new Date();
    const activeAlerts = data.scoAlertsData.filter(alert => {
        return !alert.end || new Date(alert.end) > now;
    });

    if (activeAlerts.length > 0) {
        activeAlerts.forEach(alert => {
            const alertText = `• [${new Date(alert.start).toLocaleDateString('pt-BR')}] ${alert.category} - ${alert.type} (${alert.intensity}) na região: ${alert.region}.`;
            y = addWrappedText(doc, alertText, marginLeft, y, usableWidth, lineHeight);
        });
    } else {
        y = addWrappedText(doc, 'Nenhum alerta ou aviso vigente no momento.', marginLeft, y, usableWidth, lineHeight);
    }
    y += 20;

    // --- Seção de Ocorrências (Ações SCO) ---
    y = addSectionTitle(doc, '2. Ocorrências (Ações SCO) em Andamento', y);
    doc.setFontSize(11);

    // Filtra apenas as ações com status "em-andamento"
    const ongoingActions = data.actionsData.filter(action => action.status === 'em-andamento');

    if (ongoingActions.length > 0) {
        ongoingActions.forEach(action => {
            const actionText = `• [${action.ultimaAtualizacao}] Ação: ${action.descricao} - Responsável: ${action.responsavel} (Status: ${action.status}).`;
            y = addWrappedText(doc, actionText, marginLeft, y, usableWidth, lineHeight);
        });
    } else {
        y = addWrappedText(doc, 'Nenhuma ocorrência foi registrada no período selecionado.', marginLeft, y, usableWidth, lineHeight);
    }
    y += 20;

    // --- Seção de Assistência Humanitária ---
    y = addSectionTitle(doc, '3. Assistência Humanitária (Doações e Distribuições)', y);
    doc.setFontSize(11);

    // Para assistência, podemos mostrar os totais gerais, já que não há filtro de data
    const totalDonations = data.donationsData.length;
    const totalDistributions = data.distributionsData.length;

    y = addWrappedText(doc, `Total de Doações Recebidas (histórico): ${totalDonations}`, marginLeft, y, usableWidth, lineHeight);
    y = addWrappedText(doc, `Total de Registros de Distribuição (histórico): ${totalDistributions}`, marginLeft, y, usableWidth, lineHeight);

    if (data.distributionsData.length > 0) {
        y += 10;
        data.distributionsData.forEach(dist => {
            const distText = `• [${new Date(dist.date).toLocaleDateString('pt-BR')}] Distribuído ${dist.quantity}x ${dist.item} para ${dist.destination}.`;
            y = addWrappedText(doc, distText, marginLeft + 10, y, usableWidth - 10, lineHeight);
        });
    }
    y += 15;

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginLeft, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        doc.text(`SIGERD - Sistema Integrado de Gerenciamento de Riscos e Desastres`, marginLeft, doc.internal.pageSize.getHeight() - 20);
    }

    // Salvar o PDF
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Relatorio_Situacional_${ts}.pdf`;
    doc.save(filename);
}
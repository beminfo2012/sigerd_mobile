import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Normalizes record data to handle both camelCase (from form) and snake_case (from Supabase).
 */
const normalizeData = (data, type) => {
    const isVistoria = type === 'vistoria';
    if (isVistoria) {
        return {
            vistoriaId: data.vistoriaId || data.vistoria_id || '---',
            dataHora: data.dataHora || data.data_hora || data.created_at,
            solicitante: data.solicitante || '---',
            endereco: data.endereco || '---',
            tipoInfo: data.tipoInfo || data.tipo_info || 'Vistoria Geral',
            observacoes: data.observacoes || '---',
            agente: data.agente || '---',
            matricula: data.matricula || '---',
            fotos: data.fotos || []
        };
    } else {
        return {
            interdicaoId: data.interdicaoId || data.interdicao_id || '---',
            dataHora: data.dataHora || data.data_hora || data.created_at,
            responsavelNome: data.responsavelNome || data.responsavel_nome || '---',
            endereco: data.endereco || '---',
            bairro: data.bairro || '---',
            municipio: data.municipio || '---',
            tipoAlvo: data.tipoAlvo || data.tipo_alvo || '---',
            medidaTipo: data.medidaTipo || data.medida_tipo || '---',
            riscoTipo: data.riscoTipo || data.risco_tipo || [],
            riscoGrau: data.riscoGrau || data.risco_grau || '---',
            medidaPrazo: data.medidaPrazo || data.medida_prazo || '---',
            situacaoObservada: data.situacaoObservada || data.situacao_observada || '---',
            recomendacoes: data.recomendacoes || '---',
            fotos: data.fotos || []
        };
    }
};

/**
 * Generates and shares/previews a formal PDF document.
 */
export const generatePDF = async (rawData, type) => {
    const data = normalizeData(rawData, type);
    const isVistoria = type === 'vistoria';
    const title = isVistoria ? 'Extrato de Vistoria' : 'Extrato de Interdição';
    const filename = `${type}_${data.vistoriaId || data.interdicaoId || Date.now()}.pdf`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '100vh'; // Below viewport
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    container.style.zIndex = '-9999';

    const headerHtml = `
        <div style="display: flex; align-items: center; border-bottom: 2px solid #2a5299; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="/logo_defesa_civil.png" style="height: 80px; margin-right: 20px;" />
            <div>
                <h1 style="margin: 0; font-size: 22px; color: #2a5299; text-transform: uppercase;">Defesa Civil de Santa Maria de Jetibá</h1>
                <h2 style="margin: 5px 0 0 0; font-size: 18px; color: #666; font-weight: bold;">${title}</h2>
            </div>
        </div>
    `;

    const renderInfo = (label, value) => `
        <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px;">
            <span style="font-size: 10px; color: #2a5299; font-weight: bold; text-transform: uppercase; display: block;">${label}</span>
            <span style="font-size: 14px; color: #333;">${value || '---'}</span>
        </div>
    `;

    let bodyHtml = '';
    if (isVistoria) {
        bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="grid-column: span 1;">${renderInfo('ID Vistoria', data.vistoriaId)}</div>
                <div style="grid-column: span 1;">${renderInfo('Data/Hora', new Date(data.dataHora).toLocaleString('pt-BR'))}</div>
                <div style="grid-column: span 2;">${renderInfo('Solicitante', data.solicitante)}</div>
                <div style="grid-column: span 2;">${renderInfo('Endereço', data.endereco)}</div>
                <div style="grid-column: span 2;">${renderInfo('Tipo', data.tipoInfo)}</div>
                <div style="grid-column: span 2;">${renderInfo('Observações', data.observacoes)}</div>
                <div style="grid-column: span 1;">${renderInfo('Agente', data.agente)}</div>
                <div style="grid-column: span 1;">${renderInfo('Matrícula', data.matricula)}</div>
            </div>
        `;
    } else {
        bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="grid-column: span 1;">${renderInfo('ID Interdição', data.interdicaoId)}</div>
                <div style="grid-column: span 1;">${renderInfo('Data/Hora', new Date(data.dataHora).toLocaleString('pt-BR'))}</div>
                <div style="grid-column: span 2;">${renderInfo('Responsável', data.responsavelNome)}</div>
                <div style="grid-column: span 2;">${renderInfo('Endereço', data.endereco)}</div>
                <div style="grid-column: span 1;">${renderInfo('Bairro', data.bairro)}</div>
                <div style="grid-column: span 1;">${renderInfo('Município', data.municipio)}</div>
                <div style="grid-column: span 1;">${renderInfo('Tipo de Alvo', data.tipoAlvo)}</div>
                <div style="grid-column: span 1;">${renderInfo('Tipo de Interdição', data.medidaTipo)}</div>
                <div style="grid-column: span 2;">${renderInfo('Risco Detectado', Array.isArray(data.riscoTipo) ? data.riscoTipo.join(', ') : data.riscoTipo)}</div>
                <div style="grid-column: span 1;">${renderInfo('Grau de Risco', data.riscoGrau)}</div>
                <div style="grid-column: span 1;">${renderInfo('Prazo', data.medidaPrazo)}</div>
                <div style="grid-column: span 2;">${renderInfo('Situação Observada', data.situacaoObservada)}</div>
                <div style="grid-column: span 2;">${renderInfo('Recomendações', data.recomendacoes)}</div>
            </div>
        `;
    }

    let photosHtml = '';
    if (data.fotos && data.fotos.length > 0) {
        photosHtml = `
            <div style="margin-top: 40px; border-top: 2px solid #2a5299; padding-top: 20px; page-break-before: always;">
                <h3 style="font-size: 16px; color: #2a5299; text-transform: uppercase;">Registro Fotográfico</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    ${data.fotos.map(f => `
                        <div style="border: 1px solid #ddd; padding: 5px; border-radius: 4px;">
                            <img src="${f.data || f}" style="width: 100%; height: auto; max-height: 300px; object-fit: contain;" />
                            ${f.legenda ? `<p style="font-size: 10px; margin-top: 5px; color: #666;">${f.legenda}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const footerHtml = `
        <div style="margin-top: 60px; text-align: center; page-break-inside: avoid;">
            <div style="display: inline-block; width: 300px; border-top: 1px solid #333; padding-top: 8px;">
                <p style="margin: 0; font-size: 12px; font-weight: bold;">Assinatura do Agente</p>
                <p style="margin: 0; font-size: 10px; color: #666;">Defesa Civil de Santa Maria de Jetibá</p>
            </div>
        </div>
    `;

    container.innerHTML = `<div>${headerHtml}${bodyHtml}${photosHtml}${footerHtml}</div>`;
    document.body.appendChild(container);

    const waitForImages = () => {
        const images = Array.from(container.getElementsByTagName('img'));
        return Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }));
    };

    try {
        await waitForImages();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white',
            windowWidth: 800
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const filenameFinal = filename;

        // Try Share first
        const file = new File([blob], filenameFinal, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: title });
        } else {
            // Fallback: Open in new window or Download
            const win = window.open(url, '_blank');
            if (!win) {
                const link = document.createElement('a');
                link.href = url;
                link.download = filenameFinal;
                link.click();
            }
        }

    } catch (error) {
        console.error('PDF Error:', error);
        alert('Erro ao gerar o documento.');
    } finally {
        if (document.body.contains(container)) document.body.removeChild(container);
    }
};

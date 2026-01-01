import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a formal PDF document for a record (Vistoria or Interdição).
 * @param {Object} data - The record data.
 * @param {string} type - 'vistoria' | 'interdicao'
 */
export const generatePDF = async (data, type) => {
    const isVistoria = type === 'vistoria';
    const title = isVistoria ? 'Extrato de Vistoria' : 'Extrato de Interdição';
    const filename = `${type}_${data.vistoriaId || data.interdicaoId || Date.now()}.pdf`;

    // Create a hidden container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px'; // A4-ish width in pixels
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';

    // Formal Header
    const headerHtml = `
        <div style="display: flex; align-items: center; border-bottom: 2px solid #2a5299; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="/logo_defesa_civil.png" style="height: 80px; margin-right: 20px;" />
            <div>
                <h1 style="margin: 0; font-size: 24px; color: #2a5299; text-transform: uppercase;">Defesa Civil de Santa Maria de Jetibá</h1>
                <h2 style="margin: 5px 0 0 0; font-size: 18px; color: #666; font-weight: bold;">${title}</h2>
            </div>
        </div>
    `;

    // Info Grid helper
    const renderInfo = (label, value) => `
        <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px;">
            <span style="font-size: 10px; color: #2a5299; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">${label}</span>
            <span style="font-size: 14px; color: #333; font-weight: medium;">${value || '---'}</span>
        </div>
    `;

    // Build Body based on type
    let bodyHtml = '';
    if (isVistoria) {
        bodyHtml = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
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
                <div style="grid-column: span 2;">${renderInfo('Risco Detectado', data.riscoTipo?.join(', '))}</div>
                <div style="grid-column: span 1;">${renderInfo('Grau de Risco', data.riscoGrau)}</div>
                <div style="grid-column: span 1;">${renderInfo('Prazo', data.medidaPrazo)}</div>
                <div style="grid-column: span 2;">${renderInfo('Situação Observada', data.situacaoObservada)}</div>
                <div style="grid-column: span 2;">${renderInfo('Recomendações', data.recomendacoes)}</div>
            </div>
        `;
    }

    // Photos Section
    let photosHtml = '';
    if (data.fotos && data.fotos.length > 0) {
        photosHtml = `
            <div style="margin-top: 40px; border-top: 2px solid #2a5299; padding-top: 20px;">
                <h3 style="font-size: 16px; color: #2a5299; text-transform: uppercase;">Registro Fotográfico</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
                    ${data.fotos.map(f => `
                        <div style="border: 1px solid #ddd; padding: 5px; border-radius: 4px;">
                            <img src="${f.data}" style="width: 100%; height: 200px; object-fit: cover;" />
                            ${f.legenda ? `<p style="font-size: 10px; margin: 5px 0 0 0; color: #666;">${f.legenda}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Formal Signature
    const footerHtml = `
        <div style="margin-top: 60px; text-align: center;">
            <div style="width: 250px; border-top: 1px solid #333; margin: 0 auto; padding-top: 5px;">
                <p style="margin: 0; font-size: 12px; font-weight: bold;">Assinatura do Agente</p>
                <p style="margin: 0; font-size: 10px; color: #666;">Defesa Civil de Santa Maria de Jetibá</p>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div style="min-height: 1000px; display: flex; flex-direction: column;">
            ${headerHtml}
            ${bodyHtml}
            ${photosHtml}
            <div style="margin-top: auto;">
                ${footerHtml}
                <p style="text-align: center; font-size: 8px; color: #999; margin-top: 30px;">
                    Este documento é um extrato digital gerado pelo Sistema SIGERD Mobile.
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // Wait for all images to load before capturing
    const waitForImages = () => {
        const images = container.getElementsByTagName('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if one fails
            });
        });
        return Promise.all(promises);
    };

    try {
        await waitForImages();

        // Added some delay to ensure layout is settled
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: true, // Enable for troubleshooting
            backgroundColor: 'white',
            windowWidth: 800,
            onclone: (clonedDoc) => {
                const element = clonedDoc.body.querySelector('[style*="left: -9999px"]');
                if (element) {
                    element.style.left = '0';
                    element.style.position = 'relative';
                }
            }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If content is very long, maybe we need multi-page? 
        // For now, let's just make sure one page works well.
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);

        // Final feedback
        alert('PDF gerado com sucesso!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
        document.body.removeChild(container);
    }
};

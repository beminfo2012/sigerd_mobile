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

    console.log(`Starting PDF generation for ${type}...`);

    // Create a container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '0'; // Changed from -9999px to 0 for better cloning reliability
    container.style.top = '0';
    container.style.zIndex = '-1000';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    container.style.visibility = 'hidden'; // Hidden but measurable

    // Formal Header Template
    const headerHtml = `
        <div style="display: flex; align-items: center; border-bottom: 2px solid #2a5299; padding-bottom: 20px; margin-bottom: 30px;">
            <img src="/logo_defesa_civil.png" style="height: 80px; margin-right: 20px;" />
            <div>
                <h1 style="margin: 0; font-size: 22px; color: #2a5299; text-transform: uppercase; line-height: 1.2;">Defesa Civil de Santa Maria de Jetibá</h1>
                <h2 style="margin: 5px 0 0 0; font-size: 18px; color: #666; font-weight: bold;">${title}</h2>
            </div>
        </div>
    `;

    // Info Grid helper
    const renderInfo = (label, value) => `
        <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px;">
            <span style="font-size: 10px; color: #2a5299; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">${label}</span>
            <span style="font-size: 14px; color: #333; word-break: break-word;">${value || '---'}</span>
        </div>
    `;

    // Build Body content
    let bodyHtml = '';
    if (isVistoria) {
        bodyHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="grid-column: span 1;">${renderInfo('ID Vistoria', data.vistoriaId)}</div>
                <div style="grid-column: span 1;">${renderInfo('Data/Hora', data.dataHora && new Date(data.dataHora).toLocaleString('pt-BR'))}</div>
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
                <div style="grid-column: span 1;">${renderInfo('Data/Hora', data.dataHora && new Date(data.dataHora).toLocaleString('pt-BR'))}</div>
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
                <h3 style="font-size: 16px; color: #2a5299; text-transform: uppercase; margin-bottom: 15px;">Registro Fotográfico</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    ${data.fotos.map(f => `
                        <div style="border: 1px solid #ddd; padding: 5px; border-radius: 4px; background: #fafafa;">
                            <img src="${f.data}" style="width: 100%; height: auto; max-height: 250px; object-fit: contain; display: block;" />
                            ${f.legenda ? `<p style="font-size: 10px; margin: 8px 0 0 0; color: #666; font-style: italic; text-align: center;">${f.legenda}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Signature/Footer
    const footerHtml = `
        <div style="margin-top: 60px; text-align: center; page-break-inside: avoid;">
            <div style="display: inline-block; width: 300px; border-top: 1px solid #333; padding-top: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; font-weight: bold;">Assinatura do Agente</p>
                <p style="margin: 0; font-size: 11px; color: #666;">Defesa Civil de Santa Maria de Jetibá</p>
            </div>
            <p style="font-size: 9px; color: #999; margin-top: 10px;">
                Documento gerado digitalmente em ${new Date().toLocaleString('pt-BR')}.
                <br/>Código de Autenticidade: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
        </div>
    `;

    container.innerHTML = `
        <div style="padding: 10px;">
            ${headerHtml}
            ${bodyHtml}
            ${photosHtml}
            ${footerHtml}
        </div>
    `;

    document.body.appendChild(container);

    // Helper to wait for images
    const waitForImages = () => {
        const images = Array.from(container.getElementsByTagName('img'));
        return Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));
    };

    try {
        await waitForImages();
        await new Promise(resolve => setTimeout(resolve, 800)); // Extra time for rendering

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'white',
            logging: false,
            windowWidth: 800
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pageWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        // Multi-page handling logic
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

        // --- Robust Download Trigger ---
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Append to body, click, and remove (needed for some mobile browsers)
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        console.log("PDF generated and download triggered.");
        alert('PDF gerado com sucesso! Verifique seus downloads.');

    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert(`Falha ao gerar o documento: ${error.message}`);
    } finally {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

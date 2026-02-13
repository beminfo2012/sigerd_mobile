import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generateDespachoPDF = async (despachoData) => {
    const urlToBase64 = (url) => {
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
                } catch (e) { resolve(url); }
            };
            img.onerror = () => resolve(url);
            img.src = url;
        });
    };

    let [logoDefesaCivilStr, logoSigerdStr] = await Promise.all([
        urlToBase64(LOGO_DEFESA_CIVIL),
        urlToBase64(LOGO_SIGERD)
    ]);

    const title = 'DESPACHO ADMINISTRATIVO';
    const filename = `DESPACHO_${despachoData.despachoId.replace(/[\/\\]/g, '_')}.pdf`;

    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 840px; background: white; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a;`;

    const headerHtml = `
        <div style="background-color: #ffffff; border-bottom: 4px solid #2a5299; padding: 45px 40px 25px 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="width: 120px;"><img src="${logoDefesaCivilStr}" style="height: 85px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 15px;">
                    <h1 style="margin: 0; font-size: 22px; color: #000000; text-transform: uppercase; font-weight: 800; line-height: 1.2;">PREFEITURA MUNICIPAL DE<br/>SANTA MARIA DE JETIBÁ</h1>
                    <h2 style="margin: 8px 0 0 0; font-size: 14px; color: #000000; font-weight: 700; text-transform: uppercase;">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h2>
                </div>
                <div style="width: 120px; text-align: right;"><img src="${logoSigerdStr}" style="height: 85px; object-fit: contain;" /></div>
            </div>
            <div style="text-align: center;">
                <h1 style="margin: 0; color: #2a5299; font-weight: 900; font-size: 22px; text-transform: uppercase; letter-spacing: 1.5px;">${title}</h1>
                <h3 style="margin: 5px 0 0 0; color: #64748b; font-weight: 700; font-size: 14px; text-transform: uppercase;">Nº ${despachoData.despachoId}</h3>
            </div>
        </div>
    `;

    const renderField = (label, value) => {
        return `
            <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${label}</div>
                <div style="font-size: 13px; color: #1e293b; font-weight: 600; line-height: 1.4;">${value || '---'}</div>
            </div>
        `;
    };

    const contentHtml = `
        <div style="padding: 40px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; font-size: 14px; color: #2a5299; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                    Referência: Processo Administrativo
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px;">
                    ${renderField('Número do Processo', despachoData.processo)}
                    ${renderField('Protocolo', despachoData.processo)} 
                    ${renderField('Requerente', despachoData.solicitante)}
                    ${renderField('CPF/CNPJ', despachoData.cpf)}
                    <div style="grid-column: span 2;">${renderField('Endereço da Ocorrência', despachoData.endereco)}</div>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 40px;">
                     ${renderField('Vistoria Referência', despachoData.vistoriaRef)}
                     ${renderField('Data da Vistoria', new Date(despachoData.dataVistoria).toLocaleString('pt-BR'))}
                </div>
            </div>

            <div style="margin-bottom: 40px;">
                <div style="font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">AO SETOR DE:</div>
                <div style="font-size: 18px; color: #1e293b; font-weight: 900; background: #eff6ff; padding: 15px; border-left: 5px solid #2a5299; text-transform: uppercase;">
                    ${despachoData.destino}
                </div>
            </div>

            <div style="margin-bottom: 40px;">
                <div style="font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 15px;">DETERMINAÇÃO / DESPACHO:</div>
                <div style="font-size: 14px; color: #334155; line-height: 1.8; text-align: justify; white-space: pre-wrap;">${despachoData.conteudo}</div>
            </div>

            ${despachoData.observacoes ? `
            <div style="margin-bottom: 40px;">
                <div style="font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 15px;">OBSERVAÇÕES ADICIONAIS:</div>
                <div style="font-size: 13px; color: #475569; line-height: 1.6; font-style: italic;">"${despachoData.observacoes}"</div>
            </div>
            ` : ''}

            <div style="margin-top: 80px; text-align: center;">
                 <div style="height: 100px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #2a5299; width: 300px; margin-left: auto; margin-right: auto;">
                    ${despachoData.assinatura ? `<img src="${despachoData.assinatura}" style="max-height: 90px; width: auto;" />` : ''}
                </div>
                <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; color: #1e3a8a;">${despachoData.responsavel}</div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 4px;">COORDENADOR DE PROTEÇÃO E DEFESA CIVIL</div>
                <div style="font-size: 10px; font-weight: 500; color: #94a3b8;">Matrícula: ${despachoData.matricula}</div>
            </div>

             <p style="margin-top: 60px; font-size: 9px; color: #94a3b8; text-align: center; font-weight: 500; opacity: 0.8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')} via SIGERD Mobile.
            </p>
        </div>
    `;

    container.innerHTML = `<div id="pdf-content">${headerHtml}${contentHtml}</div>`;
    document.body.appendChild(container);

    try {
        await new Promise(r => setTimeout(r, 1000));

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 840 });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height / canvas.width) * pdfWidth;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

        // Multi-page support if needed (unlikely for dispatch usually 1 page)
        if (imgHeight > pdfHeight) {
            let heightLeft = imgHeight - pdfHeight;
            let position = -pdfHeight;
            while (heightLeft > 0) {
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
                position -= pdfHeight;
            }
        }

        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: title });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url) || (location.href = url);
        }

    } catch (e) {
        console.error(e);
        alert('Erro ao gerar documento.');
    } finally {
        document.body.removeChild(container);
    }
}

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generateDespachoPDF = async (despachoData) => {
    const urlToBase64 = (url) => {
        return new Promise((resolve) => {
            if (!url) return resolve('');
            if (url.startsWith('data:')) return resolve(url);
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

    const despachoNum = despachoData.despachoId || despachoData.despacho_id || '---';

    // Format current date in Portuguese
    const formatDateLong = (dateStr) => {
        const d = dateStr ? new Date(dateStr) : new Date();
        const monthNames = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const day = d.getDate();
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `Santa Maria de Jetibá, ${day} de ${month} de ${year}.`;
    };

    const destinatariosList = Array.isArray(despachoData.destino) 
        ? despachoData.destino.join(', ') 
        : (despachoData.destino || 'Não especificado');

    // Standard A4 width at 96dpi = 794px
    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 794px; background: white; font-family: 'Inter', Arial, Helvetica, sans-serif; color: #1e293b; padding: 0; box-sizing: border-box;`;

    const headerHtml = `
        <div class="pdf-block" style="background-color: #ffffff; border-bottom: 3px solid #1e3a8a; padding: 25px 35px 15px 35px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="width: 100px;"><img src="${logoDefesaCivilStr}" style="height: 70px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                    <h1 style="margin: 0; font-size: 16px; color: #0f172a; text-transform: uppercase; font-weight: 800; line-height: 1.2; letter-spacing: 0.5px;">PREFEITURA MUNICIPAL DE<br/>SANTA MARIA DE JETIBÁ</h1>
                    <h2 style="margin: 4px 0 0 0; font-size: 11px; color: #334155; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h2>
                </div>
                <div style="width: 100px; text-align: right;"><img src="${logoSigerdStr}" style="height: 70px; object-fit: contain;" /></div>
            </div>
            <div style="text-align: center; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <h1 style="margin: 0; color: #1e3a8a; font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: 1.2px;">DESPACHO Nº ${despachoNum}</h1>
            </div>
        </div>
    `;

    // Render row only if value exists (no separation lines, no blank rows if missing)
    const renderRow = (label, value) => {
        if (!value || String(value).trim() === '' || String(value).trim() === '---' || String(value).trim() === 'N/A') {
            return '';
        }
        return `
            <div style="padding: 4px 0; display: flex; align-items: baseline;">
                <span style="width: 170px; font-size: 10.5px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${label}:</span>
                <span style="flex: 1; font-size: 12px; color: #0f172a; font-weight: 600;">${value}</span>
            </div>
        `;
    };

    const formattedDataVistoria = despachoData.dataVistoria 
        ? new Date(despachoData.dataVistoria).toLocaleDateString('pt-BR') 
        : '';

    const processoRow = renderRow('Processo de Origem', despachoData.processo);
    const vistoriaRow = renderRow('Relatório de Vistoria', despachoData.vistoriaRef ? `Nº ${despachoData.vistoriaRef}` : '');
    const dataVistoriaRow = renderRow('Data da Vistoria', formattedDataVistoria);
    const solicitanteRow = renderRow('Solicitante', despachoData.solicitante);
    const interessadoRow = renderRow('Interessado', despachoData.interessado);
    const localRow = renderRow('Local da Ocorrência', despachoData.endereco);
    const riscoRow = renderRow('Classificação de Risco', despachoData.classificacaoRisco || despachoData.grauRisco);

    const hasAnyProcessInfo = Boolean(
        processoRow || vistoriaRow || dataVistoriaRow || solicitanteRow || interessadoRow || localRow || riscoRow
    );

    const contentHtml = `
        <div style="padding: 20px 35px 30px 35px;">
            <!-- Dados do Processo -->
            ${hasAnyProcessInfo ? `
            <div class="pdf-block" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <div style="font-size: 11px; color: #1e3a8a; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; margin-bottom: 6px;">
                    Dados do Processo & Vistoria
                </div>
                ${processoRow}
                ${vistoriaRow}
                ${dataVistoriaRow}
                ${solicitanteRow}
                ${interessadoRow}
                ${localRow}
                ${riscoRow}
            </div>
            ` : ''}

            <!-- Destinatário -->
            <div class="pdf-block" style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Destinatário(s)</div>
                <div style="font-size: 13px; color: #0f172a; font-weight: 800; background: #eff6ff; border-left: 4px solid #1e3a8a; padding: 10px 14px; border-radius: 4px; text-transform: uppercase;">
                    ${destinatariosList}
                </div>
            </div>

            <!-- Assunto / Tipo de Despacho -->
            <div class="pdf-block" style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Assunto / Tipo de Despacho</div>
                <div style="font-size: 13px; color: #1e293b; font-weight: 700; background: #f1f5f9; padding: 8px 14px; border-radius: 4px;">
                    ${despachoData.tipoDespacho || 'Despacho Administrativo'}
                </div>
            </div>

            <!-- Despacho / Conteúdo -->
            <div class="pdf-block" style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Despacho</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.6; text-align: justify; white-space: pre-wrap; background: #ffffff; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 6px;">${despachoData.conteudo}</div>
            </div>

            <!-- Fundamentação (Se houver) -->
            ${despachoData.fundamentacao && String(despachoData.fundamentacao).trim() !== '' ? `
            <div class="pdf-block" style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Fundamentação Técnica / Jurídica</div>
                <div style="font-size: 12px; color: #334155; line-height: 1.5; font-style: italic; background: #fefce8; padding: 10px 14px; border-left: 3px solid #eab308; border-radius: 4px;">
                    ${despachoData.fundamentacao}
                </div>
            </div>
            ` : ''}

            <!-- Anexos (Se houver) -->
            ${Array.isArray(despachoData.anexos) && despachoData.anexos.length > 0 ? `
            <div class="pdf-block" style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Anexos Incorporados (${despachoData.anexos.length})</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #475569;">
                    ${despachoData.anexos.map((a, i) => `<li>${a.name || `Anexo ${i + 1}`} (${a.type || 'Documento'})</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <!-- Bloco de Assinatura & Rodapé -->
            <div class="pdf-block pdf-footer-block" style="margin-top: 25px; text-align: center;">
                <div style="text-align: right; font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 25px;">
                    ${formatDateLong(despachoData.dataEmissao)}
                </div>

                <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 6px; border-bottom: 2px solid #1e3a8a; width: 280px; margin-left: auto; margin-right: auto;">
                    ${despachoData.assinatura ? `<img src="${despachoData.assinatura}" style="max-height: 55px; width: auto;" />` : ''}
                </div>
                <div style="font-weight: 900; font-size: 13px; text-transform: uppercase; color: #0f172a;">${despachoData.responsavel || 'Coordenador Defesa Civil'}</div>
                <div style="font-size: 10.5px; font-weight: 700; color: #475569; margin-top: 2px;">Coordenadoria Municipal de Proteção e Defesa Civil</div>
                <div style="font-size: 9.5px; font-weight: 600; color: #64748b; margin-top: 2px;">Matrícula: ${despachoData.matricula || '---'}</div>

                <div style="margin-top: 35px; border-top: 2px solid #cbd5e1; padding-top: 10px; text-align: center; font-size: 8.5px; color: #64748b; line-height: 1.4;">
                    <div style="font-weight: 800; text-transform: uppercase; color: #334155;">Prefeitura Municipal de Santa Maria de Jetibá - ES</div>
                    <div>Rua Frossard, 145 - Centro, Santa Maria de Jetibá - ES | Tel: (27) 3263-4800</div>
                    <div style="opacity: 0.8; margin-top: 3px;">Documento assinado e emitido digitalmente via SIGERD Mobile em ${new Date().toLocaleString('pt-BR')}.</div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = `<div id="pdf-content">${headerHtml}${contentHtml}</div>`;
    document.body.appendChild(container);

    // Smart Page Break Helper to prevent chopping blocks across A4 pages
    const applySmartPageBreaks = () => {
        const PAGE_PX = 1123; // Exact A4 height in px at 96 DPI
        const blocks = container.querySelectorAll('.pdf-block');
        blocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const top = rect.top - containerRect.top;
            const bottom = rect.bottom - containerRect.top;

            const startPage = Math.floor(top / PAGE_PX);
            const endPage = Math.floor(bottom / PAGE_PX);

            const isFooter = block.classList.contains('pdf-footer-block');

            // If a block crosses an A4 page boundary, insert spacer before it
            if (startPage !== endPage || (isFooter && (top % PAGE_PX) > (PAGE_PX - 240))) {
                const spacer = document.createElement('div');
                spacer.style.height = (PAGE_PX - (top % PAGE_PX)) + 'px';
                block.parentNode.insertBefore(spacer, block);
            }
        });
    };

    try {
        await new Promise(r => setTimeout(r, 400));
        applySmartPageBreaks();
        await new Promise(r => setTimeout(r, 400));

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Exact 1:1 scale (No stretching, no compression)
        const imgHeight = (canvas.height / canvas.width) * pdfWidth;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
            location.href = blobUrl;
        }

    } catch (e) {
        console.error(e);
        alert('Erro ao gerar documento PDF do despacho.');
    } finally {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

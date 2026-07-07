import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generateNoprerPDF = async (data, options = { autoOpen: true }) => {
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

    const num = data.numero || '---';
    const filename = `NOPRER nº ${num} - ${data.nome_notificado || 'Notificado'}.pdf`.replace(/[\/\\]/g, '_');

    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 840px; background: white; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a;`;

    const headerHtml = `
        <div style="background-color: #ffffff; border-bottom: 4px solid #b91c1c; padding: 45px 40px 25px 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="width: 120px;"><img src="${logoDefesaCivilStr}" style="height: 85px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 15px;">
                    <h1 style="margin: 0; font-size: 22px; color: #000000; text-transform: uppercase; font-weight: 800; line-height: 1.2;">PREFEITURA MUNICIPAL DE<br/>SANTA MARIA DE JETIBÁ</h1>
                    <h2 style="margin: 8px 0 0 0; font-size: 14px; color: #000000; font-weight: 700; text-transform: uppercase;">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h2>
                </div>
                <div style="width: 120px; text-align: right;"><img src="${logoSigerdStr}" style="height: 85px; object-fit: contain;" /></div>
            </div>
            <div style="text-align: center;"><h1 style="margin: 0; color: #b91c1c; font-weight: 900; font-size: 19px; text-transform: uppercase; letter-spacing: 1.5px;">NOTIFICAÇÃO PRELIMINAR DE RISCO - NOPRER</h1></div>
        </div>
    `;

    const sectionTitle = (title) => `
        <div class="pdf-section-header" style="border-left: 5px solid #b91c1c; padding: 10px 15px; margin: 35px 0 15px 0; font-weight: 800; color: #7f1d1d; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
            ${title}
        </div>
    `;

    const renderField = (label, value) => {
        return `
            <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px;">
                <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">${label}</div>
                <div style="font-size: 12px; color: #1e293b; font-weight: 600; line-height: 1.4;">${value || '---'}</div>
            </div>
        `;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
    };

    let contentHtml = `<div style="padding: 0 40px 40px 40px;">`;

    contentHtml += `
        ${sectionTitle('1. Identificação do Documento')}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
            ${renderField('Número NOPRER', data.numero)}
            ${renderField('Data de Emissão', formatDate(data.data_emissao))}
            ${renderField('Vistoria Vinculada', data.vistoria ? data.vistoria.numero : 'Sem vínculo')}
            ${renderField('Agente Emissor', data.nome_agente)}
        </div>

        ${sectionTitle('2. Identificação do Notificado')}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
            <div style="grid-column: span 2;">${renderField('Nome do Notificado', data.nome_notificado)}</div>
            ${renderField('CPF / CNPJ', data.cpf_notificado)}
            ${renderField('Contato', data.contato)}
            ${renderField('Condição', data.condicao)}
            ${renderField('Tipo de Ocupação', data.tipo_ocupacao)}
            <div style="grid-column: span 2;">${renderField('Endereço', data.endereco)}</div>
        </div>

        ${sectionTitle('3. Diagnóstico do Risco')}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
            ${renderField('Tipo de Risco Principal', data.tipo_risco)}
            ${renderField('Subtipo Específico', data.sub_tipo)}
            ${renderField('Grau de Risco (R1-R4)', data.grau_risco)}
        </div>
        <div style="background: #fef2f2; border-radius: 12px; padding: 20px; border: 1px solid #fecaca; margin-top: 15px;">
            <div style="font-size: 10px; color: #991b1b; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">DESCRIÇÃO DO RISCO</div>
            <div style="font-size: 13px; color: #7f1d1d; font-weight: 600; line-height: 1.6;">
                ${data.descricao_risco || 'Nenhuma descrição detalhada.'}
            </div>
        </div>

        ${sectionTitle('4. Medidas Preventivas / Mitigadoras Estipuladas')}
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">PROVIDÊNCIAS A SEREM ADOTADAS PELO NOTIFICADO</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${(data.medidas || []).map(m => `
                    <div style="display: flex; align-items: start; gap: 10px; background: white; padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="color: #b91c1c; font-weight: 900; font-size: 14px;">➜</div>
                        <div style="font-size: 12px; color: #334155; font-weight: 600; line-height: 1.4;">${m}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: #fffbeb; border-radius: 12px; padding: 15px; border: 1px solid #fde68a;">
                <div style="font-size: 10px; color: #92400e; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">PRAZO PARA REGULARIZAÇÃO</div>
                <div style="font-size: 16px; color: #b45309; font-weight: 900;">Até ${formatDate(data.data_limite)}</div>
            </div>
            <div style="background: #eff6ff; border-radius: 12px; padding: 15px; border: 1px solid #bfdbfe;">
                <div style="font-size: 10px; color: #1e40af; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">DATA PREVISTA PARA REVISTORIA</div>
                <div style="font-size: 16px; color: #1d4ed8; font-weight: 900;">${formatDate(data.data_revistoria)}</div>
            </div>
        </div>
    `;

    // Termo de Responsabilidade
    contentHtml += `
        <div style="page-break-before: always; height: 1px;"></div>
        <div style="margin-top: 40px; padding: 25px; border: 2px solid #94a3b8; border-radius: 12px;">
            <h3 style="text-align: center; margin-top: 0; color: #334155; text-transform: uppercase; font-size: 14px;">Termo de Responsabilidade e Ciência</h3>
            <p style="font-size: 11px; color: #475569; text-align: justify; line-height: 1.6;">
                O NOTIFICADO acima qualificado, proprietário/posseiro/ocupante do imóvel em questão, declara ter recebido 
                formalmente as orientações técnicas exaradas pela Defesa Civil Municipal através deste documento (NOPRER). 
                Reconhece a condição de risco informada e concorda expressamente em cumprir as medidas preventivas e 
                mitigadoras indicadas no prazo assinalado, estando ciente de que o não cumprimento poderá resultar em 
                sanções administrativas e medidas coercitivas, bem como sua responsabilização em caso de agravamento da 
                situação que possa colocar em risco a vida própria ou de terceiros.
            </p>
        </div>
    `;

    // Assinaturas
    contentHtml += `
        <div id="footer-signatures" style="margin-top: 50px; padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; page-break-inside: avoid; break-inside: avoid;">
    `;

    if (data.modo_assinatura === 'recusa') {
        contentHtml += `
            <div style="text-align: center; color: #b91c1c; font-weight: bold; margin-bottom: 20px; font-size: 12px;">
                O NOTIFICADO SE RECUSOU A ASSINAR ESTE DOCUMENTO.
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 30px;">
                <div style="text-align: center; width: 45%;">
                    <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 1px solid #94a3b8;">
                        ${data.sign_test1 ? `<img src="${data.sign_test1}" style="max-height: 50px;" />` : ''}
                    </div>
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: #334155;">Testemunha 1: ${data.test1_nome}</p>
                    <p style="margin: 0; font-size: 10px; color: #64748b;">CPF: ${data.test1_cpf}</p>
                </div>
                <div style="text-align: center; width: 45%;">
                    <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 1px solid #94a3b8;">
                        ${data.sign_test2 ? `<img src="${data.sign_test2}" style="max-height: 50px;" />` : ''}
                    </div>
                    <p style="margin: 0; font-size: 12px; font-weight: 700; color: #334155;">Testemunha 2: ${data.test2_nome}</p>
                    <p style="margin: 0; font-size: 10px; color: #64748b;">CPF: ${data.test2_cpf}</p>
                </div>
            </div>
        `;
    } else if (data.modo_assinatura === 'digital') {
        contentHtml += `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="height: 80px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;">
                    ${data.sign_notificado ? `<img src="${data.sign_notificado}" style="max-height: 70px;" />` : ''}
                </div>
                <p style="margin: 0; font-size: 13px; font-weight: 800; color: #1e293b;">${data.nome_notificado}</p>
                <p style="margin: 0; font-size: 10px; color: #64748b;">NOTIFICADO (Assinatura Digital)</p>
            </div>
        `;
    } else {
        // impresso
        contentHtml += `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="height: 60px; margin-bottom: 15px; border-bottom: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;">
                </div>
                <p style="margin: 0; font-size: 13px; font-weight: 800; color: #1e293b;">${data.nome_notificado}</p>
                <p style="margin: 0; font-size: 10px; color: #64748b;">NOTIFICADO (Assinatura Física Requerida)</p>
            </div>
        `;
    }

    contentHtml += `
            <div style="text-align: center; margin-top: 30px;">
                <div style="height: 80px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #b91c1c; width: 60%; margin-left: auto; margin-right: auto;">
                    ${data.sign_agente ? `<img src="${data.sign_agente}" style="max-height: 70px;" />` : ''}
                </div>
                <p style="margin: 0; font-size: 13px; font-weight: 800; color: #7f1d1d; text-transform: uppercase;">${data.nome_agente}</p>
                <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Agente de Defesa Civil</p>
                ${data.matricula_agente ? `<p style="margin: 0; font-size: 10px; color: #94a3b8;">Matrícula: ${data.matricula_agente}</p>` : ''}
            </div>
        </div>
    `;

    contentHtml += `</div>`;
    container.innerHTML = `<div id="pdf-content">${headerHtml}${contentHtml}</div>`;
    document.body.appendChild(container);

    try {
        await new Promise(r => setTimeout(r, 1500)); // Render wait

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 840 });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
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

        const blobUrl = pdf.output('bloburl');
        
        let shared = false;
        // Tenta compartilhar apenas em dispositivos móveis (quando a tela é pequena)
        if (window.innerWidth <= 768 && navigator.share && navigator.canShare) {
            const file = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'NOPRER - Defesa Civil' });
                    shared = true;
                } catch (shareErr) {
                    console.warn('Share cancelado:', shareErr);
                }
            }
        }

        if (!shared && options.autoOpen) {
            window.open(blobUrl, '_blank');
        }

        return { success: true, blob: pdf.output('blob'), filename };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
    finally { document.body.removeChild(container); }
};

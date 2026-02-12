import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

/**
 * S2ID REPORT GENERATOR - HIGH FIDELITY FIDE MODEL
 * Generates a professional PDF report from S2id record data.
 */

export const generateS2idReport = async (record, userProfile, activeSector = null) => {
    // Definir se é um relatório consolidado ou setorial
    const isSectoral = !!activeSector;
    const sectorName = activeSector ? activeSector.toUpperCase().replace(/_/g, ' ') : '';
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

    const filename = isSectoral
        ? `S2ID_SETORIAL_${activeSector.toUpperCase()}_${record.data.tipificacao.cobrade.replace(/\./g, '_')}.pdf`
        : `S2ID_FIDE_${record.data.tipificacao.cobrade.replace(/\./g, '_')}_${new Date().getTime()}.pdf`;
    const data = record.data;

    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 840px; background: white; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a;`;

    const headerHtml = `
        <div style="background-color: #ffffff; border-bottom: 4px solid #1e3a8a; padding: 45px 40px 25px 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="width: 120px;"><img src="${logoDefesaCivilStr}" style="height: 85px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 15px;">
                    <h1 style="margin: 0; font-size: 20px; color: #000000; text-transform: uppercase; font-weight: 800; line-height: 1.2;">SISTEMA NACIONAL DE PROTEÇÃO E DEFESA CIVIL</h1>
                    <h2 style="margin: 8px 0 0 0; font-size: 14px; color: #1e3a8a; font-weight: 700; text-transform: uppercase;">
                        ${isSectoral ? `LEVANTAMENTO SETORIAL: ${sectorName}` : 'FORMULÁRIO DE INFORMAÇÕES DO DESASTRE (FIDE)'}
                    </h2>
                    <p style="margin: 5px 0 0 0; font-size: 10px; color: #64748b; font-weight: 600;">PORTARIA MDR Nº 2.601, DE 14 DE DEZEMBRO DE 2020</p>
                </div>
                <div style="width: 120px; text-align: right;"><img src="${logoSigerdStr}" style="height: 85px; object-fit: contain;" /></div>
            </div>
            <div style="display: flex; justify-content: center; gap: 40px; margin-top: 10px;">
                <div style="text-align: center;"><span style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Estado</span><br/><span style="font-size: 12px; font-weight: 700;">ESPIRITO SANTO</span></div>
                <div style="text-align: center;"><span style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Município</span><br/><span style="font-size: 12px; font-weight: 700;">SANTA MARIA DE JETIBÁ</span></div>
                ${isSectoral ? `<div style="text-align: center;"><span style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase;">Setor Responsável</span><br/><span style="font-size: 12px; font-weight: 700; color: #1e3a8a;">${sectorName}</span></div>` : ''}
            </div>
        </div>
    `;

    const sectionTitle = (num, title) => `
        <div style="background-color: #f1f5f9; padding: 10px 15px; margin: 30px 0 15px 0; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
            <div style="background: #1e3a8a; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px;">${num}</div>
            <div style="font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">${title}</div>
        </div>
    `;

    const renderTable = (headers, rows, widths) => `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
            <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    ${headers.map((h, i) => `<th style="padding: 10px; text-align: ${i === 0 ? 'left' : 'center'}; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 9px; width: ${widths[i]};">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        ${row.map((cell, i) => `<td style="padding: 10px; text-align: ${i === 0 ? 'left' : 'center'}; font-weight: ${i === 0 ? '700' : '600'}; color: #334155;">${cell}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    let contentHtml = `<div style="padding: 0 40px 40px 40px;">`;

    // 2. Tipificação
    contentHtml += sectionTitle('2', 'Tipificação do Desastre');
    contentHtml += `
        <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 20px;">
            <div style="background: #eff6ff; padding: 15px; border-radius: 12px; border: 1px solid #dbeafe;">
                <div style="font-size: 9px; color: #2563eb; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Codificação (COBRADE)</div>
                <div style="font-size: 16px; font-weight: 900; color: #1e3a8a;">${data.tipificacao.cobrade}</div>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 12px; border: 1px solid #dbeafe;">
                <div style="font-size: 9px; color: #2563eb; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Denominação</div>
                <div style="font-size: 14px; font-weight: 700; color: #1e3a8a;">${data.tipificacao.denominacao}</div>
            </div>
        </div>
    `;

    // 3. Ocorrência
    contentHtml += sectionTitle('3', 'Data e Horário da Ocorrência');
    contentHtml += `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            ${['Dia', 'Mês', 'Ano', 'Horário'].map(label => `
                <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="font-size: 8px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">${label}</div>
                    <div style="font-size: 13px; font-weight: 700;">${data.data_ocorrencia[label.toLowerCase()]}</div>
                </div>
            `).join('')}
        </div>
    `;

    // 6. Danos
    contentHtml += sectionTitle('6', 'Danos (Estimativas Totais)');

    // 6.1 Humanos
    contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 20px 0 10px 0;">6.1 Danos Humanos</div>`;
    const humanoRows = [
        ['Mortos', data.danos_humanos.mortos, 'Feridos', data.danos_humanos.feridos],
        ['Enfermos', data.danos_humanos.enfermos, 'Desabrigados', data.danos_humanos.desabrigados],
        ['Desalojados', data.danos_humanos.desalojados, 'Desaparecidos', data.danos_humanos.desaparecidos],
        ['Outros Afetados', data.danos_humanos.outros_afetados, '', '']
    ];
    contentHtml += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            ${humanoRows.map(row => `
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f1f5f9;"><span style="font-size: 11px; font-weight: 600;">${row[0]}</span><span style="font-weight: 800; color: #1e3a8a;">${row[1]}</span></div>
                    ${row[2] ? `<div style="flex: 1; display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #f1f5f9;"><span style="font-size: 11px; font-weight: 600;">${row[2]}</span><span style="font-weight: 800; color: #1e3a8a;">${row[3]}</span></div>` : '<div style="flex: 1;"></div>'}
                </div>
            `).join('')}
        </div>
        ${data.danos_humanos.descricao ? `
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #cbd5e1; margin-bottom: 30px;">
                <div style="font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Detalhamento de Danos Humanos</div>
                <div style="font-size: 11px; color: #334155; line-height: 1.5; font-style: italic;">"${data.danos_humanos.descricao}"</div>
            </div>
        ` : ''}
    `;

    if (!isSectoral) {
        // 6.2 Materiais
        contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 30px 0 10px 0;">6.2 Danos Materiais</div>`;
        const materialRows = Object.keys(data.danos_materiais).map(key => [
            key.replace(/_/g, ' ').toUpperCase(),
            data.danos_materiais[key].danificadas,
            data.danos_materiais[key].destruidas,
            `R$ ${data.danos_materiais[key].valor.toLocaleString('pt-BR')}`
        ]);
        contentHtml += renderTable(['Discriminação', 'Danificadas', 'Destruídas', 'Valor (R$)'], materialRows, ['40%', '20%', '20%', '20%']);

        // 6.3 Ambientais
        contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 30px 0 10px 0;">6.3 Danos Ambientais</div>`;
        const ambientalRows = Object.keys(data.danos_ambientais).filter(k => k !== 'descricao').map(key => [
            key.replace(/_/g, ' ').toUpperCase(),
            data.danos_ambientais[key].sim ? 'SIM' : 'NÃO',
            data.danos_ambientais[key].area || data.danos_ambientais[key].populacao || '---'
        ]);
        contentHtml += renderTable(['Impacto Ambiental', 'Ocorrência', 'Obs/Área/Pop.'], ambientalRows, ['50%', '20%', '30%']);

        // 7. Prejuízos
        contentHtml += `<div style="page-break-before: always; height: 1px;"></div>`;
        contentHtml += sectionTitle('7', 'Prejuízos Econômicos');

        // 7.1 Públicos
        contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 20px 0 10px 0;">7.1 Setor Público</div>`;
        const publicoRows = Object.keys(data.prejuizos_publicos).map(key => [
            key.replace(/_/g, ' ').toUpperCase(),
            `R$ ${data.prejuizos_publicos[key].toLocaleString('pt-BR')}`
        ]);
        contentHtml += renderTable(['Instalação / Serviço', 'Valor Estimado (R$)'], publicoRows, ['70%', '30%']);

        // 7.2 Privados
        contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin: 30px 0 10px 0;">7.2 Setor Privado</div>`;
        const privadoRows = Object.keys(data.prejuizos_privados).map(key => [
            key.replace(/_/g, ' ').toUpperCase(),
            `R$ ${data.prejuizos_privados[key].toLocaleString('pt-BR')}`
        ]);
        contentHtml += renderTable(['Atividade / Bens', 'Valor Estimado (R$)'], privadoRows, ['70%', '30%']);
    } else {
        // MOSTRAR APENAS DADOS DO SETOR
        contentHtml += sectionTitle('S', `Levantamento Específico: ${sectorName}`);
        const sectorData = data.setorial[activeSector] || {};
        const sectorRows = Object.entries(sectorData)
            .filter(([k, v]) => v !== 0 && v !== '')
            .map(([key, val]) => [
                key.replace(/_/g, ' ').toUpperCase(),
                val
            ]);

        if (sectorRows.length > 0) {
            contentHtml += renderTable(['Descrição do Dano/Necessidade', 'Quantidade/Valor'], sectorRows, ['70%', '30%']);
        } else {
            contentHtml += `<p style="font-size: 12px; color: #64748b; font-style: italic;">Nenhum dado quantitativo registrado para este setor.</p>`;
        }

        if (sectorData.observacoes) {
            contentHtml += `
                <div style="background: #fdf2f2; padding: 15px; border-radius: 12px; border: 1px solid #fee2e2; margin-top: 20px;">
                    <div style="font-size: 9px; color: #b91c1c; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Observações Setoriais</div>
                    <div style="font-size: 11px; color: #7f1d1d; line-height: 1.5;">${sectorData.observacoes}</div>
                </div>
            `;
        }
    }

    // 8. Fotos (Relatório Fotográfico)
    contentHtml += sectionTitle('F', 'Relatório Fotográfico');
    const photosToRender = data.evidencias.filter(p => !isSectoral || p.sector === activeSector);

    if (photosToRender.length > 0) {
        contentHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">`;
        for (const photo of photosToRender) {
            contentHtml += `
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
                    <img src="${photo.url}" style="width: 100%; height: 200px; object-fit: cover;" />
                    <div style="padding: 10px; background: #f8fafc;">
                        <div style="font-size: 8px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">Coordenadas Geográficas</div>
                        <div style="font-size: 9px; font-weight: 700; color: #334155;">LAT: ${photo.lat.toFixed(6)} | LNG: ${photo.lng.toFixed(6)}</div>
                        <div style="font-size: 8px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 5px;">Data/Hora</div>
                        <div style="font-size: 9px; font-weight: 700; color: #334155;">${new Date(photo.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `;
        }
        contentHtml += `</div>`;
    } else {
        contentHtml += `<p style="text-align: center; color: #94a3b8; font-style: italic; font-size: 11px;">Nenhuma evidência fotográfica anexada ${isSectoral ? 'para este setor' : ''}.</p>`;
    }

    // Footer / Signature (Sectoral vs Global)
    const sectorSub = isSectoral ? data.submissoes_setoriais[activeSector] : null;
    const finalSignature = isSectoral ? sectorSub?.assinatura_url : data.assinatura.data_url;
    const finalName = isSectoral ? sectorSub?.responsavel : data.assinatura.responsavel;
    const finalRole = isSectoral ? sectorSub?.cargo : 'Agente Municipal de Defesa Civil';

    contentHtml += `
        <div style="margin-top: 50px; padding: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; page-break-inside: avoid;">
            <div style="text-align: center;">
                <div style="width: 300px; margin: 0 auto; border-bottom: 2px solid #1e3a8a; height: 80px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px;">
                    ${finalSignature ? `<img src="${finalSignature}" style="max-height: 70px; width: auto;" />` : ''}
                </div>
                <p style="margin: 0; font-size: 14px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">${finalName || 'Responsável'}</p>
                <p style="margin: 4px 0; font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase;">${finalRole}</p>
                ${isSectoral ? `<p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600;">Secretaria de ${sectorName}</p>` : `<p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600;">Defesa Civil Municipal</p>`}
            </div>
            <p style="margin-top: 40px; font-size: 9px; color: #94a3b8; text-align: center; font-weight: 500; opacity: 0.8;">
                Documento gerado em ${new Date().toLocaleString('pt-BR')} via SIGERD MOBILE S2ID.
                Relatório ${isSectoral ? 'Setorial' : 'FIDE Consolidado'}.
            </p>
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

        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Relatório S2ID FIDE' });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url) || (location.href = url);
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao gerar PDF');
    } finally {
        document.body.removeChild(container);
    }
};

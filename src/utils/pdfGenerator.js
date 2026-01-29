import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generatePDF = async (rawData, type) => {
    // 1. Data Normalization - Handling both camelCase and snake_case
    const data = type === 'vistoria' ? {
        id: rawData.vistoriaId || rawData.vistoria_id || '---',
        protocolo: rawData.processo || rawData.vistoriaId || rawData.vistoria_id || '---',
        dataRegistro: formatDate(rawData.dataHora || rawData.data_hora || rawData.created_at),
        emissao: new Date().toLocaleString('pt-BR'),
        agente: rawData.agente || '---',
        matricula: rawData.matricula || '---',
        assinaturaAgente: rawData.assinaturaAgente || rawData.assinatura_agente,
        solicitante: rawData.solicitante || '---',
        endereco: rawData.endereco || '---',
        latitude: rawData.latitude || '---',
        longitude: rawData.longitude || '---',
        categoria: rawData.categoriaRisco || rawData.categoria_risco || '---',
        nivel: rawData.nivelRisco || rawData.nivel_risco || 'Baixo',
        subtipo: (() => {
            const val = rawData.subtiposRisco || rawData.subtipos_risco;
            return Array.isArray(val) ? val.join(', ') : (val || '---');
        })(),
        situacao: rawData.situacaoObservada || rawData.situacao_observada || '---',
        populacao: rawData.populacaoEstimada || rawData.populacao_estimada || '---',
        descricao: rawData.observacoes || rawData.parecer_tecnico || 'Não informado',
        medidas: rawData.medidasTomadas || rawData.medidas_tomadas || [],
        checklist: rawData.checklistRespostas || rawData.checklist_respostas || {},
        fotos: (rawData.fotos || []).map(f => typeof f === 'string' ? { data: f } : f),
        apoio: rawData.apoioTecnico || rawData.apoio_tecnico
    } : {
        id: rawData.interdicaoId || rawData.interdicao_id || '---',
        protocolo: rawData.interdicaoId || '---',
        dataRegistro: formatDate(rawData.dataHora || rawData.data_hora),
        emissao: new Date().toLocaleString('pt-BR'),
        agente: rawData.agente || 'Agente',
        descricao: rawData.relatorioTecnico || rawData.relatorio_tecnico || '---',
        medidas: [rawData.recomendacoes || rawData.medidas_recomendadas].filter(Boolean)
    };

    function formatDate(dateStr) {
        if (!dateStr) return '---';
        try { return new Date(dateStr).toLocaleString('pt-BR'); } catch (e) { return dateStr; }
    }

    const urlToBase64 = (url) => new Promise((resolve) => {
        if (!url) return resolve(null);
        if (url.startsWith('data:')) return resolve(url);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(url);
        img.src = url;
    });

    const logoDC = await urlToBase64(LOGO_DEFESA_CIVIL);
    const logoSig = await urlToBase64(LOGO_SIGERD);

    const photoPairs = [];
    if (data.fotos && data.fotos.length > 0) {
        for (let i = 0; i < data.fotos.length; i += 2) {
            photoPairs.push(data.fotos.slice(i, i + 2));
        }
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
        <style>
            body { background-color: white !important; font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 0; }
            .section-title { color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; margin-bottom: 0.6rem; border-left: 4px solid #1e3a8a; padding-left: 10px; }
            .label { font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 2px; }
            .value { font-size: 0.9rem; font-weight: 500; color: #0f172a; margin-bottom: 12px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 8px; }
            .risk-badge { padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: white; display: inline-block; }
            .risk-alto { background-color: #ef4444; }
            .risk-medio { background-color: #f59e0b; }
            .risk-baixo { background-color: #10b981; }
            .pdf-block { break-inside: avoid; margin-bottom: 24px; position: relative; }
        </style>
    </head>
    <body>
        <div id="pdf-container" style="width: 800px; padding: 40px; margin: 0 auto; background: white;">
            
            <!-- HEADER (Matches attachment precisely) -->
            <div class="pdf-block" style="margin-bottom: 30px; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
                    <img src="${logoDC}" style="height: 65px; width: auto;"/>
                    <div style="flex: 1; padding: 0 20px;">
                        <h1 style="color: #000; font-weight: 700; font-size: 1.35rem; text-transform: uppercase; margin: 0; line-height: 1.1;">PREFEITURA MUNICIPAL DE<br/>SANTA MARIA DE JETIBÁ</h1>
                        <p style="color: #000; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin: 5px 0 0 0; letter-spacing: 0.02em;">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                    </div>
                    <img src="${logoSig}" style="height: 65px; width: auto;"/>
                </div>
                <h2 style="color: #2a5299; font-size: 1.15rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 20px 0 0 0;">RELATÓRIO DE VISTORIA TÉCNICA</h2>
            </div>

            <!-- 1. IDENTIFICAÇÃO -->
            <div class="pdf-block">
                <div class="section-title">1. Identificação e Responsável</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div class="label">Data da Ocorrência</div>
                        <div class="value">${data.dataRegistro}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Nº Processo / Protocolo</div>
                        <div class="value" style="color: #2a5299; font-weight: 700;">${data.protocolo}</div>
                    </div>
                    <div>
                        <div class="label">Emissão do Relatório</div>
                        <div class="value">${data.emissao}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Técnico Responsável</div>
                        <div class="value">${data.agente}</div>
                    </div>
                </div>
            </div>

            <!-- 2. LOCALIZAÇÃO -->
            <div class="pdf-block">
                <div class="section-title">2. Localização e Solicitante</div>
                <div class="box">
                    <div class="label">Proprietário / Solicitante</div>
                    <div class="value" style="font-size: 1rem; font-weight: 700;">${data.solicitante}</div>
                    <div class="label">Endereço</div>
                    <div class="value">${data.endereco}</div>
                    <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #2a5299; font-weight: 600; margin-top: 5px;">
                        <span>LAT: ${data.latitude}</span>
                        <span>LNG: ${data.longitude}</span>
                    </div>
                </div>
            </div>

            <!-- 3. DIAGNÓSTICO -->
            <div class="pdf-block">
                <div class="section-title">3. Diagnóstico de Risco</div>
                <div class="box">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div class="label">Categoria Principal</div>
                            <div class="value">${data.categoria}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">Nível de Risco</div>
                            <div class="risk-badge risk-${String(data.nivel).toLowerCase().includes('alto') ? 'alto' : String(data.nivel).toLowerCase().includes('médio') ? 'medio' : 'baixo'}">
                                ${String(data.nivel).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 5px;">
                        <div>
                            <div class="label">Subtipo</div>
                            <div class="value">${data.subtipo}</div>
                        </div>
                        <div>
                            <div class="label">Situação Observada</div>
                            <div class="value">${data.situacao}</div>
                        </div>
                    </div>
                    <div class="label">População Exposta</div>
                    <div class="value">${data.populacao}</div>
                </div>
            </div>

            <!-- 4. PARECER -->
            <div class="pdf-block">
                <div class="section-title">4. Parecer e Recomendações</div>
                <div class="box">
                    <div class="label">Descrição Técnica / Histórico</div>
                    <div style="font-size: 0.9rem; line-height: 1.6; color: #334155; text-align: justify; margin: 10px 0 20px 0; font-style: italic;">
                        "${data.descricao}"
                    </div>
                    <div class="label" style="color: #2a5299; font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 15px;">Medidas Recomendadas</div>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.85rem; color: #475569; line-height: 1.5;">
                        ${(data.medidas.length ? data.medidas : ['Nenhuma medida específica']).map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- 5. CONSTATAÇÕES -->
            ${Object.keys(data.checklist).some(k => data.checklist[k]) ? `
            <div class="pdf-block">
                <div class="section-title">5. Constatações Técnicas</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${Object.entries(data.checklist).filter(([_, v]) => v).map(([k, v]) => `
                        <div style="background: #f0f7ff; padding: 10px 15px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: #1e3a8a; border: 1px solid #dbeafe;">
                            ${k}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 6. FOTOS -->
            ${data.fotos.length > 0 ? `
            <div class="pdf-block">
                <div class="section-title">6. Anexo Fotográfico</div>
            </div>
            ${photoPairs.map((pair) => `
                <div class="pdf-block" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    ${pair.map(foto => `
                        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
                            <img src="${foto.data}" style="width: 100%; height: 220px; object-fit: cover; display: block;"/>
                            <div style="padding: 12px;">
                                <div style="font-size: 0.7rem; color: #2a5299; font-weight: 700; text-transform: uppercase;">${foto.legenda || 'Registro Fotográfico'}</div>
                                <div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">COORD: ${data.latitude}, ${data.longitude}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            ` : ''}

            <!-- ASSINATURAS -->
            <div class="pdf-block" style="margin-top: 50px; text-align: center; border-top: 2px solid #f1f5f9; padding-top: 30px;">
                <div style="display: inline-block; min-width: 250px;">
                    <div style="height: 90px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px;">
                        ${data.assinaturaAgente ? `<img src="${data.assinaturaAgente}" style="max-height: 90px; max-width: 220px;"/>` : '<div style="width: 100%; border-bottom: 1px solid #94a3b8;"></div>'}
                    </div>
                    <div style="font-size: 0.9rem; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">${data.agente}</div>
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Agente de Defesa Civil</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Matrícula: ${data.matricula}</div>
                </div>
                <div style="margin-top: 40px; font-size: 0.6rem; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">
                    Documento autenticado via SIGERD Mobile em ${data.emissao}
                </div>
            </div>

        </div>
    </body>
    </html>
    `;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 2000));

    try {
        const pdfContainer = container.querySelector('#pdf-container');

        // Use a higher scale for better splitting precision
        const canvas = await html2canvas(pdfContainer, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const printableHeightMm = pageHeight - 40; // Leave 4cm total margin

        const contentWidth = canvas.width;
        const scaleFactor = pageWidth / contentWidth;
        const scaledContentHeight = canvas.height * scaleFactor;

        // 2. Advanced Pagination: Find last fitting block for each page
        const blocks = pdfContainer.querySelectorAll('.pdf-block');
        const blockPositions = Array.from(blocks).map(block => ({
            top: block.offsetTop * scaleFactor,
            bottom: (block.offsetTop + block.offsetHeight) * scaleFactor
        }));

        let cursorMm = 0;
        let pageIdx = 0;

        while (cursorMm < scaledContentHeight - 1) {
            let limitMm = cursorMm + printableHeightMm;
            let splitPointMm = limitMm;

            // Find blocks that are entirely within [cursor, limit]
            const fittingBlocks = blockPositions.filter(b => b.bottom <= limitMm + 2 && b.top >= cursorMm - 2);

            if (fittingBlocks.length > 0) {
                // Split exactly after the last fitting block
                splitPointMm = fittingBlocks[fittingBlocks.length - 1].bottom + 3; // 3mm gap
            } else {
                // If NO block fits entirely, check if a block is currently being cut
                const cutBlock = blockPositions.find(b => b.top < limitMm && b.bottom > limitMm);
                if (cutBlock && cutBlock.top > cursorMm + 10) {
                    // If the cut block started well into the page, push it to next page
                    splitPointMm = cutBlock.top;
                } else {
                    // Block is too big or starts at top, must cut
                    splitPointMm = limitMm;
                }
            }

            // Safety check: ensure splitPoint is ahead of cursor
            if (splitPointMm <= cursorMm) splitPointMm = cursorMm + printableHeightMm;

            if (pageIdx > 0) pdf.addPage();

            const sourceY = cursorMm / scaleFactor;
            const sourceH = Math.min((splitPointMm - cursorMm) / scaleFactor, canvas.height - sourceY);

            if (sourceH > 0) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sourceH;
                const sliceCtx = sliceCanvas.getContext('2d');
                sliceCtx.fillStyle = '#ffffff';
                sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sliceCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);

                const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(sliceData, 'JPEG', 0, 0, pageWidth, sourceH * scaleFactor);
            }

            cursorMm = splitPointMm;
            pageIdx++;
        }

        const filename = `Laudo_Vistoria_${data.id.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Laudo de Vistoria', text: `Seguimento ${data.id}` });
            } else { pdf.save(filename); }
        } catch (e) { pdf.save(filename); }

    } catch (e) {
        console.error("PDF Generate Error:", e);
        alert(`Erro ao gerar PDF: ${e.message}`);
    } finally {
        if (document.body.contains(container)) document.body.removeChild(container);
    }
};

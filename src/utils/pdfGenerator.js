import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

export const generatePDF = async (rawData, type) => {
    // 1. Data Normalization with Snake Case Fallbacks
    const data = type === 'vistoria' ? {
        id: rawData.vistoriaId || rawData.vistoria_id || '---',
        protocolo: rawData.processo || rawData.vistoriaId || '---',
        dataRegistro: formatDate(rawData.dataHora || rawData.created_at || rawData.data_hora),
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
            const sub = rawData.subtiposRisco || rawData.subtipos_risco;
            return Array.isArray(sub) ? sub.join(', ') : (sub || '---');
        })(),
        situacao: rawData.situacaoObservada || rawData.situacao_observada || '---',
        populacao: rawData.populacaoEstimada || rawData.populacao_estimada || '---',
        descricao: rawData.observacoes || 'Não informado',
        medidas: rawData.medidasTomadas || rawData.medidas_tomadas || [],
        checklist: rawData.checklistRespostas || rawData.checklist_respostas || {},
        fotos: (rawData.fotos || []).map(f => typeof f === 'string' ? { data: f } : f),
        apoio: rawData.apoioTecnico || rawData.apoio_tecnico
    } : {
        id: rawData.interdicaoId || '---',
        protocolo: rawData.interdicaoId || '---',
        dataRegistro: formatDate(rawData.dataHora),
        emissao: new Date().toLocaleString('pt-BR'),
        agente: rawData.agente || 'Agente',
        descricao: rawData.relatorioTecnico || '---',
        medidas: [rawData.recomendacoes].filter(Boolean)
    };

    console.log("PDF Generation Data (Normalized):", data);

    function formatDate(dateStr) {
        if (!dateStr) return '---';
        try { return new Date(dateStr).toLocaleString('pt-BR'); } catch (e) { return dateStr; }
    }

    const urlToBase64 = (url) => new Promise((resolve) => {
        if (!url) return resolve(null);

        // Handle Data URLs instantly
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
        img.onerror = () => {
            console.warn("Failed to load image for PDF (CORS or 404):", url);
            // Return null to trigger fallback line, or return url to hope html2canvas handles it
            // If we return NULL, it shows the line.
            // If we return URL, html2canvas might show empty space if CORS fails.
            // Let's return URL as last resort
            resolve(url);
        };
        img.src = url;
    });

    const logoDC = await urlToBase64(LOGO_DEFESA_CIVIL);
    const logoSig = await urlToBase64(LOGO_SIGERD);

    // Group photos into pairs for side-by-side layout
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
        <style>
            body { background-color: white !important; font-family: 'Inter', sans-serif; color: #1e293b; }
            .section-title { color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; margin-bottom: 0.5rem; border-left: 4px solid #1e3a8a; padding-left: 0.75rem; }
            .label { font-size: 0.6rem; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 0.1rem; }
            .value { font-size: 0.85rem; font-weight: 500; color: #0f172a; margin-bottom: 0.75rem; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
            .risk-badge { padding: 0.25rem 0.75rem; border-radius: 999px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: white; display: inline-block; }
            .risk-alto { background-color: #f97316; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3); }
            .risk-medio { background-color: #eab308; box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.3); }
            .risk-baixo { background-color: #16a34a; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3); }
            /* Critical class for smart slicing */
            .pdf-block { break-inside: avoid; margin-bottom: 1.5rem; position: relative; }
        </style>
    </head>
    <body class="antialiased">
        <div id="pdf-container" style="width: 800px; padding: 40px; margin: 0 auto; background: white;">
            
            <!-- HEADER -->
            <div class="pdf-block" style="border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <img src="${logoDC}" style="height: 55px; width: auto; object-fit: contain;"/>
                    <div style="text-align: center; flex: 1; padding: 0 20px;">
                        <h1 style="color: #0f172a; font-weight: 800; font-size: 1.25rem; text-transform: uppercase; line-height: 1.2; letter-spacing: -0.02em;">Prefeitura Municipal de<br/>Santa Maria de Jetibá</h1>
                        <p style="color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; mt: 4px; letter-spacing: 0.05em;">Coordenadoria Municipal de Proteção e Defesa Civil</p>
                    </div>
                    <img src="${logoSig}" style="height: 55px; width: auto; object-fit: contain;"/>
                </div>
                 <div style="text-align: center; width: 100%;">
                    <h2 style="color: #1e3a8a; font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Relatório de Vistoria Técnica</h2>
                </div>
            </div>

            <!-- 1. IDENTIFICAÇÃO -->
            <div class="pdf-block">
                <div class="section-title">1. Identificação e Responsável</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div class="label">Data do Registro</div>
                        <div class="value">${data.dataRegistro}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Protocolo/Processo</div>
                        <div class="value" style="color: #1e3a8a; font-weight: 700;">${data.protocolo}</div>
                    </div>
                    <div>
                        <div class="label">Emissão do Laudo</div>
                        <div class="value">${data.emissao}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Agente Responsável</div>
                        <div class="value">${data.agente}</div>
                    </div>
                </div>
            </div>

            <!-- 2. LOCALIZAÇÃO -->
            <div class="pdf-block">
                <div class="section-title">2. Localização e Solicitante</div>
                <div class="box">
                    <div class="label">Solicitante</div>
                    <div class="value" style="font-size: 1rem; font-weight: 700;">${data.solicitante}</div>
                    
                    <div class="label" style="margin-top: 12px;">Endereço da Ocorrência</div>
                    <div class="value">${data.endereco}</div>
                    
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; color: #1e3a8a; font-weight: 600; font-size: 0.75rem;">
                        <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        ${data.latitude}, ${data.longitude}
                    </div>
                </div>
            </div>

            <!-- 3. DIAGNÓSTICO -->
            <div class="pdf-block">
                <div class="section-title">3. Diagnóstico de Risco</div>
                <div class="box">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div class="label">Categoria Principal</div>
                            <div class="value" style="margin-bottom: 0;">${data.categoria}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">Nível de Risco</div>
                            <div class="risk-badge risk-${String(data.nivel).toLowerCase().includes('alto') ? 'alto' : String(data.nivel).toLowerCase().includes('médio') ? 'medio' : 'baixo'}">
                                ${String(data.nivel).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #e2e8f0; margin: 12px 0;"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div class="label">Subtipo</div>
                            <div class="value">${data.subtipo}</div>
                        </div>
                        <div>
                            <div class="label">Situação</div>
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
                    <div class="label">Descrição Técnica</div>
                    <div style="font-family: serif; font-size: 0.9rem; line-height: 1.6; color: #334155; text-align: justify; margin: 8px 0 16px 0; font-style: italic;">
                        "${data.descricao}"
                    </div>
                    
                    <div class="label" style="color: #1e3a8a; font-weight: 700; margin-top: 16px;">Medidas Recomendadas</div>
                    <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 0.85rem; color: #475569;">
                        ${(data.medidas.length ? data.medidas : ['Nenhuma medida específica']).map(m => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- 5. CONSTATAÇÕES -->
            ${Object.keys(data.checklist).some(k => data.checklist[k]) ? `
            <div class="pdf-block">
                <div class="section-title">5. Constatações Técnicas</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${Object.entries(data.checklist).filter(([_, v]) => v).map(([k, v]) => `
                        <div style="background: #eff6ff; padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
                            <div style="background: #1e3a8a; width: 6px; height: 6px; border-radius: 50%;"></div>
                            <span style="font-size: 0.75rem; font-weight: 600; color: #1e3a8a;">${k}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- 6. FOTOS (Pairs) -->
            ${data.fotos.length > 0 ? `
            <div class="pdf-block">
                <div class="section-title">6. Anexo Fotográfico</div>
            </div>
            ${photoPairs.map((pair) => `
                <div class="pdf-block" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    ${pair.map(foto => `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <div style="height: 200px; width: 100%; overflow: hidden; background: #f1f5f9;">
                                <img src="${foto.data}" style="width: 100%; height: 100%; object-fit: cover; display: block;"/>
                            </div>
                            <div style="padding: 10px;">
                                ${foto.legenda ? `<div style="font-size: 0.65rem; color: #64748b; font-weight: 500; text-transform: uppercase;">${foto.legenda}</div>` : ''}
                                <div style="font-size: 0.6rem; color: #cbd5e1; margin-top: 4px; font-family: monospace;">LAT: ${data.latitude} | LNG: ${data.longitude}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            ` : ''}

            <!-- SIGNATURES -->
            <div class="pdf-block" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: center; gap: 40px;">
                    <div style="text-align: center;">
                        <div style="height: 80px; display: flex; align-items: end; justify-content: center; margin-bottom: 8px;">
                             ${data.assinaturaAgente ? `<img src="${data.assinaturaAgente}" style="max-height: 80px; max-width: 200px; object-fit: contain;"/>` : '<div style="width: 150px; border-bottom: 1px solid #cbd5e1;"></div>'}
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase;">${data.agente}</div>
                        <div style="font-size: 0.65rem; color: #64748b; text-transform: uppercase;">Agente de Defesa Civil</div>
                        <div style="font-size: 0.6rem; color: #94a3b8;">Matrícula: ${data.matricula}</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">
                        Documento oficial gerado via SIGERD Mobile em ${data.emissao}
                    </p>
                </div>
            </div>

        </div>
    </body>
    </html>
    `;

    // Mount Container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for fonts
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const pdfContainer = container.querySelector('#pdf-container');

        // Render Full Canvas
        const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            useCORS: true,
            logging: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Smart Slicing Logic - Refined v2 (Tolerance + Safety Margin)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const marginMm = 10;
        const printableHeightMm = pageHeight - 30; // 30mm safety buffer

        // Calculate dimensions
        const contentWidth = canvas.width;
        const contentHeight = canvas.height;
        const imgWidthMm = pageWidth;
        const scaleFactor = imgWidthMm / contentWidth;
        const scaledContentHeight = contentHeight * scaleFactor;

        // Map blocks to their scaled positions
        const blocks = pdfContainer.querySelectorAll('.pdf-block');
        const blockPositions = Array.from(blocks).map(block => {
            const top = block.offsetTop * scaleFactor;
            const height = block.offsetHeight * scaleFactor;
            return {
                top: top,
                height: height,
                bottom: top + height,
                dom: block
            };
        });

        console.log("PDF Blocks (mm):", blockPositions);

        let cursorMm = 0;
        let pageCursor = 0;

        while (cursorMm < scaledContentHeight) {
            // Default split point
            let splitPointMm = cursorMm + printableHeightMm;

            // Check if this split point cuts a block
            const BUFFER = 10; // 10mm tolerance
            let cutBlock = blockPositions.find(b =>
                b.top < (splitPointMm - BUFFER) &&
                b.bottom > (splitPointMm + BUFFER)
            );

            if (cutBlock) {
                console.warn("Detected cut block:", cutBlock);
                if (cutBlock.top > (cursorMm + BUFFER)) {
                    console.log("Pushing block to next page -> Split at", cutBlock.top);
                    splitPointMm = cutBlock.top;
                } else {
                    console.warn("Block is larger than page or straddles. Allowing cut.");
                }
            }

            // Loop Safety
            if (splitPointMm <= cursorMm) {
                splitPointMm = cursorMm + printableHeightMm;
            }

            if (pageCursor > 0) pdf.addPage();

            // Calculate pixel crop
            const sourceY = cursorMm / scaleFactor;
            const sourceH = Math.min((splitPointMm - cursorMm) / scaleFactor, canvas.height - sourceY);

            if (sourceH <= 0) break;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sourceH;
            const sliceCtx = sliceCanvas.getContext('2d');

            sliceCtx.fillStyle = '#ffffff';
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(
                canvas,
                0, sourceY, canvas.width, sourceH,
                0, 0, canvas.width, sourceH
            );

            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            const destHeightMm = sourceH * scaleFactor;

            pdf.addImage(sliceData, 'JPEG', 0, 0, pageWidth, destHeightMm);

            cursorMm = splitPointMm;
            pageCursor++;
        }

        const filename = `Relatorio_Vistoria_${data.id.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        const tryShare = async () => {
            // @ts-ignore
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Relatório de Vistoria',
                    text: `Segue laudo técnico ${data.id}`
                });
            } else { throw new Error("Share API not available"); }
        };

        try {
            await tryShare();
        } catch (shareError) {
            console.warn("Share API failed, falling back to download");
            pdf.save(filename);
        }

    } catch (error) {
        console.error("PDF Generation Critical Error:", error);
        alert(`Erro detalhado: ${error.message}`);
    } finally {
        if (document.body.contains(container)) document.body.removeChild(container);
    }
};

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

// PDF GENERATOR - DREAM MODEL V3.0 - STRICT PAGE BREAKING
// v1.46.21-GOLDEN

const normalizeData = (data, type) => {
    const isVistoria = type === 'vistoria';
    if (isVistoria) {
        return {
            vistoriaId: data.vistoriaId || data.vistoria_id || '---',
            processo: data.processo || data.processo_sei || '---',
            dataHora: data.dataHora || data.data_hora || data.created_at,
            solicitante: data.solicitante || '---',
            cpf: data.cpf || '---',
            telefone: data.telefone || '---',
            enderecoSolicitante: data.enderecoSolicitante || data.endereco_solicitante || '---',
            endereco: data.endereco || '---',
            bairro: data.bairro || '---',
            latitude: data.latitude || '---',
            longitude: data.longitude || '---',
            categoriaRisco: data.categoriaRisco || data.categoria_risco || '---',
            subtiposRisco: data.subtiposRisco || data.subtipos_risco || [],
            nivelRisco: data.nivelRisco || data.nivel_risco || 'Baixo',
            situacaoObservada: data.situacaoObservada || data.situacao_observada || 'Estabilizado',
            populacaoEstimada: data.populacaoEstimada || data.populacao_estimada || '---',
            gruposVulneraveis: data.gruposVulneraveis || data.grupos_vulneraveis || [],
            observacoes: data.observacoes || '---',
            medidasTomadas: data.medidasTomadas || data.medidas_tomadas || [],
            encaminhamentos: data.encaminhamentos || [],
            agente: data.agente || '---',
            matricula: data.matricula || '---',
            fotos: (() => {
                let photos = data.fotos || [];
                if (typeof photos === 'string') {
                    try { photos = JSON.parse(photos); } catch (e) { photos = []; }
                }
                return (Array.isArray(photos) ? photos : []).map(f => {
                    if (typeof f === 'string') return { data: f, legenda: '' };
                    return {
                        ...f,
                        data: f.data || f.url || f,
                        legenda: String(f.legenda || f.caption || f.titulo || f.title || f.name || '').trim()
                    };
                });
            })(),
            assinaturaAgente: data.assinaturaAgente || data.assinatura_agente || null,
            apoioTecnico: (() => {
                let apoio = data.apoioTecnico || data.apoio_tecnico || null;
                if (typeof apoio === 'string') {
                    try { apoio = JSON.parse(apoio); } catch (e) { console.warn('Apoio parsing failed:', e); }
                }
                return apoio;
            })(),
            checklistRespostas: data.checklistRespostas || data.checklist_respostas || {}
        };
    } else {
        return {
            interdicaoId: data.interdicaoId || data.interdicao_id || '---',
            dataHora: data.dataHora || data.data_hora || data.created_at,
            responsavelNome: data.responsavelNome || data.responsavel_nome || '---',
            responsavelCpf: data.responsavelCpf || data.responsavel_cpf || '---',
            endereco: data.endereco || '---',
            bairro: data.bairro || '---',
            municipio: data.municipio || '---',
            tipoAlvo: data.tipoAlvo || data.tipo_alvo || '---',
            medidaTipo: data.medidaTipo || data.medida_tipo || '---',
            riscoTipo: data.riscoTipo || data.risco_tipo || [],
            riscoGrau: data.riscoGrau || data.risco_grau || '---',
            medidaPrazo: data.medidaPrazo || data.medida_prazo || '---',
            situacaoObservada: data.situacaoObservada || data.situacao_observada || '---',
            relatorioTecnico: data.relatorioTecnico || data.relatorio_tecnico || '---',
            recomendacoes: data.recomendacoes || '---',
            latitude: data.latitude || '---',
            longitude: data.longitude || '---',
            agente: data.agente || '---',
            matricula: data.matricula || '---',
            fotos: (() => {
                let photos = data.fotos || [];
                if (typeof photos === 'string') {
                    try { photos = JSON.parse(photos); } catch (e) { photos = []; }
                }
                return (Array.isArray(photos) ? photos : []).map(f => {
                    if (typeof f === 'string') return { data: f, legenda: '' };
                    return {
                        ...f,
                        data: f.data || f.url || f,
                        legenda: String(f.legenda || f.caption || f.titulo || f.title || f.name || '').trim()
                    };
                });
            })(),
            assinaturaAgente: data.assinaturaAgente || data.assinatura_agente || null,
            apoioTecnico: (() => {
                let apoio = data.apoioTecnico || data.apoio_tecnico || null;
                if (typeof apoio === 'string') {
                    try { apoio = JSON.parse(apoio); } catch (e) { console.warn('Apoio parsing failed:', e); }
                }
                return apoio;
            })()
        };
    }
};

export const generatePDF = async (rawData, type) => {
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

    const data = normalizeData(rawData, type);
    const isVistoria = type === 'vistoria';
    const title = isVistoria ? 'RELATÓRIO DE VISTORIA TÉCNICA' : 'ORDEM DE INTERDIÇÃO';
    const filename = `${type}_${(data.vistoriaId || data.interdicaoId).replace(/[\/\\]/g, '_')}.pdf`;

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
            <div style="text-align: center;"><h1 style="margin: 0; color: #2a5299; font-weight: 900; font-size: 19px; text-transform: uppercase; letter-spacing: 1.5px;">${title}</h1></div>
        </div>
    `;

    const sectionTitle = (title) => `
        <div class="pdf-section-header" style="border-left: 5px solid #2a5299; padding: 10px 15px; margin: 35px 0 15px 0; font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
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

    const getNivelBadge = (nivel) => {
        const colors = { 'Baixo': '#22c55e', 'Médio': '#eab308', 'Alto': '#f97316', 'Iminente': '#ef4444' };
        return `<span style="color: ${colors[nivel] || '#64748b'}; font-size: 11px; font-weight: 900; border-bottom: 2px solid ${colors[nivel] || '#64748b'}; text-transform: uppercase;">${nivel}</span>`;
    };

    let contentHtml = `<div style="padding: 0 40px 40px 40px;">`;

    if (isVistoria) {
        contentHtml += `
            ${sectionTitle('1. Identificação e Responsável')}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                ${renderField('Data do Registro', new Date(data.dataHora).toLocaleString('pt-BR'))}
                ${renderField('Protocolo/Processo', data.processo)}
                ${renderField('Agente Responsável', data.agente)}
                ${renderField('Matrícula do Agente', data.matricula)}
            </div>

            ${sectionTitle('2. Localização e Solicitante')}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                <div style="grid-column: span 2;">${renderField('Nome do Solicitante', data.solicitante)}</div>
                ${renderField('CPF/CNPJ', data.cpf)}
                ${renderField('Telefone', data.telefone)}
                <div style="grid-column: span 2;">${renderField('Endereço da Ocorrência', data.endereco)}</div>
                ${renderField('Bairro / Localidade', data.bairro)}
                ${renderField('Coordenadas', `${data.latitude}, ${data.longitude}`)}
            </div>

            ${sectionTitle('3. Diagnóstico de Risco')}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                ${renderField('Categoria Principal', data.categoriaRisco)}
                <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 9px; color: #64748b; font-weight: 700; uppercase; margin-bottom: 3px;">Nível de Risco</div>
                    <div>${getNivelBadge(data.nivelRisco)}</div>
                </div>
            </div>

            <div style="page-break-before: always; height: 1px;"></div>
            
            ${sectionTitle('4. Parecer e Recomendações')}
            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin-bottom: 25px; page-break-inside: avoid;">
                <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">DESCRIÇÃO TÉCNICA / HISTÓRICO</div>
                <div style="font-style: italic; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
                    "${data.observacoes}"
                </div>
                
                <div style="padding-top: 25px; border-top: 1px dashed #cbd5e1; margin-top: 10px;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">MEDIDAS RECOMENDADAS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${(data.medidasTomadas.length > 0 ? data.medidasTomadas : ['Monitoramento e Orientação']).map(m => `
                            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #475569; font-weight: 600;">
                                <div style="color: #2a5299;">•</div>
                                <div>${m}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            ${Object.keys(data.checklistRespostas).some(k => data.checklistRespostas[k]) ? `
                ${sectionTitle('5. Constatações Técnicas')}
                <div style="background: #eff6ff; border-radius: 12px; padding: 12px 20px; border: 1px solid #dbeafe; margin-bottom: 25px; page-break-inside: avoid;">
                    ${Object.keys(data.checklistRespostas).filter(k => data.checklistRespostas[k]).map(item => `
                        <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                            <div style="color: #2563eb; font-weight: bold; font-size: 16px;">✓</div>
                            <div style="font-size: 11px; color: #1e3a8a; font-weight: 700; line-height: 1.3;">${item}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${data.fotos.length > 0 ? `
                ${sectionTitle('6. Anexo Fotográfico')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${data.fotos.map((f, idx) => `
                        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); page-break-inside: avoid;">
                            <img src="${f.data || f}" style="width: 100%; height: 220px; object-fit: contain; display: block; background: #f1f5f9;" crossorigin="anonymous" />
                            <div style="padding: 12px; background: white;">
                                <div style="font-size: 10px; color: #2a5299; font-weight: 800; text-transform: uppercase;">REGISTRO FOTOGRÁFICO</div>
                                <div style="font-size: 8px; color: #94a3b8; font-weight: 600; margin-top: 4px;">COORD: ${data.latitude}, ${data.longitude}</div>
                                ${f.legenda ? `<div style="margin-top: 8px; font-size: 11px; color: #334155; font-weight: 700; line-height: 1.4;">${f.legenda}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    const hasApoio = data.apoioTecnico && data.apoioTecnico.assinatura;

    const signatureHtml = `
        <div id="footer-signatures" style="margin-top: 50px; padding: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; page-break-inside: avoid; break-inside: avoid;">
            <div style="display: flex; justify-content: ${hasApoio ? 'space-between' : 'center'}; align-items: flex-end; gap: 40px;">
                <div style="text-align: center; width: 340px;">
                    <div style="height: 100px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #2a5299;">
                        ${data.assinaturaAgente ? `<img src="${data.assinaturaAgente}" style="max-height: 90px; width: auto; max-width: 300px;" />` : ''}
                    </div>
                    <p style="margin: 0; font-size: 14px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">${data.agente}</p>
                    <p style="margin: 4px 0; font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase;">Agente de Defesa Civil</p>
                    <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600;">Matrícula: ${data.matricula}</p>
                </div>
                ${hasApoio ? `
                <div style="text-align: center; width: 340px;">
                    <div style="height: 100px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px; border-bottom: 2px solid #2a5299;">
                        <img src="${data.apoioTecnico.assinatura}" style="max-height: 90px; width: auto; max-width: 300px;" />
                    </div>
                    <p style="margin: 0; font-size: 14px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">${data.apoioTecnico.nome}</p>
                    <p style="margin: 4px 0; font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase;">Apoio Técnico (Obras/Eng)</p>
                    <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 600;">CREA: ${data.apoioTecnico.crea} | Mat: ${data.apoioTecnico.matricula}</p>
                </div>` : ''}
            </div>
            <p style="margin-top: 40px; font-size: 9px; color: #94a3b8; text-align: center; font-weight: 500; opacity: 0.8;">
                Documento oficial gerado em ${new Date().toLocaleString('pt-BR')} pelo SIGERD Mobile - Defesa Civil SMJ.
            </p>
        </div>
    `;

    contentHtml += signatureHtml + `</div>`;
    container.innerHTML = `<div id="pdf-content">${headerHtml}${contentHtml}</div>`;
    document.body.appendChild(container);

    const applySmartBreaks = () => {
        const PAGE_PX = 1180; // Adjusted for 840px width A4
        const blocks = container.querySelectorAll('.pdf-section-header, #footer-signatures, [style*="page-break-inside: avoid"]');

        container.querySelectorAll('.pdf-spacer').forEach(s => s.remove());

        blocks.forEach(block => {
            const rect = block.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const top = rect.top - containerRect.top;
            const bottom = rect.bottom - containerRect.top;

            const pageIdx = Math.floor(top / PAGE_PX);
            const pageBottomIdx = Math.floor((bottom - 5) / PAGE_PX);

            // If block crosses boundary OR it's a critical element near bottom
            const isCritical = block.id === 'footer-signatures' || block.classList.contains('pdf-section-header');
            const nearPageEnd = (top % PAGE_PX) > (PAGE_PX - 200);

            if (pageIdx !== pageBottomIdx || (isCritical && nearPageEnd)) {
                const spacer = document.createElement('div');
                spacer.className = 'pdf-spacer';
                spacer.style.height = (PAGE_PX - (top % PAGE_PX)) + 'px';
                block.parentNode.insertBefore(spacer, block);
            }
        });
    };

    try {
        await new Promise(r => setTimeout(r, 1500)); // Render wait
        applySmartBreaks();
        await new Promise(r => setTimeout(r, 800));

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

        let shared = false;
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: title });
                shared = true;
            } catch (shareErr) {
                console.warn('Native share failed or cancelled:', shareErr);
            }
        }

        if (!shared) {
            const url = URL.createObjectURL(blob);
            window.open(url) || (location.href = url);
        }

        return { success: true, file, blob, filename };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
    finally { document.body.removeChild(container); }
};

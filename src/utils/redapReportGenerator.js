import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

/**
 * REDAP REPORT GENERATOR - HIGH FIDELITY MULTI-SECRETARIAL MODEL
 * Generates the official REDAP-001/2026 PDF report.
 */

export const generateRedapReport = async (options) => {
    let event, secoes, fluxo, historico, assinaturas, totalPrejuizo;

    if (options && options.event) {
        event = options.event;
        secoes = options.secoes || [];
        fluxo = options.fluxo || [];
        historico = options.historico || [];
        assinaturas = options.assinaturas || [];
        totalPrejuizo = options.totalPrejuizo || 0;
    } else {
        // Fallback para suporte ao legado caso venha o objeto plano antigo
        event = options || {};
        secoes = [];
        fluxo = [];
        historico = [];
        assinaturas = [];
        totalPrejuizo = 0;
    }

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

    const filename = `REDAP_OFICIAL_${event.id_sigerd || 'PENDENTE'}_${new Date().getTime()}.pdf`;

    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 800px; background: white; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; padding: 0;`;

    // Global Styles for PDF
    const styleHtml = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            .pdf-page-container { width: 800px; background: white; padding: 40px; }
            .report-section { margin-bottom: 25px; clear: both; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; border: 1px solid #cbd5e1; table-layout: fixed; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; overflow-wrap: break-word; font-size: 9px; }
            th { background: #f8fafc; color: #1e3a8a; font-weight: 800; text-transform: uppercase; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            .signature-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
        </style>
    `;

    // Header institucional oficial
    const headerHtml = `
        <div style="border-bottom: 4px solid #f97316; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="width: 100px;"><img src="${logoDefesaCivilStr}" style="height: 75px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                    <h1 style="margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900; color: #1e3a8a; tracking-tight: -0.5px;">ESTADO DO ESPÍRITO SANTO</h1>
                    <h2 style="margin: 2px 0 0 0; font-size: 14px; color: #334155; font-weight: 800; text-transform: uppercase;">MUNICÍPIO DE SANTA MARIA DE JETIBÁ</h2>
                    <h3 style="margin: 5px 0 0 0; font-size: 11px; color: #f97316; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        REDAP - Relatório de Danos e Prejuízos (Multi-Secretarial)
                    </h3>
                </div>
                <div style="width: 100px; text-align: right;"><img src="${logoSigerdStr}" style="height: 75px; object-fit: contain;" /></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #475569; background: #f1f5f9; padding: 6px 12px; border-radius: 6px;">
                <div>CÓDIGO SIGERD: ${event.id_sigerd || 'REDAP-PENDENTE'}</div>
                <div>STATUS: ${event.status_evento || 'EM PROCESSAMENTO'}</div>
                <div>EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
        </div>
    `;

    const sectionTitle = (num, title) => `
        <div style="background-color: #f1f5f9; padding: 6px 10px; margin: 20px 0 10px 0; border-radius: 6px; display: flex; align-items: center; gap: 8px; border-left: 4px solid #1e3a8a;">
            <div style="font-weight: 950; color: #1e3a8a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Seção ${num}: ${title}</div>
        </div>
    `;

    let contentHtml = `<div class="pdf-page-container">`;
    contentHtml += headerHtml;

    // Processamento das coordenadas geográficas / áreas delimitadas
    let areasMapeadasStr = 'Nenhuma área poligonal delimitada';
    if (event.polygon_coords) {
        try {
            const parsed = typeof event.polygon_coords === 'string'
                ? JSON.parse(event.polygon_coords)
                : event.polygon_coords;
            
            let numPolygons = 0;
            let temOrthofoto = false;
            
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                if (Array.isArray(parsed.polygons)) {
                    numPolygons = parsed.polygons.length;
                }
                if (parsed.orthofoto) {
                    temOrthofoto = true;
                }
            } else if (Array.isArray(parsed) && parsed.length > 0) {
                if (Array.isArray(parsed[0][0])) {
                    numPolygons = parsed.length;
                } else {
                    numPolygons = 1;
                }
            }
            
            if (numPolygons > 0) {
                areasMapeadasStr = `${numPolygons} área(s) delimitada(s) no mapa`;
                if (temOrthofoto) {
                    areasMapeadasStr += ' + Orthofoto integrada';
                }
            }
        } catch (e) {
            console.error('Error parsing polygon_coords in report:', e);
        }
    }

    // --- SEÇÃO 1: Identificação Institucional ---
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('1', 'Identificação Institucional e do Evento');
    contentHtml += `
        <table>
            <tbody>
                <tr>
                    <td style="width: 30%; font-weight: 850; background: #f8fafc; color: #1e3a8a;">Município / UF</td>
                    <td style="width: 70%;">${event.municipio_uf || 'Santa Maria de Jetibá / ES'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 850; background: #f8fafc; color: #1e3a8a;">Classificação COBRADE</td>
                    <td>${event.cobrade || 'Não Informado'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 850; background: #f8fafc; color: #1e3a8a;">Data e Hora do Evento</td>
                    <td>${event.data_inicio ? new Date(event.data_inicio).toLocaleString('pt-BR') : 'Não Informada'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 850; background: #f8fafc; color: #1e3a8a;">Área Afetada</td>
                    <td>${event.area_afetada_localidade || 'Área Urbana e Rural'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 850; background: #f8fafc; color: #1e3a8a;">Limites Geográficos</td>
                    <td style="font-weight: 600; color: #1e3a8a;">${areasMapeadasStr}</td>
                </tr>
                <tr>
                    <td style="font-weight: 850; background: #f8fafc; color: #1e3a8a;">Decreto de Emergência</td>
                    <td>${event.decreto_municipal_emergencia || 'Não decretado'}</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    // --- SEÇÃO 2: Danos Humanos ---
    const secHumana = secoes.find(s => s.secao === 'DANOS_HUMANOS');
    const dHum = secHumana?.dados_json || { mortos: 0, feridos: 0, enfermos: 0, desalojados: 0, desabrigados: 0, desaparecidos: 0, familias_afetadas: 0 };
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('2', 'Danos Humanos (Afetados e Vítimas)');
    contentHtml += `
        <table>
            <thead>
                <tr>
                    <th>Classificação do Impacto</th>
                    <th style="text-align: center;">Quantidade</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Mortos Confirmados</td><td style="text-align: center; font-weight: bold;">${dHum.mortos || 0}</td></tr>
                <tr style="background: #f8fafc;"><td>Feridos</td><td style="text-align: center; font-weight: bold;">${dHum.feridos || 0}</td></tr>
                <tr><td>Enfermos</td><td style="text-align: center; font-weight: bold;">${dHum.enfermos || 0}</td></tr>
                <tr style="background: #f8fafc;"><td>Desalojados</td><td style="text-align: center; font-weight: bold;">${dHum.desalojados || 0}</td></tr>
                <tr><td>Desabrigados</td><td style="text-align: center; font-weight: bold;">${dHum.desabrigados || 0}</td></tr>
                <tr style="background: #f8fafc;"><td>Desaparecidos</td><td style="text-align: center; font-weight: bold;">${dHum.desaparecidos || 0}</td></tr>
                <tr><td>Famílias Afetadas</td><td style="text-align: center; font-weight: bold;">${dHum.familias_afetadas || 0}</td></tr>
            </tbody>
        </table>
    </div>`;

    // --- SEÇÃO 3: Danos a Edificações Públicas / Sociais ---
    const secoesEdif = secoes.filter(s => s.secao === 'DANOS_EDIFICACOES');
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('3', 'Danos a Edificações Públicas / Sociais');
    contentHtml += `
        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Instalação / Equipamento Público</th>
                    <th style="width: 20%; text-align: center;">Secretaria</th>
                    <th style="width: 15%; text-align: center;">Danificado</th>
                    <th style="width: 15%; text-align: center;">Destruído</th>
                    <th style="width: 20%; text-align: center;">Prejuízo Estimado</th>
                </tr>
            </thead>
            <tbody>
    `;
    let temEdif = false;
    secoesEdif.forEach(sec => {
        if (sec.dados_json?.items) {
            Object.keys(sec.dados_json.items).forEach(itName => {
                const item = sec.dados_json.items[itName];
                if (item.danificado > 0 || item.destruido > 0 || item.valor_estimado > 0) {
                    temEdif = true;
                    contentHtml += `
                        <tr>
                            <td>${itName}</td>
                            <td style="text-align: center;">${sec.secretaria_id}</td>
                            <td style="text-align: center;">${item.danificado || 0}</td>
                            <td style="text-align: center;">${item.destruido || 0}</td>
                            <td style="text-align: center; font-weight: bold;">R$ ${(item.valor_estimado || 0).toLocaleString('pt-BR')}</td>
                        </tr>
                    `;
                }
            });
        }
    });
    if (!temEdif) {
        contentHtml += `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Nenhum dano registrado nesta seção.</td></tr>`;
    }
    contentHtml += `</tbody></table></div>`;

    // --- SEÇÃO 4: Danos de Infraestrutura ---
    const secoesInfra = secoes.filter(s => s.secao === 'DANOS_INFRAESTRUTURA');
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('4', 'Danos de Infraestrutura (Vias / Pontes)');
    contentHtml += `
        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Tipo de Infraestrutura</th>
                    <th style="width: 15%; text-align: center;">Danificado</th>
                    <th style="width: 15%; text-align: center;">Destruído</th>
                    <th style="width: 15%; text-align: center;">Extensão</th>
                    <th style="width: 20%; text-align: center;">Prejuízo Estimado</th>
                </tr>
            </thead>
            <tbody>
    `;
    let temInfra = false;
    secoesInfra.forEach(sec => {
        if (sec.dados_json?.items) {
            Object.keys(sec.dados_json.items).forEach(itName => {
                const item = sec.dados_json.items[itName];
                if (item.danificado > 0 || item.destruido > 0 || item.valor_estimado > 0) {
                    temInfra = true;
                    contentHtml += `
                        <tr>
                            <td>${itName}</td>
                            <td style="text-align: center;">${item.danificado || 0}</td>
                            <td style="text-align: center;">${item.destruido || 0}</td>
                            <td style="text-align: center;">${item.extensao || '-'}</td>
                            <td style="text-align: center; font-weight: bold;">R$ ${(item.valor_estimado || 0).toLocaleString('pt-BR')}</td>
                        </tr>
                    `;
                }
            });
        }
    });
    if (!temInfra) {
        contentHtml += `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Nenhum dano registrado nesta seção.</td></tr>`;
    }
    contentHtml += `</tbody></table></div>`;

    // --- SEÇÃO 5: Danos Agrícolas ---
    const secoesAgro = secoes.filter(s => s.secao === 'DANOS_AGRICOLAS');
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('5', 'Danos a Atividades Agrícolas / Privadas');
    contentHtml += `
        <table>
            <thead>
                <tr>
                    <th style="width: 35%;">Cultura / Atividade</th>
                    <th style="width: 15%; text-align: center;">Área (HA)</th>
                    <th style="width: 15%; text-align: center;">Produtores</th>
                    <th style="width: 15%; text-align: center;">Perda (T)</th>
                    <th style="width: 20%; text-align: center;">Prejuízo Estimado</th>
                </tr>
            </thead>
            <tbody>
    `;
    let temAgro = false;
    secoesAgro.forEach(sec => {
        if (sec.dados_json?.items) {
            Object.keys(sec.dados_json.items).forEach(itName => {
                const item = sec.dados_json.items[itName];
                if (item.area_afetada_ha > 0 || item.produtores_atingidos > 0 || item.valor_estimado > 0) {
                    temAgro = true;
                    contentHtml += `
                        <tr>
                            <td>${itName}</td>
                            <td style="text-align: center;">${item.area_afetada_ha || 0}</td>
                            <td style="text-align: center;">${item.produtores_atingidos || 0}</td>
                            <td style="text-align: center;">${item.perda_estimada_ton || 0}</td>
                            <td style="text-align: center; font-weight: bold;">R$ ${(item.valor_estimado || 0).toLocaleString('pt-BR')}</td>
                        </tr>
                    `;
                }
            });
        }
    });
    if (!temAgro) {
        contentHtml += `<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic;">Nenhum dano registrado nesta seção.</td></tr>`;
    }
    contentHtml += `</tbody></table></div>`;

    // --- SEÇÃO 6: Danos Ambientais ---
    const secAmbiental = secoes.find(s => s.secao === 'DANOS_AMBIENTAIS');
    const dAmb = secAmbiental?.dados_json || { area_atingida_ha: 0, recursos_hidricos_comprometidos: 'Não', incendios_florestais: 'Não', custo_recuperacao: 0 };
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('6', 'Danos Ambientais');
    contentHtml += `
        <table>
            <tbody>
                <tr>
                    <td style="width: 40%; font-weight: bold; background: #f8fafc; color: #1e3a8a;">Área Degradada (HA)</td>
                    <td style="width: 60%;">${dAmb.area_atingida_ha || 0} HA</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; background: #f8fafc; color: #1e3a8a;">Recursos Hídricos Comprometidos?</td>
                    <td>${dAmb.recursos_hidricos_comprometidos || 'Não'}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; background: #f8fafc; color: #1e3a8a;">Ocorrência de Incêndios Florestais?</td>
                    <td>${dAmb.incendios_florestais || 'Não'}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; background: #f8fafc; color: #1e3a8a;">Prejuízo Estimado (Recuperação)</td>
                    <td style="font-weight: bold; color: #b91c1c;">R$ ${(dAmb.custo_recuperacao || 0).toLocaleString('pt-BR')}</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    // --- SEÇÃO 7: Quadro Resumo (Consolidação Econômica) ---
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('7', 'Quadro Resumo (Consolidação Econômica)');
    contentHtml += `
        <table>
            <thead>
                <tr>
                    <th style="width: 60%;">Descrição da Categoria de Dano</th>
                    <th style="width: 40%; text-align: center;">Total Estimado (R$)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Prejuízos com Edificações Públicas (Seção 3)</td>
                    <td style="text-align: center; font-weight: bold;">R$ ${secoesEdif.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0).toLocaleString('pt-BR')}</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td>Prejuízos com Infraestrutura Pública (Seção 4)</td>
                    <td style="text-align: center; font-weight: bold;">R$ ${secoesInfra.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0).toLocaleString('pt-BR')}</td>
                </tr>
                <tr>
                    <td>Prejuízos com Atividades Agrícolas / Privadas (Seção 5)</td>
                    <td style="text-align: center; font-weight: bold;">R$ ${secoesAgro.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0).toLocaleString('pt-BR')}</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td>Custo de Recuperação e Danos Ambientais (Seção 6)</td>
                    <td style="text-align: center; font-weight: bold;">R$ ${(Number(dAmb.custo_recuperacao) || 0).toLocaleString('pt-BR')}</td>
                </tr>
                <tr style="background: #f1f5f9; font-size: 11px;">
                    <td style="font-weight: bold; color: #1e3a8a;">VALOR TOTAL CONSOLIDADO DO EVENTO</td>
                    <td style="text-align: center; font-weight: 900; color: #1e3a8a;">R$ ${totalPrejuizo.toLocaleString('pt-BR')}</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    // --- SEÇÃO 8: Parecer Técnico ---
    const secObs = secoes.find(s => s.secao === 'OBSERVACOES');
    const dObs = secObs?.dados_json || { parecer_tecnico: '', observacoes_complementares: '' };
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('8', 'Parecer Técnico e Observações');
    contentHtml += `
        <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-size: 9px; line-height: 1.4; color: #334155; margin-bottom: 10px;">
            <p style="margin: 0; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">Parecer Técnico Discursivo</p>
            <p style="margin: 0; white-space: pre-wrap;">${dObs.parecer_tecnico || 'Nenhum parecer técnico inserido.'}</p>
        </div>
        <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-size: 9px; line-height: 1.4; color: #334155;">
            <p style="margin: 0; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">Observações Complementares</p>
            <p style="margin: 0; white-space: pre-wrap;">${dObs.observacoes_complementares || 'Sem observações complementares.'}</p>
        </div>
    </div>`;

    // --- SEÇÃO 9: Assinaturas Eletrônicas ---
    contentHtml += `<div class="report-section">`;
    contentHtml += sectionTitle('9', 'Assinaturas e Homologação Final');
    contentHtml += `<div class="signature-grid">`;
    assinaturas.forEach(ass => {
        contentHtml += `
            <div class="signature-card">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #1e3a8a;">${ass.nome}</p>
                <p style="margin: 2px 0; font-size: 8px; color: #475569; font-weight: 700; text-transform: uppercase;">${ass.cargo_secretaria}</p>
                <div style="margin-top: 8px; pt-2; border-t: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 7px; color: #94a3b8; font-family: monospace;">
                    <span>${new Date(ass.data_hora_assinatura).toLocaleString('pt-BR')}</span>
                    <span>HASH: ${ass.hash_assinatura}</span>
                </div>
            </div>
        `;
    });
    if (assinaturas.length === 0) {
        contentHtml += `<div style="grid-column: span 2; text-align: center; color: #94a3b8; font-style: italic; font-size: 9px; py-6;">Documento aguardando assinaturas eletrônicas.</div>`;
    }
    contentHtml += `</div></div>`;

    // Rodapé simplificado conforme solicitado: "SIGERD"
    contentHtml += `
        <div style="text-align: center; font-size: 7px; color: #94a3b8; font-weight: bold; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            SIGERD • SISTEMA INTEGRADO DE GESTÃO E RELATÓRIOS DE DESASTRES
        </div>
    `;

    contentHtml += `</div>`; // Close page container

    container.innerHTML = styleHtml + contentHtml;
    document.body.appendChild(container);

    try {
        await new Promise(r => setTimeout(r, 2000));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 800,
            logging: false
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const pxToMm = pdfWidth / 800;
        const pageHeightPx = pdfHeight / pxToMm;

        const sections = container.querySelectorAll('.report-section');
        const sectionTops = Array.from(sections).map(s => s.offsetTop);

        let currentTopPx = 0;
        const totalHeightPx = container.offsetHeight;
        let pageNum = 1;

        while (currentTopPx < totalHeightPx) {
            let cutPointPx = currentTopPx + pageHeightPx;

            if (cutPointPx < totalHeightPx) {
                const minPageFill = pageHeightPx * 0.6;
                const safeBoundary = sectionTops.filter(top =>
                    top > (currentTopPx + minPageFill) &&
                    top < cutPointPx
                ).pop();

                if (safeBoundary) {
                    cutPointPx = safeBoundary;
                }
            } else {
                cutPointPx = totalHeightPx;
            }

            const sliceHeightPx = cutPointPx - currentTopPx;
            const sliceHeightMm = sliceHeightPx * pxToMm;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = (sliceHeightPx / totalHeightPx) * canvas.height;
            const ctx = sliceCanvas.getContext('2d');

            ctx.drawImage(
                canvas,
                0, (currentTopPx / totalHeightPx) * canvas.height, canvas.width, (sliceHeightPx / totalHeightPx) * canvas.height,
                0, 0, sliceCanvas.width, sliceCanvas.height
            );

            if (pageNum > 1) pdf.addPage();
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfWidth, sliceHeightMm);

            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(`Página ${pageNum}`, pdfWidth - 25, pdfHeight - 10);

            currentTopPx = cutPointPx;
            pageNum++;
        }

        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Relatório Oficial REDAP-001/2026' }).catch(() => {
                const url = URL.createObjectURL(blob);
                window.open(url) || (location.href = url);
            });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url) || (location.href = url);
        }
    } catch (e) {
        console.error('Erro na geração do PDF:', e);
        alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

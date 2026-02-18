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
    const sectorDisplay = {
        'obras': 'SECURB',
        'interior': 'INTERIOR (ÁREA RURAL)',
        'servicos_urbanos': 'SECURB (ÁREA URBANA)'
    };
    const sectorName = activeSector ? (sectorDisplay[activeSector] || activeSector.toUpperCase().replace(/_/g, ' ')) : '';
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
                    <h1 style="margin: 0; font-size: 20px; color: #000000; text-transform: uppercase; font-weight: 800; line-height: 1.2;">SISTEMA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h1>
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
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; border: 1px solid #e2e8f0;">
            <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    ${headers.map((h, i) => `<th style="padding: 10px; text-align: ${i === 0 ? 'left' : 'center'}; color: #1e3a8a; font-weight: 800; text-transform: uppercase; font-size: 9px; width: ${widths[i]}; border: 1px solid #e2e8f0;">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map((row, idx) => `
                    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                        ${row.map((cell, i) => `<td style="padding: 10px; text-align: ${i === 0 ? 'left' : 'center'}; font-weight: ${i === 0 ? '700' : '600'}; color: #334155; border: 1px solid #e2e8f0;">${cell}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    let contentHtml = `<div style="padding: 0 40px 40px 40px;">`;

    // 2. INTRODUÇÃO (AI OU MANUAL)
    contentHtml += sectionTitle('2', 'Introdução');
    const introText = isSectoral ? (data.setorial[activeSector].introducao || '') : '';
    contentHtml += `
        <div style="background: #ffffff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 11px; line-height: 1.6; color: #334155;">
            ${introText || 'O presente relatório detalha os danos e prejuízos identificados em decorrência do evento adverso registrado.'}
        </div>
    `;

    // 3. DANOS (ESTIMATIVAS)
    const danoPrefix = isSectoral ? '3' : '6';
    contentHtml += sectionTitle(danoPrefix, `Danos no Setor: ${isSectoral ? sectorName : 'Geral'}`);

    // 3.1 Danos Humanos
    const humanoData = isSectoral ? data.setorial[activeSector] : data.danos_humanos;

    // Se for consolidado, tentar enriquecer com dados da saúde/social se disponível
    if (!isSectoral && data.setorial) {
        // Exemplo simples: Se saúde reportou mais feridos que o global, usar saúde (ou somar, dependendo da regra de negócio. Aqui vamos priorizar o maior valor para segurança)
        if (data.setorial.saude) {
            humanoData.mortos = Math.max(humanoData.mortos || 0, data.setorial.saude.mortos || 0);
            humanoData.feridos = Math.max(humanoData.feridos || 0, data.setorial.saude.feridos || 0);
            humanoData.enfermos = Math.max(humanoData.enfermos || 0, data.setorial.saude.enfermos || 0);
        }
        if (data.setorial.social) {
            // Social pode ter desabrigados/desalojados, que não estão no array padrão de exibição simplificada, mas poderiam ser adicionados
        }
    }

    const humanoRows = [
        ['Mortos', humanoData.mortos || 0],
        ['Feridos', humanoData.feridos || 0],
        ['Enfermos', humanoData.enfermos || 0]
    ];

    if (!isSectoral) {
        if (data.danos_humanos.desabrigados > 0) humanoRows.push(['Desabrigados', data.danos_humanos.desabrigados]);
        if (data.danos_humanos.desalojados > 0) humanoRows.push(['Desalojados', data.danos_humanos.desalojados]);
    }

    // Mostrar Danos Humanos apenas se houver dados ou se for consolidado
    if (!isSectoral || humanoRows.some(r => r[1] > 0)) {
        contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 20px 0 10px 0;">${danoPrefix}.1 Danos Humanos</div>`;
        contentHtml += renderTable(['Discriminação', 'Quantidade'], humanoRows, ['70%', '30%']);
    }

    // 3.2 Danos à Infraestrutura / Materiais / Levantamento Detalhado
    contentHtml += `<div style="font-size: 10px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 30px 0 10px 0;">${danoPrefix}.2 Levantamento de Danos e Necessidades</div>`;

    if (isSectoral) {
        const sData = data.setorial[activeSector];
        let specificRows = [];

        // 1. Campos Padrão de Infraestrutura do Setor
        if (sData.inst_danificadas !== undefined || sData.inst_destruidas !== undefined) {
            specificRows.push([
                'Instalações do Setor',
                sData.inst_danificadas || 0,
                sData.inst_destruidas || 0,
                `R$ ${(sData.inst_valor || 0).toLocaleString('pt-BR')}`
            ]);
        }

        // 2. Outros campos numéricos (Pontes, Bueiros, Cestas, etc)
        const skipFields = ['mortos', 'feridos', 'enfermos', 'inst_danificadas', 'inst_destruidas', 'inst_valor', 'introducao', 'consideracoes', 'observacoes'];

        // Mapeamento de pares Item -> Valor
        const ITEM_VALUE_MAP = {
            'pontes_danificadas': 'valor_pontes',
            'bueiros_obstruidos': 'valor_bueiros',
            'pavimentacao_m2': 'valor_pavimentacao',
            'ponte_madeira': 'valor_ponte_madeira',
            'ponte_concreto': 'valor_ponte_concreto',
            'bueiros': 'valor_bueiros',
            'galerias': 'valor_galerias',
            'estradas_vicinais': 'valor_estradas',
            'cestas_basicas': 'custo_cestas',
            'kits_higiene': 'custo_kits',
            'colchoes_entregues': 'custo_colchoes',
            'inst_prestadoras': 'valor_inst_prestadoras',
            'inst_comunitarias': 'valor_inst_comunitarias',
            'infra_urbana': 'valor_infra_urbana'
        };

        const valueFields = Object.values(ITEM_VALUE_MAP);

        Object.entries(sData).forEach(([key, value]) => {
            // Se for um item numérico, não estiver na lista de ignore, E NÃO FOR um campo de valor isolado
            if (!skipFields.includes(key) && !key.startsWith('prejuizo_') && typeof value === 'number' && value > 0 && !valueFields.includes(key) && !key.startsWith('valor_') && !key.startsWith('custo_')) {

                let label = key.replace(/_/g, ' ').toUpperCase();

                // Distinção de Pontes Rural vs Urbana
                if (key.includes('ponte')) {
                    if (activeSector === 'interior') label += ' (ÁREA RURAL)';
                    if (activeSector === 'obras' || activeSector === 'servicos_urbanos') label += ' (ÁREA URBANA)';
                }

                // Buscar valor correspondente no mapa ou por convenção
                let valorEstimado = '-';
                const valueKey = ITEM_VALUE_MAP[key];

                if (valueKey && sData[valueKey] > 0) {
                    valorEstimado = `R$ ${sData[valueKey].toLocaleString('pt-BR')}`;
                }

                specificRows.push([label, value, '-', valorEstimado]);
            }
        });

        // Adicionar Total de Prejuízos do Setor no final
        if (sData.prejuizo_total > 0) {
            specificRows.push(['<span style="color: #1e3a8a; font-weight: 900;">TOTAL DE PREJUÍZOS DO SETOR</span>', '-', '-', `<span style="color: #1e3a8a; font-weight: 900;">R$ ${sData.prejuizo_total.toLocaleString('pt-BR')}</span>`]);
        }

        if (specificRows.length > 0) {
            contentHtml += renderTable(['Discriminação / Item', 'Qtd. Danificada / Valor', 'Qtd. Destruída', 'Estimativa (R$)'], specificRows, ['40%', '20%', '20%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 10px; color: #94a3b8; font-style: italic;">Não há registros de danos específicos para este setor.</p>`;
        }
    } else {
        // Consolidado
        let infraRows = [];

        // 1. Danos Materiais Globais (FIDE Padrão)
        Object.keys(data.danos_materiais).forEach(key => {
            if (data.danos_materiais[key].danificadas > 0 || data.danos_materiais[key].destruidas > 0 || data.danos_materiais[key].valor > 0) {
                infraRows.push([
                    key.replace(/_/g, ' ').toUpperCase(),
                    data.danos_materiais[key].danificadas,
                    data.danos_materiais[key].destruidas,
                    `R$ ${data.danos_materiais[key].valor.toLocaleString('pt-BR')}`
                ]);
            }
        });

        // 2. Agregação de Danos Setoriais
        if (data.setorial) {
            const skipFieldsGlobal = ['mortos', 'feridos', 'enfermos', 'inst_danificadas', 'inst_destruidas', 'inst_valor', 'introducao', 'consideracoes', 'observacoes'];

            Object.entries(data.setorial).forEach(([sectorName, sData]) => {
                // Adicionar Instalações do Setor se houver
                if (sData.inst_danificadas > 0 || sData.inst_destruidas > 0 || sData.inst_valor > 0) {
                    infraRows.push([
                        `INSTALAÇÕES - ${sectorName.toUpperCase()}`,
                        sData.inst_danificadas || 0,
                        sData.inst_destruidas || 0,
                        `R$ ${(sData.inst_valor || 0).toLocaleString('pt-BR')}`
                    ]);
                }

                // Mapeamento de pares Item -> Valor (Reutilizado)
                const ITEM_VALUE_MAP = {
                    'pontes_danificadas': 'valor_pontes',
                    'bueiros_obstruidos': 'valor_bueiros',
                    'pavimentacao_m2': 'valor_pavimentacao',
                    'ponte_madeira': 'valor_ponte_madeira',
                    'ponte_concreto': 'valor_ponte_concreto',
                    'bueiros': 'valor_bueiros',
                    'galerias': 'valor_galerias',
                    'estradas_vicinais': 'valor_estradas',
                    'cestas_basicas': 'custo_cestas',
                    'kits_higiene': 'custo_kits',
                    'colchoes_entregues': 'custo_colchoes',
                    'inst_prestadoras': 'valor_inst_prestadoras',
                    'inst_comunitarias': 'valor_inst_comunitarias',
                    'infra_urbana': 'valor_infra_urbana'
                };
                const valueFields = Object.values(ITEM_VALUE_MAP);

                // Adicionar Itens Específicos do Setor
                Object.entries(sData).forEach(([key, value]) => {
                    if (!skipFieldsGlobal.includes(key) && !key.startsWith('prejuizo_') && typeof value === 'number' && value > 0 && !valueFields.includes(key) && !key.startsWith('valor_') && !key.startsWith('custo_')) {

                        let label = key.replace(/_/g, ' ').toUpperCase();

                        // Distinção de Pontes Rural vs Urbana no Consolidado
                        if (key.includes('ponte')) {
                            if (sectorKey === 'interior') label += ' (ÁREA RURAL)';
                            if (sectorKey === 'obras' || sectorKey === 'servicos_urbanos') label += ' (ÁREA URBANA)';
                        }

                        const displaySectorName = sectorKey === 'obras' ? 'SECURB' : sectorKey.toUpperCase();
                        label = `${label} (${displaySectorName})`;

                        // Buscar valor correspondente
                        let valorEstimado = '-';
                        const valueKey = ITEM_VALUE_MAP[key];

                        if (valueKey && sData[valueKey] > 0) {
                            valorEstimado = `R$ ${sData[valueKey].toLocaleString('pt-BR')}`;
                        }

                        infraRows.push([label, value, '-', valorEstimado]);
                    }
                });
            });

        }

        if (infraRows.length > 0) {
            contentHtml += renderTable(['Discriminação / Item Setorial', 'Qtd. Danificada', 'Qtd. Destruída', 'Valor Estimado (R$)'], infraRows, ['40%', '20%', '20%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 10px; color: #94a3b8; font-style: italic;">Não há registros de danos à infraestrutura consolidados.</p>`;
        }
    }

    // 4. PREJUÍZOS ECONÔMICOS
    const prejuPrefix = isSectoral ? '4' : '7';
    contentHtml += sectionTitle(prejuPrefix, `Prejuízos Econômicos`);

    let prejuRows = [];
    if (isSectoral) {
        const sData = data.setorial[activeSector];
        Object.entries(sData).forEach(([k, v]) => {
            if (k.startsWith('prejuizo_') && v > 0) {
                prejuRows.push([k.replace('prejuizo_', '').replace(/_/g, ' ').toUpperCase(), `R$ ${v.toLocaleString('pt-BR')}`]);
            }
        });
    } else {
        // Consolidado
        // 1. Prejuízos Globais
        Object.keys(data.prejuizos_publicos).forEach(key => {
            if (data.prejuizos_publicos[key] > 0) {
                prejuRows.push([key.replace(/_/g, ' ').toUpperCase(), `R$ ${data.prejuizos_publicos[key].toLocaleString('pt-BR')}`]);
            }
        });
        Object.keys(data.prejuizos_privados).forEach(key => {
            if (data.prejuizos_privados[key] > 0) {
                prejuRows.push([`PRIVADO: ${key.replace(/_/g, ' ').toUpperCase()}`, `R$ ${data.prejuizos_privados[key].toLocaleString('pt-BR')}`]);
            }
        });

        // 2. Agregação de Prejuízos Setoriais
        if (data.setorial) {
            Object.entries(data.setorial).forEach(([sectorName, sData]) => {
                Object.entries(sData).forEach(([k, v]) => {
                    if (k.startsWith('prejuizo_') && v > 0) {
                        const label = `${k.replace('prejuizo_', '').replace(/_/g, ' ').toUpperCase()} (${sectorName.toUpperCase()})`;
                        prejuRows.push([label, `R$ ${v.toLocaleString('pt-BR')}`]);
                    }
                });
            });
        }
    }

    if (prejuRows.length > 0) {
        contentHtml += renderTable(['Serviço Essencial / Atividade', 'Valor do Prejuízo (R$)'], prejuRows, ['70%', '30%']);
    } else {
        contentHtml += `<p style="font-size: 10px; color: #94a3b8; font-style: italic;">Nenhum prejuízo econômico quantificado.</p>`;
    }

    // 5. CONSIDERAÇÕES FINAIS (AI OU MANUAL)
    contentHtml += sectionTitle('5', 'Considerações Finais');
    const considerText = isSectoral ? (data.setorial[activeSector].consideracoes || '') : '';
    contentHtml += `
        <div style="background: #ffffff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 11px; line-height: 1.6; color: #334155; font-style: italic;">
            ${considerText || 'Com base no exposto, conclui-se que os danos observados impactam a normalidade local, sendo necessária a mobilização de esforços para recuperação e assistência.'}
        </div>
    `;

    // 6. RELATÓRIO FOTOGRÁFICO (Apenas para Relatórios Setoriais)
    if (isSectoral) {
        contentHtml += sectionTitle('6', 'Relatório Fotográfico');
        const photosToRender = data.evidencias.filter(p => p.sector === activeSector);

        if (photosToRender.length > 0) {
            contentHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">`;
            for (const photo of photosToRender) {
                contentHtml += `
                    <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff; page-break-inside: avoid;">
                        <img src="${photo.url}" style="width: 100%; height: 200px; object-fit: cover;" />
                        <div style="padding: 10px; background: #f8fafc;">
                            <div style="font-size: 8px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">Coordenadas Geográficas</div>
                            <div style="font-size: 9px; font-weight: 700; color: #334155;">LAT: ${photo.lat.toFixed(6)} | LNG: ${photo.lng.toFixed(6)}</div>
                            <div style="font-size: 8px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 5px;">Data/Hora</div>
                            <div style="font-size: 9px; font-weight: 700; color: #334155;">${new Date(photo.timestamp).toLocaleString()}</div>
                            ${photo.sector ? `<div style="font-size: 7px; color: #1e3a8a; font-weight: 900; margin-top: 5px;">SETOR: ${photo.sector.toUpperCase()}</div>` : ''}
                        </div>
                    </div>
                `;
            }
            contentHtml += `</div>`;
        } else {
            contentHtml += `<p style="text-align: center; color: #94a3b8; font-style: italic; font-size: 11px;">Nenhuma evidência fotográfica anexada neste setor.</p>`;
        }
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

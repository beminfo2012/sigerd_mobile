import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from './reportLogos';

/**
 * REDAP REPORT GENERATOR - HIGH FIDELITY FIDE MODEL
 * Generates a professional PDF report from REDAP record data.
 */

export const generateRedapReport = async (record, userProfile, activeSector = null) => {
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
        ? `REDAP_SETORIAL_${activeSector.toUpperCase()}_${record.data.tipificacao.cobrade.replace(/\./g, '_')}.pdf`
        : `REDAP_FIDE_${record.data.tipificacao.cobrade.replace(/\./g, '_')}_${new Date().getTime()}.pdf`;
    const data = record.data;

    const container = document.createElement('div');
    container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 800px; background: white; font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; padding: 0;`;

    // Global Styles for PDF
    const styleHtml = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            .pdf-page-container { width: 800px; background: white; padding: 40px; }
            .report-section { margin-bottom: 25px; clear: both; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; border: 1px solid #e2e8f0; table-layout: fixed; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; overflow-wrap: break-word; }
            thead { background: #f1f5f9; }
            .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            .photo-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white; }
            .signature-block { margin-top: 40px; }
            img { max-width: 100%; height: auto; display: block; }
        </style>
    `;

    // Header remains the same...
    const headerHtml = `
        <div style="border-bottom: 4px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="width: 100px;"><img src="${logoDefesaCivilStr}" style="height: 70px; object-fit: contain;" /></div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                    <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 800;">SISTEMA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h1>
                    <h2 style="margin: 5px 0 0 0; font-size: 12px; color: #1e3a8a; font-weight: 700; text-transform: uppercase;">
                        ${isSectoral ? `LEVANTAMENTO SETORIAL: ${sectorName}` : 'FORMULÁRIO DE INFORMAÇÕES DO DESASTRE (FIDE)'}
                    </h2>
                </div>
                <div style="width: 100px; text-align: right;"><img src="${logoSigerdStr}" style="height: 70px; object-fit: contain;" /></div>
            </div>
            <div style="display: flex; justify-content: center; gap: 30px; font-size: 10px; font-weight: 700;">
                <div>Estado: ESPIRITO SANTO</div>
                <div>Município: SANTA MARIA DE JETIBÁ</div>
            </div>
        </div>
    `;

    const sectionTitle = (num, title) => `
        <div style="background-color: #f1f5f9; padding: 8px 12px; margin: 20px 0 10px 0; border-radius: 6px; display: flex; align-items: center; justify-content: flex-start; gap: 8px;">
            <div style="background: #1e3a8a; color: white; width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px;">${num}</div>
            <div style="font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">${title}</div>
        </div>
    `;

    const renderTable = (headers, rows, widths) => `
        <table>
            <thead>
                <tr>
                    ${headers.map((h, i) => `<th style="width: ${widths[i]}; text-align: ${i === 0 ? 'left' : 'center'}; color: #1e3a8a; font-weight: 800; text-transform: uppercase; font-size: 8px;">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map((row, idx) => `
                    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                        ${row.map((cell, i) => `<td style="text-align: ${i === 0 ? 'left' : 'center'}; font-weight: ${i === 0 ? '700' : '600'}; color: #334155;">${cell}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Reconstruct content with section markers
    let contentHtml = `<div class="pdf-page-container">`;
    contentHtml += headerHtml;

    // Danos
    const danoPrefix = isSectoral ? '3' : '6';
    contentHtml += `<div class="report-section">${sectionTitle(danoPrefix, `Danos no Setor: ${isSectoral ? sectorName : 'Geral (FIDE)'}`)}`;

    if (isSectoral) {
        // Sectoral flow (remains identical to ensure backward compatibility for specific department submissions)
        const sData = (data.setorial && data.setorial[activeSector]) || {};
        const humanoRows = [
            ['Mortos', sData.mortos || 0],
            ['Feridos', sData.feridos || 0],
            ['Enfermos', sData.enfermos || 0]
        ];
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 15px 0 8px 0;">3.1 Danos Humanos</div>`;
        contentHtml += renderTable(['Discriminação', 'Quantidade'], humanoRows, ['70%', '30%']);

        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 25px 0 8px 0;">3.2 Levantamento de Danos e Necessidades</div>`;
        let infraRows = [];
        
        if (sData.inst_danificadas !== undefined || sData.inst_destruidas !== undefined) {
            infraRows.push([
                'Instalações do Setor',
                sData.inst_danificadas || 0,
                sData.inst_destruidas || 0,
                `R$ ${(sData.inst_valor || 0).toLocaleString('pt-BR')}`
            ]);
        }

        const skipFields = ['mortos', 'feridos', 'enfermos', 'inst_danificadas', 'inst_destruidas', 'inst_valor', 'consideracoes', 'observacoes'];
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
            if (!skipFields.includes(key) && !key.startsWith('prejuizo_') && typeof value === 'number' && value > 0 && !valueFields.includes(key) && !key.startsWith('valor_') && !key.startsWith('custo_')) {
                let label = key.replace(/_/g, ' ').toUpperCase();
                if (key.includes('ponte')) {
                    if (activeSector === 'interior') label += ' (ÁREA RURAL)';
                    if (activeSector === 'obras' || activeSector === 'servicos_urbanos') label += ' (ÁREA URBANA)';
                }
                let valorEstimado = '-';
                const valueKey = ITEM_VALUE_MAP[key];
                if (valueKey && sData[valueKey] > 0) {
                    valorEstimado = `R$ ${sData[valueKey].toLocaleString('pt-BR')}`;
                }
                infraRows.push([label, value, '-', valorEstimado]);
            }
        });

        if (sData.prejuizo_total > 0) {
            infraRows.push(['<span style="color: #1e3a8a; font-weight: 900;">TOTAL DE PREJUÍZOS DO SETOR</span>', '-', '-', `<span style="color: #1e3a8a; font-weight: 900;">R$ ${sData.prejuizo_total.toLocaleString('pt-BR')}</span>`]);
        }

        if (infraRows.length > 0) {
            contentHtml += renderTable(['Discriminação / Item Setorial', 'Qtd. Danificada', 'Qtd. Destruída', 'Valor Estimado (R$)'], infraRows, ['40%', '20%', '20%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic;">Não há registros de danos específicos.</p>`;
        }
    } else {
        // Consolidated report FIDE flow
        // 6.1 Danos Humanos
        const MAP_HUMANO = {
            mortos_confirmados: 'Mortos confirmados',
            desaparecidos: 'Desaparecidos',
            feridos_graves: 'Feridos graves',
            feridos_leves: 'Feridos leves',
            enfermos: 'Enfermos',
            desabrigados: 'Desabrigados',
            desalojados: 'Desalojados',
            deslocados_temporariamente: 'Deslocados temporariamente',
            diretamente_afetados: 'Diretamente afetados'
        };
        const humanoRows = Object.entries(MAP_HUMANO).map(([key, label]) => {
            const val = data.danos_humanos?.[key] || { total: 0, homens: 0, mulheres: 0, criancas: 0 };
            return [label, val.homens || 0, val.mulheres || 0, val.criancas || 0, val.total || 0];
        });
        
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 15px 0 8px 0;">6.1 Danos Humanos</div>`;
        contentHtml += renderTable(['Classificação dos Danos', 'Homens', 'Mulheres', 'Crianças', 'Total'], humanoRows, ['40%', '15%', '15%', '15%', '15%']);
        if (data.danos_humanos?.descricao) {
            contentHtml += `<div style="font-size: 8px; color: #475569; margin-bottom: 15px; padding: 8px; background: #f8fafc; border-left: 2px solid #cbd5e1; font-style: italic;"><strong>Descrição complementar / Memória de cálculo:</strong> ${data.danos_humanos.descricao}</div>`;
        }

        // 6.2 Danos em Edificações
        const MAP_MATERIAL_LABELS = {
            residencias_urbanas: 'Residências urbanas',
            residencias_rurais: 'Residências rurais',
            escolas_creches: 'Escolas / creches',
            unidades_saude: 'Unidades de saúde',
            edificacoes_publicas: 'Edificações administrativas públicas',
            templos_culto: 'Templos / igrejas / locais de culto',
            comercio: 'Estabelecimentos comerciais',
            industria: 'Estabelecimentos industriais'
        };
        const materialRows = [];
        Object.entries(MAP_MATERIAL_LABELS).forEach(([key, label]) => {
            const val = data.danos_materiais?.[key] || { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 };
            if (val.destruidas > 0 || val.danificadas > 0 || (val.prejuizo || val.valor || 0) > 0) {
                materialRows.push([
                    label,
                    val.destruidas || 0,
                    val.danificadas || 0,
                    val.total || 0,
                    `R$ ${(val.prejuizo || val.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ]);
            }
        });
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 25px 0 8px 0;">6.2 Danos em Edificações</div>`;
        if (materialRows.length > 0) {
            contentHtml += renderTable(['Discriminação das Edificações', 'Destruídas', 'Danificadas', 'Total Unid.', 'Prejuízo (R$)'], materialRows, ['40%', '15%', '15%', '15%', '15%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 15px;">Nenhuma edificação destruída ou danificada reportada.</p>`;
        }

        // 6.3 Danos em Infraestrutura Pública
        const MAP_INFRA_LABELS = {
            estradas_rodovias: { label: 'Estradas / rodovias danificadas', unit: 'km' },
            pontes_viadutos: { label: 'Pontes / viadutos danificados', unit: 'unidade(s)' },
            bueiros_galerias: { label: 'Bueiros / galerias comprometidos', unit: 'unidade(s)' },
            abastecimento_agua: { label: 'Rede de abastecimento de água', unit: 'km' },
            rede_esgoto: { label: 'Rede de esgoto', unit: 'km' },
            drenagem_urbana: { label: 'Drenagem urbana', unit: 'km' },
            rede_eletrica: { label: 'Rede elétrica', unit: 'km / postes' },
            comunicacoes_telefonia: { label: 'Rede de comunicações / telefonia', unit: 'km' },
            muros_arrimo: { label: 'Muros de arrimo / contenção', unit: 'm' },
            drenagem_canais: { label: 'Obras de drenagem / canais', unit: 'm' }
        };
        const infraRows = [];
        Object.entries(MAP_INFRA_LABELS).forEach(([key, info]) => {
            const val = data.danos_infraestrutura?.[key] || { qtd: 0, extensao_area: 0, prejuizo: 0 };
            if (val.qtd > 0 || val.extensao_area > 0 || val.prejuizo > 0) {
                infraRows.push([
                    info.label,
                    info.unit,
                    val.qtd || 0,
                    val.extensao_area || 0,
                    `R$ ${(val.prejuizo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ]);
            }
        });
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 25px 0 8px 0;">6.3 Danos em Infraestrutura Pública</div>`;
        if (infraRows.length > 0) {
            contentHtml += renderTable(['Descrição da Infraestrutura', 'Unidade', 'Qtd. Afetada', 'Extensão / Área', 'Prejuízo (R$)'], infraRows, ['35%', '15%', '15%', '15%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 15px;">Nenhum dano em infraestrutura pública reportado.</p>`;
        }

        // 6.4 Danos Agrícolas e de Produção
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 25px 0 8px 0;">6.4 Danos Agrícolas e de Produção</div>`;
        if (data.danos_agricolas && !data.danos_agricolas.nao_se_aplica && data.danos_agricolas.itens && data.danos_agricolas.itens.length > 0) {
            const agricolaRows = data.danos_agricolas.itens.map(item => [
                item.cultura_produto,
                item.area || 0,
                item.produtores || 0,
                item.animais || 0,
                `${item.perda || 0}%`,
                `R$ ${(item.prejuizo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ]);
            contentHtml += renderTable(['Cultura / Produto', 'Área (ha)', 'Produtores', 'Animais', 'Perda (%)', 'Prejuízo (R$)'], agricolaRows, ['30%', '12%', '13%', '13%', '12%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 15px;">Sem danos agrícolas reportados ou não se aplica.</p>`;
        }

        // 6.5 Danos Ambientais
        const MAP_AMBIENTAL_LABELS = {
            vegetacao_nativa: { label: 'Área de vegetação nativa destruída', unit: 'hectares (ha)' },
            contaminacao_agua: { label: 'Contaminação de corpos d\'água', unit: 'km de curso d\'água' },
            erosao_app: { label: 'Erosão / assoreamento de APP', unit: 'm²' },
            animais_silvestres: { label: 'Animais silvestres afetados', unit: 'indivíduos' }
        };
        const ambientalRows = [];
        Object.entries(MAP_AMBIENTAL_LABELS).forEach(([key, info]) => {
            const val = data.danos_ambientais?.[key] || { quantidade: 0, prejuizo: 0 };
            if (val.quantidade > 0 || val.prejuizo > 0) {
                ambientalRows.push([
                    info.label,
                    info.unit,
                    val.quantidade || 0,
                    `R$ ${(val.prejuizo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ]);
            }
        });
        contentHtml += `<div style="font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 25px 0 8px 0;">6.5 Danos Ambientais</div>`;
        if (ambientalRows.length > 0) {
            contentHtml += renderTable(['Tipo de Dano Ambiental', 'Unidade', 'Qtd / Extensão', 'Prejuízo (R$)'], ambientalRows, ['40%', '20%', '20%', '20%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 15px;">Nenhum dano ambiental significativo reportado.</p>`;
        }
        if (data.danos_ambientais?.descricao) {
            contentHtml += `<div style="font-size: 8px; color: #475569; margin-bottom: 15px; padding: 8px; background: #f8fafc; border-left: 2px solid #cbd5e1; font-style: italic;"><strong>Descrição complementar dos impactos ambientais:</strong> ${data.danos_ambientais.descricao}</div>`;
        }
    }
    contentHtml += `</div>`; // Close Section 3/6

    // 7. PREJUÍZOS ECONÔMICOS CONSOLIDADOS (FIDE Padrão)
    if (!isSectoral) {
        contentHtml += `<div class="report-section">${sectionTitle('7', 'Prejuízos Econômicos Consolidados')}`;
        const MAP_CONSOLIDADO_LABELS = {
            edificacoes: 'Edificações (públicas + privadas)',
            infraestrutura: 'Infraestrutura pública',
            agricola: 'Setor agrícola / produção rural',
            comercial_industrial: 'Setor comercial / industrial',
            meio_ambiente: 'Meio ambiente'
        };
        let totalDanos = 0;
        let totalPrejuizos = 0;
        const consolidadoRows = Object.entries(MAP_CONSOLIDADO_LABELS).map(([key, label]) => {
            const val = data.prejuizos_economicos_consolidados?.[key] || { danos: 0, prejuizos: 0 };
            totalDanos += (val.danos || 0);
            totalPrejuizos += (val.prejuizos || 0);
            return [
                label,
                `R$ ${(val.danos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                `R$ ${(val.prejuizos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ];
        });
        consolidadoRows.push([
            '<strong style="color: #1e3a8a;">TOTAL GERAL</strong>',
            `<strong style="color: #1e3a8a;">R$ ${totalDanos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`,
            `<strong style="color: #1e3a8a;">R$ ${totalPrejuizos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`
        ]);
        contentHtml += renderTable(['Setor Afetado', 'Danos Materiais (R$)', 'Prejuízos (R$)'], consolidadoRows, ['50%', '25%', '25%']);
        contentHtml += `</div>`;
    } else {
        // Sectoral Prejuízos (Section 4)
        const prejuPrefix = '4';
        contentHtml += `<div class="report-section">${sectionTitle(prejuPrefix, `Prejuízos Econômicos (Setorial)`)}`;
        let prejuRows = [];
        const sData = (data.setorial && data.setorial[activeSector]) || {};
        Object.entries(sData).forEach(([k, v]) => {
            if (k.startsWith('prejuizo_') && k !== 'prejuizo_total' && v > 0) {
                prejuRows.push([k.replace('prejuizo_', '').replace(/_/g, ' ').toUpperCase(), `R$ ${v.toLocaleString('pt-BR')}`]);
            }
        });
        if (prejuRows.length > 0) {
            contentHtml += renderTable(['Serviço Essencial / Atividade', 'Valor do Prejuízo (R$)'], prejuRows, ['70%', '30%']);
        } else {
            contentHtml += `<p style="font-size: 9px; color: #94a3b8; font-style: italic;">Nenhum prejuízo quantificado.</p>`;
        }
        contentHtml += `</div>`;
    }

    // 5. CONSIDERAÇÕES FINAIS
    contentHtml += `<div class="report-section">${sectionTitle('5', 'Considerações Finais')}`;
    const considerText = isSectoral ? ((data.setorial && data.setorial[activeSector]?.consideracoes) || '') : (data.observacoes_complementares || '');
    contentHtml += `
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 10px; line-height: 1.6; color: #334155; font-style: italic;">
                ${considerText || 'Com base no exposto, conclui-se que os danos observados impactam a normalidade local.'}
            </div>
        </div>
    `;

    // 6. RELATÓRIO FOTOGRÁFICO (Apenas para Relatórios Setoriais)
    if (isSectoral) {
        const photosToRender = data.evidencias.filter(p => p.sector === activeSector);

        if (photosToRender.length > 0) {
            contentHtml += `<div class="report-section">${sectionTitle('6', 'Relatório Fotográfico')}`;
            contentHtml += `<div class="photo-grid">`;
            for (const photo of photosToRender) {
                contentHtml += `
                    <div class="photo-card">
                        <img src="${photo.url}" style="width: 100%; height: 180px; object-fit: cover;" />
                        <div style="padding: 8px; background: #f8fafc;">
                            <div style="font-size: 7px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">
                                Coordenadas: ${photo.lat != null && photo.lng != null ? `<span class="pdf-coord-link" data-lat="${photo.lat}" data-lng="${photo.lng}" style="color: #1e3a8a; text-decoration: underline; cursor: pointer;">${Number(photo.lat).toFixed(6)}, ${Number(photo.lng).toFixed(6)}</span>` : 'Sem GPS'}
                            </div>
                            <div style="font-size: 8px; font-weight: 700; color: #334155;">${photo.timestamp ? new Date(photo.timestamp).toLocaleString() : 'Sem data'}</div>
                        </div>
                    </div>
                `;
            }
            contentHtml += `</div></div>`;
        }
    }

    // Footer / Signature (Sectoral vs Global)
    const sectorSub = isSectoral ? data.submissoes_setoriais[activeSector] : null;
    const finalSignature = isSectoral ? sectorSub?.assinatura_url : data.assinatura.data_url;
    const finalName = isSectoral ? sectorSub?.responsavel : data.assinatura.responsavel;
    const finalRole = isSectoral ? sectorSub?.cargo : (userProfile?.cargo || 'Agente de Defesa Civil');

    contentHtml += `
        <div class="report-section signature-block">
            <div style="text-align: center; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="width: 250px; margin: 0 auto; border-bottom: 2px solid #1e3a8a; height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 15px;">
                    ${finalSignature ? `<img src="${finalSignature}" style="max-height: 55px; width: auto;" />` : ''}
                </div>
                <p style="margin: 0; font-size: 13px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">${finalName || 'Responsável'}</p>
                <p style="margin: 4px 0; font-size: 9px; color: #475569; font-weight: 700; text-transform: uppercase;">${finalRole}</p>
                <p style="margin: 0; font-size: 8px; color: #94a3b8; font-weight: 600;">Defesa Civil Municipal de Santa Maria de Jetibá/ES</p>
                <p style="margin-top: 25px; font-size: 8px; color: #94a3b8; font-weight: 500;">Gerado em ${new Date().toLocaleString('pt-BR')} via SIGERD MOBILE REDAP.</p>
            </div>
        </div>
    `;

    contentHtml += `</div>`; // Close page container

    container.innerHTML = styleHtml + contentHtml;
    document.body.appendChild(container);

    try {
        // Wait for all images/fonts to settle
        await new Promise(r => setTimeout(r, 2000));

        const canvas = await html2canvas(container, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 800,
            logging: false
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Convert to mm for PDF positioning
        const pxToMm = pdfWidth / 800;
        const pageHeightPx = pdfHeight / pxToMm;

        // Find safe cut points (tops of sections)
        const sections = container.querySelectorAll('.report-section');
        const sectionTops = Array.from(sections).map(s => s.offsetTop);

        let currentTopPx = 0;
        const totalHeightPx = container.offsetHeight;
        let pageNum = 1;

        while (currentTopPx < totalHeightPx) {
            let cutPointPx = currentTopPx + pageHeightPx;

            // If not the last page, look for a safe boundary
            if (cutPointPx < totalHeightPx) {
                // Find the latest section start that fits in this page
                // We want a boundary that is at least 60% down the page to avoid tiny pages
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

            // Extract slice from master canvas
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

            // --- ADD LINKS FOR THIS PAGE ---
            try {
                const coordElements = container.querySelectorAll('.pdf-coord-link');
                coordElements.forEach(el => {
                    const lat = el.getAttribute('data-lat');
                    const lng = el.getAttribute('data-lng');
                    const rect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    const elTopPx = rect.top - containerRect.top;
                    const elLeftPx = rect.left - containerRect.left;
                    
                    // Check if this element belongs to the current page slice
                    if (elTopPx >= currentTopPx && elTopPx < cutPointPx) {
                        const x_mm = elLeftPx * pxToMm;
                        const y_mm = (elTopPx - currentTopPx) * pxToMm;
                        const w_mm = rect.width * pxToMm;
                        const h_mm = rect.height * pxToMm;
                        
                        pdf.link(x_mm, y_mm, w_mm, h_mm, {
                            url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        });
                    }
                });
            } catch (err) {
                console.warn('Erro ao processar links no REDAP:', err);
            }

            // Add page numbering
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(`Página ${pageNum}`, pdfWidth - 25, pdfHeight - 10);

            currentTopPx = cutPointPx;
            pageNum++;
        }

        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Relatório REDAP FIDE' }).catch(() => {
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

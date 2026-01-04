import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
            fotos: data.fotos || [],
            assinaturaAgente: data.assinaturaAgente || data.assinatura_agente || null,
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
            fotos: data.fotos || [],
            assinaturaAgente: data.assinaturaAgente || data.assinatura_agente || null
        };
    }
};

export const generatePDF = async (rawData, type) => {
    const data = normalizeData(rawData, type);
    const isVistoria = type === 'vistoria';
    const title = isVistoria ? 'RELATÓRIO DE VISTORIA TÉCNICA' : 'ORDEM DE INTERDIÇÃO';
    const cleanId = (data.vistoriaId || data.interdicaoId || 'doc').replace(/[\/\\]/g, '_');
    const cleanName = (isVistoria ? data.solicitante : data.responsavelNome) || '';
    const nameSuffix = cleanName !== '---' ? `_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}` : '';
    const filename = `${type}_${cleanId}${nameSuffix}.pdf`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '100vh';
    container.style.width = '840px';
    container.style.padding = '0';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = "'Inter', Arial, sans-serif";
    container.style.color = '#1a1a1a';
    container.style.zIndex = '-9999';

    const headerHtml = `
        <div style="background-color: #f8fafc; border-bottom: 4px solid #2a5299; padding: 40px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <img src="/logo_nova.png" style="height: 120px; width: auto; display: block; margin: 0 auto;" />
            </div>
            <h1 style="margin: 0; font-size: 26px; color: #1e3a8a; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; line-height: 1.2;">
                Prefeitura Municipal de Santa Maria de Jetibá
            </h1>
            <h2 style="margin: 5px 0 20px 0; font-size: 18px; color: #2a5299; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL
            </h2>
            <div style="display: inline-block; background: #2a5299; color: white; padding: 8px 30px; border-radius: 4px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                ${title}
            </div>
        </div>
    `;

    const sectionTitle = (title) => `
        <div style="background: #f8fafc; border-left: 5px solid #2a5299; padding: 10px 15px; margin: 20px 0 10px 0; font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; border-radius: 0 6px 6px 0; page-break-inside: avoid; page-break-after: avoid;">
            ${title}
        </div>
    `;

    const renderField = (label, value) => `
        <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
            <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">${label}</div>
            <div style="font-size: 12px; color: #1e293b; font-weight: 500; line-height: 1.3;">${value || 'Não informado'}</div>
        </div>
    `;

    const getNivelBadge = (nivel) => {
        const colors = {
            'Baixo': '#22c55e',
            'Médio': '#eab308',
            'Alto': '#f97316',
            'Iminente': '#ef4444'
        };
        return `<span style="background: ${colors[nivel] || '#64748b'}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; display: inline-block; line-height: 1.3; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">${nivel.toUpperCase()}</span>`;
    };

    let contentHtml = '';
    if (isVistoria) {
        contentHtml = `
            <div style="padding: 0 35px 35px 35px;">
                ${sectionTitle('1. Identificação e Responsável')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                    ${renderField('Data do Registro', data.dataHora ? new Date(data.dataHora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '---')}
                    ${renderField('Protocolo/Processo', data.processo)}
                    ${renderField('Emissão do Laudo', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}
                    ${renderField('Agente Responsável', data.agente)}
                    ${renderField('Matrícula do Agente', data.matricula)}
                </div>

                ${sectionTitle('2. Localização e Solicitante')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                    <div style="grid-column: span 2;">${renderField('Nome do Solicitante', data.solicitante)}</div>
                    ${renderField('CPF', data.cpf)}
                    ${renderField('Telefone', data.telefone)}
                    <div style="grid-column: span 2;">${renderField('Endereço do Solicitante', data.enderecoSolicitante)}</div>
                    <div style="grid-column: span 2;">${renderField('Endereço da Ocorrência', data.endereco)}</div>
                    ${renderField('Bairro / Localidade', data.bairro)}
                    ${renderField('Coordenadas (Lat, Long)', `${data.latitude}, ${data.longitude}`)}
                </div>

                ${sectionTitle('3. Diagnóstico de Risco')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                    ${renderField('Categoria Principal', data.categoriaRisco)}
                    <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
                        <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">NÍVEL DE RISCO</div>
                        <div>${getNivelBadge(data.nivelRisco)}</div>
                    </div>
                    <div style="grid-column: span 2;">${renderField('Subtipos Identificados', data.subtiposRisco.join(', ') || 'Nenhum específico')}</div>
                    <div style="grid-column: span 2;">${renderField('Situação Observada', data.situacaoObservada)}</div>
                    <div style="grid-column: span 2;">${renderField('População Exposta', `${data.populacaoEstimada} pessoas (${data.gruposVulneraveis.join(', ') || 'Nenhum grupo sensível'})`)}</div>
                </div>

                ${sectionTitle('4. Parecer e Recomendações')}
                <div style="display: grid; grid-template-columns: 1fr; gap: 0 30px;">
                    ${renderField('Descrição Técnica', data.observacoes)}
                    ${renderField('Medidas Recomendadas', data.medidasTomadas.join('; ') || 'Orientação padrão')}
                    ${renderField('Encaminhamentos Efetuados', data.encaminhamentos.join(', ') || 'Nenhum')}
                </div>

                ${Object.keys(data.checklistRespostas).some(k => data.checklistRespostas[k]) ? `
                    ${sectionTitle('5. Constatações Técnicas (Checklist)')}
                    <div style="background: #fafafa; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
                        ${Object.keys(data.checklistRespostas)
                    .filter(k => data.checklistRespostas[k])
                    .map(item => `
                                <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 11px; color: #334155; line-height: 1.3;">
                                    <div style="color: #2a5299; font-weight: bold; font-size: 14px;">✓</div>
                                    <div style="font-weight: 600;">${item}</div>
                                </div>
                            `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        // Interdição layout (compacted)
        contentHtml = `
            <div style="padding: 0 35px 35px 35px;">
                ${sectionTitle('1. Identificação da Ordem')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                    ${renderField('Número de Controle', data.interdicaoId)}
                    ${renderField('Data e Hora da Ação', new Date(data.dataHora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}
                    <div style="grid-column: span 2;">${renderField('Responsável pelo Imóvel', data.responsavelNome)}</div>
                </div>

                ${sectionTitle('2. Local e Fundamentação')}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px;">
                    <div style="grid-column: span 2;">${renderField('Endereço', data.endereco)}</div>
                    ${renderField('Risco Constatado', data.riscoGrau)}
                    ${renderField('Medida Aplicada', data.medidaTipo)}
                    <div style="grid-column: span 2;">${renderField('Parecer Técnico', data.relatorioTecnico)}</div>
                    <div style="grid-column: span 2;">${renderField('Recomendações', data.recomendacoes)}</div>
                </div>
            </div>
        `;
    }

    let photosHtml = '';
    if (data.fotos && data.fotos.length > 0) {
        photosHtml = `
            <div style="padding: 0 35px 35px 35px; page-break-before: always;">
                ${sectionTitle('6. Anexo Fotográfico')}
                <div style="display: grid; grid-template-columns: 1fr; gap: 30px; justify-items: center;">
                    ${data.fotos.map((f, idx) => `
                        <div style="width: 100%; max-width: 600px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; text-align: center; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.05); page-break-inside: avoid;">
                            <img src="${f.data || f}" style="width: 100%; height: auto; max-height: 450px; border-radius: 4px; object-fit: contain; margin: 0 auto; display: block;" crossorigin="anonymous" />
                            <div style="margin-top: 10px; font-size: 11px; color: #475569; font-weight: 700; text-transform: uppercase;">FOTO ${idx + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const footerHtml = `
        <div style="margin-top: 40px; padding: 40px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; page-break-inside: avoid;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px;">
                <!-- Agent Signature Column -->
                <div style="text-align: center; width: 350px; margin: 0 auto;">
                    <div style="height: 120px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 5px; overflow: hidden;">
                        ${data.assinaturaAgente ? `
                            <img 
                                src="${data.assinaturaAgente}" 
                                style="max-height: 120px; width: auto; max-width: 320px; display: block; border-bottom: 1px solid #e2e8f0;" 
                            />
                        ` : '<div style="height: 60px; border-bottom: 2px solid #cbd5e1; width: 250px; margin-bottom: 10px;"></div>'}
                    </div>
                    <div style="padding-top: 10px;">
                        <p style="margin: 0; font-size: 15px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">${data.agente}</p>
                        <p style="margin: 2px 0; font-size: 11px; color: #475569; font-weight: 700; letter-spacing: 0.5px;">AGENTE DE DEFESA CIVIL</p>
                        <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 600;">Matrícula: ${data.matricula}</p>
                    </div>
                </div>
            </div>
            <p style="margin-top: 30px; font-size: 9px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                Documento oficial gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} pelo Sistema SIGERD Mobile.
            </p>
        </div>
    `;

    container.innerHTML = `<div style="max-width: 840px; margin: 0 auto; border: 1px solid #e2e8f0; min-height: 1100px;">${headerHtml}${contentHtml}${photosHtml}${footerHtml}</div>`;
    document.body.appendChild(container);

    const waitForImages = () => {
        const images = Array.from(container.getElementsByTagName('img'));
        return Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }));
    };

    try {
        await waitForImages();
        // Increased delay for base64 rendering and added scroll to ensure fixed element visibility
        await new Promise(resolve => setTimeout(resolve, 2500));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: true, // Enabled for debugging if needed
            allowTaint: false,
            backgroundColor: '#ffffff',
            windowWidth: 840,
            onclone: (clonedDoc) => {
                // Ensure the cloned container is visible
                const clonedContainer = clonedDoc.querySelector('div');
                if (clonedContainer) clonedContainer.style.top = '0';
            }
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: title });
        } else {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank') || (location.href = url);
        }

    } catch (error) {
        console.error('PDF Error:', error);
        alert('Erro ao gerar PDF.');
    } finally {
        if (document.body.contains(container)) document.body.removeChild(container);
    }
};

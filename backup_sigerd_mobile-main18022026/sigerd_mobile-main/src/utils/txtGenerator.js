/**
 * Utility to generate plain text versions of reports
 */

export const generateTXT = (data, type) => {
    const isVistoria = type === 'vistoria';
    const title = isVistoria ? 'RELATÓRIO DE VISTORIA TÉCNICA' : 'ORDEM DE INTERDIÇÃO';
    const date = new Date().toLocaleString('pt-BR');

    let text = `==========================================\n`;
    text += `   ${title}\n`;
    text += `==========================================\n\n`;
    text += `Gerado em: ${date}\n`;
    text += `------------------------------------------\n\n`;

    if (isVistoria) {
        text += `1. IDENTIFICAÇÃO\n`;
        text += `ID: ${data.vistoriaId || data.vistoria_id || '---'}\n`;
        text += `Protocolo: ${data.processo || '---'}\n`;
        text += `Data/Hora: ${data.dataHora || '---'}\n`;
        text += `Agente: ${data.agente || '---'}\n`;
        text += `Matrícula: ${data.matricula || '---'}\n\n`;

        text += `2. LOCALIZAÇÃO E SOLICITANTE\n`;
        text += `Solicitante: ${data.solicitante || '---'}\n`;
        text += `CPF/CNPJ: ${data.cpf || '---'}\n`;
        text += `Endereço: ${data.endereco || '---'}\n`;
        text += `Bairro: ${data.bairro || '---'}\n`;
        text += `Coordenadas: ${data.latitude}, ${data.longitude}\n\n`;

        text += `3. DIAGNÓSTICO DE RISCO\n`;
        text += `Categoria: ${data.categoriaRisco || '---'}\n`;
        text += `Nível de Risco: ${data.nivelRisco || '---'}\n`;
        text += `Situação: ${data.situacaoObservada || '---'}\n`;
        text += `Subtipos: ${(data.subtiposRisco || []).join(', ') || 'Nenhum'}\n\n`;

        text += `4. PARECER E RECOMENDAÇÕES\n`;
        text += `Descrição Técnica:\n${data.observacoes || '---'}\n\n`;
        text += `Medidas Recomendadas: ${(data.medidasTomadas || []).join('; ') || '---'}\n`;
        text += `Encaminhamentos: ${(data.encaminhamentos || []).join(', ') || '---'}\n\n`;

        if (data.checklistRespostas && Object.keys(data.checklistRespostas).length > 0) {
            text += `5. CONSTATAÇÕES TÉCNICAS\n`;
            Object.keys(data.checklistRespostas).forEach(key => {
                if (data.checklistRespostas[key]) {
                    text += `[X] ${key}\n`;
                }
            });
            text += `\n`;
        }
    } else {
        text += `1. IDENTIFICAÇÃO DA ORDEM\n`;
        text += `ID: ${data.interdicaoId || data.interdicao_id || '---'}\n`;
        text += `Data/Hora: ${data.dataHora || '---'}\n`;
        text += `Responsável: ${data.responsavelNome || '---'}\n`;
        text += `CPF: ${data.responsavelCpf || '---'}\n\n`;

        text += `2. LOCAL E FUNDAMENTAÇÃO\n`;
        text += `Endereço: ${data.endereco || '---'}\n`;
        text += `Bairro: ${data.bairro || '---'}\n`;
        text += `Risco: ${data.riscoGrau || '---'}\n`;
        text += `Medida: ${data.medidaTipo || '---'}\n\n`;

        text += `3. PARECER TÉCNICO\n`;
        text += `${data.relatorioTecnico || '---'}\n\n`;
        text += `Recomendações: ${data.recomendacoes || '---'}\n\n`;
    }

    text += `------------------------------------------\n`;
    text += `Assinado por: ${data.agente || '---'}\n`;
    text += `Defesa Civil de Santa Maria de Jetibá\n`;
    text += `==========================================\n`;

    // Download logic
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${type}_${(data.vistoriaId || data.interdicaoId || 'doc').replace(/[\/\\]/g, '_')}.txt`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

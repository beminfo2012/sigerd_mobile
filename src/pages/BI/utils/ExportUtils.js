import * as XLSX from 'xlsx';

/**
 * Utilitários para exportação de dados no SIGERD BI
 */

export const exportToXLSX = (data, filename = 'sigerd_bi_dataset.xlsx') => {
  if (!data) return;

  const workbook = XLSX.utils.book_new();

  // 1. Aba Vistorias
  if (data.vistoriasList && data.vistoriasList.length > 0) {
    const vData = data.vistoriasList.map(v => ({
      'Código': v.vistoria_id || v.id,
      'Data': v.data_vistoria || v.created_at,
      'Localidade / Bairro': v.bairro || v.localidade || 'N/I',
      'Endereço': v.endereco || '',
      'Categoria Risco': v.categoria_risco || v.categoriaRisco || 'Outros',
      'Nível de Risco': v.nivel_risco || v.nivelRisco || 'N/A',
      'Responsável': v.tecnico_responsavel || v.usuario || '',
      'Parecer Técnico': v.parecer_tecnico || v.descricao || ''
    }));
    const sheetV = XLSX.utils.json_to_sheet(vData);
    XLSX.utils.book_append_sheet(workbook, sheetV, 'Vistorias');
  }

  // 2. Aba Ocorrências
  if (data.ocorrenciasList && data.ocorrenciasList.length > 0) {
    const oData = data.ocorrenciasList.map(o => ({
      'Código': o.ocorrencia_id_format || o.id,
      'Data': o.data_ocorrencia || o.created_at,
      'Localidade': o.bairro || o.localidade || 'N/I',
      'Natureza': o.natureza || o.categoria_risco || 'Geral',
      'Status': o.status || 'Pendente',
      'Afetados': o.afetados_count || 0,
      'Desabrigados': o.desabrigados_count || 0,
      'Desalojados': o.desalojados_count || 0
    }));
    const sheetO = XLSX.utils.json_to_sheet(oData);
    XLSX.utils.book_append_sheet(workbook, sheetO, 'Ocorrências');
  }

  // 3. Aba Interdições
  if (data.interdicoesList && data.interdicoesList.length > 0) {
    const iData = data.interdicoesList.map(i => ({
      'Código': i.interdicao_id || i.id,
      'Data': i.data_interdicao || i.created_at,
      'Localidade': i.bairro || i.localidade || 'N/I',
      'Tipo Interdição': i.risco_tipo || 'Total',
      'Medida Cautelar': i.medida_tipo || 'Embargo Imóvel',
      'Status': i.status_interdicao || i.status || 'Interditado',
      'Motivo': i.motivo || ''
    }));
    const sheetI = XLSX.utils.json_to_sheet(iData);
    XLSX.utils.book_append_sheet(workbook, sheetI, 'Interdições');
  }

  // 4. Aba Ranking de Localidades
  if (data.rankingLocalidades && data.rankingLocalidades.length > 0) {
    const rData = data.rankingLocalidades.map(r => ({
      'Localidade': r.localidade,
      'Índice Criticidade (0-100)': r.indiceCriticidade,
      'Nível': r.nivelDesc,
      'Total Registros': r.total,
      'R3 (Alto Risco)': r.r3,
      'R4 (Muito Alto Risco)': r.r4,
      'Interdições Vigentes': r.interdicoes,
      'Alertas Ativos': r.alertas,
      'NOPRERs': r.noprers
    }));
    const sheetR = XLSX.utils.json_to_sheet(rData);
    XLSX.utils.book_append_sheet(workbook, sheetR, 'Ranking Localidades');
  }

  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (data, filename = 'sigerd_bi_export.csv') => {
  if (!data || !data.rankingLocalidades) return;
  const headers = ['Localidade', 'IndiceCriticidade', 'Nivel', 'TotalRegistros', 'R3', 'R4', 'Interdicoes', 'Alertas'];
  const rows = data.rankingLocalidades.map(r => [
    `"${r.localidade}"`,
    r.indiceCriticidade,
    `"${r.nivelDesc}"`,
    r.total,
    r.r3,
    r.r4,
    r.interdicoes,
    r.alertas
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data, filename = 'sigerd_bi_export.json') => {
  if (!data) return;
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

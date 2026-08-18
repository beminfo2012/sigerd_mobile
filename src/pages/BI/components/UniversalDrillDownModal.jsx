import React, { useState } from 'react';
import { X, Search, MapPin, Calendar, User, Camera, ExternalLink, ShieldAlert, CheckSquare } from 'lucide-react';

export default function UniversalDrillDownModal({ itemFilter, data, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  if (!itemFilter || !data) return null;

  // Filtragem inteligente de itens baseada na seleção
  let title = 'Detalhamento do Indicador Analítico';
  let items = [];

  const filterKey = typeof itemFilter === 'string' ? itemFilter : itemFilter.key || 'vistorias';

  if (filterKey === 'R1' || filterKey === 'R2' || filterKey === 'R3' || filterKey === 'R4') {
    title = `Registros de Vistorias Técnicas em Risco ${filterKey}`;
    items = (data.vistoriasList || []).filter(v => {
      const r = String(v.nivel_risco || v.nivelRisco || '').toUpperCase();
      return r.includes(filterKey);
    });
  } else if (filterKey === 'totalVistorias') {
    title = 'Listagem Completa de Vistorias Técnicas Registradas';
    items = data.vistoriasList || [];
  } else if (filterKey === 'ocorrencias') {
    title = 'Detalhamento de Ocorrências Operacionais Abertas/Região';
    items = data.ocorrenciasList || [];
  } else if (filterKey === 'interdicoes') {
    title = 'Detalhamento de Interdições de Imóveis Vigentes';
    items = data.interdicoesList || [];
  } else if (filterKey === 'noprer') {
    title = 'Notificações Preliminares de Risco (NOPRER)';
    items = data.noprersList || [];
  } else if (filterKey === 'alertas') {
    title = 'Listagem de Alertas Emitidos (CEMADEN / INMET / Defesa Civil)';
    items = data.alertasLista || [];
  } else {
    title = `Detalhamento Analítico — ${filterKey}`;
    items = data.vistoriasList || [];
  }

  const filteredItems = items.filter(i => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const loc = String(i.bairro || i.localidade || i.municipio || '').toLowerCase();
    const cod = String(i.vistoria_id || i.ocorrencia_id_format || i.interdicao_id || i.codigo || i.id || '').toLowerCase();
    return loc.includes(term) || cod.includes(term);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Drill-down Universal SIGERD BI
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Busca e Contadores */}
        <div className="my-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código ou localidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Exibindo <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> de {items.length} registros
          </span>
        </div>

        {/* Conteúdo Principal: Tabela / Detalhes */}
        <div className="overflow-y-auto flex-1 my-2 pr-1 space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((rec, idx) => (
              <div
                key={rec.id || idx}
                onClick={() => setSelectedRecord(rec)}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                      {rec.vistoria_id || rec.ocorrencia_id_format || rec.interdicao_id || rec.id || `REG-${idx+1}`}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {rec.bairro || rec.localidade || rec.municipio || 'Localidade registrada'}
                    </h4>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
                    {rec.parecer_tecnico || rec.descricao || rec.detalhes || rec.motivo || 'Registro cadastrado no sistema.'}
                  </p>
                </div>
                <div className="text-right text-[10px] text-slate-400 shrink-0">
                  <div className="flex items-center gap-1 justify-end font-bold text-slate-600 dark:text-slate-300">
                    <User size={12} /> {rec.tecnico_responsavel || rec.agente || rec.usuario || 'Agente Técnico'}
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Calendar size={12} /> {new Date(rec.data_vistoria || rec.created_at || Date.now()).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-medium text-slate-400 py-12 text-center">
              Nenhum registro encontrado para o filtro aplicado.
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}

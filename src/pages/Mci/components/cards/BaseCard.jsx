import React from 'react';
import { 
    CheckCircle2, Edit3, Trash2, ClipboardList 
} from 'lucide-react';

export default function BaseCard({ 
    recurso, 
    icon: Icon, 
    iconColor, 
    statusBadge, 
    outdated, 
    isRecommended, 
    isCOMPDEC, 
    opacityClass = '',
    onRenewValidade, 
    onOpenRequest, 
    onViewLogs, 
    onEditRecurso, 
    onDelete,
    children
}) {
    return (
        <div 
            className={`bg-white dark:bg-slate-800/40 border rounded-xl p-5 relative overflow-hidden transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/60 ${opacityClass} ${
                isRecommended 
                    ? 'border-blue-500 shadow-md shadow-blue-900/10' 
                    : outdated 
                        ? 'border-red-500/40 dark:border-red-900/40 shadow-md shadow-red-900/5' 
                        : 'border-slate-200 dark:border-slate-800'
            }`}
        >
            {/* Status Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                {outdated && (
                    <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                        Não Atualizado (90d+)
                    </span>
                )}
                {isRecommended && (
                    <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                        Recomendado
                    </span>
                )}
                {statusBadge}
            </div>

            {/* Title & Info */}
            <div className="flex items-start gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Icon className={`${iconColor} h-5 w-5`} />
                </div>
                <div className="pr-16">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase break-words">{recurso.nome}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                        Secretaria: {recurso.secretaria_id}
                    </span>
                </div>
            </div>

            {/* Category Specific Info */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                {children}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-500">
                    Atualizado em: {new Date(recurso.ultima_atualizacao).toLocaleDateString()}
                </span>
                <div className="flex gap-2 text-slate-700 dark:text-slate-350">
                    {/* Revalidar (se estiver desatualizado) */}
                    {outdated && (
                        <button 
                            onClick={() => onRenewValidade(recurso.id)}
                            title="Confirmar validade atual dos dados"
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded animate-pulse"
                        >
                            <CheckCircle2 size={16} />
                        </button>
                    )}
                    {/* Requisitar Recurso (COMPDEC) */}
                    {isCOMPDEC && recurso.status === 'DISPONIVEL' && (
                        <button 
                            onClick={() => onOpenRequest(recurso)}
                            title="Requisitar este recurso para evento ativo"
                            className="px-2.5 py-1 bg-blue-100 dark:bg-blue-600/30 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white rounded font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                            Requisitar
                        </button>
                    )}
                    <button 
                        onClick={() => onViewLogs(recurso)}
                        title="Histórico de alterações"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/30 rounded"
                    >
                        <ClipboardList size={16} />
                    </button>
                    <button 
                        onClick={() => onEditRecurso(recurso)}
                        title="Editar"
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(recurso.id)}
                        title="Remover"
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

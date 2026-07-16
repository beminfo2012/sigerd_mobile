import React from 'react';

const STATUS_CONFIG = {
    'EMITIDA': {
        label: 'Emitida',
        bg: 'bg-[#EBF1F8] dark:bg-blue-900/30', // navy3
        border: 'border-[#2E5C8A]/30', // navy2
        text: 'text-[#1F3B5C] dark:text-slate-100' // navy
    },
    'RASCUNHO': {
        label: 'Rascunho',
        bg: 'bg-amber-100',
        border: 'border-amber-300',
        text: 'text-amber-800'
    },
    'EM_PRAZO': {
        label: 'Em Prazo Crítico',
        bg: 'bg-[#FFFBEB] dark:bg-amber-900/30', // amber bg
        border: 'border-[#FCD34D]', // amber border
        text: 'text-[#92400E] dark:text-amber-400' // amber text
    },
    'VENCIDA': {
        label: 'Vencida',
        bg: 'bg-[#FEF2F2] dark:bg-red-900/30', // red bg
        border: 'border-[#FCA5A5]', // red border
        text: 'text-[#991B1B] dark:text-red-400' // red text
    },
    'REGULARIZADA': {
        label: 'Regularizada',
        bg: 'bg-[#F0FDF4] dark:bg-green-900/30', // green bg
        border: 'border-[#86EFAC]', // green border
        text: 'text-[#166534] dark:text-green-400' // green text
    },
    'ESCALADA': {
        label: 'Escalada (Interdição)',
        bg: 'bg-purple-50', // roxo sutil
        border: 'border-purple-300',
        text: 'text-purple-700'
    }
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['EMITIDA'];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[10px] text-[9px] font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.text}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;

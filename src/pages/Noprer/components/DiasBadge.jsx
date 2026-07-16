import React from 'react';

const DiasBadge = ({ diasRestantes, isVencida, status }) => {
    // Se a NOPRER já foi concluída, não mostra dias
    if (status === 'REGULARIZADA' || status === 'ESCALADA') {
        return null;
    }

    if (isVencida) {
        const diasAbsolutos = Math.abs(diasRestantes);
        return (
            <span className="text-[10px] font-bold text-[#991B1B] dark:text-red-400 bg-[#FEF2F2] dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-[#FCA5A5] whitespace-nowrap">
                {diasAbsolutos}d vencido
            </span>
        );
    }

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
            diasRestantes <= 7 
            ? 'text-[#92400E] dark:text-amber-400 bg-[#FFFBEB] dark:bg-amber-900/30 border-[#FCD34D]' 
            : 'text-[#1F3B5C] dark:text-slate-100 bg-[#EBF1F8] dark:bg-blue-900/30 border-[#2E5C8A]/30'
        }`}>
            {diasRestantes}d restantes
        </span>
    );
};

export default DiasBadge;

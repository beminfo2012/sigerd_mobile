import React from 'react';

const DiasBadge = ({ diasRestantes, isVencida, status }) => {
    // Se a NOPRER já foi concluída, não mostra dias
    if (status === 'REGULARIZADA' || status === 'ESCALADA') {
        return null;
    }

    if (isVencida) {
        const diasAbsolutos = Math.abs(diasRestantes);
        return (
            <span className="text-[10px] font-bold text-[#991B1B] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FCA5A5] whitespace-nowrap">
                {diasAbsolutos}d vencido
            </span>
        );
    }

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
            diasRestantes <= 7 
            ? 'text-[#92400E] bg-[#FFFBEB] border-[#FCD34D]' 
            : 'text-[#1F3B5C] bg-[#EBF1F8] border-[#2E5C8A]/30'
        }`}>
            {diasRestantes}d restantes
        </span>
    );
};

export default DiasBadge;

import React from 'react';

const PrazoBar = ({ progresso, statusCalculado }) => {
    // Determina a cor da barra com base no status ou progresso
    let corBarra = 'bg-[#1F3B5C]'; // navy
    if (statusCalculado === 'VENCIDA') {
        corBarra = 'bg-[#991B1B]'; // red
    } else if (statusCalculado === 'EM_PRAZO' || progresso > 75) {
        corBarra = 'bg-[#92400E]'; // amber
    } else if (statusCalculado === 'REGULARIZADA') {
        corBarra = 'bg-[#166534]'; // green
    }

    // Limita entre 0 e 100
    const percent = Math.min(Math.max(progresso, 0), 100);

    return (
        <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden flex items-center">
            <div 
                className={`h-full ${corBarra} transition-all duration-500 ease-out`}
                style={{ width: `${percent}%` }}
            />
        </div>
    );
};

export default PrazoBar;

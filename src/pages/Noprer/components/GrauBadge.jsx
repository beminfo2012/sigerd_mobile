import React from 'react';
import { GRAUS } from '../data/graus';

const GrauBadge = ({ grau }) => {
    const config = GRAUS.find(g => g.id === grau) || GRAUS[0];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[10px] text-[10px] font-bold uppercase tracking-widest border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
            {config.id}
        </span>
    );
};

export default GrauBadge;

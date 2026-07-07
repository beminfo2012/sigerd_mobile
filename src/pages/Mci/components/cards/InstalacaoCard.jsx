import React from 'react';
import BaseCard from './BaseCard';
import { MapPin } from 'lucide-react';

function getStatusBadge(r) {
    if (r.status === 'OCUPADO' || r.status === 'EM_REFORMA' || r.status === 'INDISPONIVEL') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Indisponível</span>;
    }
    return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Disponível</span>;
}

export default function InstalacaoCard(props) {
    const { recurso } = props;
    const isIndisponivel = recurso.status === 'OCUPADO' || recurso.status === 'EM_REFORMA' || recurso.status === 'INDISPONIVEL';

    return (
        <BaseCard
            {...props}
            icon={MapPin}
            iconColor="text-red-600 dark:text-red-400"
            statusBadge={getStatusBadge(recurso)}
            opacityClass={isIndisponivel ? 'opacity-60' : ''}
        >
            <p><strong>Tipo:</strong> {recurso.detalhes?.tipo}</p>
            <p><strong>Endereço:</strong> {recurso.detalhes?.endereco}</p>
            <p><strong>Capacidade:</strong> {recurso.detalhes?.capacidade_abrigo} Pessoas</p>
        </BaseCard>
    );
}

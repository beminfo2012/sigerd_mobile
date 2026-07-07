import React from 'react';
import BaseCard from './BaseCard';
import { Users } from 'lucide-react';

function getStatusBadge(r) {
    if (r.status === 'EM_USO') {
        return <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Em Operação</span>;
    }
    if (r.status !== 'DISPONIVEL') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Indisponível</span>;
    }
    return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Disponível</span>;
}

export default function ProfissionalCard(props) {
    const { recurso } = props;
    const isIndisponivel = recurso.status !== 'DISPONIVEL' && recurso.status !== 'EM_USO';

    return (
        <BaseCard
            {...props}
            icon={Users}
            iconColor="text-purple-600 dark:text-purple-400"
            statusBadge={getStatusBadge(recurso)}
            opacityClass={isIndisponivel ? 'opacity-60' : ''}
            canRequest={!isIndisponivel}
        >
            <p><strong>Função:</strong> {recurso.detalhes?.funcao}</p>
            <p><strong>Disponibilidade:</strong> <span className="uppercase font-semibold">{recurso.status === 'EM_USO' ? 'Em Operação' : (recurso.status === 'DISPONIVEL' ? 'Disponível' : 'Indisponível')}</span></p>
            <p><strong>Contato:</strong> {recurso.detalhes?.contato_responsavel}</p>
            <p><strong>Profissionais:</strong> {recurso.detalhes?.profissionais_disponiveis}</p>
        </BaseCard>
    );
}

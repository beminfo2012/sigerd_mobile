import React from 'react';
import BaseCard from './BaseCard';
import { Wrench } from 'lucide-react';

function getStatusBadge(r) {
    if (r.detalhes?.estado_conservacao === 'inoperante' || r.status === 'EM_MANUTENCAO' || r.status === 'EM_REFORMA') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Manutenção</span>;
    }
    if (r.status === 'EM_USO') {
        return <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Em Operação</span>;
    }
    if (r.status !== 'DISPONIVEL') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Indisponível</span>;
    }
    return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Disponível</span>;
}

export default function EquipamentoCard(props) {
    const { recurso } = props;
    const isIndisponivel = recurso.detalhes?.estado_conservacao === 'inoperante' || recurso.status === 'EM_MANUTENCAO' || (recurso.status !== 'DISPONIVEL' && recurso.status !== 'EM_USO');

    return (
        <BaseCard
            {...props}
            icon={Wrench}
            iconColor="text-emerald-600 dark:text-emerald-400"
            statusBadge={getStatusBadge(recurso)}
            opacityClass={isIndisponivel ? 'opacity-60' : ''}
        >
            {recurso.detalhes?.quantidade && <p><strong>Quantidade:</strong> {recurso.detalhes?.quantidade}</p>}
            <p><strong>Condição:</strong> <span className="uppercase font-semibold">{recurso.detalhes?.estado_conservacao || 'bom'}</span></p>
            <p><strong>Local:</strong> {recurso.detalhes?.localizacao_guarda}</p>
        </BaseCard>
    );
}

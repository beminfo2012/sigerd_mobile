import React from 'react';
import BaseCard from './BaseCard';
import { Truck } from 'lucide-react';

function getStatusBadge(r) {
    if (r.status === 'EM_MANUTENCAO') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Manutenção</span>;
    }
    if (r.status === 'EM_USO') {
        return <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Em Operação</span>;
    }
    if (r.status !== 'DISPONIVEL') {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Indisponível</span>;
    }
    return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Operacional</span>;
}

export default function VeiculoCard(props) {
    const { recurso } = props;
    const isIndisponivel = recurso.status === 'EM_MANUTENCAO' || recurso.status !== 'DISPONIVEL' && recurso.status !== 'EM_USO';

    return (
        <BaseCard
            {...props}
            icon={Truck}
            iconColor="text-blue-600 dark:text-blue-400"
            statusBadge={getStatusBadge(recurso)}
            opacityClass={isIndisponivel ? 'opacity-60' : ''}
        >
            <p><strong>Tipo:</strong> {recurso.detalhes?.tipo}</p>
            {recurso.detalhes?.placa && <p><strong>Placa:</strong> {recurso.detalhes?.placa}</p>}
            <p><strong>Status Manutenção:</strong> <span className="uppercase font-semibold">{recurso.status === 'EM_MANUTENCAO' ? 'Em Manutenção' : 'Operacional'}</span></p>
            {recurso.detalhes?.capacidade && <p><strong>Capacidade:</strong> {recurso.detalhes?.capacidade}</p>}
            {recurso.detalhes?.observacoes_operacionais && <p className="italic text-slate-500 dark:text-slate-400 mt-1">"{recurso.detalhes?.observacoes_operacionais}"</p>}
        </BaseCard>
    );
}

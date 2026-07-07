import React from 'react';
import BaseCard from './BaseCard';
import { Package } from 'lucide-react';

function getStatusBadge(r) {
    if (r.detalhes?.quantidade_estoque === 0) {
        return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Zerado</span>;
    }
    if (r.detalhes?.validade && new Date(r.detalhes.validade) < new Date()) {
        return <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Vencido</span>;
    }
    if (r.status === 'DISPONIVEL') {
        return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Disponível</span>;
    }
    return <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Indisponível</span>;
}

export default function EstoqueCard(props) {
    const { recurso } = props;
    const isZerado = recurso.detalhes?.quantidade_estoque === 0;
    const isIndisponivel = recurso.status !== 'DISPONIVEL' || isZerado;

    return (
        <BaseCard
            {...props}
            icon={Package}
            iconColor="text-amber-600 dark:text-amber-400"
            statusBadge={getStatusBadge(recurso)}
            opacityClass={isIndisponivel ? 'opacity-60' : ''}
            canRequest={!isIndisponivel}
        >
            <p><strong>Item:</strong> {recurso.detalhes?.item}</p>
            <p><strong>Quantidade:</strong> {recurso.detalhes?.quantidade_estoque} {recurso.detalhes?.unidade_medida}</p>
            {recurso.detalhes?.validade && (
                <p><strong>Validade:</strong> {new Date(recurso.detalhes?.validade).toLocaleDateString()}</p>
            )}
            <p><strong>Local:</strong> {recurso.detalhes?.local_armazenamento}</p>
        </BaseCard>
    );
}

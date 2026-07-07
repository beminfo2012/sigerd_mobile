import React from 'react';
import EstoqueCard from './cards/EstoqueCard';
import InstalacaoCard from './cards/InstalacaoCard';
import VeiculoCard from './cards/VeiculoCard';
import EquipamentoCard from './cards/EquipamentoCard';
import ProfissionalCard from './cards/ProfissionalCard';

export default function ResourceCardFactory(props) {
    const { recurso } = props;
    
    switch (recurso.categoria) {
        case 'ESTOQUE':
            return <EstoqueCard {...props} />;
        case 'INSTALACAO':
            return <InstalacaoCard {...props} />;
        case 'VEICULO':
            return <VeiculoCard {...props} />;
        case 'EQUIPAMENTO':
            return <EquipamentoCard {...props} />;
        case 'PROFISSIONAL':
            return <ProfissionalCard {...props} />;
        default:
            return <VeiculoCard {...props} />;
    }
}

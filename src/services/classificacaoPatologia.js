/**
 * Serviço de classificação de patologias baseado na tabela de referência IBAPE-MG.
 * IMPORTANTE: Esta classificação é puramente descritiva baseada na largura medida.
 * Ela NÃO define, por si só, o grau de risco. O diagnóstico de origem e 
 * monitoramento de atividade continuam necessários.
 */

const FAIXAS_IBAPE_MG = [
    { limite: 0.5, classificacao: 'fissura' },
    { limite: 1.0, classificacao: 'trinca' },
    { limite: 5.0, classificacao: 'rachadura' },
    { limite: 10.0, classificacao: 'fenda' },
];

export const classificarAbertura = (larguraMm) => {
    if (larguraMm === null || larguraMm === undefined || isNaN(larguraMm)) {
        return null;
    }
    
    const largura = parseFloat(larguraMm);
    
    for (const faixa of FAIXAS_IBAPE_MG) {
        if (largura <= faixa.limite) {
            return faixa.classificacao;
        }
    }
    
    return 'brecha'; // > 10.0mm
};

export const obterRotuloClassificacao = (classificacao) => {
    const rotulos = {
        fissura: "Fissura",
        trinca: "Trinca",
        rachadura: "Rachadura",
        fenda: "Fenda",
        brecha: "Brecha",
    };
    
    return rotulos[classificacao] || classificacao;
};

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
        fissura: "Fissura (≤ 0.5mm)",
        trinca: "Trinca (0.5mm a 1.0mm)",
        rachadura: "Rachadura (1.0mm a 5.0mm)",
        fenda: "Fenda (5.0mm a 10.0mm)",
        brecha: "Brecha (> 10.0mm)",
    };
    
    return rotulos[classificacao] || classificacao;
};

/**
 * Analisa a evolução da abertura da fissura/trinca em relação a uma medição anterior.
 * Permite identificar se a estrutura está em expansão ativa (abrindo mais) ou estabilizada.
 */
export const analisarEvolucaoAbertura = (larguraAtualMm, larguraAnteriorMm) => {
    if (larguraAtualMm === null || larguraAnteriorMm === null || larguraAtualMm === undefined || larguraAnteriorMm === undefined) {
        return null;
    }

    const atual = parseFloat(larguraAtualMm);
    const anterior = parseFloat(larguraAnteriorMm);
    
    if (isNaN(atual) || isNaN(anterior)) return null;

    const diff = atual - anterior;
    const diffAbs = Math.abs(diff);
    const percent = anterior > 0 ? (diff / anterior) * 100 : 0;

    if (Math.abs(diff) < 0.05) {
        return {
            status: 'estavel',
            rotulo: 'Estável (Sem variação)',
            variacaoMm: 0,
            percentual: 0,
            cor: 'emerald',
            alerta: 'Abertura estável sem variação em relação à medição de referência.'
        };
    } else if (diff > 0) {
        return {
            status: 'expansao',
            rotulo: `EM EXPANSÃO (+${diff.toFixed(2)} mm)`,
            variacaoMm: diff,
            percentual: percent,
            cor: 'red',
            alerta: `⚠️ ATENÇÃO: A abertura AUMENTOU +${diff.toFixed(2)} mm (+${percent.toFixed(1)}%). Indica atividade estrutural em evolução.`
        };
    } else {
        return {
            status: 'reducao',
            rotulo: `Redução/Acomodação (${diff.toFixed(2)} mm)`,
            variacaoMm: diff,
            percentual: percent,
            cor: 'blue',
            alerta: `A abertura diminuiu ${diffAbs.toFixed(2)} mm em relação à leitura anterior.`
        };
    }
};

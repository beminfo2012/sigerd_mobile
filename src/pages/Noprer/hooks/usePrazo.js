import { useMemo } from 'react';

export function usePrazo() {
    /**
     * Calcula o status atual da NOPRER de forma dinâmica, sem persistir no banco.
     * @param {Object} noprer Dados da NOPRER do banco
     * @returns {Object} { statusCalculado, diasRestantes, isVencida, progresso, dataLimiteStr, dataRevistoriaStr }
     */
    const calcularStatus = (noprer) => {
        if (!noprer) return null;

        // Se já estiver encerrada ou escalada, o status final prevalece
        if (noprer.status === 'REGULARIZADA' || noprer.status === 'ESCALADA') {
            return {
                statusCalculado: noprer.status,
                diasRestantes: 0,
                isVencida: false,
                progresso: 100,
                dataLimiteStr: noprer.data_limite,
                dataRevistoriaStr: noprer.data_revistoria
            };
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataLimite = new Date(noprer.data_limite);
        dataLimite.setHours(0, 0, 0, 0);

        const dataEmissao = new Date(noprer.data_emissao);
        dataEmissao.setHours(0, 0, 0, 0);

        const diffTime = (a, b) => {
            const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
            const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
            return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
        };

        // Quantidade total de dias de prazo concedido
        const totalDiasPrazo = diffTime(dataLimite, dataEmissao);
        
        // Quantidade de dias restantes até vencer
        const diasRestantes = diffTime(dataLimite, hoje);

        // Porcentagem gasta do prazo para barra de progresso
        let progresso = 0;
        if (totalDiasPrazo > 0) {
            const diasDecorridos = diffTime(hoje, dataEmissao);
            progresso = Math.min(Math.max((diasDecorridos / totalDiasPrazo) * 100, 0), 100);
        }

        const isVencida = diasRestantes < 0;

        let statusCalculado = 'EMITIDA';
        if (isVencida) {
            statusCalculado = 'VENCIDA';
        } else if (diasRestantes <= 7) {
            statusCalculado = 'EM_PRAZO';
        }

        return {
            statusCalculado,
            diasRestantes,
            isVencida,
            progresso,
            dataLimiteStr: noprer.data_limite,
            dataRevistoriaStr: noprer.data_revistoria
        };
    };

    /**
     * Calcula dinamicamente data limite e data de revistoria com base no prazo (dias corridos).
     */
    const calcularDatasFormulario = (diasPrazo) => {
        const hoje = new Date();
        const dataLimite = new Date(hoje);
        dataLimite.setDate(dataLimite.getDate() + diasPrazo);
        
        const dataRevistoria = new Date(dataLimite);
        dataRevistoria.setDate(dataRevistoria.getDate() + 3); // Revistoria é +3 dias do limite
        
        return {
            dataLimite,
            dataRevistoria
        };
    };

    return {
        calcularStatus,
        calcularDatasFormulario
    };
}

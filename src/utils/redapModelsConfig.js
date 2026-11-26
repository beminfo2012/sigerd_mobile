/**
 * Modelos Parametrizáveis do Módulo REDAP (SIGERD)
 * Baseado no Manual de Implementação REDAP v1.0 (Seções 5 e 7.2).
 *
 * Princípios:
 * - Um único motor de formulário renderiza qualquer secretaria a partir da configuração ativa.
 * - Modelos-piloto prioritários: Saúde (v1) e Serviços Urbanos (v1).
 * - Diferencia explicitamente: campo não preenchido (null/''), valor zero (0),
 *   "Não houve ocorrência" e "Não se aplica".
 */

export const REDAP_REPORT_STATUS = {
    NAO_INICIADO: {
        key: 'NAO_INICIADO',
        label: 'Não iniciado',
        color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
        editableBySector: true,
    },
    EM_PREENCHIMENTO: {
        key: 'EM_PREENCHIMENTO',
        label: 'Em preenchimento',
        color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
        dot: 'bg-sky-500',
        editableBySector: true,
    },
    ENVIADO: {
        key: 'ENVIADO',
        label: 'Enviado',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
        dot: 'bg-indigo-500',
        editableBySector: false,
    },
    EM_ANALISE: {
        key: 'EM_ANALISE',
        label: 'Em análise',
        color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
        dot: 'bg-violet-500',
        editableBySector: false,
    },
    DEVOLVIDO: {
        key: 'DEVOLVIDO',
        label: 'Devolvido para correção',
        color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        editableBySector: true,
    },
    APROVADO: {
        key: 'APROVADO',
        label: 'Aprovado',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        editableBySector: false,
    },
    CANCELADO: {
        key: 'CANCELADO',
        label: 'Cancelado',
        color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        editableBySector: false,
    },
};

export const SITUACAO_INFORMACAO = {
    INFORMADO: 'INFORMADO',
    NAO_HOUVE_OCORRENCIA: 'NAO_HOUVE_OCORRENCIA',
    NAO_SE_APLICA: 'NAO_SE_APLICA',
};

export const SECRETARIA_CATALOG = [
    { key: 'Redap_Saude', nome: 'Secretaria de Saúde', sigla: 'SAÚDE', piloto: true },
    { key: 'Redap_ServicosUrbanos', nome: 'Secretaria de Serviços Urbanos', sigla: 'SERV. URBANOS', piloto: true },
    { key: 'Redap_Obras', nome: 'Secretaria de Obras e Infraestrutura', sigla: 'OBRAS', piloto: false },
    { key: 'Redap_Educacao', nome: 'Secretaria de Educação', sigla: 'EDUCAÇÃO', piloto: false },
    { key: 'Redap_Social', nome: 'Secretaria de Assistência Social', sigla: 'SOCIAL', piloto: false },
    { key: 'Redap_Agricultura', nome: 'Secretaria de Agropecuária / Agricultura', sigla: 'AGROPECUÁRIA', piloto: false },
    { key: 'Redap_Interior', nome: 'Secretaria de Interior', sigla: 'INTERIOR', piloto: false },
    { key: 'Redap_MeioAmbiente', nome: 'Secretaria de Meio Ambiente', sigla: 'MEIO AMBIENTE', piloto: false },
    { key: 'Redap_Transportes', nome: 'Secretaria de Transportes', sigla: 'TRANSPORTES', piloto: false },
    { key: 'Redap_Administracao', nome: 'Secretaria de Administração', sigla: 'ADMINISTRAÇÃO', piloto: false },
    { key: 'Redap_DefesaSocial', nome: 'Secretaria de Defesa Social', sigla: 'DEFESA SOCIAL', piloto: false },
    { key: 'Redap_EsporteTurismo', nome: 'Secretaria de Esporte e Turismo', sigla: 'ESPORTE/TUR.', piloto: false },
    { key: 'Redap_Cesan', nome: 'CESAN / Abastecimento de Água', sigla: 'CESAN', piloto: false },
    { key: 'Redap_CDL', nome: 'CDL / Comércio e Serviços', sigla: 'CDL', piloto: false },
];

export const DEFAULT_REDAP_MODELS = {
    Redap_Saude: {
        id: 'modelo-saude-v1',
        secretaria_key: 'Redap_Saude',
        secretaria_nome: 'Secretaria de Saúde',
        nome: 'Formulário Setorial — Saúde (Piloto)',
        versao: 1,
        ativo: true,
        piloto: true,
        configuracao_json: {
            model: 'saude',
            version: 1,
            has_danos_humanos: true,
            aviso_tecnico: 'Atenção (Seção 5.1 do Manual): conferir criteriosamente os conceitos oficiais de mortos, feridos e enfermos antes do envio oficial.',
            danos_humanos_items: [
                { key: 'mortos', label: 'Mortos', help: 'Óbitos diretamente relacionados ao desastre' },
                { key: 'feridos', label: 'Feridos', help: 'Pessoas com lesões físicas em decorrência do evento' },
                { key: 'enfermos', label: 'Enfermos', help: 'Pessoas acometidas por doenças/agravos associados ao desastre' },
            ],
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Instalações Públicas de Saúde',
                    items: [
                        'Hospitais Públicos',
                        'Unidades Básicas de Saúde (UBS)',
                        'Pronto Atendimento (PA)',
                        'Farmácias Públicas',
                        'Laboratórios / Centros de Vacinação',
                        'Equipamentos Médicos / Hospitalares',
                        'Ambulâncias e Veículos de Emergência',
                    ],
                },
            ],
            prejuizos_servicos: [
                'Assistência médica',
                'Saúde pública e vigilância epidemiológica/sanitária',
                'Atendimento de emergências médicas',
                'Distribuição emergencial de medicamentos e insumos',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    },
    Redap_ServicosUrbanos: {
        id: 'modelo-servicos-urbanos-v1',
        secretaria_key: 'Redap_ServicosUrbanos',
        secretaria_nome: 'Secretaria de Serviços Urbanos',
        nome: 'Formulário Setorial — Serviços Urbanos (Piloto)',
        versao: 1,
        ativo: true,
        piloto: true,
        configuracao_json: {
            model: 'servicos_urbanos',
            version: 1,
            has_danos_humanos: false,
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Instalações Públicas Prestadoras de Serviços',
                    items: [
                        'Garagens, Pátios e Almoxarifados',
                        'Postos de Apoio Operacional',
                        'Cemitérios Municipais',
                    ],
                },
                {
                    categoria: 'Instalações Públicas de Uso Comunitário',
                    items: [
                        'Praças, Parques e Áreas de Lazer',
                        'Mercados e Feiras Públicas',
                        'Abrigos de Lixo e Contentores Comunitários',
                    ],
                },
                {
                    categoria: 'Obras de Infraestrutura Pública Urbana',
                    items: [
                        'Rede de Drenagem e Bocas de Lobo',
                        'Postes e Rede de Iluminação Pública',
                        'Pavimentação, Calçadas e Contenções Urbanas',
                    ],
                },
            ],
            prejuizos_servicos: [
                'Sistema de limpeza urbana e de recolhimento e destinação do lixo',
                'Remoção emergencial de lama, galhos e entulhos',
                'Manutenção emergencial de drenagem e iluminação pública',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    },
    Redap_Obras: {
        id: 'modelo-obras-v1',
        secretaria_key: 'Redap_Obras',
        secretaria_nome: 'Secretaria de Obras e Infraestrutura',
        nome: 'Formulário Setorial — Obras e Infraestrutura',
        versao: 1,
        ativo: true,
        piloto: false,
        configuracao_json: {
            model: 'obras',
            version: 1,
            has_danos_humanos: false,
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Obras de Infraestrutura Pública',
                    items: [
                        'Pontes de Concreto / Alvenaria',
                        'Pontes de Madeira / Passarelas',
                        'Bueiros e Galerias Pluviais',
                        'Muros de Contenção e Encostas',
                        'Vias Pavimentadas e Calçadas',
                        'Prédios Administrativos Municipais',
                    ],
                },
            ],
            prejuizos_servicos: [
                'Recuperação emergencial de vias e acessos',
                'Desobstrução e escoramento estrutural',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    },
    Redap_Educacao: {
        id: 'modelo-educacao-v1',
        secretaria_key: 'Redap_Educacao',
        secretaria_nome: 'Secretaria de Educação',
        nome: 'Formulário Setorial — Educação',
        versao: 1,
        ativo: true,
        piloto: false,
        configuracao_json: {
            model: 'educacao',
            version: 1,
            has_danos_humanos: false,
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Instalações Públicas de Ensino',
                    items: [
                        'Escolas Municipais de Ensino Fundamental',
                        'Centros Municipais de Educação Infantil (CMEI)',
                        'Quadras Poliesportivas e Bibliotecas',
                        'Mobiliário, Equipamentos Didáticos e Frota Escolar',
                    ],
                },
            ],
            prejuizos_servicos: [
                'Ensino público e reposição emergencial de aulas',
                'Transporte escolar',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    },
    Redap_Social: {
        id: 'modelo-social-v1',
        secretaria_key: 'Redap_Social',
        secretaria_nome: 'Secretaria de Assistência Social',
        nome: 'Formulário Setorial — Assistência Social',
        versao: 1,
        ativo: true,
        piloto: false,
        configuracao_json: {
            model: 'social',
            version: 1,
            has_danos_humanos: true,
            danos_humanos_items: [
                { key: 'desabrigados', label: 'Desabrigados', help: 'Pessoas acolhidas em abrigos públicos' },
                { key: 'desalojados', label: 'Desalojados', help: 'Pessoas em casas de parentes, amigos ou aluguel social' },
                { key: 'desaparecidos', label: 'Desaparecidos', help: 'Pessoas ainda não localizadas' },
                { key: 'outros_afetados', label: 'Outros Afetados', help: 'Demais pessoas diretamente impactadas' },
            ],
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Instalações de Assistência Social',
                    items: ['CRAS / CREAS', 'Abrigos Públicos / Casas de Passagem', 'Conselho Tutelar / Banco de Alimentos'],
                },
            ],
            prejuizos_servicos: [
                'Assistência social emergencial e benefícios eventuais',
                'Fornecimento de cestas básicas, kits higiene e colchões',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    },
};

/**
 * Retorna a configuração do modelo para qualquer secretaria_key,
 * com fallback parametrizável genérico para secretarias ainda sem modelo customizado.
 */
export const getModelForSecretaria = (secretariaKey, customModels = []) => {
    const fromDb = (customModels || []).find(
        m => m.secretaria_key === secretariaKey && m.ativo !== false
    );
    if (fromDb) return fromDb;

    if (DEFAULT_REDAP_MODELS[secretariaKey]) {
        return DEFAULT_REDAP_MODELS[secretariaKey];
    }

    const cat = SECRETARIA_CATALOG.find(s => s.key === secretariaKey);
    const nome = cat?.nome || secretariaKey.replace(/^Redap_/, 'Secretaria de ');

    return {
        id: `modelo-${secretariaKey.toLowerCase()}-v1`,
        secretaria_key: secretariaKey,
        secretaria_nome: nome,
        nome: `Formulário Setorial — ${nome}`,
        versao: 1,
        ativo: true,
        piloto: false,
        configuracao_json: {
            model: secretariaKey.toLowerCase(),
            version: 1,
            has_danos_humanos: false,
            danos_infraestrutura_categorias: [
                {
                    categoria: 'Infraestrutura e Instalações do Setor',
                    items: [
                        'Instalações Públicas do Setor',
                        'Equipamentos e Veículos',
                        'Obras e Estruturas Vinculadas',
                    ],
                },
            ],
            prejuizos_servicos: [
                'Serviços Públicos Essenciais do Setor',
                'Custos Operacionais Emergenciais',
            ],
            has_atuacao_orgao: true,
            has_ia_textos: true,
        },
    };
};

/**
 * Calcula o percentual de completude (0-100%) de forma independente do status (Seção 4.1).
 */
export const calculateReportProgress = ({
    report,
    danos = [],
    prejuizos = [],
    equipes = [],
    recursos = [],
    despesas = [],
    anexos = [],
    modelConfig = {},
}) => {
    const comp = report?.dados_complementares || {};
    const checks = [];

    // 1. Identificação
    checks.push(Boolean(report?.responsavel_nome && report.responsavel_nome.trim().length > 1));

    // 2. Danos Humanos (se o modelo possuir)
    if (modelConfig.has_danos_humanos) {
        const sitHum = comp.situacao_danos_humanos;
        const hasHum =
            sitHum === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
            sitHum === SITUACAO_INFORMACAO.NAO_SE_APLICA ||
            danos.some(d => d.secao === 'DANOS_HUMANOS' && (d.quantidade !== null && d.quantidade !== undefined && d.quantidade !== ''));
        checks.push(hasHum);
    }

    // 3. Danos à Infraestrutura
    const sitInfra = comp.situacao_danos_infraestrutura;
    const hasInfra =
        sitInfra === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
        sitInfra === SITUACAO_INFORMACAO.NAO_SE_APLICA ||
        danos.some(d => d.secao !== 'DANOS_HUMANOS');
    checks.push(hasInfra);

    // 4. Prejuízos Econômicos
    const sitPrej = comp.situacao_prejuizos;
    const hasPrej =
        sitPrej === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
        sitPrej === SITUACAO_INFORMACAO.NAO_SE_APLICA ||
        prejuizos.length > 0;
    checks.push(hasPrej);

    // 5. Atuação do Órgão
    const sitAtu = comp.situacao_atuacao;
    const hasAtu =
        sitAtu === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
        sitAtu === SITUACAO_INFORMACAO.NAO_SE_APLICA ||
        equipes.length > 0 ||
        recursos.length > 0 ||
        despesas.length > 0;
    checks.push(hasAtu);

    // 6. Textos (Introdução e Considerações Finais)
    checks.push(Boolean(report?.introducao_texto?.trim()) && Boolean(report?.consideracoes_texto?.trim()));

    // 7. Relatório Fotográfico (ou declaração de ausência)
    const hasFotos = anexos.length > 0 || comp.sem_fotos_justificativa === true;
    checks.push(hasFotos);

    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
};

/**
 * Valida regras obrigatórias antes do envio (RF05 / RF10).
 */
export const validateReportForSubmission = ({
    report,
    danos = [],
    prejuizos = [],
    equipes = [],
    recursos = [],
    despesas = [],
    pendencias = [],
    modelConfig = {},
}) => {
    const errors = [];
    const comp = report?.dados_complementares || {};

    if (!report?.responsavel_nome?.trim()) {
        errors.push('Informe o nome do responsável pelo relatório na etapa de Identificação.');
    }

    if (modelConfig.has_danos_humanos) {
        const sitHum = comp.situacao_danos_humanos;
        const hasHum =
            sitHum === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
            sitHum === SITUACAO_INFORMACAO.NAO_SE_APLICA ||
            danos.some(d => d.secao === 'DANOS_HUMANOS' && d.quantidade !== null && d.quantidade !== undefined && d.quantidade !== '');
        if (!hasHum) {
            errors.push('Preencha os Danos Humanos ou marque explicitamente "Não houve ocorrência" / "Não se aplica".');
        }
    }

    const sitInfra = comp.situacao_danos_infraestrutura;
    if (
        sitInfra !== SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA &&
        sitInfra !== SITUACAO_INFORMACAO.NAO_SE_APLICA &&
        !danos.some(d => d.secao !== 'DANOS_HUMANOS')
    ) {
        errors.push('Registre ao menos um Dano à Infraestrutura ou marque "Não houve ocorrência" / "Não se aplica".');
    }

    const sitPrej = comp.situacao_prejuizos;
    if (
        sitPrej !== SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA &&
        sitPrej !== SITUACAO_INFORMACAO.NAO_SE_APLICA &&
        prejuizos.length === 0
    ) {
        errors.push('Registre ao menos um Prejuízo Econômico Público ou marque "Não houve ocorrência" / "Não se aplica".');
    }

    const sitAtu = comp.situacao_atuacao;
    if (
        sitAtu !== SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA &&
        sitAtu !== SITUACAO_INFORMACAO.NAO_SE_APLICA &&
        equipes.length === 0 &&
        recursos.length === 0 &&
        despesas.length === 0
    ) {
        errors.push('Registre a Atuação do Órgão (equipes, materiais ou despesas) ou marque "Não houve atuação" / "Não se aplica".');
    }

    // Valida valores negativos
    const hasNegDano = danos.some(
        d =>
            (d.quantidade !== null && d.quantidade !== undefined && Number(d.quantidade) < 0) ||
            (d.quantidade_danificada !== null && d.quantidade_danificada !== undefined && Number(d.quantidade_danificada) < 0) ||
            (d.quantidade_destruida !== null && d.quantidade_destruida !== undefined && Number(d.quantidade_destruida) < 0) ||
            (d.valor_estimado !== null && d.valor_estimado !== undefined && Number(d.valor_estimado) < 0)
    );
    if (hasNegDano) {
        errors.push('Existem quantidades ou valores negativos na seção de Danos.');
    }

    const hasNegPrej = prejuizos.some(p => p.valor_estimado !== null && p.valor_estimado !== undefined && Number(p.valor_estimado) < 0);
    if (hasNegPrej) {
        errors.push('Existem valores negativos na seção de Prejuízos Econômicos.');
    }

    const openPendencias = pendencias.filter(p => p.situacao === 'ABERTA');
    if (report?.status === 'DEVOLVIDO' && openPendencias.length > 0) {
        errors.push(`Existem ${openPendencias.length} pendência(s) aberta(s) da Defesa Civil. Marque-as como resolvidas após corrigir.`);
    }

    if (!report?.declaracao_responsabilidade) {
        errors.push('É obrigatório confirmar a declaração de veracidade e responsabilidade antes de enviar.');
    }

    return errors;
};

export const formatBRL = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

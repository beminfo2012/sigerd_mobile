/**
 * Utilitário de roteamento e detecção do subdomínio dedicado do REDAP (redap.<dominio>).
 * Mantém compatibilidade com desenvolvimento local (localhost / 127.0.0.1) e Vercel preview.
 */

export const isRedapSubdomain = () => {
    if (typeof window === 'undefined') return false;
    const host = (window.location.hostname || '').toLowerCase();
    return host.startsWith('redap.');
};

export const isRedapStandalonePath = (pathname = '') => {
    return isRedapSubdomain() || String(pathname || '').startsWith('/redap');
};

/**
 * Calcula a URL do portal dedicado REDAP (redap.<dominio>).
 * - Em localhost / IP / *.vercel.app sem subdomínio customizado, mantém na mesma origem em `/redap`.
 * - Em domínio próprio (ex: sigerd.smj.es.gov.br ou www.sigerd.com.br), redireciona para `https://redap.<dominio>/redap`.
 * - Pode ser sobrescrito via `VITE_REDAP_URL`.
 */
export const getRedapPortalUrl = (subpath = '/redap') => {
    const normalizedPath = subpath.startsWith('/') ? subpath : `/${subpath}`;

    const envUrl = import.meta.env.VITE_REDAP_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
        const base = envUrl.trim().replace(/\/+$/, '');
        return `${base}${normalizedPath}`;
    }

    if (typeof window === 'undefined') return normalizedPath;

    const { protocol, hostname, port } = window.location;
    const hostLower = (hostname || '').toLowerCase();

    // Já está no subdomínio redap.*
    if (hostLower.startsWith('redap.')) {
        return normalizedPath;
    }

    // Ambiente local ou IP numérico -> mantém mesma origem (já abre em modo standalone sem sidebar)
    const isLocal =
        hostLower === 'localhost' ||
        hostLower === '127.0.0.1' ||
        /^\d{1,3}(\.\d{1,3}){3}$/.test(hostLower) ||
        hostLower.endsWith('.vercel.app');

    if (isLocal) {
        return normalizedPath;
    }

    const baseDomain = hostLower.startsWith('www.') ? hostLower.slice(4) : hostLower;
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//redap.${baseDomain}${portSuffix}${normalizedPath}`;
};

/**
 * Calcula a URL do SIGERD principal a partir do subdomínio `redap.<dominio>`.
 */
export const getMainSigerdUrl = (subpath = '/') => {
    const normalizedPath = subpath.startsWith('/') ? subpath : `/${subpath}`;

    const envMain = import.meta.env.VITE_MAIN_SIGERD_URL;
    if (envMain && typeof envMain === 'string' && envMain.trim()) {
        const base = envMain.trim().replace(/\/+$/, '');
        return `${base}${normalizedPath}`;
    }

    if (typeof window === 'undefined') return normalizedPath;

    const { protocol, hostname, port } = window.location;
    const hostLower = (hostname || '').toLowerCase();

    if (hostLower.startsWith('redap.')) {
        const mainHost = hostLower.slice('redap.'.length);
        const portSuffix = port ? `:${port}` : '';
        return `${protocol}//${mainHost}${portSuffix}${normalizedPath}`;
    }

    return normalizedPath;
};

/**
 * Redireciona para o portal REDAP (externo se em domínio próprio, interno se local/já em redap.*).
 */
export const openRedapPortal = (navigate, subpath = '/redap') => {
    const target = getRedapPortalUrl(subpath);
    if (target.startsWith('http://') || target.startsWith('https://')) {
        window.location.href = target;
    } else if (typeof navigate === 'function') {
        navigate(target);
    } else {
        window.location.href = target;
    }
};

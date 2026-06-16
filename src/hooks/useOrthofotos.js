import { useState, useEffect, useCallback } from 'react';
import { listOrthofotos } from '../services/orthofotoService';

/**
 * Hook para consumir as orthofotos globais do sistema nos mapas.
 * Retorna apenas as orthofotos ativas com bounds definidos.
 * 
 * Uso: const { orthofotos, loading } = useOrthofotos();
 */
const useOrthofotos = () => {
    const [orthofotos, setOrthofotos] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listOrthofotos();
            // Filtra apenas orthofotos ativas e com bounds definidos
            const active = data
                .filter(o => o.ativo && o.bounds)
                .map(o => ({
                    ...o,
                    bounds: typeof o.bounds === 'string' ? JSON.parse(o.bounds) : o.bounds,
                    opacidade: o.opacidade ?? 0.7
                }));
            setOrthofotos(active);
        } catch (e) {
            console.warn('[useOrthofotos] Failed to load orthofotos:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        // Escuta evento de atualização global de orthofotos
        const handler = () => load();
        window.addEventListener('orthofotos-updated', handler);
        return () => window.removeEventListener('orthofotos-updated', handler);
    }, [load]);

    return { orthofotos, loading, reload: load };
};

export default useOrthofotos;

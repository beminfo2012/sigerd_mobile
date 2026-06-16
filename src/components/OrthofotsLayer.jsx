import React from 'react';
import { ImageOverlay, Rectangle } from 'react-leaflet';
import useOrthofotos from '../hooks/useOrthofotos';

/**
 * Componente que renderiza todas as orthofotos globais ativas do sistema.
 * Deve ser colocado DENTRO de um <MapContainer> do react-leaflet.
 *
 * Uso:
 *   import OrthofotsLayer from '../components/OrthofotsLayer';
 *   // Dentro do MapContainer:
 *   <OrthofotsLayer />
 */
const OrthofotsLayer = () => {
    const { orthofotos } = useOrthofotos();

    if (!orthofotos || orthofotos.length === 0) return null;

    return (
        <>
            {orthofotos.map(orto => {
                if (!orto.bounds) return null;

                const isTiff = orto.tipo === 'TIFF' ||
                    (typeof orto.url === 'string' &&
                        (orto.url.toLowerCase().endsWith('.tif') || orto.url.toLowerCase().endsWith('.tiff')));

                if (isTiff) {
                    // TIFF: desenha o retângulo de cobertura com legenda
                    return (
                        <Rectangle
                            key={orto.id}
                            bounds={orto.bounds}
                            pathOptions={{
                                color: '#2563eb',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.08,
                                weight: 2,
                                dashArray: '6, 4'
                            }}
                        />
                    );
                }

                // PNG/JPG: ImageOverlay
                return (
                    <ImageOverlay
                        key={orto.id}
                        url={orto.url}
                        bounds={orto.bounds}
                        opacity={orto.opacidade ?? 0.7}
                    />
                );
            })}
        </>
    );
};

export default OrthofotsLayer;

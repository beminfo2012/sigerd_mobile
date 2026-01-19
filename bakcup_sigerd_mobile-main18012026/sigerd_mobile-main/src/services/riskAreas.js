import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import cprmData from '../data/risk_cprm.json';
import sedurbData from '../data/risk_sedurb.json';

/**
 * Checks if a given coordinate is within any mapped risk area.
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Object|null} Returns the risk area details if found, or null.
 */
export const checkRiskArea = (latitude, longitude) => {
    if (!latitude || !longitude) return null;

    const pt = point([longitude, latitude]); // Turf uses [lng, lat]

    // Helper to check a dataset
    const checkDataset = (data, sourceName) => {
        if (!data || !data.features) return null;

        for (const feature of data.features) {
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                const isInside = booleanPointInPolygon(pt, feature);
                if (isInside) {
                    return {
                        source: sourceName,
                        name: feature.properties?.Name || feature.properties?.NOME || feature.properties?.bairro || 'Área de Risco Desconhecida',
                        riskLevel: feature.properties?.Risco || feature.properties?.GRAU_RISCO || 'Não informado',
                        description: feature.properties?.description || feature.properties?.OBSERVACAO || '',
                        ...feature.properties
                    };
                }
            }
        }
        return null;
    };

    // Check SEDURB first (Municipal might be more precise?)
    const sedurbRisk = checkDataset(sedurbData, 'SEDURB (Municipal)');
    if (sedurbRisk) return sedurbRisk;

    // Check CPRM
    const cprmRisk = checkDataset(cprmData, 'CPRM (Federal)');
    if (cprmRisk) return cprmRisk;

    return null;
};

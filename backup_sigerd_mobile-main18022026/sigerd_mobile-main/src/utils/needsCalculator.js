/**
 * Calculates the estimated needs for a shelter based on the number of occupants
 * for a 7-day period.
 * 
 * @param {number} occupantsCount Number of active occupants in the shelter
 * @returns {Array} Array of need objects { category, item, quantity, unit, icon }
 */
export function calculateShelterNeeds(occupantsCount) {
    const count = parseInt(occupantsCount || 0);

    return [
        {
            category: 'Alimentação',
            item: 'Alimentos (Cestas/Kits)',
            quantity: Math.ceil(count * 14), // 2kg/day * 7 days
            unit: 'kg',
            icon: 'Package',
            description: 'Baseado em 2kg/dia por pessoa'
        },
        {
            category: 'Hidratação',
            item: 'Água Potável',
            quantity: count * 21, // 3L/day * 7 days
            unit: 'Liters',
            icon: 'Droplets',
            description: 'Baseado em 3L/dia por pessoa'
        },
        {
            category: 'Higiene',
            item: 'Kits de Higiene Pessoal',
            quantity: count,
            unit: 'unidades',
            icon: 'Heart',
            description: '1 kit por pessoa/semana'
        },
        {
            category: 'Dormitório',
            item: 'Colchões e Mantas',
            quantity: count,
            unit: 'unidades',
            icon: 'Bed',
            description: '1 kit por pessoa'
        },
        {
            category: 'Vestuário',
            item: 'Mudas de Roupa',
            quantity: count * 2,
            unit: 'kits',
            icon: 'Shirt',
            description: 'Média de 2 mudas por pessoa'
        }
    ];
}

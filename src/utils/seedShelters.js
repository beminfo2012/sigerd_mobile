import { getShelters, addShelter } from '../services/shelterDb.js';
import sheltersData from '../data/shelters_seed.json';

export const seedSheltersIfNeeded = async () => {
    try {
        const existing = await getShelters();
        if (existing && existing.length > 0) {
            console.log("Shelter DB already has data. Skipping seed.");
            return false;
        }

        console.log("Seeding Shelter DB...", sheltersData);
        let count = 0;
        for (const shelter of sheltersData) {
            // Basic validation
            if (shelter.name) {
                await addShelter(shelter);
                count++;
            }
        }
        console.log(`Seeded ${count} shelters.`);
        return true;
    } catch (error) {
        console.error("Error seeding shelters:", error);
        return false;
    }
};

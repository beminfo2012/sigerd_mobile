import axios from 'axios';

// The municipal API is hosted on the same server or reachable via URL
// During development, it might be localhost:3000
const MUNICIPAL_API_URL = '/api/ocorrencias';

/**
 * Fetch visible occurrences from the Municipal SIGERD
 */
export const fetchMunicipalOccurrences = async () => {
    try {
        // In a real scenario, this would call the municipal endpoint
        // For development/demo, we can fetch from the municipal handler implemented earlier
        // Or fallback to mock data if the API is not running
        const response = await axios.get(MUNICIPAL_API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching municipal data:', error);
        // Fallback or rethrow
        throw error;
    }
};

/**
 * Update the State Status of an occurrence
 * This goes to the ESTADUAL database (independent)
 */
export const updateStateStatus = async (occurrenceId, status) => {
    // In actual implementation, this would use Supabase or a state-level API
    console.log(`[State] Updating status of ${occurrenceId} to: ${status}`);
    return { success: true };
};

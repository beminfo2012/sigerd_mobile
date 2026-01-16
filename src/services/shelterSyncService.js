import { supabase } from './supabase';
import { initDB } from './db';

const TABLES = ['shelters', 'occupants', 'families', 'donations', 'inventory', 'distributions'];

export const shelterSyncService = {
    /**
     * Pushes a single record to Supabase
     */
    async pushRecord(table, data) {
        // Remove local-only fields if any, generally 'id' is local auto-increment, 
        // we need to keep the UUID (shelter_id, etc)
        // If the table uses a UUID as primary key in Supabase, we rely on the specific ID field

        const { id, synced, ...recordToPush } = data;

        // Map local fields to Supabase expectations if needed
        // Assuming strict 1:1 mapping for now based on previous code

        try {
            const conflictKey = table === 'shelters' ? 'shelter_id' :
                table === 'occupants' ? 'occupant_id' :
                    table === 'donations' ? 'donation_id' :
                        table === 'inventory' ? 'inventory_id' :
                            table === 'distributions' ? 'distribution_id' : 'id';

            const { error } = await supabase
                .from(table)
                .upsert(recordToPush, { onConflict: conflictKey });

            if (error) throw error;

            // Mark as synced locally
            const db = await initDB();
            const tx = db.transaction(table, 'readwrite');
            const store = tx.objectStore(table);

            // We need to fetch the record again to ensure we don't overwrite newer changes with old data
            // But for 'synced' flag it's usually safe.
            const record = await store.get(id);
            if (record) {
                record.synced = true;
                await store.put(record);
            }
            await tx.done;

            return true;
        } catch (err) {
            console.error(`Sync error on ${table}:`, err);
            return false;
        }
    },

    /**
     * Syncs all pending records from local DB to Supabase
     */
    async syncPending() {
        if (!navigator.onLine) return;

        const db = await initDB();

        for (const table of TABLES) {
            // Get all records where synced is false (or 0)
            // Note: Our new shelterDb uses synced: false (boolean)
            const tx = db.transaction(table, 'readonly');
            const store = tx.objectStore(table);
            const index = store.index('synced');
            const pending = await index.getAll(false);

            for (const record of pending) {
                await this.pushRecord(table, record);
            }
        }
    },

    /**
     * Pulls data from Supabase to local DB
     */
    async pullData() {
        if (!navigator.onLine) return;

        const db = await initDB();

        for (const table of TABLES) {
            try {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    const tx = db.transaction(table, 'readwrite');
                    const store = tx.objectStore(table);

                    for (const item of data) {
                        // We need to handle the merge strategy.
                        // For simplicity, we assume Cloud is truth for these records if we are pulling.
                        // However, we must preserve the local 'id' (auto-increment) if it exists,
                        // to avoid creating duplicates if we re-save.

                        // Strategy: identify by unique ID (shelter_id etc)
                        const uniqueIdField = table === 'shelters' ? 'shelter_id' :
                            table === 'occupants' ? 'occupant_id' :
                                table === 'donations' ? 'donation_id' :
                                    table === 'inventory' ? 'inventory_id' :
                                        table === 'distributions' ? 'distribution_id' : 'id'; // families might rely on default id?

                        const uniqueId = item[uniqueIdField];

                        if (uniqueId) {
                            // Check if exists locally
                            let localId = undefined;
                            if (store.indexNames.contains(uniqueIdField)) {
                                const localRecord = await store.index(uniqueIdField).get(uniqueId);
                                if (localRecord) localId = localRecord.id;
                            }

                            await store.put({
                                ...item,
                                id: localId, // Keep local ID if exists (update), or undefined (add new)
                                synced: true
                            });
                        }
                    }
                    await tx.done;
                }
            } catch (err) {
                console.error(`Pull error on ${table}:`, err);
            }
        }
    },

    /**
     * Initialize listeners (Simplified for IDB)
     * Since we don't have hooks, we set up the online listener.
     */
    init() {
        if (navigator.onLine) {
            this.pullData();
        }
        window.addEventListener('online', () => {
            console.log('Online detected: Syncing pending records...');
            this.syncPending();
            this.pullData();
        });
    },

    /**
     * Calculates the overall synchronization percentage
     */
    async getSyncProgress() {
        const db = await initDB();
        let total = 0;
        let synced = 0;

        for (const table of TABLES) {
            const tx = db.transaction(table, 'readonly');
            const store = tx.objectStore(table);
            const count = await store.count();
            const syncedCount = await store.index('synced').count(true); // Count where synced is true

            total += count;
            synced += syncedCount;
        }

        return total === 0 ? 100 : Math.round((synced / total) * 100);
    }
};

export default shelterSyncService;

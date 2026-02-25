import { supabase } from './supabase';
import { initDB } from './db';

const TABLES = ['shelters', 'occupants', 'donations', 'inventory', 'distributions', 'emergency_contracts'];

export const shelterSyncService = {
    /**
     * Pushes a single record to Supabase
     */
    async pushRecord(table, data) {
        // Map local store names to Supabase table names
        const remoteTableMap = {
            'shelters': 'shelters',
            'occupants': 'shelter_occupants',
            'donations': 'shelter_donations',
            'inventory': 'shelter_inventory',
            'distributions': 'shelter_distributions',
            'emergency_contracts': 'emergency_contracts'
        };

        const remoteTable = remoteTableMap[table] || table;
        const { id, synced, ...recordToPush } = data;

        // Map local fields to Supabase expectations
        if (table === 'shelters') {
            if (recordToPush.contact_phone && !recordToPush.responsible_phone) {
                recordToPush.responsible_phone = recordToPush.contact_phone;
            }
            if (recordToPush.contact_name && !recordToPush.responsible_name) {
                recordToPush.responsible_name = recordToPush.contact_name;
            }
            if (recordToPush.lat && recordToPush.lng && !recordToPush.coordenadas) {
                recordToPush.coordenadas = `${recordToPush.lat}, ${recordToPush.lng}`;
            }
            // Remove local-only fields
            delete recordToPush.contact_phone;
            delete recordToPush.contact_name;
            delete recordToPush.lat;
            delete recordToPush.lng;
        }

        try {
            const conflictKey = table === 'shelters' ? 'shelter_id' :
                table === 'occupants' ? 'occupant_id' :
                    table === 'donations' ? 'donation_id' :
                        table === 'inventory' ? 'inventory_id' :
                            table === 'distributions' ? 'distribution_id' :
                                table === 'emergency_contracts' ? 'contract_id' : 'id';

            const { error } = await supabase
                .from(remoteTable)
                .upsert(recordToPush, { onConflict: conflictKey });

            if (error) throw error;

            // Mark as synced locally
            const db = await initDB();
            const tx = db.transaction(table, 'readwrite');
            const store = tx.objectStore(table);

            const record = await store.get(id);
            if (record) {
                record.synced = true;
                await store.put(record);
            }
            await tx.done;

            return true;
        } catch (err) {
            console.error(`Sync error on ${table} (${remoteTable}):`, err);
            return false;
        }
    },

    /**
     * Syncs all pending records from local DB to Supabase
     */
    async syncPending() {
        if (!navigator.onLine) return;

        try {
            const db = await initDB();

            for (const table of TABLES) {
                if (!db.objectStoreNames.contains(table)) continue;

                const tx = db.transaction(table, 'readonly');
                const store = tx.objectStore(table);
                const index = store.index('synced');
                const pending = await index.getAll(false);

                for (const record of pending) {
                    await this.pushRecord(table, record);
                }
            }
        } catch (error) {
            console.error('Error in syncPending:', error);
        }
    },

    /**
     * Pulls data from Supabase to local DB
     */
    async pullData() {
        if (!navigator.onLine) return;

        const remoteTableMap = {
            'shelters': 'shelters',
            'occupants': 'shelter_occupants',
            'donations': 'shelter_donations',
            'inventory': 'shelter_inventory',
            'distributions': 'shelter_distributions',
            'emergency_contracts': 'emergency_contracts'
        };

        const db = await initDB();

        for (const table of TABLES) {
            const remoteTable = remoteTableMap[table] || table;
            try {
                const { data, error } = await supabase.from(remoteTable).select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    console.log(`[Sync] Pulled ${data.length} records for ${table}`);
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
                                        table === 'distributions' ? 'distribution_id' :
                                            table === 'emergency_contracts' ? 'contract_id' : 'id';

                        const uniqueId = item[uniqueIdField];

                        if (uniqueId) {
                            // Check if exists locally
                            let localId = undefined;
                            let localIsUnsynced = false;

                            if (store.indexNames.contains(uniqueIdField)) {
                                const localRecord = await store.index(uniqueIdField).get(uniqueId);
                                if (localRecord) {
                                    localId = localRecord.id;
                                    // CRITICAL FIX: If local record is unsynced, DO NOT overwrite with server data
                                    if (localRecord.synced === false) {
                                        localIsUnsynced = true;
                                        // console.log(`[Sync] Skipping update for ${table} ${uniqueId} - Local changes pending`);
                                    }
                                }
                            }

                            if (!localIsUnsynced) {
                                await store.put({
                                    ...item,
                                    supabase_id: item.id, // Store Supabase UUID separately
                                    id: localId, // Keep local ID if exists (update), or undefined (add new)
                                    synced: true
                                });
                            }
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

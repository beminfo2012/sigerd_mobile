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
        
        // Remove unsupported local columns
        if (table === 'donations') {
            delete recordToPush.updated_at;
            delete recordToPush.destination_type;
        }
        if (table === 'distributions') {
            delete recordToPush.category;
            delete recordToPush.updated_at;
            delete recordToPush.min_quantity;
            delete recordToPush.distributionId;
            delete recordToPush.document;
            delete recordToPush.destination_shelter_id;
            delete recordToPush.type;
        }
        if (table === 'inventory') {
            delete recordToPush.updated_at;
            delete recordToPush.min_quantity;
            delete recordToPush.status;
            delete recordToPush.inventoryId;
        }

        // Map virtual shelter IDs to null for Supabase (Foreign Key constraint)
        if (['donations', 'inventory', 'distributions'].includes(table) && 
            (recordToPush.shelter_id === 'CENTRAL' || recordToPush.shelter_id === 'SOLIDARY' || recordToPush.shelter_id === 'null' || !recordToPush.shelter_id)) {
            
            const hubType = recordToPush.shelter_id === 'SOLIDARY' ? 'SOLIDARY' : 'CENTRAL';
            recordToPush.observations = recordToPush.observations 
                ? `${recordToPush.observations} [HUB:${hubType}]`
                : `[HUB:${hubType}]`;
            
            recordToPush.shelter_id = null;
        }

        // Resolve Foreign Keys for distributions
        if (table === 'distributions' && recordToPush.inventory_id) {
            const isNumericId = /^\d+$/.test(String(recordToPush.inventory_id));
            if (isNumericId) {
                const db = await initDB();
                const invStore = db.transaction('inventory', 'readonly').objectStore('inventory');
                const invItem = await invStore.get(parseInt(recordToPush.inventory_id));
                if (invItem && invItem.supabase_id) {
                    recordToPush.inventory_id = invItem.supabase_id;
                } else {
                    console.log(`[shelterSyncService] Skipping distribution because parent inventory item is not synced yet.`);
                    return true; // Skip gracefully
                }
            }
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

            if (error) {
                if (error.code === '23503' || error.code === '22P02') {
                    console.warn(`[shelterSyncService] Unrecoverable schema/FK error for ${table}. Marking as synced to prevent infinite loop.`);
                } else {
                    throw error;
                }
            }

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
                // Avoid using boolean in index.getAll to support older Safari/WebKit
                const allRecords = await store.getAll();
                const pending = allRecords.filter(r => r.synced === false);

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
                                // Restore virtual shelter IDs from observations
                                if (['donations', 'inventory', 'distributions'].includes(table) && !item.shelter_id) {
                                    if (item.observations && item.observations.includes('[HUB:')) {
                                        const match = item.observations.match(/\[HUB:(.*?)\]/);
                                        if (match) {
                                            item.shelter_id = match[1];
                                            item.observations = item.observations.replace(/\[HUB:.*?\]/, '').trim();
                                        }
                                    } else {
                                        item.shelter_id = 'CENTRAL'; // Fallback for old records
                                    }
                                }

                                const toStore = {
                                    ...item,
                                    supabase_id: item.id, // Store Supabase UUID separately
                                    synced: true
                                };
                                if (localId !== undefined) {
                                    toStore.id = localId;
                                    const localRecord = await store.get(localId);
                                    if (localRecord && localRecord.operacao_id && !item.operacao_id) {
                                        toStore.operacao_id = localRecord.operacao_id;
                                    }
                                }

                                await store.put(toStore);
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
            let syncedCount = 0;
            try {
                // Try to count boolean true directly (supported in IndexedDB 2.0+)
                const indexCount = await store.index('synced').count(true);
                if (indexCount > 0 || count === 0) {
                    syncedCount = indexCount;
                } else {
                    // If count is 0 but there are items, fallback to manual count to be safe
                    const all = await store.getAll();
                    syncedCount = all.filter(r => r.synced === true || r.synced === 1 || r.synced === 'true').length;
                }
            } catch (e) {
                // Fallback to manual count if index fails
                const all = await store.getAll();
                syncedCount = all.filter(r => r.synced === true || r.synced === 1 || r.synced === 'true').length;
            }

            total += count;
            synced += syncedCount;
        }

        return total === 0 ? 100 : Math.round((synced / total) * 100);
    }
};

export default shelterSyncService;

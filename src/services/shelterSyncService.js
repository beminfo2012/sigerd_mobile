import { supabase } from './supabase';
import { db } from './shelterDb';

/**
 * Service to handle synchronization between IndexedDB (Dexie) and Supabase
 * for the Shelter Management module.
 */
export const shelterSyncService = {
    /**
     * Pushes a single record to Supabase
     */
    async pushRecord(table, data) {
        const { synced, id, ...recordToPush } = data;

        try {
            const { error } = await supabase
                .from(table)
                .upsert(recordToPush, {
                    onConflict: table === 'shelters' ? 'shelter_id' :
                        table === 'occupants' ? 'occupant_id' :
                            table === 'donations' ? 'donation_id' :
                                table === 'inventory' ? 'inventory_id' :
                                    table === 'families' ? 'id' :
                                        'distribution_id'
                });

            if (error) throw error;

            await db[table].where('id').equals(id).modify({ synced: true });
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

        const tables = ['shelters', 'occupants', 'families', 'donations', 'inventory', 'distributions'];

        for (const table of tables) {
            const pending = await db[table].where('synced').equals(0).toArray();
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

        const tables = ['shelters', 'occupants', 'families', 'donations', 'inventory', 'distributions'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    await db[table].bulkPut(data.map(item => ({ ...item, synced: true })));
                }
            } catch (err) {
                console.error(`Pull error on ${table}:`, err);
            }
        }
    },

    /**
     * Initialize listeners for automatic sync
     */
    init() {
        const tables = ['shelters', 'occupants', 'families', 'donations', 'inventory', 'distributions'];

        tables.forEach(table => {
            db[table].hook('creating', (primaryKey, obj) => {
                if (navigator.onLine) {
                    setTimeout(() => {
                        db[table].get(primaryKey).then(record => {
                            if (record) this.pushRecord(table, record);
                        });
                    }, 500);
                }
            });

            db[table].hook('updating', (modifications, primaryKey, obj) => {
                if (navigator.onLine) {
                    setTimeout(() => {
                        db[table].get(primaryKey).then(record => {
                            if (record && !record.synced) {
                                this.pushRecord(table, record);
                            }
                        });
                    }, 500);
                }
            });
        });

        if (navigator.onLine) {
            this.pullData();
        }

        window.addEventListener('online', () => this.syncPending());
    },

    /**
     * Calculates the overall synchronization percentage
     */
    async getSyncProgress() {
        const tables = ['shelters', 'occupants', 'families', 'donations', 'inventory', 'distributions'];
        let total = 0;
        let synced = 0;

        for (const table of tables) {
            const count = await db[table].count();
            const syncedItems = await db[table].where('synced').equals(1).toArray();
            total += count;
            synced += syncedItems.length;
        }

        return total === 0 ? 100 : Math.round((synced / total) * 100);
    }
};

export default shelterSyncService;

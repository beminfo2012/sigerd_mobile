import { initDB } from './db';

/**
 * NotificationRepository - Local IndexedDB persistence for Notifications
 * Enforces strict 1-to-1 mapping by group_key to prevent any duplication.
 */
export const notificationRepository = {
    /**
     * Get all notifications from IndexedDB (deduplicated)
     */
    async getAll() {
        try {
            const db = await initDB();
            const all = await db.getAll('notifications');
            return this.deduplicateInMemory(all);
        } catch (error) {
            console.error('Error reading notifications from IndexedDB:', error);
            return [];
        }
    },

    /**
     * Get notification by ID
     */
    async getById(id) {
        try {
            const db = await initDB();
            return await db.get('notifications', id);
        } catch (error) {
            console.error(`Error getting notification ${id} from IndexedDB:`, error);
            return null;
        }
    },

    /**
     * In-memory deduplication helper: 1 item per group_key, merging read states
     */
    deduplicateInMemory(items = []) {
        if (!Array.isArray(items)) return [];
        const map = new Map();
        for (const item of items) {
            const key = item.group_key || item.id;
            if (map.has(key)) {
                const existing = map.get(key);
                const read = existing.read || item.read;
                const read_at = existing.read_at || item.read_at;
                const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
                if (isItemUuid) {
                    map.set(key, { ...item, read, read_at });
                } else {
                    map.set(key, { ...existing, read, read_at });
                }
            } else {
                map.set(key, item);
            }
        }
        return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    /**
     * Save multiple notifications safely (preventing duplicate group_keys with different IDs)
     */
    async saveAll(notifications) {
        if (!Array.isArray(notifications) || notifications.length === 0) return;
        try {
            const db = await initDB();
            const tx = db.transaction('notifications', 'readwrite');
            const store = tx.objectStore('notifications');
            const groupKeyIndex = store.indexNames.contains('group_key') ? store.index('group_key') : null;

            for (const item of notifications) {
                if (!item || (!item.id && !item.group_key)) continue;
                
                // 1. Check existing record by group_key
                let existing = null;
                if (item.group_key && groupKeyIndex) {
                    existing = await groupKeyIndex.get(item.group_key);
                }
                if (!existing) {
                    existing = await store.get(item.id);
                }

                // 2. If an existing record was found under a different ID, delete old duplicate
                if (existing && existing.id !== item.id) {
                    await store.delete(existing.id);
                }

                // 3. Preserve read status if previously read
                if (existing && existing.read) {
                    item.read = true;
                    item.read_at = existing.read_at || item.read_at;
                }

                await store.put(item);
            }
            await tx.done;
        } catch (error) {
            console.error('Error saving notifications to IndexedDB:', error);
        }
    },

    /**
     * Save or update a single notification
     */
    async save(notification) {
        if (!notification) return;
        await this.saveAll([notification]);
    },

    /**
     * Check if a notification already exists with group_key
     */
    async existsByGroupKey(groupKey) {
        if (!groupKey) return false;
        try {
            const db = await initDB();
            const tx = db.transaction('notifications', 'readonly');
            const store = tx.objectStore('notifications');
            if (store.indexNames.contains('group_key')) {
                const item = await store.index('group_key').get(groupKey);
                return !!item;
            }
            const all = await store.getAll();
            return all.some(n => n.group_key === groupKey);
        } catch (error) {
            return false;
        }
    },

    /**
     * Purge all duplicate notifications sharing the same group_key from IndexedDB
     */
    async purgeDuplicates() {
        try {
            const db = await initDB();
            const all = await db.getAll('notifications');
            const seenGroupKeys = new Map();
            const idsToDelete = [];

            for (const item of all) {
                const key = item.group_key || item.id;
                if (seenGroupKeys.has(key)) {
                    const existing = seenGroupKeys.get(key);
                    const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
                    const isExistingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing.id);

                    if (isItemUuid && !isExistingUuid) {
                        idsToDelete.push(existing.id);
                        seenGroupKeys.set(key, { ...item, read: existing.read || item.read, read_at: existing.read_at || item.read_at });
                    } else {
                        idsToDelete.push(item.id);
                        if (item.read && !existing.read) {
                            existing.read = true;
                            existing.read_at = item.read_at;
                        }
                    }
                } else {
                    seenGroupKeys.set(key, item);
                }
            }

            if (idsToDelete.length > 0) {
                const tx = db.transaction('notifications', 'readwrite');
                for (const delId of idsToDelete) {
                    await tx.store.delete(delId);
                }
                await tx.done;
            }
        } catch (err) {
            console.error('Error purging notification duplicates:', err);
        }
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(id, readAt = new Date().toISOString()) {
        try {
            const db = await initDB();
            const notification = await db.get('notifications', id);
            if (notification) {
                notification.read = true;
                notification.read_at = readAt;
                await db.put('notifications', notification);
            }
        } catch (error) {
            console.error(`Error marking notification ${id} as read in IndexedDB:`, error);
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(readAt = new Date().toISOString()) {
        try {
            const db = await initDB();
            const all = await db.getAll('notifications');
            const tx = db.transaction('notifications', 'readwrite');
            for (const item of all) {
                if (!item.read) {
                    item.read = true;
                    item.read_at = readAt;
                    await tx.store.put(item);
                }
            }
            await tx.done;
        } catch (error) {
            console.error('Error marking all notifications as read in IndexedDB:', error);
        }
    },

    /**
     * Remove read notifications older than retention days (default 30 days)
     */
    async cleanOldNotifications(daysRetention = 30) {
        try {
            const db = await initDB();
            const all = await db.getAll('notifications');
            const thresholdTime = Date.now() - daysRetention * 24 * 60 * 60 * 1000;
            const tx = db.transaction('notifications', 'readwrite');
            for (const item of all) {
                if (item.read && item.read_at) {
                    const readTime = new Date(item.read_at).getTime();
                    if (readTime < thresholdTime) {
                        await tx.store.delete(item.id);
                    }
                }
            }
            await tx.done;
        } catch (error) {
            console.error('Error cleaning old notifications from IndexedDB:', error);
        }
    },

    /**
     * Pending offline sync operations queue
     */
    async queuePendingOp(operation) {
        try {
            const db = await initDB();
            await db.add('pending_notification_ops', {
                ...operation,
                created_at: new Date().toISOString(),
                synced: false
            });
        } catch (error) {
            console.error('Error queueing pending notification op:', error);
        }
    },

    async getPendingOps() {
        try {
            const db = await initDB();
            return await db.getAll('pending_notification_ops');
        } catch (error) {
            console.error('Error getting pending notification ops:', error);
            return [];
        }
    },

    async removePendingOp(id) {
        try {
            const db = await initDB();
            await db.delete('pending_notification_ops', id);
        } catch (error) {
            console.error('Error removing pending notification op:', error);
        }
    }
};

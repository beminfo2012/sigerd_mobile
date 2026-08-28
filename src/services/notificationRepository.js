import { initDB } from './db';

/**
 * NotificationRepository - Local IndexedDB persistence for Notifications
 */
export const notificationRepository = {
    /**
     * Get all notifications from IndexedDB
     */
    async getAll() {
        try {
            const db = await initDB();
            return await db.getAll('notifications');
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
     * Save multiple notifications (bulk insert or update with read status preservation)
     */
    async saveAll(notifications) {
        if (!Array.isArray(notifications) || notifications.length === 0) return;
        try {
            const db = await initDB();
            const tx = db.transaction('notifications', 'readwrite');
            for (const item of notifications) {
                const existing = await tx.store.get(item.id);
                if (existing && existing.read) {
                    item.read = true;
                    item.read_at = existing.read_at || item.read_at;
                }
                await tx.store.put(item);
            }
            await tx.done;
        } catch (error) {
            console.error('Error saving notifications to IndexedDB:', error);
        }
    },

    /**
     * Save or update a single notification (preserving local read status)
     */
    async save(notification) {
        try {
            const db = await initDB();
            const existing = await db.get('notifications', notification.id);
            if (existing && existing.read) {
                notification.read = true;
                notification.read_at = existing.read_at || notification.read_at;
            }
            await db.put('notifications', notification);
        } catch (error) {
            console.error('Error saving notification to IndexedDB:', error);
        }
    },

    /**
     * Check if a notification already exists with group_key
     */
    async existsByGroupKey(groupKey) {
        if (!groupKey) return false;
        try {
            const db = await initDB();
            const item = await db.getFromIndex('notifications', 'group_key', groupKey);
            return !!item;
        } catch (error) {
            console.error('Error checking groupKey existence:', error);
            return false;
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

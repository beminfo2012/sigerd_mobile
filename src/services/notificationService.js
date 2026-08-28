import { supabase } from './supabase';
import { notificationRepository } from './notificationRepository';

/**
 * NotificationService - Remote Sync & Server API Operations with Supabase
 * Optimized with batching & single-query upserts to prevent database connection exhaustion.
 */
class NotificationService {
    constructor() {
        this.remoteDisabled = false;
    }

    /**
     * Factory: Create standardized notification object
     */
    create(data = {}) {
        const id = data.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        return {
            id,
            type: data.type || 'system',
            title: data.title || 'Notificação',
            message: data.message || '',
            created_at: data.created_at || new Date().toISOString(),
            read: data.read || false,
            read_at: data.read_at || null,
            urgency: data.urgency || 'medium',
            reference_id: data.reference_id ? String(data.reference_id) : null,
            reference_type: data.reference_type || null,
            link: data.link || '/',
            icon: data.icon || 'bell',
            expires_at: data.expires_at || null,
            group_key: data.group_key || `gk_${id}`,
            target_role: data.target_role || null,
            user_id: data.user_id ? String(data.user_id) : null,
            metadata: data.metadata || {},
            created_by: data.created_by || 'system'
        };
    }

    /**
     * Push a single notification to Supabase
     */
    async pushRemoteNotification(notification) {
        if (!navigator.onLine || this.remoteDisabled) return null;
        return this.pushRemoteNotificationsBatch([notification]);
    }

    /**
     * Bulk Push multiple notifications to Supabase in lightweight batches of 50
     * Reduces 300+ separate HTTP requests to a single or few bulk SQL queries.
     */
    async pushRemoteNotificationsBatch(items = []) {
        if (!navigator.onLine || this.remoteDisabled || !Array.isArray(items) || items.length === 0) return null;

        const chunkSize = 50;
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            const payload = chunk.map(item => ({
                type: item.type || 'system',
                title: item.title,
                message: item.message,
                created_at: item.created_at || new Date().toISOString(),
                read: item.read || false,
                read_at: item.read_at || null,
                urgency: item.urgency || 'medium',
                reference_id: item.reference_id ? String(item.reference_id) : null,
                reference_type: item.reference_type || null,
                link: item.link || '/',
                icon: item.icon || 'bell',
                expires_at: item.expires_at || null,
                group_key: item.group_key || null,
                target_role: item.target_role || null,
                user_id: item.user_id ? String(item.user_id) : null,
                metadata: item.metadata || {},
                created_by: item.created_by || 'system'
            }));

            try {
                if (supabase && supabase.from) {
                    const { error } = await supabase
                        .from('notifications')
                        .upsert(payload, { onConflict: 'group_key', ignoreDuplicates: true });

                    if (error) {
                        console.warn('[Supabase Notification Batch Push Warning]:', error.message || error);
                        if (error.code === '42P01' || error.status === 404) {
                            this.remoteDisabled = true;
                            break;
                        }
                    } else {
                        this.remoteDisabled = false;
                    }
                }
            } catch (error) {
                console.warn('Failed to push batch remote notifications to Supabase:', error);
            }
        }
        return true;
    }

    /**
     * Bulk resolve Supabase UUIDs in a SINGLE query (.in('group_key', keys))
     */
    async resolveNotificationUuidsBatch(items = []) {
        if (!supabase || !supabase.from || items.length === 0) return new Map();
        
        const uuidMap = new Map();
        const groupKeysToFetch = [];

        items.forEach(item => {
            const id = typeof item === 'string' ? item : item.id;
            const groupKey = typeof item === 'object' ? item.group_key : null;
            const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (isValidUuid) {
                uuidMap.set(id, id);
                if (groupKey) uuidMap.set(groupKey, id);
            } else if (groupKey) {
                groupKeysToFetch.push(groupKey);
            }
        });

        if (groupKeysToFetch.length > 0) {
            try {
                const { data } = await supabase
                    .from('notifications')
                    .select('id, group_key')
                    .in('group_key', groupKeysToFetch);
                if (data && Array.isArray(data)) {
                    data.forEach(row => {
                        if (row.id && row.group_key) {
                            uuidMap.set(row.group_key, row.id);
                        }
                    });
                }
            } catch (err) {
                console.warn('Batch resolve UUIDs error:', err);
            }
        }
        return uuidMap;
    }

    /**
     * Helper to resolve real Supabase UUID for a notification
     */
    async resolveNotificationUuid(id, groupKey = null) {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isValidUuid) return id;

        const map = await this.resolveNotificationUuidsBatch([{ id, group_key: groupKey }]);
        return map.get(groupKey) || map.get(id) || null;
    }

    /**
     * Fetch recent notifications from backend with per-user read tracking (Limit: 15-20)
     */
    async fetchRemoteNotifications(params = {}) {
        if (!navigator.onLine || this.remoteDisabled) {
            return null;
        }

        const { userId, userRole, limit = 20 } = params;

        try {
            if (supabase && supabase.from) {
                let query = supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (userId || userRole) {
                    const filters = ['user_id.is.null', 'target_role.is.null'];
                    if (userId) filters.push(`user_id.eq.${userId}`);
                    if (userRole) filters.push(`target_role.eq.${userRole}`);
                    query = query.or(filters.join(','));
                }

                const { data: rawNotifs, error } = await query;

                if (error) {
                    console.warn('[Supabase Notification Fetch Warning]:', error.message || error);
                    if (error.code === '42P01' || error.status === 404) {
                        this.remoteDisabled = true;
                    }
                    return null;
                }

                if (rawNotifs && Array.isArray(rawNotifs)) {
                    this.remoteDisabled = false;

                    let userReadMap = new Map();
                    if (userId && rawNotifs.length > 0) {
                        try {
                            const notifIds = rawNotifs.map(n => n.id);
                            const { data: userReads } = await supabase
                                .from('user_notifications')
                                .select('notification_id, read, read_at')
                                .eq('user_id', String(userId))
                                .in('notification_id', notifIds);

                            if (userReads && Array.isArray(userReads)) {
                                userReads.forEach(r => userReadMap.set(r.notification_id, r));
                            }
                        } catch {
                            // silent ignore
                        }
                    }

                    return rawNotifs.map(item => {
                        const userReadRecord = userReadMap.get(item.id);
                        if (userReadRecord) {
                            return {
                                ...item,
                                read: userReadRecord.read,
                                read_at: userReadRecord.read_at
                            };
                        }
                        return item;
                    });
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Mark single notification read via API
     */
    async markRemoteAsRead(id, userId = null, groupKey = null) {
        if (!navigator.onLine || this.remoteDisabled) return;
        try {
            const readAt = new Date().toISOString();
            if (supabase && supabase.from) {
                const targetUuid = await this.resolveNotificationUuid(id, groupKey);

                if (userId && targetUuid) {
                    await supabase.from('user_notifications').upsert({
                        notification_id: targetUuid,
                        user_id: String(userId),
                        read: true,
                        read_at: readAt
                    }, { onConflict: 'notification_id, user_id' });
                }

                if (targetUuid) {
                    await supabase.from('notifications').update({ read: true, read_at: readAt }).eq('id', targetUuid);
                }
            }
        } catch (error) {
            console.warn(`Failed to mark notification ${id} as read on Supabase:`, error);
        }
    }

    /**
     * Mark all notifications read via API in ONE bulk query
     */
    async markAllRemoteAsRead(notificationsList = [], userId = null) {
        if (!navigator.onLine || this.remoteDisabled || !Array.isArray(notificationsList) || notificationsList.length === 0) return;
        try {
            const readAt = new Date().toISOString();
            if (supabase && supabase.from) {
                const uuidMap = await this.resolveNotificationUuidsBatch(notificationsList);
                const upsertData = [];

                for (const item of notificationsList) {
                    const notifId = typeof item === 'string' ? item : item.id;
                    const groupKey = typeof item === 'object' ? item.group_key : null;
                    const targetUuid = uuidMap.get(groupKey) || uuidMap.get(notifId);

                    if (targetUuid && userId) {
                        upsertData.push({
                            notification_id: targetUuid,
                            user_id: String(userId),
                            read: true,
                            read_at: readAt
                        });
                    }
                }

                if (upsertData.length > 0) {
                    await supabase
                        .from('user_notifications')
                        .upsert(upsertData, { onConflict: 'notification_id, user_id' });
                }
            }
        } catch (error) {
            console.warn('Failed to mark all notifications as read on Supabase:', error);
        }
    }

    /**
     * Sync pending offline ops to backend
     */
    async syncPendingOps(userId = null) {
        if (!navigator.onLine || this.remoteDisabled) return;
        const pendingOps = await notificationRepository.getPendingOps();
        for (const op of pendingOps) {
            try {
                if (op.operation === 'MARK_AS_READ') {
                    await this.markRemoteAsRead(op.notification_id, userId || op.user_id, op.group_key);
                } else if (op.operation === 'MARK_ALL_AS_READ') {
                    await this.markAllRemoteAsRead(op.notifications || op.notification_ids || [], userId || op.user_id);
                }
                await notificationRepository.removePendingOp(op.id);
            } catch (err) {
                console.error(`Failed to sync pending notification op ${op.id}:`, err);
            }
        }
    }

    /**
     * Request browser notification permission
     */
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (e) {
                // ignore
            }
        }
    }

    /**
     * Browser native desktop notification helper
     */
    showSystemNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, { body, icon: '/pwa-192x192.png' });
            } catch (e) {
                // ignore
            }
        }
    }
}

export const notificationService = new NotificationService();

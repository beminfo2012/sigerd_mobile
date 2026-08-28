import { supabase } from './supabase';
import { notificationRepository } from './notificationRepository';

/**
 * Central Notification Service for SIGERD Mobile
 */
class NotificationService {
    constructor() {
        this.permission = 'default';
        this.remoteDisabled = false;
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    /**
     * Standard creation interface for any SIGERD module
     */
    create({
        type = 'system',
        title,
        message,
        urgency = 'medium',
        reference_id = null,
        reference_type = null,
        link = '/',
        icon = 'bell',
        group_key = null,
        target_role = null,
        user_id = null,
        metadata = {}
    }) {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const gKey = group_key || `${type}-${reference_id || id}`;

        return {
            id,
            type,
            title,
            message,
            created_at: new Date().toISOString(),
            read: false,
            read_at: null,
            urgency,
            reference_id,
            reference_type,
            link,
            icon,
            expires_at: null,
            group_key: gKey,
            target_role,
            user_id,
            metadata,
            created_by: 'system'
        };
    }

    /**
     * Request browser push notification permissions
     */
    async requestPermission() {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return 'granted';
        }
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'error';
        }
    }

    /**
     * Trigger browser system notification
     */
    showSystemNotification(title, body, icon = '/pwa-192x192.png') {
        if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        try {
            const options = {
                body,
                icon,
                badge: '/pwa-192x192.png',
                vibrate: [200, 100, 200]
            };
            const n = new Notification(title, options);
            n.onclick = () => {
                window.focus();
                n.close();
            };
        } catch (error) {
            console.error('Error showing system notification:', error);
        }
    }

    /**
     * Upsert a notification to remote Supabase database table
     */
    async pushRemoteNotification(notification) {
        if (!navigator.onLine) return null;
        try {
            if (supabase && supabase.from) {
                const payload = {
                    type: notification.type || 'system',
                    title: notification.title,
                    message: notification.message,
                    created_at: notification.created_at || new Date().toISOString(),
                    read: notification.read || false,
                    read_at: notification.read_at || null,
                    urgency: notification.urgency || 'medium',
                    reference_id: notification.reference_id ? String(notification.reference_id) : null,
                    reference_type: notification.reference_type || null,
                    link: notification.link || '/',
                    icon: notification.icon || 'bell',
                    expires_at: notification.expires_at || null,
                    group_key: notification.group_key || null,
                    target_role: notification.target_role || null,
                    user_id: notification.user_id ? String(notification.user_id) : null,
                    metadata: notification.metadata || {},
                    created_by: notification.created_by || 'system'
                };

                const { data, error } = await supabase
                    .from('notifications')
                    .upsert(payload, { onConflict: 'group_key' })
                    .select();

                if (error) {
                    console.warn('[Supabase Notification Push Warning]:', error.message || error);
                    if (error.code === '42P01' || error.status === 404) {
                        this.remoteDisabled = true;
                    }
                    return null;
                }

                if (data && data.length > 0) {
                    this.remoteDisabled = false;
                    return data[0];
                }
            }
        } catch (error) {
            console.warn('Failed to push remote notification to Supabase:', error);
        }
        return null;
    }

    /**
     * Helper to resolve real Supabase UUID for a notification (by UUID or group_key)
     */
    async resolveNotificationUuid(id, groupKey = null) {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isValidUuid) return id;

        if (supabase && supabase.from && groupKey) {
            try {
                const { data } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('group_key', groupKey)
                    .maybeSingle();
                if (data && data.id) {
                    return data.id;
                }
            } catch {
                // fall through
            }
        }
        return null;
    }

    /**
     * API Fetch notifications from backend with per-user read tracking & role filtering
     */
    async fetchRemoteNotifications(params = {}) {
        if (!navigator.onLine) {
            return null;
        }

        const { userId, userRole, limit = 50 } = params;

        try {
            if (supabase && supabase.from) {
                let query = supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                // Apply role/user filtering if provided
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

                    // Fetch user's individual read tracking records if userId exists
                    let userReadMap = new Map();
                    if (userId) {
                        try {
                            const { data: userReads } = await supabase
                                .from('user_notifications')
                                .select('notification_id, read, read_at')
                                .eq('user_id', String(userId));

                            if (userReads && Array.isArray(userReads)) {
                                userReads.forEach(r => userReadMap.set(r.notification_id, r));
                            }
                        } catch {
                            // ignore user_notifications lookup error if table missing
                        }
                    }

                    // Merge per-user read state with notifications
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
     * Mark notification read via API (per-user tracking in user_notifications table)
     */
    async markRemoteAsRead(id, userId = null, groupKey = null) {
        if (!navigator.onLine) return;
        try {
            const readAt = new Date().toISOString();
            if (supabase && supabase.from) {
                const targetUuid = await this.resolveNotificationUuid(id, groupKey);

                if (userId && targetUuid) {
                    // Upsert per-user read state into user_notifications
                    const { error: userNotifErr } = await supabase.from('user_notifications').upsert({
                        notification_id: targetUuid,
                        user_id: String(userId),
                        read: true,
                        read_at: readAt
                    }, { onConflict: 'notification_id, user_id' });

                    if (userNotifErr) {
                        console.warn('[user_notifications Upsert Warning]:', userNotifErr.message || userNotifErr);
                    }
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
     * Mark all notifications read via API (per-user tracking in user_notifications table)
     */
    async markAllRemoteAsRead(notificationsList = [], userId = null) {
        if (!navigator.onLine) return;
        try {
            const readAt = new Date().toISOString();
            if (supabase && supabase.from && Array.isArray(notificationsList) && notificationsList.length > 0) {
                const upsertData = [];
                for (const item of notificationsList) {
                    const notifId = typeof item === 'string' ? item : item.id;
                    const groupKey = typeof item === 'object' ? item.group_key : null;
                    const targetUuid = await this.resolveNotificationUuid(notifId, groupKey);
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
                    const { error: batchErr } = await supabase
                        .from('user_notifications')
                        .upsert(upsertData, { onConflict: 'notification_id, user_id' });
                    
                    if (batchErr) {
                        console.warn('[user_notifications Batch Read Warning]:', batchErr.message || batchErr);
                    }
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
        if (!navigator.onLine) return;
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
}

export const notificationService = new NotificationService();

import { supabase } from './supabase';
import { notificationService } from './notificationService';

/**
 * NotificationWebSocket - Supabase Realtime / WebSocket connection manager
 */
export class NotificationWebSocket {
    constructor(onNotificationReceived, onStatusChange) {
        this.onNotificationReceived = onNotificationReceived;
        this.onStatusChange = onStatusChange;
        this.channel = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.isReconnecting = false;
    }

    connect() {
        if (this.channel || this.isReconnecting || notificationService.remoteDisabled) return;

        try {
            if (!supabase || !supabase.channel) {
                this.updateStatus(false);
                return;
            }

            const channelName = `realtime_notifs_${Date.now()}`;
            this.channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications' },
                    (payload) => {
                        if (payload.new && this.onNotificationReceived) {
                            this.onNotificationReceived([payload.new]);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        this.updateStatus(true);
                        this.reconnectAttempts = 0;
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.updateStatus(false);
                        // If channel fails or remote table doesn't exist, don't flood reconnects
                        if (status === 'CHANNEL_ERROR') {
                            notificationService.remoteDisabled = true;
                        } else {
                            this.scheduleReconnect();
                        }
                    }
                });
        } catch (error) {
            this.updateStatus(false);
        }
    }

    updateStatus(newStatus) {
        if (this.connected !== newStatus) {
            this.connected = newStatus;
            if (this.onStatusChange) {
                this.onStatusChange(newStatus);
            }
        }
    }

    scheduleReconnect() {
        if (this.isReconnecting || notificationService.remoteDisabled) return;
        this.isReconnecting = true;
        this.disconnectChannel();

        const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 60000);
        this.reconnectAttempts++;

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.isReconnecting = false;
            if (navigator.onLine && !notificationService.remoteDisabled) {
                this.connect();
            }
        }, delay);
    }

    disconnectChannel() {
        if (this.channel) {
            const ch = this.channel;
            this.channel = null;
            if (supabase) {
                try {
                    supabase.removeChannel(ch);
                } catch (e) {
                    // Ignore disconnect errors
                }
            }
        }
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.isReconnecting = false;
        this.disconnectChannel();
        this.updateStatus(false);
    }
}

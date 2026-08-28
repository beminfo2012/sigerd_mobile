import { notificationService } from './notificationService';

/**
 * NotificationPoller - 60s REST Polling fallback mechanism (Low DB Load)
 */
export class NotificationPoller {
    constructor(onNewNotifications, intervalMs = 60000) {
        this.onNewNotifications = onNewNotifications;
        this.intervalMs = intervalMs;
        this.timer = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.poll();
        this.timer = setInterval(() => this.poll(), this.intervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
    }

    async poll() {
        if (!navigator.onLine || notificationService.remoteDisabled) return;
        try {
            const data = await notificationService.fetchRemoteNotifications({ limit: 15 });
            if (data && Array.isArray(data) && this.onNewNotifications) {
                this.onNewNotifications(data);
            }
        } catch (error) {
            // silent ignore
        }
    }
}

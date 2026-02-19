/**
 * Service to handle browser notifications for SIGERD Mobile
 */
class NotificationService {
    constructor() {
        this.permission = 'default';
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    /**
     * Request permission from the user
     * @returns {Promise<string>} 'granted', 'denied', or 'default'
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return 'unsupported';
        }

        if (Notification.permission === 'granted') {
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
     * Show a notification to the user
     * @param {string} title - Notification title
     * @param {string} body - Notification body text
     * @param {string} icon - Optional icon path
     */
    show(title, body, icon = '/pwa-192x192.png') {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.log('Notification skipped (permission not granted or unsupported)');
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
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Utility to notify about a new record
     * @param {string} type - 'vistoria', 'contrato', 'alerta', etc.
     * @param {Object} data - The record data
     */
    notifyNewRecord(type, data) {
        let title = 'Novo Registro no SIGERD';
        let body = 'Uma nova informação foi adicionada.';
        let icon = '/pwa-192x192.png';

        switch (type) {
            case 'vistoria':
                title = 'Nova Vistoria Realizada 🏠';
                body = `${data.categoria_risco || 'Vistoria'} em ${data.logradouro || 'localização não informada'}`;
                break;
            case 'emergency_contracts':
                title = 'Novo Contrato de Emergência 📜';
                body = `Contrato ${data.contract_number}: ${data.object_description}`;
                break;
            case 'alerta':
                title = 'Alerta Meteorológico ⛈️';
                body = data.description || data.titulo || 'Fique atento às atualizações.';
                break;
        }

        this.show(title, body, icon);
    }
}

export const notificationService = new NotificationService();

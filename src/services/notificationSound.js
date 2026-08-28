/**
 * NotificationSound - Web Audio API synthesizer for alert sound effects
 */
class NotificationSoundService {
    constructor() {
        this.STORAGE_KEY = 'sigerd_notification_sound_enabled';
        this.enabled = this.loadPreference();
        this.audioCtx = null;
    }

    loadPreference() {
        try {
            const val = localStorage.getItem(this.STORAGE_KEY);
            return val !== null ? JSON.parse(val) : true;
        } catch {
            return true;
        }
    }

    setSoundEnabled(enabled) {
        this.enabled = enabled;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(enabled));
        } catch (e) {
            console.error('Failed to save sound preference:', e);
        }
    }

    isSoundEnabled() {
        return this.enabled;
    }

    /**
     * Play short alert chime for Critical notifications
     */
    playCriticalSound() {
        if (!this.enabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!this.audioCtx) {
                this.audioCtx = new AudioContext();
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const now = this.audioCtx.currentTime;

            // Two-tone alert beep (880Hz -> 1174Hz)
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now); // A5
            osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.36);
        } catch (error) {
            console.warn('Could not play alert sound:', error);
        }
    }
}

export const notificationSoundService = new NotificationSoundService();

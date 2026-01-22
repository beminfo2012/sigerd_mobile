import React, { useEffect } from 'react'
import { syncPendingData, getPendingSyncCount } from '../services/db.js'
import { supabase } from '../services/supabase'
import { notificationService } from '../services/notificationService'

const SyncBackground = () => {
    useEffect(() => {
        const performSync = async () => {
            if (!navigator.onLine) return

            try {
                const pendingCount = await getPendingSyncCount()
                if (pendingCount > 0) {
                    console.log(`[SyncBackground] Starting auto-sync for ${pendingCount} items...`)
                    const result = await syncPendingData()
                    if (result.success && result.count > 0) {
                        console.log(`[SyncBackground] Auto-sync complete: ${result.count} items synced.`)
                        // Dispatch custom event to notify components (like Dashboard) to refresh
                        window.dispatchEvent(new CustomEvent('sync-complete', {
                            detail: { count: result.count }
                        }))
                    }
                }
            } catch (error) {
                console.error('[SyncBackground] Sync failed:', error)
            }
        }

        // 1. Check on mount
        performSync()

        // 2. Listen for online event
        const handleOnline = () => {
            console.log('[SyncBackground] Device is back online. Triggering sync...')
            performSync()
        }

        window.addEventListener('online', handleOnline)

        // 3. Set up Realtime Subscriptions
        const setupRealtime = () => {
            if (!navigator.onLine) return null;

            console.log('[SyncBackground] Setting up Realtime subscriptions...');
            const channel = supabase
                .channel('public:realtime_notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vistorias' }, payload => {
                    console.log('[SyncBackground] New Vistoria detected:', payload);
                    notificationService.notifyNewRecord('vistoria', payload.new);
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergency_contracts' }, payload => {
                    console.log('[SyncBackground] New Contract detected:', payload);
                    notificationService.notifyNewRecord('emergency_contracts', payload.new);
                })
                .subscribe();

            return channel;
        }

        const realtimeChannel = setupRealtime();

        // 4. Periodic check (every 5 minutes) as fallback
        const interval = setInterval(performSync, 5 * 60 * 1000)

        return () => {
            window.removeEventListener('online', handleOnline)
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
            }
            clearInterval(interval)
        }
    }, [])

    return null // Non-visual component
}

export default SyncBackground

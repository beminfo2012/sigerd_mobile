import React, { useEffect } from 'react'
import { syncPendingData, getPendingSyncCount, pullAllData } from '../services/db.js'
import { supabase } from '../services/supabase'
import { notificationService } from '../services/notificationService'

const SyncBackground = () => {
    useEffect(() => {
        // Full sync: pull from cloud + push pending changes
        const performFullSync = async () => {
            if (!navigator.onLine) return

            try {
                console.log('[SyncBackground] Full sync starting...')
                await pullAllData()
                await pushPendingChanges()
            } catch (error) {
                console.error('[SyncBackground] Full sync failed:', error)
            }
        }

        // Light sync: only push pending local changes (fast)
        const pushPendingChanges = async () => {
            if (!navigator.onLine) return

            try {
                const pendingCount = await getPendingSyncCount()
                if (pendingCount.total > 0) {
                    console.log(`[SyncBackground] Syncing ${pendingCount.total} pending items...`)
                    const result = await syncPendingData()
                    if (result.success && result.count > 0) {
                        console.log(`[SyncBackground] Synced ${result.count} items.`)

                        // Refresh vistorias cache after sync
                        const { data: freshData, error: fetchErr } = await supabase
                            .from('vistorias')
                            .select('*')
                            .order('created_at', { ascending: false });

                        if (!fetchErr && freshData) {
                            const { saveRemoteVistoriasCache } = await import('../services/db.js');
                            await saveRemoteVistoriasCache(freshData).catch(() => { });
                        }

                        window.dispatchEvent(new CustomEvent('sync-complete', {
                            detail: { count: result.count }
                        }))
                    }
                }
            } catch (error) {
                console.error('[SyncBackground] Push sync failed:', error)
            }
        }

        // Delay initial full sync by 5s so it doesn't fight with login loading
        const initialTimer = setTimeout(() => {
            performFullSync()
        }, 5000)

        // Online event: do full sync
        const handleOnline = () => {
            console.log('[SyncBackground] Back online. Triggering full sync...')
            performFullSync()
        }
        window.addEventListener('online', handleOnline)

        // Realtime Subscriptions
        const setupRealtime = () => {
            if (!navigator.onLine) return null;

            const channel = supabase
                .channel('public:realtime_notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vistorias' }, payload => {
                    notificationService.notifyNewRecord('vistoria', payload.new);
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 's2id_records' }, payload => {
                    notificationService.notifyNewRecord('s2id', payload.new);
                })
                .subscribe();

            return channel;
        }

        const realtimeChannel = setupRealtime();

        // Heartbeat every 5 minutes — only push pending, don't pull everything
        const interval = setInterval(() => {
            pushPendingChanges();
        }, 5 * 60 * 1000)

        return () => {
            clearTimeout(initialTimer)
            window.removeEventListener('online', handleOnline)
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
            }
            clearInterval(interval)
        }
    }, [])

    return null
}

export default SyncBackground


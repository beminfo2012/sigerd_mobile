import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { notificationRepository } from '../services/notificationRepository';
import { notificationService } from '../services/notificationService';
import { NotificationPoller } from '../services/notificationPoller';
import { NotificationWebSocket } from '../services/notificationWebSocket';
import { notificationSoundService } from '../services/notificationSound';
import { initDB } from '../services/db';

const NotificationContext = createContext();

// Helper to format official document numbers (e.g., 001/2026, 002/2026)
const formatDocNumber = (rawId, customNum, dateStr) => {
    if (customNum && typeof customNum === 'string' && customNum.includes('/')) {
        return customNum;
    }
    const year = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
    const num = customNum || rawId;
    if (typeof num === 'number' || (typeof num === 'string' && /^\d+$/.test(num))) {
        return `${String(num).padStart(3, '0')}/${year}`;
    }
    return String(num || `001/${year}`).replace(/^#/, '');
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connected, setConnected] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(() => notificationSoundService.isSoundEnabled());
    const [pluviometroStates, setPluviometroStates] = useState({});

    // Current logged-in user profile details
    const userProfile = useMemo(() => {
        try {
            const saved = localStorage.getItem('userProfile');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }, []);

    const currentUserId = userProfile?.id || userProfile?.email || 'operador_default';
    const currentUserRole = userProfile?.role || 'operador';

    // Unread count
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    // Scan real system records ONCE and push in ONE single batch query to Supabase
    const syncRealSystemNotifications = useCallback(async () => {
        try {
            const db = await initDB();
            const allSystemNotifs = [];
            
            // 1. Check real Interdições in system
            if (db.objectStoreNames.contains('interdicoes')) {
                const realInterdicoes = await db.getAll('interdicoes');
                if (Array.isArray(realInterdicoes)) {
                    for (const item of realInterdicoes) {
                        const targetId = item.supabase_id || item.id || item.interdicao_id || item.interdicaoId;
                        const notifId = `interdicao_${item.id}`;
                        const existing = await notificationRepository.getById(notifId);

                        const itemDate = item.created_at || item.data_hora || new Date().toISOString();
                        const docNum = formatDocNumber(item.id, item.interdicao_id || item.interdicaoId || item.numero_interdicao || item.protocolo, itemDate);
                        const locationStr = [item.logradouro, item.bairro].filter(Boolean).join(', ') || 'Via Pública';
                        const reasonStr = item.motivo_interdicao || item.motivo || item.risco_grau || item.grau_risco || 'Risco Estrutural';

                        const title = `🚧 Interdição nº ${docNum}`;
                        const message = `Endereço: ${locationStr} • Motivo: ${reasonStr}`;
                        
                        allSystemNotifs.push({
                            id: notifId,
                            type: 'interdicao',
                            title,
                            message,
                            created_at: itemDate,
                            read: existing ? existing.read : false,
                            read_at: existing ? existing.read_at : null,
                            urgency: 'medium',
                            reference_id: String(docNum),
                            reference_type: 'interdicao',
                            link: targetId ? `/interdicao/imprimir/${targetId}` : '/interdicao',
                            icon: 'construction',
                            expires_at: null,
                            group_key: `interdicao-${item.id}`,
                            target_role: null,
                            user_id: null,
                            metadata: {},
                            created_by: 'system'
                        });
                    }
                }
            }

            // 2. Check real Vistorias in system with High/Very High risk
            if (db.objectStoreNames.contains('vistorias')) {
                const realVistorias = await db.getAll('vistorias');
                if (Array.isArray(realVistorias)) {
                    for (const item of realVistorias) {
                        const isHighRisk = String(item.nivel_risco || item.categoria_risco || '').toLowerCase().includes('alto') ||
                                           String(item.nivel_risco || item.categoria_risco || '').toLowerCase().includes('emerg');
                        if (isHighRisk) {
                            const targetId = item.supabase_id || item.id || item.vistoria_id || item.vistoriaId;
                            const notifId = `vistoria_${item.id}`;
                            const existing = await notificationRepository.getById(notifId);

                            const itemDate = item.created_at || item.data_hora || new Date().toISOString();
                            const docNum = formatDocNumber(item.id, item.vistoria_id || item.vistoriaId || item.protocolo || item.numero, itemDate);
                            const applicantStr = item.solicitante ? ` • Solicitante: ${item.solicitante}` : '';
                            const locationStr = [item.logradouro, item.bairro].filter(Boolean).join(', ') || 'Localidade';
                            const riskStr = item.nivel_risco || item.categoria_risco || 'Risco Elevado';

                            const title = `🏠 Vistoria nº ${docNum}`;
                            const message = `Local: ${locationStr}${applicantStr} • Risco: ${riskStr}`;

                            allSystemNotifs.push({
                                id: notifId,
                                type: 'vistoria',
                                title,
                                message,
                                created_at: itemDate,
                                read: existing ? existing.read : false,
                                read_at: existing ? existing.read_at : null,
                                urgency: 'high',
                                reference_id: String(docNum),
                                reference_type: 'vistoria',
                                link: targetId ? `/vistorias/imprimir/${targetId}` : '/vistorias',
                                icon: 'file-warning',
                                expires_at: null,
                                group_key: `vistoria-${item.id}`,
                                target_role: null,
                                user_id: null,
                                metadata: {},
                                created_by: 'system'
                            });
                        }
                    }
                }
            }

            // 3. Check real Ocorrências in system
            if (db.objectStoreNames.contains('ocorrencias_operacionais')) {
                const realOcorrencias = await db.getAll('ocorrencias_operacionais');
                if (Array.isArray(realOcorrencias)) {
                    for (const item of realOcorrencias) {
                        const notifId = `ocorrencia_${item.id}`;
                        const existing = await notificationRepository.getById(notifId);

                        const itemDate = item.created_at || item.data_hora || item.data_ocorrencia || new Date().toISOString();
                        const docNum = formatDocNumber(item.id, item.ocorrencia_id_format || item.numero_ocorrencia || item.protocolo || item.codigo, itemDate);
                        const title = `🚨 Ocorrência Operacional nº ${docNum}`;
                        const locationStr = [item.logradouro || item.endereco, item.bairro].filter(Boolean).join(', ') || 'Município';
                        const typeStr = item.tipo_ocorrencia || item.natureza || 'Atendimento Operacional';
                        const message = `Tipo: ${typeStr} • Local: ${locationStr}`;

                        const targetId = item.supabase_id || item.id;
                        allSystemNotifs.push({
                            id: notifId,
                            type: 'ocorrencia',
                            title,
                            message,
                            created_at: itemDate,
                            read: existing ? existing.read : false,
                            read_at: existing ? existing.read_at : null,
                            urgency: 'high',
                            reference_id: String(docNum),
                            reference_type: 'ocorrencia',
                            link: targetId ? `/ocorrencias/imprimir/${targetId}` : '/ocorrencias',
                            icon: 'alert-octagon',
                            expires_at: null,
                            group_key: `ocorrencia-${item.id}`,
                            target_role: null,
                            user_id: null,
                            metadata: {},
                            created_by: 'system'
                        });
                    }
                }
            }

            if (allSystemNotifs.length > 0) {
                // 1. Save all to local IndexedDB
                await notificationRepository.saveAll(allSystemNotifs);
                // 2. Batch push to Supabase in ONE lightweight query (instead of hundreds of requests)
                if (navigator.onLine) {
                    await notificationService.pushRemoteNotificationsBatch(allSystemNotifs);
                }
            }
        } catch (error) {
            console.warn('Scan for real system notifications skipped:', error);
        }
    }, []);

    // Load initial notifications from IndexedDB & Supabase
    const loadLocalNotifications = useCallback(async () => {
        setLoading(true);
        try {
            await notificationRepository.cleanOldNotifications(30);
            
            // Clean legacy fake mock items if present
            const allItems = await notificationRepository.getAll();
            const legacyMockIds = ['1', '2', '3'];
            for (const item of allItems) {
                if (legacyMockIds.includes(item.id) || (item.group_key && item.group_key.includes('noprer-413-26'))) {
                    const db = await initDB();
                    await db.delete('notifications', item.id);
                }
            }

            // Sync real system records into notifications once
            await syncRealSystemNotifications();

            // Fetch remote user-targeted notifications from Supabase (Limit: 20)
            if (navigator.onLine) {
                const remoteNotifs = await notificationService.fetchRemoteNotifications({
                    userId: currentUserId,
                    userRole: currentUserRole,
                    limit: 20
                });
                if (remoteNotifs && Array.isArray(remoteNotifs)) {
                    await notificationRepository.saveAll(remoteNotifs);
                }
            }

            const items = await notificationRepository.getAll();
            setNotifications(items || []);
        } catch (error) {
            console.error('Failed to load local notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [syncRealSystemNotifications, currentUserId, currentUserRole]);

    // Toggle Sound
    const toggleSound = useCallback(() => {
        const nextState = !soundEnabled;
        setSoundEnabled(nextState);
        notificationSoundService.setSoundEnabled(nextState);
    }, [soundEnabled]);

    // Add & deduplicate notification
    const addNotification = useCallback(async (newNotifData) => {
        const item = notificationService.create(newNotifData);

        const existsInState = notifications.some(n => n.group_key === item.group_key);
        const existsInDb = await notificationRepository.existsByGroupKey(item.group_key);

        if (existsInState || existsInDb) {
            return null;
        }

        await notificationRepository.save(item);
        setNotifications(prev => [item, ...prev]);

        if (navigator.onLine) {
            await notificationService.pushRemoteNotification(item);
        }

        if (item.urgency === 'critical') {
            notificationSoundService.playCriticalSound();
            notificationService.showSystemNotification(item.title, item.message);
        }

        return item;
    }, [notifications]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id) => {
        const notifObj = notifications.find(n => n.id === id);
        const groupKey = notifObj ? notifObj.group_key : null;
        const readAt = new Date().toISOString();

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, read_at: readAt } : n));
        await notificationRepository.markAsRead(id, readAt);

        if (navigator.onLine) {
            try {
                await notificationService.markRemoteAsRead(id, currentUserId, groupKey);
            } catch {
                await notificationRepository.queuePendingOp({ operation: 'MARK_AS_READ', notification_id: id, group_key: groupKey, user_id: currentUserId });
            }
        } else {
            await notificationRepository.queuePendingOp({ operation: 'MARK_AS_READ', notification_id: id, group_key: groupKey, user_id: currentUserId });
        }
    }, [notifications, currentUserId]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        const readAt = new Date().toISOString();
        const unreadItems = notifications.filter(n => !n.read);

        setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: readAt })));
        await notificationRepository.markAllAsRead(readAt);

        if (navigator.onLine) {
            try {
                await notificationService.markAllRemoteAsRead(unreadItems, currentUserId);
            } catch {
                await notificationRepository.queuePendingOp({ operation: 'MARK_ALL_AS_READ', notifications: unreadItems, user_id: currentUserId });
            }
        } else {
            await notificationRepository.queuePendingOp({ operation: 'MARK_ALL_AS_READ', notifications: unreadItems, user_id: currentUserId });
        }
    }, [notifications, currentUserId]);

    // Lightweight background sync (only pending ops and recent remote items)
    const sync = useCallback(async () => {
        if (!navigator.onLine || syncing) return;
        setSyncing(true);
        try {
            await notificationService.syncPendingOps(currentUserId);
            const remoteNotifs = await notificationService.fetchRemoteNotifications({
                userId: currentUserId,
                userRole: currentUserRole,
                limit: 15
            });
            if (remoteNotifs && Array.isArray(remoteNotifs)) {
                await notificationRepository.saveAll(remoteNotifs);
            }
            const allLocal = await notificationRepository.getAll();
            setNotifications(allLocal || []);
            setLastSyncAt(new Date().toISOString());
        } catch (error) {
            console.error('Error syncing notifications:', error);
        } finally {
            setSyncing(false);
        }
    }, [syncing, currentUserId, currentUserRole]);

    // Handle WebSocket / Poller remote callbacks
    const handleIncomingRemoteNotifications = useCallback(async (incoming) => {
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        for (const item of incoming) {
            const isForUser = !item.user_id || item.user_id === currentUserId;
            const isForRole = !item.target_role || item.target_role === currentUserRole;
            if (isForUser && isForRole) {
                await addNotification(item);
            }
        }
    }, [addNotification, currentUserId, currentUserRole]);

    // Pluviometer State Machine Engine Rule
    const checkPluviometroRule = useCallback((stationId, stationName, mm24h) => {
        const currentState = pluviometroStates[stationId] || 'NORMAL';

        if (mm24h >= 50) {
            if (currentState === 'NORMAL') {
                addNotification({
                    type: 'pluviometro',
                    title: '💧 Alerta de Chuva Intensa',
                    message: `Pluviômetro "${stationName}" registrou ${mm24h.toFixed(1)}mm nas últimas 24h`,
                    urgency: 'high',
                    reference_id: stationId,
                    reference_type: 'pluviometro',
                    link: '/monitoramento/pluviometria',
                    icon: 'droplets',
                    group_key: `pluviometro-${stationId}-50mm`
                });

                setPluviometroStates(prev => ({ ...prev, [stationId]: 'ALERTA_GERADO' }));
            }
        } else {
            if (currentState === 'ALERTA_GERADO') {
                setPluviometroStates(prev => ({ ...prev, [stationId]: 'NORMAL' }));
            }
        }
    }, [pluviometroStates, addNotification]);

    // NOPRER Document Engine Rule
    const checkNoprerRule = useCallback((documentId, documentTitle, dueDateStr) => {
        if (!dueDateStr) return;
        const dueDate = new Date(dueDateStr);
        const now = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 5) {
            const formattedDate = dueDate.toLocaleDateString('pt-BR');
            addNotification({
                type: 'noprer',
                title: '📄 Prazo de vencimento NOPRER',
                message: `O documento "${documentTitle}" vence em ${formattedDate}`,
                urgency: 'high',
                reference_id: documentId,
                reference_type: 'noprer',
                link: `/noprer/documentos/${documentId}`,
                icon: 'file-warning',
                group_key: `noprer-${documentId}-${dueDateStr}`
            });
        }
    }, [addNotification]);

    // Interdiction Engine Rule
    const checkInterdictionRule = useCallback((interdictionId, title, reason) => {
        addNotification({
            type: 'interdicao',
            title: `🚧 Interdição nº ${interdictionId}`,
            message: `${title} - Motivo: ${reason}`,
            urgency: 'medium',
            reference_id: interdictionId,
            reference_type: 'interdicao',
            link: interdictionId ? `/interdicao/imprimir/${interdictionId}` : '/interdicao',
            icon: 'construction',
            group_key: `interdicao-${interdictionId}`
        });
    }, [addNotification]);

    // Initialize state, WS, poller and network listeners
    useEffect(() => {
        loadLocalNotifications();

        const ws = new NotificationWebSocket(
            handleIncomingRemoteNotifications,
            (isConn) => setConnected(isConn)
        );
        ws.connect();

        const poller = new NotificationPoller(handleIncomingRemoteNotifications, 60000);
        poller.start();

        const handleOnline = () => sync();
        window.addEventListener('online', handleOnline);

        return () => {
            ws.disconnect();
            poller.stop();
            window.removeEventListener('online', handleOnline);
        };
    }, [loadLocalNotifications, handleIncomingRemoteNotifications, sync]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                syncing,
                connected,
                lastSyncAt,
                soundEnabled,
                toggleSound,
                addNotification,
                markAsRead,
                markAllAsRead,
                sync,
                checkPluviometroRule,
                checkNoprerRule,
                checkInterdictionRule
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

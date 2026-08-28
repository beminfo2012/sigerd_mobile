import React, { useMemo } from 'react';
import NotificationItem from './NotificationItem';
import NotificationEmptyState from './NotificationEmptyState';

const NotificationList = ({ notifications, onClosePanel }) => {
    const sortedNotifications = useMemo(() => {
        if (!notifications || !Array.isArray(notifications)) return [];

        return [...notifications].sort((a, b) => {
            // First group: Unread (false) before Read (true)
            if (a.read !== b.read) {
                return a.read ? 1 : -1;
            }
            // Second order: Date descending (newest to oldest)
            const timeA = new Date(a.created_at).getTime() || 0;
            const timeB = new Date(b.created_at).getTime() || 0;
            return timeB - timeA;
        });
    }, [notifications]);

    if (!sortedNotifications || sortedNotifications.length === 0) {
        return <NotificationEmptyState />;
    }

    const unreadItems = sortedNotifications.filter(n => !n.read);
    const readItems = sortedNotifications.filter(n => n.read);

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {unreadItems.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                        <h4 className="text-xs font-black tracking-wider text-slate-500 uppercase">
                            Não lidas ({unreadItems.length})
                        </h4>
                    </div>
                    <div className="space-y-2.5">
                        {unreadItems.map(item => (
                            <NotificationItem
                                key={item.id}
                                notification={item}
                                onClosePanel={onClosePanel}
                            />
                        ))}
                    </div>
                </div>
            )}

            {readItems.length > 0 && (
                <div className="space-y-2 pt-2">
                    {unreadItems.length > 0 && <div className="border-t border-slate-100 my-3" />}
                    <div className="px-1">
                        <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                            Anteriores ({readItems.length})
                        </h4>
                    </div>
                    <div className="space-y-2.5">
                        {readItems.map(item => (
                            <NotificationItem
                                key={item.id}
                                notification={item}
                                onClosePanel={onClosePanel}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationList;

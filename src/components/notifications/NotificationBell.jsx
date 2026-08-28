import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationBadge from './NotificationBadge';
import NotificationPanel from './NotificationPanel';

const NotificationBell = () => {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => {
        setIsOpen(prev => !prev);
    };

    const closePanel = () => {
        setIsOpen(false);
    };

    const ariaLabelText = unreadCount > 0 
        ? `Notificações, ${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
        : 'Notificações';

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={togglePanel}
                aria-label={ariaLabelText}
                title={ariaLabelText}
                className="relative p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-white/20"
            >
                <Bell size={20} className={unreadCount > 0 ? 'text-amber-300 animate-pulse' : 'text-white'} />
                <NotificationBadge count={unreadCount} />
            </button>

            <NotificationPanel
                isOpen={isOpen}
                onClose={closePanel}
            />
        </div>
    );
};

export default NotificationBell;

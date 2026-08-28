import React from 'react';

/**
 * NotificationBadge - Displays unread notifications badge count
 */
const NotificationBadge = ({ count }) => {
    if (!count || count <= 0) return null;

    const displayCount = count > 99 ? '99+' : count;

    return (
        <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[10px] leading-none px-1.5 py-0.5 rounded-full shadow-md border border-white flex items-center justify-center min-w-[18px] min-h-[18px] animate-in zoom-in-50 duration-200"
            style={{ backgroundColor: '#dc2626' }}
        >
            {displayCount}
        </span>
    );
};

export default NotificationBadge;

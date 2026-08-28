import React from 'react';
import { 
    AlertTriangle, 
    FileWarning, 
    CloudRain, 
    Droplets, 
    Construction, 
    Bell, 
    CheckCircle2, 
    Clock,
    AlertOctagon,
    ExternalLink
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const urgencyStyles = {
    critical: {
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        badgeBg: '#dc2626',
        badgeText: '#ffffff',
        label: 'CRÍTICO'
    },
    high: {
        color: '#f97316',
        bg: '#fff7ed',
        border: '#ffedd5',
        badgeBg: '#f97316',
        badgeText: '#ffffff',
        label: 'ALTA'
    },
    medium: {
        color: '#eab308',
        bg: '#fefce8',
        border: '#fef08a',
        badgeBg: '#eab308',
        badgeText: '#ffffff',
        label: 'MÉDIA'
    },
    low: {
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#dbeafe',
        badgeBg: '#3b82f6',
        badgeText: '#ffffff',
        label: 'BAIXA'
    }
};

const renderIcon = (iconName, color) => {
    const props = { size: 20, style: { color }, className: "shrink-0" };
    switch (iconName) {
        case 'file-warning':
            return <FileWarning {...props} />;
        case 'cloud-rain':
            return <CloudRain {...props} />;
        case 'droplets':
            return <Droplets {...props} />;
        case 'construction':
            return <Construction {...props} />;
        case 'alert-octagon':
            return <AlertOctagon {...props} />;
        default:
            return <Bell {...props} />;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return dateString;
    }
};

const NotificationItem = ({ notification, onClosePanel }) => {
    const { markAsRead } = useNotifications();

    const { id, title, message, created_at, read, urgency, link, icon, reference_id } = notification;
    const style = urgencyStyles[urgency] || urgencyStyles.medium;

    const handleClick = (e) => {
        e.stopPropagation();
        if (!read) {
            markAsRead(id);
        }
        if (onClosePanel) onClosePanel();
        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    };

    const handleMarkRead = (e) => {
        e.stopPropagation();
        markAsRead(id);
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                read ? 'bg-white/80 border-slate-200 opacity-80 hover:opacity-100' : 'border-l-4 shadow-sm'
            }`}
            style={{
                backgroundColor: read ? '#ffffff' : style.bg,
                borderColor: read ? '#e2e8f0' : style.border,
                borderLeftColor: style.color
            }}
        >
            <div className="flex items-start gap-3">
                {/* Status indicator & Icon */}
                <div className="relative pt-0.5">
                    {renderIcon(icon, style.color)}
                    {!read && (
                        <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse"
                            style={{ backgroundColor: style.color }}
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
                                style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
                            >
                                ● {style.label}
                            </span>
                            {reference_id && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/80">
                                    {reference_id.toLowerCase().includes('nº') 
                                        ? reference_id 
                                        : `nº ${reference_id.replace(/^#/, '')}`}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium shrink-0">
                            <Clock size={12} />
                            <span>{formatDate(created_at)}</span>
                        </div>
                    </div>

                    <h4 className={`text-sm font-bold leading-snug mb-1 ${read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {title}
                    </h4>

                    <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${read ? 'text-slate-500' : 'text-slate-600 font-normal'}`}>
                        {message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                        <span className="text-[11px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                            <ExternalLink size={12} />
                            <span>Ver relatório em nova aba &rarr;</span>
                        </span>

                        {!read && (
                            <button
                                type="button"
                                onClick={handleMarkRead}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-2xs active:scale-95"
                            >
                                <CheckCircle2 size={13} className="text-emerald-500" />
                                Marcar como lida
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;

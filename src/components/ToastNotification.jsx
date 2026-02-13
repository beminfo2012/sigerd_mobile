import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLORS = {
    success: {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
        title: 'text-emerald-900 dark:text-emerald-200',
        msg: 'text-emerald-700 dark:text-emerald-300',
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-500/10',
        border: 'border-red-200 dark:border-red-500/30',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-900 dark:text-red-200',
        msg: 'text-red-700 dark:text-red-300',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/30',
        icon: 'text-amber-600 dark:text-amber-400',
        title: 'text-amber-900 dark:text-amber-200',
        msg: 'text-amber-700 dark:text-amber-300',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/30',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-900 dark:text-blue-200',
        msg: 'text-blue-700 dark:text-blue-300',
    },
};

const Toast = ({ id, type = 'success', title, message, onDismiss, duration = 4000 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        const timer = setTimeout(() => dismiss(), duration);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setIsLeaving(true);
        setTimeout(() => onDismiss(id), 300);
    };

    const Icon = ICONS[type] || ICONS.info;
    const color = COLORS[type] || COLORS.info;

    return (
        <div
            className={`flex items-start gap-3 p-4 pr-3 rounded-2xl border shadow-lg backdrop-blur-sm
                ${color.bg} ${color.border}
                transition-all duration-300 ease-out
                ${isVisible && !isLeaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
        >
            <div className={`mt-0.5 flex-shrink-0 ${color.icon}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                {title && <p className={`text-sm font-bold ${color.title}`}>{title}</p>}
                {message && <p className={`text-xs ${color.msg} mt-0.5 leading-relaxed`}>{message}</p>}
            </div>
            <button
                onClick={dismiss}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// --- Toast Container & Hook ---

let toastListeners = [];
let toastCounter = 0;

const toastBase = (title, messageOrType) => {
    if (['success', 'error', 'warning', 'info'].includes(messageOrType)) {
        notify(messageOrType, title);
    } else {
        notify('info', title, messageOrType);
    }
};

toastBase.success = (title, message) => notify('success', title, message);
toastBase.error = (title, message) => notify('error', title, message);
toastBase.warning = (title, message) => notify('warning', title, message);
toastBase.info = (title, message) => notify('info', title, message);

export const toast = toastBase;
export const useToast = () => ({ toast: toastBase });

const notify = (type, title, message) => {
    const id = ++toastCounter;
    const t = { id, type, title, message };
    toastListeners.forEach(fn => fn(t));
};

export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (t) => setToasts(prev => [...prev.slice(-4), t]);
        toastListeners.push(handler);
        return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[200] flex flex-col gap-2">
            {toasts.map(t => (
                <Toast key={t.id} {...t} onDismiss={dismiss} />
            ))}
        </div>
    );
};

export default ToastContainer;

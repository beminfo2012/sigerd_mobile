export function Badge({ status, children, className = '' }) {
    const statusStyles = {
        active: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
        inactive: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        full: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
    };

    const dotColors = {
        active: 'bg-emerald-500',
        inactive: 'bg-slate-400',
        full: 'bg-orange-500',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${statusStyles[status]} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`}></span>
            <span className="text-[8px] font-bold uppercase tracking-widest">
                {children}
            </span>
        </span>
    );
}

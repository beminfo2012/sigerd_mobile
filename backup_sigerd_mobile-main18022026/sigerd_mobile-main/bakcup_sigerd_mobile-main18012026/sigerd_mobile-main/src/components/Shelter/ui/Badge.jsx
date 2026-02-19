export function Badge({ status, children, className = '' }) {
    const statusStyles = {
        active: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        inactive: 'bg-slate-100 border-slate-200 text-slate-600',
        full: 'bg-orange-50 border-orange-200 text-orange-700',
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

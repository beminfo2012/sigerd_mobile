export function Card({ children, className = '', onClick, variant = 'default' }) {
    const variants = {
        default: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm',
        gradient: 'bg-gradient-to-br from-[#1e3c72] to-[#2a5299] rounded-[32px] shadow-lg shadow-blue-100 dark:shadow-none',
        stat: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm',
    };

    const baseClasses = onClick ? 'cursor-pointer active:scale-95 transition-all' : '';

    return (
        <div
            className={`${variants[variant]} ${baseClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

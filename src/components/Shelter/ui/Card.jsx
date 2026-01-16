export function Card({ children, className = '', onClick, variant = 'default' }) {
    const variants = {
        default: 'bg-white border border-slate-100 rounded-2xl shadow-sm',
        gradient: 'bg-gradient-to-br from-[#1e3c72] to-[#2a5299] rounded-[32px] shadow-lg shadow-blue-100',
        stat: 'bg-white border border-slate-100 rounded-[28px] shadow-sm',
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

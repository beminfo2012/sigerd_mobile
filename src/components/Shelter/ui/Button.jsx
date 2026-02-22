export function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-[#2a5299] dark:bg-blue-600 text-white hover:bg-[#1e3c72] dark:hover:bg-blue-700',
        secondary: 'bg-white dark:bg-slate-800 text-[#2a5299] dark:text-blue-400 border border-[#2a5299] dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
        <button
            className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

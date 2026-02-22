export function Input({ label, required, error, icon, ...props }) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all ${error ? 'border-red-500' : ''}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-600 font-bold">{error}</p>
            )}
        </div>
    );
}

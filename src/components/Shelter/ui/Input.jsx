export function Input({ label, required, error, icon: Icon, ...props }) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${Icon ? 'pl-12' : ''} ${error ? 'border-red-500' : ''}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-600 font-bold">{error}</p>
            )}
        </div>
    );
}

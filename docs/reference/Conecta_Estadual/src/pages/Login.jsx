import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Mock authentication for now (as per plan)
        // In production, this would use Supabase
        setTimeout(() => {
            if (email && password) {
                onLogin();
            } else {
                setError('Por favor, preencha todos os campos.');
                setLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden font-inter">
            {/* Background Animated Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse-slow delay-1000"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[80px] animate-pulse-slow delay-2000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">

                    {/* Header & Logo */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
                            <ShieldCheck size={40} className="text-white" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Conecta Estadual</h1>
                        <p className="text-slate-300 text-sm">Painel Administrativo da Defesa Civil</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Email Input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={20} className="text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block w-full pl-12 p-4 transition-all"
                                    placeholder="Seu e-mail institucional"
                                />
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block w-full pl-12 p-4 transition-all"
                                    placeholder="Sua senha"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs text-center animate-fade-in">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-offset-slate-900" />
                                <span>Lembrar-me</span>
                            </label>
                            <a href="#" className="hover:text-blue-400 transition-colors">Esqueceu a senha?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            <span>{loading ? 'Acessando...' : 'Entrar no Sistema'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center border-t border-white/10 pt-6">
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} SIGERD - Sistema Integrado de Gerenciamento.
                            <br />Acesso restrito a pessoal autorizado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

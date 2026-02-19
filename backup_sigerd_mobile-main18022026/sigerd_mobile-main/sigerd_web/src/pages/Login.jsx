import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import { supabase } from '../services/supabase'

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            onLogin()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">SIGERD Web</h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Central de Comando
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-400 font-bold">
                        Defesa Civil Municipal - SMJ
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login

import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Fingerprint, User, Lock, Info, ShieldAlert, LogIn, Loader2 } from 'lucide-react'

const MobileLoginView = ({
    username, setUsername, password, setPassword, loading, error, handleSubmit, handleBiometricLogin
}) => (
    <div
        className="fixed inset-0 w-screen h-screen flex flex-col justify-center items-center overflow-hidden font-sans"
        style={{ backgroundColor: '#102754' }}
    >
        <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10 px-8">
            {/* Logo & Brand */}
            <div className="flex flex-col items-center gap-4 text-center">
                <img
                    src="/logo_sigerd_new.png"
                    alt="Logo SIGERD"
                    className="w-32 h-32 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                    <h1 className="text-5xl font-bold text-white tracking-widest leading-none">SIGERD</h1>
                    <p className="text-[13px] text-white/70 font-medium mt-4 leading-relaxed">
                        Sistema Integrado de Gerenciamento de<br />Riscos e Desastres
                    </p>
                </div>
            </div>

            {/* Auth Section */}
            <div className="w-full flex flex-col gap-6">
                <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-full font-bold text-[#102754] bg-white transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 h-[60px] text-lg shadow-lg"
                >
                    <Fingerprint size={28} />
                    Entrar com a Digital
                </button>

                <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-white/20" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
                        ou use sua conta
                    </span>
                    <div className="h-[1px] flex-1 bg-white/20" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                            type="text"
                            placeholder="E-mail"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#1e293b]/30 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-all text-base font-medium"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#1e293b]/30 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-all text-base font-medium"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-200">
                            <ShieldAlert size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2.5 rounded-3xl font-bold text-white transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 h-16 text-xl mt-2"
                        style={{
                            backgroundColor: '#ff5722',
                            boxShadow: '0 8px 30px rgba(255, 87, 34, 0.3)',
                        }}
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={24} /> Entrando...</>
                        ) : (
                            "Entrar no App"
                        )}
                    </button>
                </form>
            </div>

            {/* Rodapé */}
            <div className="flex flex-col items-center gap-1.5 text-center mt-4">
                <p className="text-[12px] font-bold text-white" style={{ opacity: 0.9 }}>
                    Defesa Civil de Santa Maria de Jetibá
                </p>
                <p className="text-[11px] text-white/40 font-medium">
                    © 2024-2026 SIGERD Mobile
                </p>
            </div>
        </div>
    </div>
);

const WebLoginView = ({
    username, setUsername, password, setPassword, loading, error, handleSubmit
}) => {
    const [currentBg, setCurrentBg] = useState(0);
    const backgrounds = [
        '/assets/img/login_bg_rescue.png',
        '/assets/img/login_bg_humanitarian.png',
        '/assets/img/login_bg_mud_rescue.png',
        '/assets/img/login_bg_def_smj.jpeg'
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full flex bg-[#122e65] font-sans selection:bg-blue-500/30">
            {/* Left Side: Dynamic Backgrounds & Bold Message */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden">
                {/* Background Slideshow */}
                {backgrounds.map((bg, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentBg === idx ? 'opacity-50' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url(${bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Overlay to darken image slightly for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#122e65] via-transparent to-transparent opacity-60"></div>
                        <div className="absolute inset-0 bg-[#122e65]/20"></div>
                    </div>
                ))}

                {/* Content Overlay */}
                <div className="relative z-10 w-full h-full flex flex-col justify-end p-24 pb-32">
                    <div className="max-w-xl">
                        <div className="mb-4">
                            <h2 className="text-7xl font-black text-white leading-none tracking-tighter">
                                CONSTRUINDO<br />
                                <span className="text-blue-500">A RESILIÊNCIA</span>
                            </h2>
                        </div>

                        <div className="flex gap-6 items-start mt-8">
                            <div className="w-1.5 h-20 bg-blue-600 rounded-full shrink-0"></div>
                            <p className="text-lg text-white/60 font-medium leading-relaxed max-w-md">
                                Plataforma integrada de gestão e resposta a desastres.
                                Controle total das ocorrências, vistorias e monitoramento em tempo real.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Professional Dark Login Panel */}
            <div className="w-full lg:w-[500px] flex flex-col justify-center items-center bg-[#122e65] p-12 relative">
                {/* Ambient glow in background */}
                <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>

                <div className="w-full max-w-sm space-y-12 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <img
                            src="/logo_sigerd_new.png"
                            className="w-24 h-24 object-contain"
                            alt="SIGERD"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Bem-Vindo de Volta</h2>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">Insira suas credenciais para continuar</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Usuário / E-mail</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="exemplo@s2id.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full h-14 pl-16 pr-6 rounded-2xl bg-[#eff3ff] border-none outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-[#050a18] placeholder:text-slate-400 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-14 pl-16 pr-6 rounded-2xl bg-[#eff3ff] border-none outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-[#050a18] placeholder:text-slate-400 shadow-inner"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                                <ShieldAlert size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={20} /> Autenticando...</>
                                ) : (
                                    <>Acessar <LogIn size={18} /></>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="pt-8 flex flex-col items-center">
                        <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[2px] hover:text-white/40 transition-colors cursor-help">
                            <Info size={14} />
                            <span>Contate a COMPDEC-SMJ para ajuda</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 text-[10px] font-bold text-white/10 uppercase tracking-[4px]">
                    SIGERD Mobile v3.0
                </div>
            </div>
        </div>
    );
};

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const base64ToUint8Array = (base64) => {
        const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    }

    const uint8ArrayToBase64Url = (uint8Array) => {
        return window.btoa(String.fromCharCode(...uint8Array))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    const handleBiometricLogin = async () => {
        setError('')
        const savedEmail = localStorage.getItem('biometric_email')
        if (!savedEmail) { setError('Faça login com senha primeiro para ativar a biometria.'); return }
        setLoading(true)
        try {
            const { data: options, error: optError } = await supabase.functions.invoke('webauthn', {
                body: { action: 'generate-authentication-options', email: savedEmail, origin: window.location.origin }
            })
            if (optError) throw optError
            options.allowCredentials = options.allowCredentials.map(c => ({ ...c, id: base64ToUint8Array(c.id) }))
            options.challenge = base64ToUint8Array(options.challenge)
            const credential = await navigator.credentials.get({ publicKey: options })
            if (!credential) throw new Error('Falha ao obter credencial')
            const authResponse = {
                id: credential.id,
                rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
                type: credential.type,
                response: {
                    authenticatorData: uint8ArrayToBase64Url(new Uint8Array(credential.response.authenticatorData)),
                    clientDataJSON: uint8ArrayToBase64Url(new Uint8Array(credential.response.clientDataJSON)),
                    signature: uint8ArrayToBase64Url(new Uint8Array(credential.response.signature)),
                    userHandle: credential.response.userHandle ? uint8ArrayToBase64Url(new Uint8Array(credential.response.userHandle)) : null,
                },
                clientExtensionResults: credential.getClientExtensionResults(),
            }
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('webauthn', {
                body: { action: 'verify-authentication', email: savedEmail, authenticationResponse: authResponse, origin: window.location.origin }
            })
            if (verifyError) {
                let msg = verifyError.message;
                try { const d = await verifyError.response?.json(); if (d?.error) msg = d.error; } catch (_) { }
                throw new Error(msg);
            }
            if (verifyResult.verified && verifyResult.loginUrl) onLogin()
            else setError('Falha na verificação biométrica')
        } catch (err) {
            setError('Erro na biometria: ' + (err.message || 'Tente novamente'))
        } finally { setLoading(false) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!navigator.onLine) {
            setError('⚠️ Sem internet. Conecte-se para entrar pela primeira vez.')
            return
        }

        setLoading(true)
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email: username, password })
            if (authError) {
                setError('Usuário ou senha inválidos')
                setLoading(false)
                return
            }
            onLogin()
        } catch (err) {
            setError('Erro ao conectar. Verifique sua conexão.')
            setLoading(false)
        }
    }

    const commonProps = { username, setUsername, password, setPassword, loading, error, handleSubmit, handleBiometricLogin };

    return isMobile ? <MobileLoginView {...commonProps} /> : <WebLoginView {...commonProps} />;
}

export default Login

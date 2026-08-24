import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { Fingerprint, User, Lock, Info, ShieldAlert, LogIn, Loader2, Eye, EyeOff } from 'lucide-react'

const MobileLoginView = ({
    username, setUsername, password, setPassword, loading, error, handleSubmit, handleBiometricLogin, showPassword, setShowPassword
}) => (
    <div
        className="fixed inset-0 w-screen h-screen flex flex-col items-center overflow-hidden font-sans pt-8 pb-7 px-8"
        style={{ background: 'radial-gradient(120% 70% at 50% 0%, #16224a 0%, #0e1836 45%, #091230 100%)' }}
    >
        {/* logo */}
        <div className="mt-[18px] flex flex-col items-center">
            <div className="relative w-[132px] h-[132px] flex items-center justify-center before:content-[''] before:absolute before:-inset-5 before:bg-[radial-gradient(circle,rgba(255,87,34,0.18)_0%,rgba(255,87,34,0)_70%)]">
                <img src="/logo_header.png" alt="SIGERD" className="w-[96px] h-[96px] object-contain relative z-10" />
            </div>
            <div className="mt-[14px] font-display font-extrabold text-[34px] tracking-[6px] text-white">SIGERD</div>
            <div className="mt-[10px] font-sans font-normal text-[12.5px] leading-[1.6] tracking-[0.1px] text-[#aab4d6] text-center max-w-[250px]">
                Sistema Integrado de Gerenciamento<br />de Riscos e Desastres
            </div>
        </div>

        <div className="w-full max-w-[326px] mt-[26px] flex flex-col items-stretch">
            <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full h-[52px] rounded-[14px] border-[1.5px] border-white/30 bg-white/5 text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-[10px] cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-white/40 disabled:opacity-50"
            >
                <Fingerprint size={19} className="opacity-90" />
                Entrar com a Digital
            </button>

            <div className="flex items-center gap-[14px] my-6">
                <span className="flex-1 h-[1px] bg-white/10"></span>
                <span className="text-[10.5px] tracking-[1.6px] text-[#5f6a92] font-semibold whitespace-nowrap">OU USE SUA CONTA</span>
                <span className="flex-1 h-[1px] bg-white/10"></span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="relative mb-4 group">
                    <User className="absolute left-[14px] top-[18px] w-[19px] h-[19px] text-[#aab4d6] pointer-events-none transition-colors duration-160 group-focus-within:text-orange-mobile-soft" strokeWidth={1.8} />
                    <input
                        type="text"
                        id="email"
                        placeholder=" "
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="peer w-full h-[56px] bg-white/5 border-[1.3px] border-white/10 rounded-[13px] pt-[20px] pb-[6px] px-[44px] text-white font-sans text-[15px] font-medium outline-none transition-all duration-160 focus:border-orange-mobile focus:shadow-[0_0_0_3.5px_rgba(255,87,34,0.16)]"
                    />
                    <label htmlFor="email" className="absolute left-[44px] top-[18px] text-[#aab4d6] text-[14.5px] font-normal pointer-events-none origin-top-left transition-all duration-160 peer-focus:top-[9px] peer-focus:scale-75 peer-focus:text-orange-mobile-soft peer-[&:not(:placeholder-shown)]:top-[9px] peer-[&:not(:placeholder-shown)]:scale-75 peer-[&:not(:placeholder-shown)]:text-orange-mobile-soft">E-mail</label>
                </div>

                <div className="relative mb-4 group">
                    <Lock className="absolute left-[14px] top-[18px] w-[19px] h-[19px] text-[#aab4d6] pointer-events-none transition-colors duration-160 group-focus-within:text-orange-mobile-soft" strokeWidth={1.8} />
                    <input
                        type={showPassword ? "text" : "password"}
                        id="senha"
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="peer w-full h-[56px] bg-white/5 border-[1.3px] border-white/10 rounded-[13px] pt-[20px] pb-[6px] px-[44px] text-white font-sans text-[15px] font-medium outline-none transition-all duration-160 focus:border-orange-mobile focus:shadow-[0_0_0_3.5px_rgba(255,87,34,0.16)]"
                    />
                    <label htmlFor="senha" className="absolute left-[44px] top-[18px] text-[#aab4d6] text-[14.5px] font-normal pointer-events-none origin-top-left transition-all duration-160 peer-focus:top-[9px] peer-focus:scale-75 peer-focus:text-orange-mobile-soft peer-[&:not(:placeholder-shown)]:top-[9px] peer-[&:not(:placeholder-shown)]:scale-75 peer-[&:not(:placeholder-shown)]:text-orange-mobile-soft">Senha</label>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-[14px] top-[18px] text-[#c7cfe8] opacity-85 hover:opacity-100 transition-opacity"
                    >
                        {showPassword ? <EyeOff size={20} strokeWidth={1.8} /> : <Eye size={20} strokeWidth={1.8} />}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-200">
                        <ShieldAlert size={14} className="shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[56px] mt-1.5 border-none rounded-[14px] bg-gradient-to-b from-[#ff6a33] to-orange-mobile text-white font-sans font-bold text-[16px] tracking-[0.2px] shadow-[0_10px_24px_-6px_rgba(255,87,34,0.55)] transition-all duration-120 hover:-translate-y-[1px] hover:shadow-[0_14px_28px_-6px_rgba(255,87,34,0.65)] active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" size={24} /> Entrando...</>
                    ) : (
                        "Entrar no App"
                    )}
                </button>
            </form>
        </div>

        <div className="flex-1"></div>

        <div className="text-center pb-1.5">
            <div className="text-[13px] font-semibold text-white/90 font-sans">Defesa Civil de Santa Maria de Jetibá</div>
            <div className="mt-[5px] text-[10.5px] text-[#333d5e] font-sans">© 2024–2026 SIGERD Mobile</div>
        </div>
    </div>
);

const WebLoginView = ({
    username, setUsername, password, setPassword, loading, error, handleSubmit, showPassword, setShowPassword
}) => {
    const [currentBg, setCurrentBg] = useState(0);
    const backgrounds = [
        '/assets/img/login_bg_rescue.png',
        '/assets/img/login_bg_humanitarian.png',
        '/assets/img/login_bg_mud_rescue.png',
        '/assets/img/login_bg_def_smj.jpeg',
        '/assets/img/login_bg_def_smj_acre.jpeg'
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
                <div className="relative z-10 w-full h-full flex flex-col justify-start p-24 pb-32">
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
            <div className="w-full lg:w-[500px] flex flex-col justify-start pt-16 items-center bg-[#122e65] p-12 relative">
                {/* Ambient glow in background */}
                <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>

                <div className="w-full max-w-sm space-y-10 relative z-10">
                    <div className="flex flex-col items-center gap-6">
                        <img
                            src="/logo_sigerd_new.png"
                            className="w-44 h-44 object-contain mb-2"
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
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">E-mail</label>
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
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-14 pl-16 pr-14 rounded-2xl bg-[#eff3ff] border-none outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-[#050a18] placeholder:text-slate-400 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
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
    const [showPassword, setShowPassword] = useState(false)

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
            if (verifyResult.verified && verifyResult.loginUrl) {
                // Verificar se o usuário está ativo
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('is_active')
                        .eq('id', user.id)
                        .single()

                    if (profile && profile.is_active === false) {
                        await supabase.auth.signOut()
                        setError('Sua conta está inativa. Entre em contato com o administrador.')
                        return
                    }
                }
                onLogin()
            }
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

            // Verificar se o usuário está ativo
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_active')
                .eq('id', data.user.id)
                .single()

            if (profile && profile.is_active === false) {
                await supabase.auth.signOut()
                setError('Sua conta está inativa. Entre em contato com o administrador.')
                setLoading(false)
                return
            }

            onLogin()
        } catch (err) {
            setError('Erro ao conectar. Verifique sua conexão.')
            setLoading(false)
        }
    }

    const commonProps = { username, setUsername, password, setPassword, loading, error, handleSubmit, handleBiometricLogin, showPassword, setShowPassword };

    return isMobile ? <MobileLoginView {...commonProps} /> : <WebLoginView {...commonProps} />;
}

export default Login

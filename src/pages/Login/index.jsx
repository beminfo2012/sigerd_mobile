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
        '/assets/img/login_bg_humanitarian.png'
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBg((prev) => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen w-full flex bg-slate-50 font-sans">
            {/* Left Side: Branding & Info */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#102754] p-16 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                            <img src="/logo_sigerd_new.png" className="w-10 h-10 object-contain" alt="SIGERD" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter">SIGERD <span className="text-blue-400 font-bold ml-1">WEB</span></h2>
                            <span className="text-[10px] uppercase font-black tracking-[4px] opacity-40">Intelligence Management</span>
                        </div>
                    </div>

                    <div className="mt-12 space-y-12 max-w-md">
                        <div>
                            <h3 className="text-4xl font-black leading-tight mb-4 text-white">Gestão Integrada de Riscos e Desastres.</h3>
                            <p className="text-lg text-white/50 leading-relaxed">
                                Plataforma oficial da Defesa Civil de Santa Maria de Jetibá para monitoramento, vistoria e resposta a desastres naturais.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-400 font-black text-2xl tabular-nums">1.2k+</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Vistorias Realizadas</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 font-black text-2xl tabular-nums">24/7</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Monitoramento Ativo</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[3px] opacity-20">
                        <div className="h-[1px] w-12 bg-white"></div>
                        Prefeitura Municipal de Santa Maria de Jetibá
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form with Background Images */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative overflow-hidden">
                {/* Dynamic Backgrounds */}
                {backgrounds.map((bg, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentBg === idx ? 'opacity-20' : 'opacity-0'}`}
                        style={{
                            backgroundImage: `url(${bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'grayscale(30%)'
                        }}
                    />
                ))}

                <div className="absolute top-8 right-8 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Acesso Restrito
                </div>

                <div className="w-full max-w-md space-y-12 bg-white/90 backdrop-blur-sm lg:p-12 lg:rounded-[32px] lg:shadow-2xl lg:shadow-slate-200/50 lg:border lg:border-slate-100 relative z-20">
                    <div className="lg:hidden flex flex-col items-center gap-4 mb-12">
                        <img src="/logo_sigerd_new.png" className="w-20 h-20 object-contain" alt="SIGERD" onError={(e) => { e.target.style.display = 'none'; }} />
                        <h2 className="text-3xl font-black text-[#102754]">SIGERD</h2>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Entrar</h2>
                        <p className="text-slate-400 font-medium leading-relaxed">Acesse o sistema com suas credenciais oficiais corporativas.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="exemplo@s2id.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full h-16 pl-16 pr-6 rounded-[20px] bg-slate-50/50 border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-16 pl-16 pr-6 rounded-[20px] bg-slate-50/50 border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in">
                                <ShieldAlert size={20} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-[#ff5722] hover:bg-[#e64a19] text-white rounded-[20px] font-black text-base uppercase tracking-widest shadow-xl shadow-[#ff5722]/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={24} /> Autenticando...</>
                                ) : (
                                    <><LogIn size={20} /> Acessar Sistema</>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="pt-8 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 group cursor-help">
                            <Info size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Problemas de acesso? Contate a COMPDEC-SMJ</span>
                        </div>
                    </div>
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

        if (!navigator.onLine && !username.endsWith('@s2id.com')) {
            setError('⚠️ Sem internet. Conecte-se para entrar pela primeira vez.')
            return
        }

        const TEST_ACCOUNTS = {
            'saude@s2id.com': { role: 'Redap_Saude', name: 'Secretaria de Saúde' },
            'securb@s2id.com': { role: 'Redap_Obras', name: 'Secretaria de Serviços Urbanos' },
            'social@s2id.com': { role: 'Redap_Social', name: 'Secretaria de Assistência Social' },
            'educacao@s2id.com': { role: 'Redap_Educacao', name: 'Secretaria de Educação' },
            'agricultura@s2id.com': { role: 'Redap_Agricultura', name: 'Secretaria de Agricultura' },
            'interior@s2id.com': { role: 'Redap_Interior', name: 'Secretaria de Interior' },
            'administracao@s2id.com': { role: 'Redap_Administracao', name: 'Secretaria de Administração' },
            'cdl@s2id.com': { role: 'Redap_CDL', name: 'CDL - Comércio e Serviços' },
            'cesan@s2id.com': { role: 'Redap_Cesan', name: 'CESAN - Água e Esgoto' },
            'defesasocial@s2id.com': { role: 'Redap_DefesaSocial', name: 'Secretaria de Defesa Social' },
            'esporte@s2id.com': { role: 'Redap_EsporteTurismo', name: 'Secretaria de Esporte e Turismo' },
            'transportes@s2id.com': { role: 'Redap_Transportes', name: 'Secretaria de Transportes' },
            'defesa@s2id.com': { role: 'Agente de Defesa Civil', name: 'Agente de Teste' },
            'admin@s2id.com': { role: 'Admin', name: 'Administrador de Teste' }
        };

        if (password === 'teste123' && TEST_ACCOUNTS[username]) {
            setLoading(true);
            const mockProfile = {
                id: 'mock-' + username,
                full_name: TEST_ACCOUNTS[username].name,
                email: username,
                role: TEST_ACCOUNTS[username].role,
                is_mock: true
            };
            localStorage.setItem('auth', 'true');
            localStorage.setItem('userProfile', JSON.stringify(mockProfile));
            setTimeout(() => onLogin(), 800);
            return;
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

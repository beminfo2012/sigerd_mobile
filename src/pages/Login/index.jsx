import React, { useState } from 'react'
import { supabase } from '../../services/supabase'
import { Fingerprint, User, Lock, Info, ShieldCheck, ShieldAlert, LogIn, Loader2 } from 'lucide-react'

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [techError, setTechError] = useState(null)
    const [showTech, setShowTech] = useState(false)

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
            'saude@s2id.com': { role: 'S2id_Saude', name: 'Secretaria de Saúde' },
            'securb@s2id.com': { role: 'S2id_Obras', name: 'Secretaria de Serviços Urbanos' },
            'social@s2id.com': { role: 'S2id_Social', name: 'Secretaria de Assistência Social' },
            'educacao@s2id.com': { role: 'S2id_Educacao', name: 'Secretaria de Educação' },
            'agricultura@s2id.com': { role: 'S2id_Agricultura', name: 'Secretaria de Agricultura' },
            'interior@s2id.com': { role: 'S2id_Interior', name: 'Secretaria de Interior' },
            'administracao@s2id.com': { role: 'S2id_Administracao', name: 'Secretaria de Administração' },
            'cdl@s2id.com': { role: 'S2id_CDL', name: 'CDL - Comércio e Serviços' },
            'cesan@s2id.com': { role: 'S2id_Cesan', name: 'CESAN - Água e Esgoto' },
            'defesasocial@s2id.com': { role: 'S2id_DefesaSocial', name: 'Secretaria de Defesa Social' },
            'esporte@s2id.com': { role: 'S2id_EsporteTurismo', name: 'Secretaria de Esporte e Turismo' },
            'transportes@s2id.com': { role: 'S2id_Transportes', name: 'Secretaria de Transportes' },
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
                setTechError(authError.message + (authError.status ? ` (Status: ${authError.status})` : ''))
                setLoading(false)
                return
            }
            onLogin()
        } catch (err) {
            setError('Erro ao conectar. Verifique sua conexão.')
            setTechError(err.message || String(err))
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 w-screen h-screen flex flex-col justify-center items-center overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0f3470 0%, #162d50 100%)' }}
        >
            {/* Glow decorativo */}
            <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }} />

            {/* Container principal — sem scroll, se encaixa na tela */}
            <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10 px-6">

                {/* Logo & Brand */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <img
                        src="/logo_sigerd_new.png"
                        alt="Logo SIGERD"
                        className="w-24 h-24 object-contain drop-shadow-2xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-[5px] m-0 leading-none">SIGERD</h1>
                        <p className="text-[11px] text-white/60 font-semibold tracking-widest uppercase mt-2">
                            Sistema Integrado de Gerenciamento<br />de Riscos e Desastres
                        </p>
                    </div>
                </div>

                {/* Card de autenticação */}
                <div className="w-full rounded-3xl p-6 flex flex-col gap-4"
                    style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>

                    {/* Botão biometria — touch target 56px (>44px conforme skill) */}
                    <button
                        type="button"
                        onClick={handleBiometricLogin}
                        disabled={loading}
                        aria-label="Entrar com Digital"
                        className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold text-slate-900 bg-white transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 hover:bg-slate-50"
                        style={{ minHeight: '56px', fontSize: '15px' }}
                    >
                        <Fingerprint size={22} />
                        Entrar com Digital
                    </button>

                    {/* Divisor */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.12)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            ou use sua conta
                        </span>
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.12)' }} />
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                        {/* Input E-mail */}
                        <div className="relative group">
                            <User
                                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                                size={18}
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                            />
                            <input
                                type="text"
                                placeholder="E-mail"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                style={{
                                    minHeight: '52px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1.5px solid rgba(255,255,255,0.18)',
                                    fontSize: '15px'
                                }}
                                className="w-full pl-11 pr-4 rounded-xl text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                            />
                        </div>

                        {/* Input Senha */}
                        <div className="relative group">
                            <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                                size={18}
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                            />
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{
                                    minHeight: '52px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1.5px solid rgba(255,255,255,0.18)',
                                    fontSize: '15px'
                                }}
                                className="w-full pl-11 pr-4 rounded-xl text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                            />
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold"
                                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                                <ShieldAlert size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Botão submit — laranja vibrante, touch target 56px */}
                        <button
                            type="submit"
                            disabled={loading}
                            aria-label="Entrar no SIGERD"
                            className="w-full flex items-center justify-center gap-2.5 rounded-2xl font-black text-white transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60"
                            style={{
                                minHeight: '56px',
                                fontSize: '16px',
                                letterSpacing: '0.02em',
                                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                boxShadow: '0 6px 24px rgba(249, 115, 22, 0.45)',
                            }}
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={20} /> Entrando...</>
                            ) : (
                                <><LogIn size={20} /> Entrar no SIGERD</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Rodapé */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Defesa Civil de Santa Maria de Jetibá
                    </p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        © 2024-2026 SIGERD Mobile • v1.46.25
                    </p>
                </div>

                {/* Diagnóstico técnico */}
                <div className="text-center w-full">
                    <button
                        type="button"
                        onClick={() => setShowTech(!showTech)}
                        className="flex items-center gap-1.5 mx-auto transition-colors duration-200 cursor-pointer"
                        style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                    >
                        <Info size={11} />
                        {showTech ? 'Ocultar Diagnóstico' : 'Diagnóstico Técnico'}
                    </button>

                    {showTech && (
                        <div className="mt-3 p-4 rounded-2xl text-left"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 className="text-[9px] font-black uppercase mb-2 flex items-center gap-1.5" style={{ color: '#93c5fd' }}>
                                <ShieldCheck size={11} /> Security Status
                            </h4>
                            <div className="space-y-1 font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}>
                                <div className="flex justify-between">
                                    <span className="font-bold" style={{ color: 'rgba(255,255,255,0.65)' }}>ENVIRONMENT:</span>
                                    <span>PRODUCTION</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold" style={{ color: 'rgba(255,255,255,0.65)' }}>CONNECTION:</span>
                                    <span style={{ color: navigator.onLine ? '#4ade80' : '#f87171' }}>
                                        {navigator.onLine ? 'ESTABLISHED' : 'OFFLINE'}
                                    </span>
                                </div>
                                {techError && (
                                    <div className="mt-2 p-2 rounded font-sans" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontSize: '9px' }}>
                                        <span className="font-bold">DEBUG:</span> {techError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Login

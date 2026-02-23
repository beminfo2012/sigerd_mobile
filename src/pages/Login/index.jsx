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
            className="fixed inset-0 w-screen h-screen flex flex-col justify-center items-center overflow-hidden font-sans"
            style={{ backgroundColor: '#102754' }}
        >
            {/* Container principal */}
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

                    {/* Botão biometria */}
                    <button
                        type="button"
                        onClick={handleBiometricLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 rounded-full font-bold text-[#102754] bg-white transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 h-[60px] text-lg shadow-lg"
                    >
                        <Fingerprint size={28} />
                        Entrar com a Digital
                    </button>

                    {/* Divisor */}
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-white/20" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
                            ou use sua conta
                        </span>
                        <div className="h-[1px] flex-1 bg-white/20" />
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Input E-mail */}
                        <div className="relative">
                            <User
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="E-mail"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#1e293b]/30 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-all text-base font-medium"
                            />
                        </div>

                        {/* Input Senha */}
                        <div className="relative">
                            <Lock
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                                size={20}
                            />
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#1e293b]/30 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-all text-base font-medium"
                            />
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-200">
                                <ShieldAlert size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Botão submit */}
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
                        © 2024-2026 SIGERD Mobile - v1.46.16
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login

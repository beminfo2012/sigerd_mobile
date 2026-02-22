import React, { useState } from 'react'
import { supabase } from '../../services/supabase'
import { Fingerprint, User, Lock, Info, ShieldCheck, ShieldAlert, LogIn, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [techError, setTechError] = useState(null)
    const [showTech, setShowTech] = useState(false)

    // Helper to decode base64/base64url to Uint8Array
    const base64ToUint8Array = (base64) => {
        const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Helper to encode Uint8Array to base64url
    const uint8ArrayToBase64Url = (uint8Array) => {
        const binaryString = String.fromCharCode(...uint8Array);
        return window.btoa(binaryString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    const handleBiometricLogin = async () => {
        setError('')
        const savedEmail = localStorage.getItem('biometric_email')
        if (!savedEmail) {
            setError('Faça login com senha primeiro para ativar a biometria.')
            return
        }

        setLoading(true)
        try {
            const { data: options, error: optError } = await supabase.functions.invoke('webauthn', {
                body: {
                    action: 'generate-authentication-options',
                    email: savedEmail,
                    origin: window.location.origin
                }
            })

            if (optError) throw optError

            options.allowCredentials = options.allowCredentials.map(c => ({
                ...c,
                id: base64ToUint8Array(c.id)
            }))
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
                body: {
                    action: 'verify-authentication',
                    email: savedEmail,
                    authenticationResponse: authResponse,
                    origin: window.location.origin
                }
            })

            if (verifyError) {
                let errorMessage = verifyError.message;
                try {
                    const errorData = await verifyError.response?.json();
                    if (errorData?.error) errorMessage = errorData.error;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                throw new Error(errorMessage);
            }

            if (verifyResult.verified && verifyResult.loginUrl) {
                onLogin()
            } else {
                setError('Falha na verificação biométrica')
            }

        } catch (err) {
            console.error('Biometric error:', err)
            setError('Erro na biometria: ' + (err.message || 'Tente novamente'))
        } finally {
            setLoading(false)
        }
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
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: username,
                password: password
            });

            if (authError) {
                setError('Usuário ou senha inválidos');
                setTechError(authError.message + (authError.status ? ` (Status: ${authError.status})` : ''));
                setLoading(false);
                return;
            }
            onLogin()
        } catch (err) {
            setError('Erro ao conectar. Verifique sua conexão.')
            setTechError(err.message || String(err))
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 min-h-screen w-screen bg-slate-950 flex justify-center items-center p-6 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 -left-1/4 w-full h-full bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 -right-1/4 w-full h-full bg-orange-900/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-[420px] flex flex-col items-center gap-8 relative z-10">

                {/* Logo & Brand */}
                <div className="flex flex-col items-center gap-4 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-all duration-500 rounded-full"></div>
                        <img
                            src="/logo_sigerd_new.png"
                            alt="Logo SIGERD"
                            className="w-28 h-28 object-contain drop-shadow-2xl relative z-10"
                        />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-[4px] m-0">SIGERD</h1>
                        <p className="text-[12px] text-white/50 font-medium tracking-wide uppercase mt-2 max-w-[280px]">
                            Sistema Integrado de Gerenciamento de Riscos e Desastres
                        </p>
                    </div>
                </div>

                <Card className="w-full bg-white/5 backdrop-blur-xl border-white/10 p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">

                    {/* Biometric Option */}
                    <Button
                        onClick={handleBiometricLogin}
                        disabled={loading}
                        variant="secondary"
                        size="lg"
                        className="w-full bg-white text-slate-900 hover:bg-slate-50 border-none h-14"
                    >
                        <Fingerprint className="mr-3" size={24} />
                        Entrar com Digital
                    </Button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">ou use sua conta</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="E-mail"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-bold animate-in fade-in zoom-in duration-200">
                                <ShieldAlert size={16} />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            className="w-full h-14 bg-orange-600 hover:bg-orange-500 border-none mt-2 shadow-lg shadow-orange-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" size={20} />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2" size={20} />
                                    Entrar no SIGERD
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Footer Info */}
                <div className="flex flex-col items-center gap-6 w-full text-center">
                    <div className="flex flex-col items-center gap-1 opacity-50">
                        <p className="text-[11px] font-black text-white uppercase tracking-widest px-4">
                            Defesa Civil de Santa Maria de Jetibá
                        </p>
                        <p className="text-[10px] text-white font-medium">© 2024-2026 SIGERD Mobile • v1.46.25</p>
                    </div>

                    <div className="w-full">
                        <button
                            type="button"
                            onClick={() => setShowTech(!showTech)}
                            className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <Info size={12} />
                            {showTech ? 'Ocultar Diagnóstico' : 'Diagnóstico Técnico'}
                        </button>

                        {showTech && (
                            <div className="mt-4 p-5 bg-white/5 backdrop-blur-md rounded-2xl text-left border border-white/10 animate-in fade-in slide-in-from-bottom-2 w-full max-w-[340px] mx-auto overflow-hidden">
                                <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    Security Status
                                </h4>
                                <div className="space-y-2 text-[10px] font-mono text-white/50 break-all leading-relaxed">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-white/70">ENVIRONMENT:</span>
                                        <span>PRODUCTION</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-white/70">CONNECTION:</span>
                                        <span className={navigator.onLine ? 'text-green-500' : 'text-red-500'}>
                                            {navigator.onLine ? 'ESTABLISHED' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    {techError && (
                                        <div className="mt-2 p-2 bg-red-500/10 text-red-400 rounded border border-red-500/20 font-sans">
                                            <span className="font-bold">DEBUG:</span> {techError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login


import React, { useState } from 'react'
import { supabase } from '../../services/supabase'
import { Fingerprint } from 'lucide-react'

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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
            // 1. Get authentication options from Edge Function
            const { data: options, error: optError } = await supabase.functions.invoke('webauthn', {
                body: {
                    action: 'generate-authentication-options',
                    email: savedEmail,
                    origin: window.location.origin
                }
            })

            if (optError) throw optError

            // 2. Convert options for navigator.credentials.get
            options.allowCredentials = options.allowCredentials.map(c => ({
                ...c,
                id: base64ToUint8Array(c.id)
            }))
            options.challenge = base64ToUint8Array(options.challenge)

            // 3. Get credential from browser
            const credential = await navigator.credentials.get({ publicKey: options })

            if (!credential) throw new Error('Falha ao obter credencial')

            // 4. Verify with Edge Function
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

    const handleRegisterBiometrics = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: options, error: optError } = await supabase.functions.invoke('webauthn', {
                body: {
                    action: 'generate-registration-options',
                    origin: window.location.origin
                }
            })

            if (optError) throw optError

            // Convert options
            options.user.id = base64ToUint8Array(options.user.id)
            options.challenge = base64ToUint8Array(options.challenge)
            if (options.excludeCredentials) {
                options.excludeCredentials = options.excludeCredentials.map(c => ({
                    ...c,
                    id: base64ToUint8Array(c.id)
                }))
            }

            const credential = await navigator.credentials.create({ publicKey: options })

            const registrationResponse = {
                id: credential.id,
                rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
                type: credential.type,
                response: {
                    attestationObject: uint8ArrayToBase64Url(new Uint8Array(credential.response.attestationObject)),
                    clientDataJSON: uint8ArrayToBase64Url(new Uint8Array(credential.response.clientDataJSON)),
                    transports: credential.response.getTransports ? credential.response.getTransports() : [],
                },
                clientExtensionResults: credential.getClientExtensionResults(),
            }

            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('webauthn', {
                body: {
                    action: 'verify-registration',
                    registrationResponse,
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

            if (verifyResult.verified) {
                localStorage.setItem('biometric_email', session.user.email)
                alert('Biometria ativada com sucesso!')
            }
        } catch (err) {
            console.error('Registration error:', err)
            alert('Erro ao ativar biometria: ' + err.message)
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
        console.log('--- LOGIN ATTEMPT ---')
        console.log('Username:', username)

        try {
            // timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: O servidor não respondeu a tempo.')), 15000)
            );

            // auth promise
            const authPromise = supabase.auth.signInWithPassword({
                email: username,
                password: password
            });

            console.log('Starting Supabase Auth...')
            const { data, error: authError } = await Promise.race([authPromise, timeoutPromise]);
            console.log('Auth result:', { data, error: authError });

            if (authError) {
                setError('Usuário ou senha inválidos')
                setLoading(false)
                return
            }

            console.log('Login successful, checking biometrics configuration...')
            if (!localStorage.getItem('biometric_email')) {
                // Non-blocking biometrics check
                try {
                    if (window.confirm('Deseja ativar o login por biometria para este dispositivo?')) {
                        console.log('User opted for biometrics, registering...')
                        await handleRegisterBiometrics()
                    }
                } catch (bioErr) {
                    console.warn('Biometric registration failed but continuing login:', bioErr)
                }
            }

            console.log('Proceeding to onLogin()...')
            onLogin()
        } catch (err) {
            console.error('Login technical error:', err)
            setError(err.message || 'Erro ao conectar. Verifique sua conexão.')
            setLoading(false)
        }
    }


    return (
        <div style={{
            background: 'linear-gradient(180deg, #0f3470 0%, #162d50 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            padding: '20px',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
            }}>

                {/* Logo Section */}
                <div style={{
                    marginTop: '10px',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img
                        src="/logo_sigerd_new.png"
                        alt="Logo SIGERD"
                        style={{
                            width: '140px',
                            height: '140px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>

                {/* Title Section */}
                <div style={{ marginBottom: '4px' }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '34px',
                        fontWeight: '800',
                        margin: '0',
                        letterSpacing: '3px'
                    }}>SIGERD</h1>

                    <p style={{
                        color: 'rgba(255, 255, 255, 0.65)',
                        fontSize: '13px',
                        margin: '6px auto 0',
                        maxWidth: '260px',
                        lineHeight: '1.5',
                        fontWeight: '500'
                    }}>Sistema Integrado de Gerenciamento de Riscos e Desastres</p>
                </div>

                {/* Biometric Button */}
                <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        background: 'white',
                        color: '#0f3470',
                        border: 'none',
                        padding: '13px',
                        borderRadius: '50px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                    }}
                >
                    <Fingerprint size={24} strokeWidth={2.5} />
                    Entrar com a Digital
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    margin: '4px 0',
                    gap: '14px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }}></div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        ou use sua conta
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }}></div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Email Input */}
                    <div style={{ position: 'relative' }}>
                        <i className="fas fa-user" style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255, 255, 255, 0.6)'
                        }}></i>
                        <input
                            type="text"
                            placeholder="E-mail"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 55px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ position: 'relative' }}>
                        <i className="fas fa-lock" style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255, 255, 255, 0.6)'
                        }}></i>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 55px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            color: '#ff4d4d',
                            fontSize: '14px',
                            textAlign: 'center',
                            marginTop: '5px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #ff6d3a 0%, #ff5722 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '50px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '700',
                            marginTop: '6px',
                            boxShadow: '0 4px 20px rgba(255, 87, 34, 0.35)',
                            transition: 'all 0.3s',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {loading ? 'Entrando...' : 'Entrar no App'}
                    </button>
                </form>

                {/* Footer */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '24px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    lineHeight: '1.6',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    width: '60%'
                }}>
                    <p style={{ fontWeight: '700', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2px', marginTop: '12px' }}>Defesa Civil de Santa Maria de Jetibá</p>
                    <p style={{ fontSize: '10px' }}>© 2024-2026 SIGERD Mobile - v1.46.25</p>
                </div>
            </div>

            {/* FontAwesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            {/* Google Fonts */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
        </div>
    )
}

export default Login

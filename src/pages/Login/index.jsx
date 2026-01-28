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

        if (!navigator.onLine) {
            setError('⚠️ Sem internet. Conecte-se para entrar pela primeira vez.')
            return
        }

        setLoading(true)

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: username,
                password: password
            })

            if (authError) {
                setError('Usuário ou senha inválidos')
                setLoading(false)
                return
            }

            if (!localStorage.getItem('biometric_email')) {
                if (window.confirm('Deseja ativar o login por biometria para este dispositivo?')) {
                    await handleRegisterBiometrics()
                }
            }

            onLogin()
        } catch (err) {
            console.error('Login error:', err)
            setError('Erro ao conectar. Tente novamente.')
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
                gap: '10px'
            }}>

                {/* Logo Section */}
                <div style={{
                    marginTop: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img
                        src="/logo_sigerd_new.png"
                        alt="Logo SIGERD"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* Title Section */}
                <h1 style={{
                    color: 'white',
                    fontSize: '42px',
                    fontWeight: '800',
                    margin: '0',
                    letterSpacing: '1px'
                }}>SIGERD</h1>

                <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    margin: '0 0 40px 0',
                    maxWidth: '280px',
                    lineHeight: '1.4'
                }}>Sistema Integrado de Gerenciamento de Riscos e Desastres</p>

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
                        padding: '18px',
                        borderRadius: '50px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s active'
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
                    margin: '30px 0',
                    gap: '15px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ou use sua conta
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>

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
                            background: '#ff5722',
                            color: 'white',
                            border: 'none',
                            padding: '18px',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            fontWeight: '700',
                            marginTop: '10px',
                            boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? 'Entrando...' : 'Entrar no App'}
                    </button>
                </form>

                {/* Footer */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '40px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textAlign: 'center',
                    lineHeight: '1.6'
                }}>
                    <p>© 2024-2026 Santa Maria de Jetibá - v1.45.0</p>
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

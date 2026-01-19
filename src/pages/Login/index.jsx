import React, { useState } from 'react'
import { supabase } from '../../services/supabase'
import logoLogin from '../../assets/logo_login.png'

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!navigator.onLine) {
            setError('⚠️ Sem internet. Conecte-se para entrar pela primeira vez.')
            return
        }

        setLoading(true)

        try {
            // Try to sign in with Supabase Auth
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: username, // Can be email or username
                password: password
            })

            if (authError) {
                setError('Usuário ou senha inválidos')
                setLoading(false)
                return
            }

            // Success - call onLogin to update app state
            onLogin()
        } catch (err) {
            console.error('Login error:', err)
            setError('Erro ao conectar. Tente novamente.')
            setLoading(false)
        }
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5299 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>

                {/* Logo */}
                <div style={{
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img
                        src={logoLogin}
                        alt="Logo Defesa Civil"
                        style={{
                            maxWidth: '180px',
                            height: 'auto',
                            display: 'block',
                            margin: '0 auto'
                        }}
                        onError={(e) => e.target.style.display = 'none'}
                    />
                </div>

                {/* Title */}
                <h2 style={{
                    color: '#1e3c72',
                    fontSize: '28px',
                    marginBottom: '5px',
                    fontWeight: '600'
                }}>SIGERD</h2>

                {/* Subtitle */}
                <p style={{
                    color: '#666',
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>Sistema Integrado de Gerenciamento de Riscos e Desastres</p>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Username Input */}
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <i className="fas fa-user" style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#aaa'
                        }}></i>
                        <input
                            type="text"
                            placeholder="E-mail"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2a5299'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <i className="fas fa-lock" style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#aaa'
                        }}></i>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2a5299'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {/* Error Message */}
                    <div style={{
                        color: '#c82333',
                        marginBottom: '15px',
                        fontSize: '14px',
                        height: '1em'
                    }}>
                        {error}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? '#6c8cc4' : '#2a5299',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => !loading && (e.target.style.background = '#1e3c72')}
                        onMouseLeave={(e) => !loading && (e.target.style.background = '#2a5299')}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Footer */}
                <div style={{
                    marginTop: '30px',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    <p>© 2024 Defesa Civil de Santa Maria de Jetibá</p>
                </div>
            </div>

            {/* FontAwesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        </div>
    )
}

export default Login

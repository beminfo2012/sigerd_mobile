import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Upload } from 'lucide-react'
import html2canvas from 'html2canvas'

const Alerts = () => {
    const navigate = useNavigate()
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState(null)
    const [format, setFormat] = useState('stories') // 'stories' or 'feed'
    const [mapImage, setMapImage] = useState(null)

    // Form fields
    const [alertType, setAlertType] = useState('')
    const [severity, setSeverity] = useState('Grande Perigo')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [risks, setRisks] = useState('')
    const [instructions, setInstructions] = useState(`- Desligue aparelhos elétricos, quadro geral de energia.
- Observe alteração nas encostas.
- Permaneça em local abrigado.
- Em caso de situação de inundação, ou similar, proteja seus pertences da água envoltos em sacos plásticos.
- Obtenha mais informações junto à Defesa Civil (telefone 199) e ao Corpo de Bombeiros (telefone 193).`)

    const artRef = useRef(null)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        setLoading(true)
        try {
            const resp = await fetch('/api/inmet')
            if (resp.ok) {
                const data = await resp.json()
                const validAlerts = Array.isArray(data) ? data : []
                setAlerts(validAlerts)
                if (validAlerts.length > 0) {
                    loadAlertToForm(validAlerts[0])
                }
            } else {
                setAlerts([])
            }
        } catch (e) {
            console.error(e)
            setAlerts([])
        } finally {
            setLoading(false)
        }
    }

    const loadAlertToForm = (alert) => {
        if (!alert) return

        setSelectedAlert(alert)
        setAlertType(alert.descricao || alert.aviso_tipo || '')
        setSeverity(alert.severidade || alert.aviso_severidade || 'Grande Perigo')
        setStartDate(formatDateToInput(alert.inicio))
        setEndDate(formatDateToInput(alert.fim))
        setRisks(alert.riscos ? alert.riscos.join('\\n') : alert.descricao || '')
        if (alert.instrucoes) {
            setInstructions(alert.instrucoes.join('\\n'))
        }
    }

    const formatDateToInput = (dateStr) => {
        if (!dateStr) return ''
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return dateStr

            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')

            return `${day}/${month}/${year} ${hours}h${minutes}min`
        } catch (e) {
            return dateStr
        }
    }

    const getSeverityClass = () => {
        if (severity.includes('Potencial')) return 'amarelo'
        if (severity.includes('Grande')) return 'vermelho'
        return 'laranja'
    }

    const getSeverityColor = () => {
        if (severity.includes('Potencial')) return '#f1c40f'
        if (severity.includes('Grande')) return '#c62828'
        return '#e67e22'
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setMapImage(event.target.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const downloadImage = async () => {
        if (!artRef.current) return

        try {
            const canvas = await html2canvas(artRef.current, {
                allowTaint: true,
                useCORS: false,
                scale: 2,
                backgroundColor: '#f5f5f5',
                logging: false
            })

            const dataURL = canvas.toDataURL('image/jpeg', 0.95)

            // Create download link
            const link = document.createElement('a')
            link.download = `alerta-defesa-civil-${Date.now()}.jpg`
            link.href = dataURL
            link.click()
        } catch (error) {
            console.error('Erro ao gerar imagem:', error)
            alert('Erro ao gerar imagem: ' + error.message)
        }
    }

    const instructionsList = instructions
        .split('\\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.replace(/^[-•*]\\s*/, ''))

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f4f9' }}>
            {/* Sidebar */}
            <aside style={{
                width: '350px',
                background: 'white',
                padding: '20px',
                borderRight: '1px solid #ddd',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '8px',
                            border: 'none',
                            background: '#f0f0f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.2rem', color: '#003366', margin: 0, fontWeight: 'bold' }}>
                        Gerador de Alertas
                    </h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>
                        Carregar Alerta do INMET
                    </label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            value={selectedAlert ? alerts.indexOf(selectedAlert) : ''}
                            onChange={(e) => {
                                if (e.target.value !== '') {
                                    loadAlertToForm(alerts[parseInt(e.target.value)])
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="">
                                {loading ? 'Carregando...' : alerts.length === 0 ? 'Nenhum alerta ativo' : 'Selecione um alerta...'}
                            </option>
                            {alerts.map((alert, index) => (
                                <option key={index} value={index}>
                                    [{alert.severidade}] {alert.aviso_tipo}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={fetchAlerts}
                            title="Atualizar lista"
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                background: '#003366',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #eee', margin: '5px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Aviso de:</label>
                    <input
                        type="text"
                        value={alertType}
                        onChange={(e) => setAlertType(e.target.value)}
                        placeholder="Ex: Acumulado de Chuva"
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Grau de severidade:</label>
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="Perigo Potencial">Perigo Potencial (Amarelo)</option>
                        <option value="Perigo">Perigo (Laranja)</option>
                        <option value="Grande Perigo">Grande Perigo (Vermelho)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Início:</label>
                    <input
                        type="text"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="DD/MM/AAAA HH:mm"
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Fim:</label>
                    <input
                        type="text"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="DD/MM/AAAA HH:mm"
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Riscos Potenciais:</label>
                    <textarea
                        value={risks}
                        onChange={(e) => setRisks(e.target.value)}
                        rows="5"
                        placeholder="Descrição dos riscos..."
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>
                        Imagem do Alerta (Upload):
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ fontSize: '0.85rem' }}
                    />
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #eee', margin: '5px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Instruções:</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows="6"
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #eee', margin: '5px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Formato da Imagem</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setFormat('stories')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                background: format === 'stories' ? '#003366' : '#eee',
                                color: format === 'stories' ? 'white' : '#333',
                                transition: 'background 0.2s'
                            }}
                        >
                            Stories (9:16)
                        </button>
                        <button
                            onClick={() => setFormat('feed')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                background: format === 'feed' ? '#003366' : '#eee',
                                color: format === 'feed' ? 'white' : '#333',
                                transition: 'background 0.2s'
                            }}
                        >
                            Feed (1:1)
                        </button>
                    </div>
                </div>

                <button
                    onClick={downloadImage}
                    style={{
                        padding: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        background: '#003366',
                        color: 'white',
                        fontSize: '1rem',
                        marginTop: 'auto'
                    }}
                >
                    Baixar Imagem
                </button>
            </aside>

            {/* Preview Area */}
            <main style={{
                flex: 1,
                background: '#e0e0e0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                overflow: 'auto'
            }}>
                {/* Capture Container */}
                <div
                    ref={artRef}
                    style={{
                        background: '#f5f5f5',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        width: format === 'stories' ? '540px' : '800px',
                        height: format === 'stories' ? '960px' : '800px',
                        flexShrink: 0
                    }}
                >
                    {/* Red top bar */}
                    <div style={{
                        height: '15px',
                        width: '100%',
                        background: getSeverityColor()
                    }} />

                    {/* Header Section */}
                    <div style={{
                        padding: '40px 20px 30px',
                        textAlign: 'center',
                        background: '#f5f5f5'
                    }}>
                        <h1 style={{
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: '3rem',
                            fontWeight: 700,
                            color: '#333',
                            letterSpacing: '2px',
                            margin: '0 0 10px 0',
                            textTransform: 'uppercase'
                        }}>
                            DEFESA CIVIL
                        </h1>
                        <h2 style={{
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: '1.5rem',
                            fontWeight: 400,
                            color: '#666',
                            letterSpacing: '3px',
                            margin: '0 0 25px 0',
                            textTransform: 'uppercase'
                        }}>
                            SANTA MARIA DE JETIBÁ
                        </h2>
                        <div style={{
                            display: 'inline-block',
                            background: getSeverityColor(),
                            color: severity.includes('Potencial') ? '#333' : 'white',
                            padding: '12px 40px',
                            borderRadius: '30px',
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: '1.4rem',
                            fontWeight: 600,
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            {severity.toUpperCase()}
                        </div>

                        {mapImage && (
                            <img
                                src={mapImage}
                                alt="Mapa do Alerta"
                                style={{
                                    width: '100%',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    marginTop: '20px',
                                    borderRadius: '8px'
                                }}
                            />
                        )}
                    </div>

                    {/* Info Card */}
                    <div style={{
                        flex: 1,
                        background: 'white',
                        padding: '30px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            marginBottom: '20px',
                            fontSize: '1.3rem',
                            lineHeight: 1.6,
                            borderBottom: '1px solid #eee',
                            paddingBottom: '15px'
                        }}>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Aviso de:</strong> {alertType || '...'}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Grau de severidade:</strong> {severity}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Início:</strong> {startDate || '...'}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Fim:</strong> {endDate || '...'}
                            </p>
                        </div>

                        <div style={{
                            fontSize: '1.1rem',
                            color: '#444',
                            lineHeight: 1.4,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div>
                                <strong>Riscos Potenciais:</strong>
                                <p style={{ fontSize: '1.2rem', lineHeight: 1.5, margin: '5px 0' }}>
                                    {risks || '...'}
                                </p>
                            </div>

                            <div style={{
                                marginTop: '10px',
                                borderTop: '1px solid #eee',
                                paddingTop: '10px'
                            }}>
                                <strong>Instruções:</strong>
                                <ul style={{
                                    listStyleType: 'disc',
                                    paddingLeft: '20px',
                                    marginTop: '5px'
                                }}>
                                    {instructionsList.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '5px' }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        background: getSeverityColor(),
                        color: 'white',
                        textAlign: 'right',
                        padding: '8px 15px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                    }}>
                        Fonte: INMET
                    </div>
                </div>
            </main>

            {/* Google Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
                rel="stylesheet"
            />
        </div>
    )
}

export default Alerts

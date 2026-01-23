import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Upload, MessageCircle, Copy, Check } from 'lucide-react'
import { toJpeg } from 'html-to-image'

// Componente isolado da Arte para garantir consistência entre Preview e Exportação
const AlertArt = ({ format, severity, alertType, startDate, endDate, risks, instructionsList, mapImage, severityColor }) => {
    return (
        <div style={{
            width: format === 'stories' ? '360px' : '500px',
            height: format === 'stories' ? '640px' : '500px',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5', // Fundo base
            overflow: 'hidden', // Evita overflow na exportação
            fontFamily: "'Roboto', sans-serif" // Garante fonte base
        }}>
            {/* Top bar */}
            <div style={{
                height: '12px',
                width: '100%',
                background: severityColor,
                flexShrink: 0
            }} />

            {/* Header Section */}
            <div style={{
                padding: '15px 15px 10px',
                textAlign: 'center',
                background: '#f5f5f5',
                width: '100%',
                flexShrink: 0
            }}>
                <h1 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: format === 'stories' ? '2.0rem' : '2.8rem',
                    fontWeight: 700,
                    color: '#333',
                    letterSpacing: '1px',
                    margin: '0 0 4px 0',
                    lineHeight: 1.2,
                    textTransform: 'uppercase'
                }}>
                    DEFESA CIVIL
                </h1>
                <h2 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: format === 'stories' ? '1.1rem' : '1.3rem',
                    fontWeight: 400,
                    color: '#666',
                    letterSpacing: '1px',
                    margin: '0 0 12px 0',
                    textTransform: 'uppercase'
                }}>
                    SANTA MARIA DE JETIBÁ
                </h2>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: severityColor,
                    color: severity.includes('Potencial') ? '#333' : 'white',
                    padding: format === 'stories' ? '8px 30px' : '12px 40px',
                    borderRadius: '25px',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: format === 'stories' ? '1.1rem' : '1.3rem',
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    minWidth: '200px'
                }}>
                    {severity.toUpperCase()}
                </div>

                {mapImage && (
                    <img
                        src={mapImage}
                        alt="Mapa do Alerta"
                        style={{
                            width: '100%',
                            maxHeight: format === 'stories' ? '140px' : '180px',
                            objectFit: 'contain',
                            marginTop: '15px',
                            borderRadius: '8px'
                        }}
                    />
                )}
            </div>

            {/* Info Card */}
            <div style={{
                background: 'white',
                padding: format === 'stories' ? '15px 20px' : '25px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                fontSize: format === 'stories' ? '0.85rem' : '1rem',
                minHeight: 0,
                borderTop: '1px solid #eee'
            }}>
                <div style={{
                    marginBottom: '10px',
                    lineHeight: 1.4,
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '10px',
                    flexShrink: 0
                }}>
                    <p style={{ margin: '3px 0', fontSize: format === 'stories' ? '0.9rem' : '1.05rem' }}>
                        <strong>Aviso de:</strong> {alertType || '...'}
                    </p>
                    <p style={{ margin: '3px 0', fontSize: format === 'stories' ? '0.85rem' : '0.95rem' }}>
                        <strong>Severidade:</strong> {severity}
                    </p>
                    <p style={{ margin: '3px 0', fontSize: format === 'stories' ? '0.8rem' : '0.9rem' }}>
                        <strong>Início:</strong> {startDate || '...'}
                    </p>
                    <p style={{ margin: '3px 0', fontSize: format === 'stories' ? '0.8rem' : '0.9rem' }}>
                        <strong>Fim:</strong> {endDate || '...'}
                    </p>
                </div>

                <div style={{
                    color: '#444',
                    lineHeight: 1.35,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflow: 'hidden' // Garante que texto longo não quebre layout
                }}>
                    <div style={{ flexShrink: 0 }}>
                        <strong style={{ fontSize: format === 'stories' ? '0.85rem' : '1rem' }}>Riscos Potenciais:</strong>
                        <p style={{ lineHeight: 1.35, margin: '4px 0', fontSize: format === 'stories' ? '0.8rem' : '0.9rem' }}>
                            {risks || '...'}
                        </p>
                    </div>

                    <div style={{
                        marginTop: '5px',
                        borderTop: '2px solid #f0f0f0',
                        paddingTop: '8px',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        <strong style={{ fontSize: format === 'stories' ? '0.85rem' : '1rem' }}>Instruções:</strong>
                        <ul style={{
                            listStyleType: 'disc',
                            paddingLeft: '18px',
                            marginTop: '4px',
                            fontSize: format === 'stories' ? '0.75rem' : '0.88rem',
                            marginBottom: 0
                        }}>
                            {instructionsList.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                background: severityColor,
                color: 'white',
                textAlign: 'right',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                flexShrink: 0
            }}>
                Fonte: INMET
            </div>
        </div>
    )
}

const Alerts = () => {
    const navigate = useNavigate()
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState(null)
    const [format, setFormat] = useState('stories') // 'stories' or 'feed'
    const [mapImage, setMapImage] = useState(null)
    const [isCopying, setIsCopying] = useState(false)

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

    const artRef = useRef(null) // Referência apenas para visualização
    const exportRef = useRef(null) // Referência oculta para exportação fiel

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
        setRisks(alert.riscos ? alert.riscos.join('\n') : alert.descricao || '')
        if (alert.instrucoes) {
            setInstructions(alert.instrucoes.join('\n'))
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
        if (!exportRef.current) return

        try {
            // Aguardar renderização
            await new Promise(resolve => setTimeout(resolve, 200))

            const isStories = format === 'stories'
            const pixelRatio = isStories ? 3 : 2

            // IMPORTANT: Capturar do exportRef (off-screen)
            const dataUrl = await toJpeg(exportRef.current, {
                quality: 1.0,
                pixelRatio: pixelRatio,
                backgroundColor: '#f5f5f5',
                width: isStories ? 360 : 500,
                height: isStories ? 640 : 500,
                style: {
                    transform: 'none',
                    margin: 0,
                }
            })

            const link = document.createElement('a')
            link.download = `alerta-defesa-civil-${Date.now()}.jpg`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Erro ao gerar imagem:', error)
            alert('Erro ao gerar imagem: ' + error.message)
        }
    }

    const shareToWhatsApp = async () => {
        // 1. Generate formatted text
        const severityEmoji = severity.includes('Grande') ? '🔴' : (severity.includes('Potencial') ? '🟡' : '🟠')
        const alertEmoji = alertType.toLowerCase().includes('chuva') || alertType.toLowerCase().includes('tempestade') ? '⛈️' : '⚠️'

        // Clean text formatting for WhatsApp
        const waRisks = risks.split('\n').filter(r => r.trim()).join('\n')
        const waInstructions = instructionsList.map(i => `• ${i}`).join('\n')

        const waText =
            `🚨 *ALERTA DE DEFESA CIVIL* 🚨\n\n` +
            `${alertEmoji} *AVISO DE:* ${alertType.toUpperCase()}\n` +
            `${severityEmoji} *SEVERIDADE:* ${severity.toUpperCase()}\n\n` +
            `📅 *Início:* ${startDate}\n` +
            `🏁 *Fim:* ${endDate}\n\n` +
            `⚡ *Riscos Potenciais:*\n${waRisks}\n\n` +
            `📝 *Instruções:*\n${waInstructions}\n\n` +
            `📞 *Emergência:* 199 ou 193\n` +
            `🏘️ Defesa Civil - Santa Maria de Jetibá`

        // 2. Download the image first
        await downloadImage()

        // 3. Copy text to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(waText)
                setIsCopying(true)
                setTimeout(() => setIsCopying(false), 3000)
            }
        } catch (err) {
            console.warn('Clipboard copy failed:', err)
        }

        // 4. Open WhatsApp
        const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`
        window.open(waLink, '_blank')
    }

    const instructionsList = instructions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.replace(/^[-•*]\s*/, ''))

    const severityColor = getSeverityColor()

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Avisos INMET</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
            </div>

            {/* Main Grid - Always single column for mobile-first */}
            <div className="space-y-5">
                {/* Control Panel */}
                <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">
                        Configurações do Alerta
                    </h2>

                    <div className="space-y-4">
                        {/* Carregar Alerta */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Carregar Alerta do INMET
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedAlert ? alerts.indexOf(selectedAlert) : ''}
                                    onChange={(e) => {
                                        if (e.target.value !== '') {
                                            loadAlertToForm(alerts[parseInt(e.target.value)])
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Aviso de e Severidade */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Aviso de:</label>
                            <input type="text" value={alertType} onChange={(e) => setAlertType(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm mb-4" />

                            <label className="text-xs font-bold text-slate-500 mb-2 block">Severidade:</label>
                            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                                <option value="Perigo Potencial">Perigo Potencial (Amarelo)</option>
                                <option value="Perigo">Perigo (Laranja)</option>
                                <option value="Grande Perigo">Grande Perigo (Vermelho)</option>
                            </select>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">Início:</label>
                                <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">Fim:</label>
                                <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
                            </div>
                        </div>

                        {/* Riscos */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Riscos:</label>
                            <textarea value={risks} onChange={(e) => setRisks(e.target.value)} rows="3"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none" />
                        </div>

                        {/* Imagem */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Imagem (Opcional):</label>
                            <input type="file" accept="image/*" onChange={handleImageUpload}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </div>

                        {/* Instruções */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Instruções:</label>
                            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows="4"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none" />
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Formato */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Formato:</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setFormat('stories')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm ${format === 'stories' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    Stories (9:16)
                                </button>
                                <button onClick={() => setFormat('feed')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm ${format === 'feed' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    Feed (1:1)
                                </button>
                            </div>
                        </div>

                        <button onClick={downloadImage}
                            className="w-full bg-slate-800 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 hover:bg-slate-900 transition-all active:scale-95 shadow-lg">
                            <Upload size={20} /> Baixar Apenas Imagem
                        </button>

                        <button onClick={shareToWhatsApp}
                            className="w-full bg-[#25D366] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 hover:bg-[#20ba59] transition-all active:scale-95 shadow-lg border-b-4 border-green-700">
                            <MessageCircle size={22} fill="white" />
                            {isCopying ? 'Pronto! Texto Copiado!' : 'Postar no Canal WhatsApp'}
                        </button>

                        <div className="bg-blue-50 p-4 rounded-2xl mt-4 border border-blue-100">
                            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                Como publicar no canal:
                            </p>
                            <ol className="text-[11px] text-blue-700 space-y-1 font-medium">
                                <li>1. A imagem será baixada automaticamente</li>
                                <li>2. O texto será copiado para sua área de transferência</li>
                                <li>3. No WhatsApp, selecione o Canal, cole o texto e anexe a imagem</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex justify-center items-center min-h-[600px] overflow-hidden">
                    <div ref={artRef} className="shadow-lg rounded-2xl overflow-hidden scale-90 md:scale-100 transition-transform">
                        <AlertArt
                            format={format}
                            severity={severity}
                            alertType={alertType}
                            startDate={startDate}
                            endDate={endDate}
                            risks={risks}
                            instructionsList={instructionsList}
                            mapImage={mapImage}
                            severityColor={severityColor}
                        />
                    </div>
                </div>
            </div>

            {/* Hidden Export Container - BLINDADO CONTRA LAYOUT EXTERNO */}
            <div style={{ position: 'fixed', top: -10000, left: -10000, pointerEvents: 'none', visibility: 'visible' }}>
                <div ref={exportRef}>
                    <AlertArt
                        format={format}
                        severity={severity}
                        alertType={alertType}
                        startDate={startDate}
                        endDate={endDate}
                        risks={risks}
                        instructionsList={instructionsList}
                        mapImage={mapImage}
                        severityColor={severityColor}
                    />
                </div>
            </div>

            {/* Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
                rel="stylesheet"
            />
        </div>
    )
}

export default Alerts

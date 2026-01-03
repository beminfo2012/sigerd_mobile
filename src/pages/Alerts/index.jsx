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
            // Aguardar um momento para garantir que tudo está renderizado
            await new Promise(resolve => setTimeout(resolve, 100))

            const canvas = await html2canvas(artRef.current, {
                allowTaint: false,
                useCORS: true,
                scale: 3, // Alta qualidade
                backgroundColor: '#f5f5f5',
                logging: false,
                windowWidth: artRef.current.scrollWidth,
                windowHeight: artRef.current.scrollHeight,
                scrollY: 0,
                scrollX: 0,
                imageTimeout: 0,
                removeContainer: true,
                foreignObjectRendering: false,
                // Capturar fontes do Google Fonts
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-html2canvas-ignore]')
                    if (clonedElement) {
                        clonedElement.style.display = 'none'
                    }
                }
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
                        {/* INMET Alert Loader */}
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

                        {/* Alert Type */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Aviso de:
                            </label>
                            <input
                                type="text"
                                value={alertType}
                                onChange={(e) => setAlertType(e.target.value)}
                                placeholder="Ex: Tempestade"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Grau de severidade:
                            </label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Perigo Potencial">Perigo Potencial (Amarelo)</option>
                                <option value="Perigo">Perigo (Laranja)</option>
                                <option value="Grande Perigo">Grande Perigo (Vermelho)</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">
                                    Início:
                                </label>
                                <input
                                    type="text"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="DD/MM/AAAA HH:mm"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">
                                    Fim:
                                </label>
                                <input
                                    type="text"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="DD/MM/AAAA HH:mm"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Risks */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Riscos Potenciais:
                            </label>
                            <textarea
                                value={risks}
                                onChange={(e) => setRisks(e.target.value)}
                                rows="4"
                                placeholder="Descrição dos riscos..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Imagem do Alerta:
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                            />
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Instructions */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Instruções:
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows="5"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                            />
                        </div>

                        <div className="border-t border-slate-100 my-4" />

                        {/* Format Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">
                                Formato da Imagem:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setFormat('stories')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${format === 'stories'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Stories (9:16)
                                </button>
                                <button
                                    onClick={() => setFormat('feed')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${format === 'feed'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Feed (1:1)
                                </button>
                            </div>
                        </div>

                        {/* Download Button */}
                        <button
                            onClick={downloadImage}
                            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center gap-2 mt-2"
                        >
                            <Upload size={20} />
                            Baixar Imagem
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex justify-center items-center min-h-[600px]">
                    {/* Capture Container */}
                    <div
                        ref={artRef}
                        className="bg-slate-50 shadow-lg rounded-2xl overflow-hidden"
                        style={{
                            width: format === 'stories' ? '360px' : '500px',
                            height: format === 'stories' ? '640px' : '500px',
                            maxWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Top bar */}
                        <div style={{
                            height: '12px',
                            width: '100%',
                            background: getSeverityColor()
                        }} />

                        {/* Header Section */}
                        <div style={{
                            padding: '30px 20px 25px',
                            textAlign: 'center',
                            background: '#f5f5f5'
                        }}>
                            <h1 style={{
                                fontFamily: "'Oswald', sans-serif",
                                fontSize: format === 'stories' ? '2.2rem' : '2.8rem',
                                fontWeight: 700,
                                color: '#333',
                                letterSpacing: '2px',
                                margin: '0 0 8px 0',
                                textTransform: 'uppercase'
                            }}>
                                DEFESA CIVIL
                            </h1>
                            <h2 style={{
                                fontFamily: "'Oswald', sans-serif",
                                fontSize: format === 'stories' ? '1.1rem' : '1.3rem',
                                fontWeight: 400,
                                color: '#666',
                                letterSpacing: '2px',
                                margin: '0 0 20px 0',
                                textTransform: 'uppercase'
                            }}>
                                SANTA MARIA DE JETIBÁ
                            </h2>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: getSeverityColor(),
                                color: severity.includes('Potencial') ? '#333' : 'white',
                                padding: format === 'stories' ? '10px 30px' : '12px 40px',
                                borderRadius: '25px',
                                fontFamily: "'Oswald', sans-serif",
                                fontSize: format === 'stories' ? '1.1rem' : '1.3rem',
                                fontWeight: 600,
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                textAlign: 'center'
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
                            padding: format === 'stories' ? '20px' : '25px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: format === 'stories' ? '0.85rem' : '1rem',
                            minHeight: 0,
                            overflow: 'auto'
                        }}>
                            <div style={{
                                marginBottom: '15px',
                                lineHeight: 1.5,
                                borderBottom: '2px solid #f0f0f0',
                                paddingBottom: '12px'
                            }}>
                                <p style={{ margin: '4px 0', fontSize: format === 'stories' ? '0.9rem' : '1.05rem' }}>
                                    <strong>Aviso de:</strong> {alertType || '...'}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: format === 'stories' ? '0.85rem' : '0.95rem' }}>
                                    <strong>Severidade:</strong> {severity}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: format === 'stories' ? '0.8rem' : '0.9rem' }}>
                                    <strong>Início:</strong> {startDate || '...'}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: format === 'stories' ? '0.8rem' : '0.9rem' }}>
                                    <strong>Fim:</strong> {endDate || '...'}
                                </p>
                            </div>

                            <div style={{
                                color: '#444',
                                lineHeight: 1.4,
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                fontSize: format === 'stories' ? '0.8rem' : '0.95rem'
                            }}>
                                <div>
                                    <strong>Riscos Potenciais:</strong>
                                    <p style={{ lineHeight: 1.4, margin: '4px 0' }}>
                                        {risks || '...'}
                                    </p>
                                </div>

                                <div style={{
                                    marginTop: '8px',
                                    borderTop: '2px solid #f0f0f0',
                                    paddingTop: '8px'
                                }}>
                                    <strong>Instruções:</strong>
                                    <ul style={{
                                        listStyleType: 'disc',
                                        paddingLeft: '18px',
                                        marginTop: '4px',
                                        fontSize: format === 'stories' ? '0.75rem' : '0.88rem'
                                    }}>
                                        {instructionsList.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: '3px' }}>{item}</li>
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
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            Fonte: INMET
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap"
                rel="stylesheet"
            />
        </div>
    )
}

export default Alerts

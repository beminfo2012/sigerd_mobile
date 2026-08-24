import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Upload, MessageCircle, Copy, Check, ShieldAlert } from 'lucide-react'
import { toJpeg } from 'html-to-image'
import { supabase } from '../../services/supabase'

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
                    minWidth: '200px',
                    whiteSpace: 'nowrap'
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
            const resp = await fetch('/api/inmet').catch(() => null)
            let data = []
            if (resp && resp.ok) {
                data = await resp.json()
            }
            let validAlerts = Array.isArray(data) ? data : []

            // Fallback to production cached API if local is empty/blocked
            if (validAlerts.length === 0) {
                const prodResp = await fetch('https://sigerd-mobile.vercel.app/api/inmet').catch(() => null)
                if (prodResp && prodResp.ok) {
                    const prodData = await prodResp.json()
                    if (Array.isArray(prodData) && prodData.length > 0) {
                        validAlerts = prodData
                    }
                }
            }

            // Fallback to database query if APIs are empty
            if (validAlerts.length === 0) {
                try {
                    const nowIso = new Date().toISOString()
                    const { data: dbAlerts } = await supabase
                        .from('alertas_inmet')
                        .select('*')
                        .gte('fim', nowIso)
                        .lte('inicio', nowIso)
                        .order('inicio', { ascending: false })
                    
                    if (dbAlerts && dbAlerts.length > 0) {
                        validAlerts = dbAlerts.map(a => ({
                            id: a.id,
                            tipo: a.tipo,
                            severidade: a.severidade,
                            inicio: a.inicio,
                            fim: a.fim,
                            riscos: a.riscos ? a.riscos.split('\n') : [],
                            instrucoes: a.instrucoes ? a.instrucoes.split('\n') : [],
                            msg: a.msg,
                            descricao: a.descricao
                        }))
                    }
                } catch (dbErr) {
                    console.error('[Alerts] Database fallback error:', dbErr)
                }
            }

            setAlerts(validAlerts)
            if (validAlerts.length > 0) {
                loadAlertToForm(validAlerts[0])
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
            `🚨 *ALERTA DA DEFESA CIVIL* 🚨\n\n` +
            `${alertEmoji} *AVISO DE:* ${alertType.toUpperCase()}\n` +
            `${severityEmoji} *SEVERIDADE:* ${severity.toUpperCase()}\n\n` +
            `📅 *Início:* ${startDate}\n` +
            `🏁 *Fim:* ${endDate}\n\n` +
            `⚡ *Riscos Potenciais:*\n${waRisks}\n\n` +
            `📝 *Instruções:*\n${waInstructions}\n\n` +
            `📞 *Emergência:* 27 99771-2022\n` +
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

        // 4. Open official WhatsApp Channel
        const waChannelLink = `https://whatsapp.com/channel/0029Vb7CuCcW4lh0Lhj115`
        window.open(waChannelLink, '_blank')
    }


    const shareToSecretaries = () => {
        const message = "DEFESA CIVIL ALERTA: Previsão de evento adverso com risco ao Município. É importante que as Secretarias permaneçam em estado de atenção e prontidão, com equipes e equipamentos mobilizados. Favor Informar ocorrências à Defesa Civil."
        const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`
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
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Avisos INMET</h1>
            </div>

            {/* Main Grid - Always single column for mobile-first */}
            <div className="space-y-5">
                {/* Control Panel */}
                <div className="bg-white p-6 border border-slate-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <h2 className="text-base font-black text-slate-900 mb-5 pb-4 border-b border-slate-100">
                        Configurações do Alerta
                    </h2>

                 <div className="space-y-5">
                        {/* Carregar Alerta */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">
                                Carregar Alerta do INMET
                            </label>
                            <div className="flex gap-3 items-center">
                                <select
                                    value={selectedAlert ? alerts.indexOf(selectedAlert) : ''}
                                    onChange={(e) => {
                                        if (e.target.value !== '') {
                                            loadAlertToForm(alerts[parseInt(e.target.value)])
                                        }
                                    }}
                                    className="flex-1 px-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none shadow-sm transition-all"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                                >
                                    <option value="">
                                        {loading ? 'Carregando...' : alerts.length === 0 ? 'Nenhum alerta ativo' : 'Selecione um alerta...'}
                                    </option>
                                    {alerts.map((alert, index) => (
                                        <option key={index} value={index}>
                                            [{alert.severidade}] {alert.tipo || alert.descricao}
                                        </option>
                                    ))}
                                </select>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-2xl animate-pulse opacity-40 blur-sm pulse-ring-marker"></div>
                                    <button
                                        onClick={fetchAlerts}
                                        title="Atualizar lista"
                                        className="relative bg-blue-600 text-white p-4 h-[52px] min-w-[64px] flex items-center justify-center rounded-2xl hover:bg-blue-700 transition-colors active:scale-95 shadow-lg shadow-blue-500/30"
                                    >
                                        <RefreshCw size={24} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] font-medium text-blue-600 mt-2 ml-1">
                                Toque para buscar o aviso mais recente direto do INMET
                            </p>
                        </div>

                        {/* Aviso de */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Aviso de:</label>
                            <input type="text" placeholder="Ex: Chuvas Intensas" value={alertType} onChange={(e) => setAlertType(e.target.value)}
                                className="w-full px-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all" />
                        </div>

                        {/* Severidade */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Severidade:</label>
                            <div className="relative">
                                <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3.5 border rounded-2xl text-sm font-bold appearance-none shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${severity === 'Grande Perigo' ? 'bg-red-50 border-red-300 text-red-700 focus:ring-red-500/20 focus:border-red-500' : severity === 'Perigo' ? 'bg-orange-50 border-orange-300 text-orange-700 focus:ring-orange-500/20 focus:border-orange-500' : 'bg-yellow-50 border-yellow-300 text-yellow-700 focus:ring-yellow-500/20 focus:border-yellow-500'}`}
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                                >
                                    <option value="Perigo Potencial">Perigo Potencial (Amarelo)</option>
                                    <option value="Perigo">Perigo (Laranja)</option>
                                    <option value="Grande Perigo">Grande Perigo (Vermelho)</option>
                                </select>
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${severity === 'Grande Perigo' ? 'bg-red-600' : severity === 'Perigo' ? 'bg-orange-500' : 'bg-yellow-400'}`}></div>
                            </div>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 mb-2 block">Início:</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    <input type="text" placeholder="dd/mm/aaaa hh:mm" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[13px] font-bold text-slate-700 mb-2 block">Fim:</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    <input type="text" placeholder="dd/mm/aaaa hh:mm" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Riscos */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Riscos:</label>
                            <textarea placeholder="Descreva os riscos associados a este aviso..." value={risks} onChange={(e) => setRisks(e.target.value)} rows="3"
                                className="w-full px-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all resize-none" />
                        </div>

                        {/* Imagem */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Imagem (Opcional):</label>
                            <div className="relative">
                                <input type="file" accept="image/*" onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="border border-dashed border-blue-200 bg-blue-50/50 rounded-2xl px-4 py-5 flex items-center justify-between text-sm transition-all hover:bg-blue-50">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                                        <span className="bg-blue-600 text-white rounded-lg px-3 py-1.5 shadow-sm">Escolher arquivo</span>
                                    </div>
                                    <span className="text-slate-400 font-medium">{mapImage ? 'Imagem selecionada' : 'Nenhum arquivo escolhido'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Instruções */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Instruções:</label>
                            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows="4"
                                className="w-full px-4 py-3.5 border border-slate-200 bg-slate-50/50 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all resize-none" />
                        </div>

                        <div className="border-t border-slate-100 my-6" />

                        {/* Formato */}
                        <div>
                            <label className="text-[13px] font-bold text-slate-700 mb-2 block">Formato:</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setFormat('stories')}
                                    className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm ${format === 'stories' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Stories (9:16)
                                </button>
                                <button onClick={() => setFormat('feed')}
                                    className={`py-3.5 px-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm ${format === 'feed' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    Feed (1:1)
                                </button>
                            </div>
                        </div>

                        <button onClick={downloadImage}
                            className="w-full bg-slate-800 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-slate-900 transition-all active:scale-95 shadow-lg">
                            <Upload size={20} /> Baixar Apenas Imagem
                        </button>

                        <button onClick={shareToWhatsApp}
                            className="w-full bg-[#25D366] text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 mt-3 hover:bg-[#20ba59] transition-all active:scale-95 shadow-lg shadow-[#25D366]/20">
                            <MessageCircle size={22} fill="white" />
                            {isCopying ? 'Pronto! Texto Copiado!' : 'Postar no Canal WhatsApp'}
                        </button>

                        {(severity === 'Perigo' || severity === 'Grande Perigo') && (
                            <button
                                onClick={shareToSecretaries}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-[11px] font-black uppercase tracking-widest bg-slate-50 py-3 rounded-2xl border border-dashed border-slate-200 active:scale-95"
                            >
                                <ShieldAlert size={16} />
                                Alertar Secretários (WhatsApp)
                            </button>
                        )}
                    </div>   </div>

                {/* Preview Area */}
                <div className="bg-white p-6 border border-slate-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex justify-center items-center min-h-[600px] overflow-hidden">
                    <div ref={artRef} className="shadow-lg  overflow-hidden scale-90 md:scale-100 transition-transform">
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

            {/* Hidden Export Container */}
            <div style={{ position: 'fixed', top: -10000, left: -10000, pointerEvents: 'none' }}>
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

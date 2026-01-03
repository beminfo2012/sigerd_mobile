import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Share2, AlertTriangle, Calendar, Info, Download, Image as ImageIcon } from 'lucide-react'
import html2canvas from 'html2canvas'

const Alerts = () => {
    const navigate = useNavigate()
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState(null)
    const [format, setFormat] = useState('stories') // 'stories' or 'feed'
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
                if (validAlerts.length > 0) setSelectedAlert(validAlerts[0])
                else setSelectedAlert(null)
            } else {
                console.warn('API /api/inmet returned error status:', resp.status)
                setAlerts([])
            }
        } catch (e) {
            console.error('Failed to fetch alerts:', e)
            setAlerts([])
            setSelectedAlert(null)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '...'
        try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return dateStr
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '') + 'h'
        } catch (e) {
            console.warn('Date formatting error:', e)
            return dateStr
        }
    }

    const getSeverityDetails = (sev) => {
        if (!sev) return { color: '#94a3b8', bg: '#f1f5f9', text: 'INDEFINIDO', hex: '#64748b' }
        const s = String(sev).toLowerCase()
        if (s.includes('grande perigo')) return { color: '#c62828', bg: '#c62828', text: 'GRANDE PERIGO', hex: '#c62828' }
        if (s.includes('perigo')) return { color: '#ef6c00', bg: '#ef6c00', text: 'PERIGO', hex: '#ef6c00' }
        return { color: '#fbc02d', bg: '#fbc02d', text: 'PERIGO POTENCIAL', hex: '#fbc02d' }
    }

    const generateArt = async () => {
        if (!artRef.current) return
        try {
            const canvas = await html2canvas(artRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1080,
                windowHeight: format === 'stories' ? 1920 : 1080
            })

            const dataURL = canvas.toDataURL('image/jpeg', 0.95)
            const link = document.createElement('a')
            link.download = `alerta-defesa-civil-${Date.now()}.jpg`
            link.href = dataURL
            link.click()
        } catch (err) {
            console.error('Erro ao gerar imagem:', err)
            alert('Erro ao gerar a imagem. Tente novamente.')
        }
    }

    const sev = getSeverityDetails(selectedAlert?.severidade)

    return (
        <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-4 border-b border-slate-200 shrink-0">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Avisos INMET</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Santa Maria de Jetibá</p>
                </div>
                <button onClick={fetchAlerts} className={`p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
                            <p className="font-bold text-slate-500">Buscando avisos...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[32px] border border-slate-200">
                            <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mb-4 text-green-500">
                                <Info size={32} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 mb-1">Céu Limpo</h2>
                            <p className="text-sm font-bold text-slate-400">Nenhum aviso vigente no momento.</p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8 items-start">
                            {/* Controls Column */}
                            <div className="space-y-6 order-2 lg:order-1">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-200 space-y-6 shadow-sm">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Selecione o Aviso</label>
                                        <div className="grid gap-3">
                                            {alerts.map((alert, idx) => (
                                                <button
                                                    key={alert.id || idx}
                                                    onClick={() => setSelectedAlert(alert)}
                                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedAlert?.id === alert.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                                                >
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm leading-tight mb-1">{alert.tipo}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{alert.severidade}</div>
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full`} style={{ background: getSeverityDetails(alert.severidade).color }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Formato da Mídia</label>
                                        <div className="flex p-1 bg-slate-100 rounded-2xl">
                                            <button onClick={() => setFormat('stories')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${format === 'stories' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>STORIES</button>
                                            <button onClick={() => setFormat('feed')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${format === 'feed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>FEED</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={generateArt}
                                        className="flex-1 bg-slate-800 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200"
                                    >
                                        <Download size={20} /> Baixar JPG
                                    </button>
                                    <button
                                        onClick={() => {
                                            const text = `⚠️ *AVISO DE RISCO INMET*\n\n🔹 *Tipo:* ${selectedAlert?.tipo}\n🔸 *Severidade:* ${selectedAlert?.severidade}\n\n📅 *Vigência:* de ${formatDate(selectedAlert?.inicio)} até ${formatDate(selectedAlert?.fim)}\n\n⚠️ *Riscos:* ${selectedAlert?.riscos}\n\n📱 Mais informações em: app.sigerd.com.br`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                                        }}
                                        className="bg-green-600 text-white px-6 py-5 rounded-[24px] font-black flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-green-100"
                                    >
                                        <Share2 size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Column */}
                            <div className="order-1 lg:order-2 flex flex-col items-center">
                                <div className="bg-slate-200/50 p-4 border border-slate-300 border-dashed rounded-[40px] flex items-center justify-center overflow-hidden w-full max-w-[440px]">
                                    <div
                                        className="bg-white shadow-2xl relative overflow-hidden"
                                        style={{
                                            width: format === 'stories' ? '324px' : '400px',
                                            height: format === 'stories' ? '576px' : '400px',
                                        }}
                                    >
                                        <div
                                            ref={artRef}
                                            style={{
                                                width: '1080px',
                                                height: format === 'stories' ? '1920px' : '1080px',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                transform: format === 'stories' ? 'scale(0.3)' : 'scale(0.3703)',
                                                transformOrigin: 'top left',
                                                fontFamily: 'sans-serif',
                                                borderTop: `40px solid ${sev.color}`
                                            }}
                                        >
                                            <div style={{ flex: 1, padding: '80px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                                {/* Header Area */}
                                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                    <h1 style={{ margin: 0, fontSize: '100px', fontWeight: 900, color: '#2d2d2d', letterSpacing: '4px', textTransform: 'uppercase' }}>DEFESA CIVIL</h1>
                                                    <p style={{ margin: '10px 0 0', fontSize: '48px', fontWeight: 400, color: '#7d7d7d', letterSpacing: '8px', textTransform: 'uppercase' }}>SANTA MARIA DE JETIBÁ</p>
                                                </div>

                                                {/* Severity Pill */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        backgroundColor: sev.color,
                                                        color: '#ffffff',
                                                        padding: '30px 100px',
                                                        borderRadius: '100px',
                                                        fontSize: '48px',
                                                        fontWeight: 900,
                                                        letterSpacing: '2px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {sev.text}
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div style={{ fontSize: '42px', color: '#000000', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 800 }}>Aviso de: </span>{selectedAlert?.tipo || '...'}
                                                    </div>
                                                    <div style={{ fontSize: '42px', color: '#000000', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 800 }}>Grau de severidade: </span>
                                                        <span style={{ color: sev.color, fontWeight: 700 }}>{String(sev.text).charAt(0) + String(sev.text).slice(1).toLowerCase()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '42px', color: '#000000', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 800 }}>Início: </span>{formatDate(selectedAlert?.inicio)}
                                                    </div>
                                                    <div style={{ fontSize: '42px', color: '#000000', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 800 }}>Fim: </span>{formatDate(selectedAlert?.fim)}
                                                    </div>
                                                </div>

                                                <div style={{ height: '2px', background: '#f0f0f0', width: '100%' }} />

                                                {/* Risks */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div style={{ fontSize: '40px', fontWeight: 800, color: '#2d2d2d' }}>Riscos Potenciais:</div>
                                                    <div style={{ fontSize: '38px', color: '#4d4d4d', lineHeight: 1.4 }}>{selectedAlert?.riscos || 'Nenhum risco detectado.'}</div>
                                                </div>

                                                {/* Instructions */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                                    <div style={{ fontSize: '40px', fontWeight: 800, color: '#2d2d2d' }}>Instruções:</div>
                                                    <div style={{ fontSize: '36px', color: '#4d4d4d', lineHeight: 1.5 }}>
                                                        {String(selectedAlert?.instrucoes || '').split('\n').filter(l => l.trim()).slice(0, 5).map((line, i) => (
                                                            <div key={i} style={{ marginBottom: '15px', position: 'relative', paddingLeft: '40px' }}>
                                                                <div style={{ position: 'absolute', left: 0, top: '15px', width: '10px', height: '10px', borderRadius: '50%', background: sev.color }} />
                                                                {line.replace(/^[-•*]\s*/, '')}
                                                            </div>
                                                        ))}
                                                        {!selectedAlert?.instrucoes && <div>Consulte a Defesa Civil para mais informações.</div>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                backgroundColor: sev.color,
                                                padding: '30px 50px',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                fontSize: '32px',
                                                fontWeight: 800,
                                                color: '#ffffff'
                                            }}>
                                                Fonte: INMET
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Status Hook */}
            <div className="fixed bottom-6 left-6 right-6 z-50 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-2xl flex items-center justify-between max-w-xl mx-auto pointer-events-auto">
                    <div className="flex items-center gap-3 text-slate-400">
                        <ImageIcon size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avisos INMET</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Alerts

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
            }
        } catch (e) {
            console.error(e)
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
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '') + 'h'
        } catch (e) { return dateStr }
    }

    const getSeverityColor = (sev) => {
        if (!sev) return 'gray'
        const s = sev.toLowerCase()
        if (s.includes('grande perigo')) return 'red'
        if (s.includes('perigo')) return 'orange'
        return 'yellow'
    }

    const getSeverityHex = (sev) => {
        const color = getSeverityColor(sev)
        if (color === 'red') return '#c62828'
        if (color === 'orange') return '#e67e22'
        return '#f1c40f'
    }

    const generateArt = async () => {
        if (!artRef.current) return
        const canvas = await html2canvas(artRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f5f5f5'
        })

        const dataURL = canvas.toDataURL('image/jpeg', 0.9)
        const link = document.createElement('a')
        link.download = `alerta-${selectedAlert?.id || Date.now()}.jpg`
        link.href = dataURL
        link.click()
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-4 border-b border-slate-100 shrink-0">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800">Alertas INMET</h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Santa Maria de Jetibá</p>
                </div>
                <button onClick={fetchAlerts} className={`p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <RefreshCw className="animate-spin text-blue-600 mb-4" size={40} />
                        <p className="font-bold text-slate-500">Buscando avisos...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mb-4">
                            <Info className="text-green-500" size={32} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 mb-2">Sem avisos vigentes</h2>
                        <p className="text-sm font-medium text-slate-500">Não há alertas meteorológicos ativos para sua região no momento.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Selecionar Alerta</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {alerts.map((alert) => (
                                    <button
                                        key={alert.id}
                                        onClick={() => setSelectedAlert(alert)}
                                        className={`shrink-0 px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${selectedAlert?.id === alert.id ? 'border-blue-600 bg-blue-50' : 'border-white bg-white shadow-sm'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-${getSeverityColor(alert.severidade)}-500`} />
                                        <div className="text-left">
                                            <div className="text-xs font-black text-slate-800 leading-none">{alert.tipo}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{alert.severidade}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Format Switch */}
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                            <button onClick={() => setFormat('stories')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${format === 'stories' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
                                <ImageIcon size={18} /> Stories
                            </button>
                            <button onClick={() => setFormat('feed')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${format === 'feed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
                                < ImageIcon size={18} /> Feed
                            </button>
                        </div>

                        {/* Generator Preview Area */}
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border-4 border-white mb-6">
                                {/* Art to Capture */}
                                <div
                                    ref={artRef}
                                    style={{
                                        aspectRatio: format === 'stories' ? '9/16' : '1/1',
                                        width: '100%',
                                        backgroundColor: '#f5f5f5',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        fontFamily: 'sans-serif'
                                    }}
                                >
                                    {/* Red Top Bar */}
                                    <div style={{ height: '2%', background: getSeverityHex(selectedAlert?.severidade), width: '100%' }} />

                                    {/* Info Header */}
                                    <div style={{ padding: '8% 5% 5%', textAlign: 'center' }}>
                                        <h1 style={{ margin: 0, fontSize: format === 'stories' ? '2.2rem' : '2.8rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>AVISO DE RISCO</h1>
                                        <p style={{ margin: '2% 0 8%', fontSize: format === 'stories' ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '3px' }}>METEOROLÓGICO</p>

                                        <div style={{
                                            display: 'inline-block',
                                            padding: '3% 10%',
                                            borderRadius: '50px',
                                            backgroundColor: getSeverityHex(selectedAlert?.severidade),
                                            color: getSeverityColor(selectedAlert?.severidade) === 'yellow' ? '#1e293b' : 'white',
                                            fontSize: format === 'stories' ? '1rem' : '1.2rem',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                        }}>
                                            {selectedAlert?.severidade?.toUpperCase() || 'GRANDE PERIGO'}
                                        </div>
                                    </div>

                                    {/* Dynamic Map/Image Holder - Simulating the manual upload area but with icon */}
                                    <div style={{ flex: 1, margin: '0 5% 5%', backgroundColor: 'white', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '6% 6% 4%', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6', marginBottom: '1%' }}>TIPO DE EVENTO</div>
                                            <div style={{ fontSize: format === 'stories' ? '1.1rem' : '1.4rem', fontWeight: 900, color: '#1e293b' }}>{selectedAlert?.tipo || '...'}</div>
                                        </div>

                                        <div style={{ flex: 1, padding: '5% 6%', color: '#475569', fontSize: format === 'stories' ? '0.85rem' : '1rem', lineHeight: 1.5 }}>
                                            <div style={{ fontWeight: 900, fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2%' }}>RISCOS E RECOMENDAÇÕES</div>
                                            {selectedAlert?.riscos && (
                                                <div style={{ marginBottom: '4%' }}>{selectedAlert.riscos}</div>
                                            )}
                                            {selectedAlert?.instrucoes && typeof selectedAlert.instrucoes === 'string' && (
                                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                    {selectedAlert.instrucoes.split('\n').map((li, i) => (
                                                        <li key={i} style={{ marginBottom: '2%' }}>{li.replace(/^[-•*]\s*/, '')}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Validity Section */}
                                        <div style={{ padding: '4% 6%', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5%' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8' }}>INÍCIO</div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b' }}>{formatDate(selectedAlert?.inicio)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8' }}>PREVISÃO FIM</div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b' }}>{formatDate(selectedAlert?.fim)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div style={{
                                        padding: '4% 5%',
                                        backgroundColor: getSeverityHex(selectedAlert?.severidade),
                                        color: getSeverityColor(selectedAlert?.severidade) === 'yellow' ? '#1e293b' : 'white',
                                        textAlign: 'center',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        letterSpacing: '1px'
                                    }}>
                                        DEFESA CIVIL - SANTA MARIA DE JETIBÁ/ES
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full max-w-sm">
                                <button
                                    onClick={generateArt}
                                    className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
                                >
                                    <Download size={20} /> Baixar Arte
                                </button>
                                <button
                                    onClick={() => {
                                        const text = `⚠️ *AVISO DE RISCO INMET*\n\n🔹 *Tipo:* ${selectedAlert?.tipo}\n🔸 *Severidade:* ${selectedAlert?.severidade}\n\n📍 *Município:* Santa Maria de Jetibá\n⏰ *Fim:* ${formatDate(selectedAlert?.fim)}\n\n⚠️ ${selectedAlert?.riscos}\n\n📱 Mais informações em: app.sigerd.com.br`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                                    }}
                                    className="flex-1 bg-green-600 text-white py-4 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
                                >
                                    <Share2 size={20} /> Compartilhar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Floating Nav Hint */}
            <div className="fixed bottom-6 left-6 right-6 z-50">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                        <ImageIcon size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider">Módulo Gerador INMET</span>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <AlertTriangle className="text-blue-600" size={18} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Alerts

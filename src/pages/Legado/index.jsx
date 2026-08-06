import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, History, Filter, Map as MapIcon, BarChart3, Search, Calendar, User, Info, ShieldAlert, X, FileText, Upload, Loader2, Eye, Download, Trash2, ExternalLink, Plus, Send, CheckCircle2, FileCode, Lock } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import LimiteSMJLayer from '../../components/LimiteSMJLayer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { getLegadoPdf, uploadLegadoPdf } from '../../services/legadoService'
import { getOficiosList, getLegadoResumo } from '../../services/oficiosService'
import NovoOficioModal from './NovoOficioModal'
import { supabase } from '../../services/supabase'
import localforage from 'localforage'
import 'leaflet/dist/leaflet.css'

// Import legacy vistorias
import legacyData from '../../data/legacy_vistorias.json'

const getDrivePreviewUrl = (url) => {
    if (!url) return null
    const match = url.match(/\/(?:file\/d\/|d\/)([a-zA-Z0-9_-]+)(?:\/|$)/)
    if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)
    if (docMatch && docMatch[1]) {
        return `https://docs.google.com/document/d/${docMatch[1]}/preview`
    }
    return url
}

const LegadoDashboard = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState('vistorias') // 'vistorias' | 'pareceres' | 'oficios'

    useEffect(() => {
        if (location.pathname.includes('/oficios')) {
            setActiveTab('oficios')
        } else if (location.pathname.includes('/vistorias')) {
            setActiveTab('vistorias')
        }
    }, [location.pathname])

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        if (tab === 'oficios') {
            navigate('/legado/oficios', { replace: true })
        } else {
            navigate('/legado/vistorias', { replace: true })
        }
    }
    
    // Global filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedYear, setSelectedYear] = useState('Todos') // Default para 'Todos' para exibir todo o acervo histórico
    const [showFilters, setShowFilters] = useState(false)
    
    // PDF Modal states
    const [selectedItem, setSelectedItem] = useState(null)
    const [pdfRecord, setPdfRecord] = useState(null)
    const [loadingPdf, setLoadingPdf] = useState(false)
    const [uploadingPdf, setUploadingPdf] = useState(false)
    const [showPdfViewerModal, setShowPdfViewerModal] = useState(false)

    // Ofícios state
    const [oficiosList, setOficiosList] = useState([])
    const [oficiosResumo, setOficiosResumo] = useState({ totalGeral: 0, distribuicaoAno: [], topDestinatarios: [] })
    const [loadingOficios, setLoadingOficios] = useState(false)
    const [showNovoOficioModal, setShowNovoOficioModal] = useState(false)

    // Anos disponíveis para seleção no acervo de ofícios
    const availableOficioYears = ['Todos', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2015', '2014']

    useEffect(() => {
        if (activeTab === 'oficios') {
            loadOficiosData()
        }
    }, [activeTab, selectedYear, searchQuery])

    const loadOficiosData = async () => {
        setLoadingOficios(true)
        try {
            const list = await getOficiosList({ year: selectedYear, searchQuery })
            setOficiosList(list)

            const resumo = await getLegadoResumo()
            setOficiosResumo(resumo)
        } catch (err) {
            console.error('Erro ao carregar dados de ofícios:', err)
        } finally {
            setLoadingOficios(false)
        }
    }

    const handleOpenDocumentView = (oficio) => {
        let rawUrl = oficio.arquivo_pdf_url || oficio.arquivo_url || oficio.arquivo_original_scan_url;
        if (rawUrl) {
            rawUrl = rawUrl.replace('/vistorias_fotos/legado_oficios/', '/oficios_legados/');
        }
        const fileUrl = rawUrl ? (rawUrl.split('?')[0] + '?v=' + Date.now()) : null;
        setPdfRecord({
            pdf_url: fileUrl,
            preview_url: fileUrl,
            nome_arquivo: oficio.identificador_completo || `Ofício ${oficio.numero_formatado}`,
            is_oficio: true,
            oficio_data: oficio
        })
        setShowPdfViewerModal(true)
    }

    const handleSelectItem = async (item) => {
        setSelectedItem(item)
        if (item.drive_url) {
            const previewUrl = getDrivePreviewUrl(item.drive_url)
            setPdfRecord({
                pdf_url: item.drive_url,
                preview_url: previewUrl,
                nome_arquivo: `${item.fullTitle}`,
                created_at: new Date().toISOString(),
                is_drive: true
            })
            setShowPdfViewerModal(true)
            return
        }
        setLoadingPdf(true)
        try {
            const record = await getLegadoPdf(item.id)
            setPdfRecord(record)
        } catch (err) {
            console.error('Error fetching legacy pdf:', err)
        } finally {
            setLoadingPdf(false)
        }
    }

    const handleUploadFile = async (e, vistoriaId) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (file.type !== 'application/pdf' && fileExt !== 'pdf') {
            alert('Por favor, selecione um arquivo no formato PDF.')
            return
        }
        
        setUploadingPdf(true)
        try {
            const record = await uploadLegadoPdf(vistoriaId, file)
            setPdfRecord(record)
            alert('PDF anexado e salvo com sucesso!')
        } catch (err) {
            console.error('Error uploading pdf:', err)
            alert('Erro ao realizar upload do PDF.')
        } finally {
            setUploadingPdf(false)
        }
    }

    const handleDeletePdf = async (vistoriaId) => {
        if (!window.confirm('Tem certeza de que deseja remover o PDF deste laudo legado?')) return
        
        setLoadingPdf(true)
        try {
            const { error } = await supabase
                .from('laudos_legados_pdf')
                .delete()
                .eq('vistoria_id', vistoriaId)
                
            if (error) throw error
            
            const localData = await localforage.getItem('sigerd_legado_pdfs') || {}
            delete localData[vistoriaId]
            await localforage.setItem('sigerd_legado_pdfs', localData)
            
            setPdfRecord(null)
            alert('PDF removido com sucesso!')
        } catch (err) {
            console.error('Error deleting pdf:', err)
            alert('Erro ao excluir o PDF.')
        } finally {
            setLoadingPdf(false)
        }
    }

    // Calculate years from data for Vistorias
    const availableYears = useMemo(() => {
        const years = [...new Set(legacyData.map(item => String(item.year)))].sort((a, b) => b - a)
        return ['Todos', ...years]
    }, [])

    const filteredData = useMemo(() => {
        return legacyData.filter(item => {
            const matchesYear = selectedYear === 'Todos' || String(item.year) === String(selectedYear)
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = (item.requester || '').toLowerCase().includes(searchLower) ||
                (item.number || '').includes(searchLower) ||
                (item.fullTitle || '').toLowerCase().includes(searchLower)
            
            if (activeTab === 'pareceres') {
                return matchesYear && matchesSearch && !!item.drive_url
            }

            return matchesYear && matchesSearch
        })
    }, [selectedYear, searchQuery, activeTab])

    const yearChartData = useMemo(() => {
        const counts = {}
        legacyData.forEach(item => {
            const yr = String(item.year)
            counts[yr] = (counts[yr] || 0) + 1
        })
        return Object.keys(counts).map(year => ({
            year,
            quantidade: counts[year]
        })).sort((a, b) => a.year - b.year)
    }, [])

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm z-10 font-sans">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <History size={24} className="text-blue-600" />
                            Acervo Legado COMPDEC
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Histórico Institucional COMPDEC 2014-2026</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl border border-slate-200 dark:border-slate-600">
                    <button
                        onClick={() => handleTabChange('vistorias')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'vistorias' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                    >
                        Vistorias ({legacyData.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('oficios')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'oficios' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                    >
                        Ofícios ({oficiosResumo.totalGeral || 353})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'oficios' && (
                        <button
                            onClick={() => setShowNovoOficioModal(true)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <Plus size={16} /> Novo Ofício
                        </button>
                    )}

                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={activeTab === 'oficios' ? "Buscar por número, destinatário ou assunto..." : "Buscar laudo ou requerente..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm w-64 transition-all outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            {activeTab === 'oficios' ? (
                /* TAB 3: OFÍCIOS COMPDEC */
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 font-sans">
                    
                    {/* Seletor de Anos Dedicado */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar size={14} className="text-blue-600" /> Selecionar Ano de Exercício dos Ofícios:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableOficioYears.map(yr => (
                                <button
                                    key={yr}
                                    onClick={() => setSelectedYear(yr)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${selectedYear === yr ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                >
                                    {yr}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total no Acervo (2014-2026)</p>
                                <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{oficiosResumo.totalGeral}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                                <FileText size={24} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofícios no Ano ({selectedYear})</p>
                                <p className="text-3xl font-black text-blue-600 mt-1">{oficiosList.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                                <Calendar size={24} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Armazenamento Nuvem</p>
                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={16} /> Supabase Storage Bucket
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 font-black">
                                <ShieldAlert size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Tabela detalhada de Ofícios */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-blue-600" size={18} />
                                Listagem Sequencial do Exercício ({selectedYear})
                            </h2>
                            <span className="text-xs font-bold text-slate-500">{oficiosList.length} registro(s)</span>
                        </div>

                        {loadingOficios ? (
                            <div className="p-12 text-center text-slate-400">
                                <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" size={32} />
                                <p className="text-sm font-bold">Carregando acervo de ofícios...</p>
                            </div>
                        ) : oficiosList.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <FileText size={48} className="mx-auto mb-2 opacity-30" />
                                <p className="text-base font-bold">Nenhum ofício encontrado para o ano {selectedYear}.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="py-3.5 px-4">Identificador / Ofício</th>
                                            <th className="py-3.5 px-4">Ano</th>
                                            <th className="py-3.5 px-4">Destinatário</th>
                                            <th className="py-3.5 px-4">Assunto / Descrição</th>
                                            <th className="py-3.5 px-4 text-center">Documento PDF (Supabase)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {oficiosList.map((oficio) => (
                                            <tr key={oficio.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="py-3.5 px-4 font-black text-slate-800 dark:text-white">
                                                    {oficio.identificador_completo}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                                                    {oficio.ano}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                                                    {oficio.destinatario_nome || oficio.destinatario_orgao || 'COMPDEC SMJ'}
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400 max-w-md truncate">
                                                    {oficio.assunto || 'Sem assunto especificado'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenDocumentView(oficio)}
                                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 rounded-xl font-bold transition-all flex items-center gap-1.5 mx-auto"
                                                    >
                                                        <Eye size={14} /> Abrir PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                /* TAB 1 e 2: VISTORIAS E PARECERES LEGADOS */
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Sidebar: Filters & Cards List */}
                    <div className="w-full md:w-[420px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full font-sans">
                        
                        {/* Seletor de Ano para Vistorias e Pareceres */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Filter size={12} /> Exercício Histórico:
                                </label>
                                <span className="text-xs font-bold text-blue-600">{filteredData.length} registro(s)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {availableYears.map(yr => (
                                    <button
                                        key={yr}
                                        onClick={() => setSelectedYear(yr)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${selectedYear === yr ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                    >
                                        {yr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cards List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredData.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 space-y-2">
                                    <Info size={36} className="mx-auto opacity-30" />
                                    <p className="text-sm font-bold">Nenhuma vistoria ou parecer encontrado para este filtro.</p>
                                </div>
                            ) : (
                                filteredData.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectItem(item)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedItem?.id === item.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-black uppercase">
                                                    {item.number}
                                                </span>
                                                <h3 className="font-bold text-sm text-slate-800 dark:text-white mt-1 leading-snug">
                                                    {item.fullTitle}
                                                </h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 shrink-0">{item.year}</span>
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                                            Requerente: <strong className="text-slate-700 dark:text-slate-200">{item.requester}</strong>
                                        </p>

                                        {item.drive_url && (
                                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Documento Digitalizado
                                                </span>
                                                <span className="text-blue-600 font-bold flex items-center gap-1">
                                                    Visualizar <Eye size={12} />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Body: Interactive Map Container */}
                    <div className="flex-1 relative bg-slate-100 dark:bg-slate-900 h-full">
                        <MapContainer
                            center={[-20.033, -40.755]}
                            zoom={11}
                            className="w-full h-full z-0"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <LimiteSMJLayer />

                            {filteredData.filter(item => item.lat && item.lng).map(item => (
                                <CircleMarker
                                    key={item.id}
                                    center={[parseFloat(item.lat), parseFloat(item.lng)]}
                                    radius={selectedItem?.id === item.id ? 10 : 7}
                                    pathOptions={{
                                        color: selectedItem?.id === item.id ? '#2563eb' : '#ef4444',
                                        fillColor: selectedItem?.id === item.id ? '#3b82f6' : '#f87171',
                                        fillOpacity: 0.8,
                                        weight: 2
                                    }}
                                    eventHandlers={{
                                        click: () => handleSelectItem(item)
                                    }}
                                >
                                    <Popup className="font-sans">
                                        <div className="p-1 max-w-xs">
                                            <span className="text-[10px] font-black text-blue-600 uppercase">{item.number}</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-0.5 leading-tight">{item.fullTitle}</h4>
                                            <p className="text-xs text-slate-600 mt-1">Requerente: {item.requester}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Ano: {item.year}</p>
                                            <div className="mt-2 pt-2 border-t flex justify-end">
                                                <button
                                                    onClick={() => handleSelectItem(item)}
                                                    className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg"
                                                >
                                                    Ver Detalhes
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            )}

            {/* Modal de Novo Ofício Wizard */}
            <NovoOficioModal
                isOpen={showNovoOficioModal}
                onClose={() => setShowNovoOficioModal(false)}
                onSuccess={() => loadOficiosData()}
            />

            {/* Modal Leitor de PDF / Documento Legado em Tela Cheia (Somente Leitura - Supabase Storage) */}
            {showPdfViewerModal && pdfRecord && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
                    <div className="bg-slate-900 w-full max-w-5xl h-[92vh] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Header do Leitor */}
                        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                            <Lock size={12} /> Supabase Storage (Somente Leitura)
                                        </span>
                                    </div>
                                    <p className="text-sm font-black text-slate-200 truncate max-w-[250px] sm:max-w-xl leading-tight">
                                        {pdfRecord.nome_arquivo || 'Ofício COMPDEC'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {pdfRecord.pdf_url && (
                                    <a 
                                        href={pdfRecord.pdf_url}
                                        download={pdfRecord.nome_arquivo || 'oficio_compdec.pdf'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        title="Baixar Arquivo Oficial do Supabase Storage"
                                    >
                                        <Download size={16} /> Baixar
                                    </a>
                                )}
                                <button 
                                    onClick={() => setShowPdfViewerModal(false)}
                                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Viewer Frame Body */}
                        <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center">
                            {pdfRecord.pdf_url ? (
                                <iframe 
                                    key={pdfRecord.pdf_url}
                                    src={pdfRecord.pdf_url} 
                                    className="w-full h-full border-none"
                                    title="Visualizador do Ofício Legado Supabase Storage"
                                />
                            ) : (
                                <div className="text-center p-8 text-slate-400 space-y-3">
                                    <FileText size={48} className="mx-auto text-slate-600" />
                                    <p className="text-sm font-bold">Documento digitalizado não anexado ou em fase de transição de acervo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LegadoDashboard

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, History, Filter, Map as MapIcon, BarChart3, Search, Calendar, User, Info, ShieldAlert, X, FileText, Upload, Loader2, Eye, Download, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getLegadoPdf, uploadLegadoPdf } from '../../services/legadoService'
import { supabase } from '../../services/supabase'
import localforage from 'localforage'
import 'leaflet/dist/leaflet.css'

// Import legacy data
import legacyData from '../../data/legacy_vistorias.json'

const LegadoDashboard = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedYear, setSelectedYear] = useState('Todos')
    const [showFilters, setShowFilters] = useState(false)
    
    // PDF Modal states
    const [selectedItem, setSelectedItem] = useState(null)
    const [pdfRecord, setPdfRecord] = useState(null)
    const [loadingPdf, setLoadingPdf] = useState(false)
    const [uploadingPdf, setUploadingPdf] = useState(false)
    const [showPdfViewerModal, setShowPdfViewerModal] = useState(false)

    const handleSelectItem = async (item) => {
        setSelectedItem(item)
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

    // Calculate years from data
    const availableYears = useMemo(() => {
        const years = [...new Set(legacyData.map(item => item.year))].sort((a, b) => b - a)
        return ['Todos', ...years]
    }, [])

    const filteredData = useMemo(() => {
        return legacyData.filter(item => {
            const matchesYear = selectedYear === 'Todos' || item.year === selectedYear
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch = item.requester.toLowerCase().includes(searchLower) ||
                item.number.includes(searchLower) ||
                item.fullTitle.toLowerCase().includes(searchLower)
            return matchesYear && matchesSearch
        })
    }, [selectedYear, searchQuery])

    // Chart Data: Vistorias per Year
    const yearChartData = useMemo(() => {
        const counts = {}
        legacyData.forEach(item => {
            counts[item.year] = (counts[item.year] || 0) + 1
        })
        return Object.keys(counts).map(year => ({
            year,
            quantidade: counts[year]
        })).sort((a, b) => a.year - b.year)
    }, [])

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm z-10 font-sans">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <History size={24} className="text-blue-600" />
                            Legado COMPDEC
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Histórico de Vistorias 2015-2025</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar laudo ou requerente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm w-64 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>
            </header>

            {/* Filters Row */}
            {showFilters && (
                <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-4 animate-in slide-in-from-top-4 duration-300 z-10">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">filtrar por ano</label>
                        <div className="flex flex-wrap gap-2">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedYear === year ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Search for mobile */}
                    <div className="md:hidden w-full flex flex-col gap-1.5 mt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Laudo ou requerente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 font-sans">

                {/* Left Panel: Sidebar Stats & List */}
                <div className="col-span-1 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800 overflow-hidden h-[40vh] lg:h-auto z-10 shadow-xl">

                    {/* Stats Header */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumo Legado</h2>
                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-black">{filteredData.length} Vistorias</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Geral</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{legacyData.length}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">No Filtro</p>
                                <p className="text-xl font-black text-blue-600">{filteredData.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Vistorias per Year Chart */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BarChart3 size={14} /> Distribuição por Ano
                            </h3>
                            <div className="h-48 w-full bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl p-2 border border-slate-100 dark:border-slate-700">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '11px', fontWeight: 700 }}
                                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                                        />
                                        <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* List of Vistorias (Top 100 or filtered) */}
                        <div className="space-y-2 pb-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10">
                                <History size={14} /> Listagem Detalhada
                            </h3>
                            {filteredData.slice(0, 100).map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-transparent hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-all flex items-start gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm font-black text-[10px] text-blue-600 border border-slate-100 dark:border-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {item.number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">{item.requester}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.year}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[9px] text-blue-500 font-bold uppercase">Laudo DC</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredData.length > 100 && (
                                <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Exibindo 100 de {filteredData.length} registros
                                    </p>
                                    <p className="text-[9px] text-slate-300 mt-1 uppercase">Aperte em um ponto no mapa para ver detalhes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="col-span-1 lg:col-span-3 relative h-[60vh] lg:h-auto">
                    <MapContainer
                        center={[-20.0246, -40.6976]} // Santa Maria de Jetibá
                        zoom={13}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {filteredData.filter(item => item.lat != null && item.lon != null && !isNaN(Number(item.lat))).map(item => (
                            <CircleMarker
                                key={item.id}
                                center={[item.lat, item.lon]}
                                radius={7}
                                pathOptions={{
                                    color: '#1e40af',
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.6,
                                    weight: 2
                                }}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[220px] font-sans">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/20">
                                                {item.number}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ano Referência</p>
                                                <p className="text-sm font-black text-slate-800 uppercase">{item.year}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Requerente / Objeto</span>
                                                <p className="text-xs font-bold text-slate-700 leading-snug">{item.requester}</p>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Título Original</span>
                                                <p className="text-[10px] text-slate-500 italic leading-tight">{item.fullTitle}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Info size={12} className="text-blue-500" />
                                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Histórico Legado</span>
                                            </div>
                                            <button
                                                onClick={() => handleSelectItem(item)}
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>

                    {/* Floating Controls */}
                    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
                            <button onClick={(e) => { e.stopPropagation(); navigate('/monitoramento/riscos'); }} title="Alternar para Áreas de Risco" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-orange-500">
                                <ShieldAlert size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Floating Legend */}
                    <div className="absolute bottom-6 left-6 lg:left-auto lg:right-6 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20 pointer-events-none">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legenda Visual</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Vistoria Georreferenciada</span>
                            </div>
                            <p className="text-[8px] text-slate-400 max-w-[150px] leading-tight font-medium uppercase mt-1">Dados provenientes do arquivo COMPDEC (2015-2025)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes da Vistoria Legada */}
            {selectedItem && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                                    {selectedItem.number || 'S/N'}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">Laudo Técnico {selectedItem.number}/{selectedItem.year}</h2>
                                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-none">Histórico Legado COMPDEC</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setSelectedItem(null); setPdfRecord(null); }} 
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detalhes da Vistoria */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Informações Gerais</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Requerente</span>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedItem.requester}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ano de Referência</span>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedItem.year}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Título Original do Arquivo</span>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">{selectedItem.fullTitle}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Coordenadas Geográficas</span>
                                        <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-350">
                                            Lat: {selectedItem.lat?.toFixed(6)} | Lon: {selectedItem.lon?.toFixed(6)}
                                        </p>
                                    </div>
                                </div>

                                {/* Mini Mapa do ponto */}
                                <div className="h-44 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-0">
                                    <MapContainer center={[selectedItem.lat, selectedItem.lon]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <CircleMarker center={[selectedItem.lat, selectedItem.lon]} radius={8} pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 2 }} />
                                    </MapContainer>
                                </div>
                            </div>

                            {/* Upload e Visualização do PDF */}
                            <div className="flex flex-col border-l border-slate-100 dark:border-slate-800 md:pl-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Laudo Digitalizado (PDF)</h3>

                                {loadingPdf ? (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
                                        <Loader2 className="animate-spin text-blue-600" size={32} />
                                        <span className="text-xs font-bold text-slate-400 uppercase">Buscando documento...</span>
                                    </div>
                                ) : pdfRecord ? (
                                    <div className="flex-1 flex flex-col gap-4">
                                        <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/30 dark:border-blue-900/30 rounded-2xl flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{pdfRecord.nome_arquivo || 'laudo_tecnico.pdf'}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5">Anexado em {new Date(pdfRecord.created_at).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <button 
                                                    onClick={() => setShowPdfViewerModal(true)}
                                                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Eye size={14} /> Visualizar
                                                </button>
                                                <a 
                                                    href={pdfRecord.pdf_url}
                                                    download={pdfRecord.nome_arquivo || 'laudo_tecnico.pdf'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Download size={14} /> Baixar
                                                </a>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleDeletePdf(selectedItem.id)}
                                                className="w-full py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Trash2 size={12} /> Remover PDF Anexo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-white dark:bg-slate-850 flex flex-col items-center justify-center gap-4">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => handleUploadFile(e, selectedItem.id)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                disabled={uploadingPdf}
                                            />
                                            {uploadingPdf ? (
                                                <>
                                                    <Loader2 className="animate-spin text-blue-600" size={36} />
                                                    <p className="text-xs font-black text-slate-750 dark:text-slate-300 uppercase tracking-widest">Enviando PDF para a Nuvem...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                                                        <Upload size={28} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Carregar PDF do Laudo</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">Arraste ou clique para selecionar o arquivo PDF digitalizado oficial.</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visualização do PDF em Tela Cheia */}
            {showPdfViewerModal && pdfRecord && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-800">
                        {/* Header */}
                        <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-500" size={20} />
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Visualizando Laudo</h3>
                                    <p className="text-sm font-black text-slate-200 truncate max-w-[250px] sm:max-w-md">{pdfRecord.nome_arquivo || 'laudo_tecnico.pdf'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={pdfRecord.pdf_url}
                                    download={pdfRecord.nome_arquivo || 'laudo_tecnico.pdf'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
                                    title="Baixar PDF"
                                >
                                    <Download size={18} />
                                </a>
                                <button 
                                    onClick={() => setShowPdfViewerModal(false)}
                                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Viewer Body */}
                        <div className="flex-1 bg-slate-950 relative flex items-center justify-center">
                            {/* Iframe para Desktop (apenas se for link remoto para evitar restrições de iframe em data-urls de browsers) */}
                            {pdfRecord.pdf_url && !pdfRecord.pdf_url.startsWith('data:') ? (
                                <iframe 
                                    src={pdfRecord.pdf_url} 
                                    className="w-full h-full border-none hidden md:block"
                                    title="Visualizador de PDF Legado"
                                />
                            ) : (
                                <div className="hidden md:flex flex-col items-center justify-center p-8 text-center gap-4 text-white">
                                    <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-450">
                                        <FileText size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-slate-200 uppercase tracking-wide">Documento Armazenado Localmente (Offline)</h4>
                                        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-md">Este laudo está armazenado temporariamente no cache local do seu dispositivo. Clique no botão abaixo para abrir ou baixar o PDF diretamente.</p>
                                    </div>
                                    <a 
                                        href={pdfRecord.pdf_url}
                                        download={pdfRecord.nome_arquivo || 'laudo_tecnico.pdf'}
                                        className="px-6 py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                                    >
                                        <Download size={16} /> Abrir / Salvar Arquivo PDF
                                    </a>
                                </div>
                            )}
                            
                            {/* Mobile Info/Fallback */}
                            <div className="md:hidden flex flex-col items-center justify-center p-6 text-center gap-4 text-white">
                                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-200 uppercase tracking-wide">Laudo Técnico PDF</p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[280px]">Dispositivos móveis exigem um leitor externo para abrir arquivos PDF.</p>
                                </div>
                                <a 
                                    href={pdfRecord.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                                >
                                    <Eye size={16} /> Abrir Documento Completo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LegadoDashboard;

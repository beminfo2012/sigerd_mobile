import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import VistoriaForm from './VistoriaForm'
import VistoriaList from './VistoriaList'

const Vistorias = () => {
    const [view, setView] = useState('list') // 'list' | 'form'
    const [selectedVistoria, setSelectedVistoria] = useState(null)

    const [showBlockModal, setShowBlockModal] = useState(false)
    const navigate = useNavigate()

    const handleNew = () => {
        // Enforce Equipment Check Protocol
        const today = new Date().toDateString()
        const checkKey = `equipment_check_v3_${today}`
        const hasCheck = localStorage.getItem(checkKey)

        console.log(`[Protocol Check] Key: ${checkKey}, Value: ${hasCheck}`)

        if (!hasCheck) {
            console.warn('[Protocol Check] Failed - Blocking access')
            setShowBlockModal(true)
            return
        }

        console.log('[Protocol Check] Passed')
        setSelectedVistoria(null)
        setView('form')
    }

    const handleEdit = (vistoria) => {
        // Need to map DB fields to Form fields if they differ
        // For now passing raw, assuming Form handles it or we map here
        // DB: tipo_info, etc. Form: tipoInfo
        // Simplest mapping:
        const mappedData = {
            ...vistoria,
            tipoInfo: vistoria.tipo_info,
            vistoriaId: vistoria.vistoria_id,
            dataHora: vistoria.data_hora || new Date().toISOString().slice(0, 16),
            fotos: vistoria.fotos || [], // If JSONB is array of objects
            documentos: vistoria.documentos || []
        }

        setSelectedVistoria(mappedData)
        setView('form')
    }

    const handleBack = () => {
        setView('list')
        setSelectedVistoria(null)
    }

    return (
        <div>
            {view === 'list' && (
                <VistoriaList onNew={handleNew} onEdit={handleEdit} />
            )}
            {view === 'form' && (
                <VistoriaForm onBack={handleBack} initialData={selectedVistoria} />
            )}

            {/* Protocol Enforcement Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 z-[60]" onClick={() => setShowBlockModal(false)}>
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-amber-600" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-800 mb-2">Prontidão Não Confirmada</h3>
                        <p className="text-sm text-center text-slate-500 mb-6 leading-relaxed">
                            Para garantir a segurança da operação, é obrigatório confirmar a verificação de equipamentos do dia antes de iniciar.
                        </p>
                        <button
                            onClick={() => navigate('/checklist-saida')}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                        >
                            Ir para Iniciar Vistoria
                        </button>
                        <button
                            onClick={() => setShowBlockModal(false)}
                            className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vistorias

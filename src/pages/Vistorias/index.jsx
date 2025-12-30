import React, { useState } from 'react'
import VistoriaForm from './VistoriaForm'
import VistoriaList from './VistoriaList'

const Vistorias = () => {
    const [view, setView] = useState('list') // 'list' | 'form'
    const [selectedVistoria, setSelectedVistoria] = useState(null)

    const handleNew = () => {
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
        </div>
    )
}

export default Vistorias

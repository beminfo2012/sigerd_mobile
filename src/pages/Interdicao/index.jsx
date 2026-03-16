import React, { useState } from 'react'
import InterdicaoForm from './InterdicaoForm'
import InterdicaoList from './InterdicaoList'
import DesinterdicaoForm from './DesinterdicaoForm'

const Interdicao = () => {
    const [view, setView] = useState('list') // 'list' | 'form' | 'desinterdicao'
    const [selectedInterdicao, setSelectedInterdicao] = useState(null)
    const [selectedDesinterdicao, setSelectedDesinterdicao] = useState(null)

    const handleNew = () => {
        setSelectedInterdicao(null)
        setSelectedDesinterdicao(null)
        setView('form')
    }

    const handleEdit = (interdicao) => {
        setSelectedInterdicao(interdicao)
        setSelectedDesinterdicao(null)
        setView('form')
    }

    const handleDesinterdicao = (interdicao) => {
        setSelectedInterdicao(interdicao)
        setSelectedDesinterdicao(null)
        setView('desinterdicao')
    }

    const handleEditDesinterdicao = (desinterdicao, parentInterdicao) => {
        setSelectedInterdicao(parentInterdicao)
        setSelectedDesinterdicao(desinterdicao)
        setView('desinterdicao')
    }

    const handleBack = () => {
        setView('list')
        setSelectedInterdicao(null)
        setSelectedDesinterdicao(null)
    }

    return (
        <div>
            {view === 'list' && (
                <InterdicaoList 
                    onNew={handleNew} 
                    onEdit={handleEdit} 
                    onDesinterdicao={handleDesinterdicao}
                    onEditDesinterdicao={handleEditDesinterdicao}
                />
            )}
            {view === 'form' && (
                <InterdicaoForm 
                    onBack={handleBack} 
                    initialData={selectedInterdicao} 
                    onDesinterdicao={handleDesinterdicao}
                    onEditDesinterdicao={handleEditDesinterdicao}
                />
            )}
            {view === 'desinterdicao' && (
                <DesinterdicaoForm 
                    interdicao={selectedInterdicao} 
                    initialData={selectedDesinterdicao}
                    onBack={handleBack} 
                />
            )}
        </div>
    )
}

export default Interdicao


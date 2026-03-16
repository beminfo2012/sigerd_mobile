import React, { useState } from 'react'
import InterdicaoForm from './InterdicaoForm'
import InterdicaoList from './InterdicaoList'
import DesinterdicaoForm from './DesinterdicaoForm'

const Interdicao = () => {
    const [view, setView] = useState('list') // 'list' | 'form' | 'desinterdicao'
    const [selectedInterdicao, setSelectedInterdicao] = useState(null)

    const handleNew = () => {
        setSelectedInterdicao(null)
        setView('form')
    }

    const handleEdit = (interdicao) => {
        setSelectedInterdicao(interdicao)
        setView('form')
    }

    const handleDesinterdicao = (interdicao) => {
        setSelectedInterdicao(interdicao)
        setView('desinterdicao')
    }

    const handleBack = () => {
        setView('list')
        setSelectedInterdicao(null)
    }

    return (
        <div>
            {view === 'list' && (
                <InterdicaoList 
                    onNew={handleNew} 
                    onEdit={handleEdit} 
                    onDesinterdicao={handleDesinterdicao} 
                />
            )}
            {view === 'form' && (
                <InterdicaoForm 
                    onBack={handleBack} 
                    initialData={selectedInterdicao} 
                    onDesinterdicao={handleDesinterdicao}
                />
            )}
            {view === 'desinterdicao' && (
                <DesinterdicaoForm interdicao={selectedInterdicao} onBack={handleBack} />
            )}
        </div>
    )
}

export default Interdicao


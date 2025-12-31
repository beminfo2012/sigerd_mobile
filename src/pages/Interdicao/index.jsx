import React, { useState } from 'react'
import InterdicaoForm from './InterdicaoForm'
import InterdicaoList from './InterdicaoList'

const Interdicao = () => {
    const [view, setView] = useState('list') // 'list' | 'form'
    const [selectedInterdicao, setSelectedInterdicao] = useState(null)

    const handleNew = () => {
        setSelectedInterdicao(null)
        setView('form')
    }

    const handleEdit = (interdicao) => {
        setSelectedInterdicao(interdicao)
        setView('form')
    }

    const handleBack = () => {
        setView('list')
        setSelectedInterdicao(null)
    }

    return (
        <div>
            {view === 'list' && (
                <InterdicaoList onNew={handleNew} onEdit={handleEdit} />
            )}
            {view === 'form' && (
                <InterdicaoForm onBack={handleBack} initialData={selectedInterdicao} />
            )}
        </div>
    )
}

export default Interdicao

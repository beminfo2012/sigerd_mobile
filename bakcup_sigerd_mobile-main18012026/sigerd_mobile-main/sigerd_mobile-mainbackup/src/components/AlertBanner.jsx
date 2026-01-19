import React from 'react'

const AlertBanner = ({ level = 'normal', message }) => {
    const getGradient = () => {
        switch (level) {
            case 'high': return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            case 'medium': return 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
            case 'low':
            default: return 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
        }
    }

    const styles = {
        background: getGradient(),
        color: level === 'medium' ? '#333' : 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }

    return (
        <div style={styles}>
            <span style={{ fontWeight: 'bold' }}>{message}</span>
            <span style={{ fontSize: '24px' }}>
                {level === 'high' && '⚠️'}
                {level === 'medium' && '⚡'}
                {level === 'low' && '✅'}
            </span>
        </div>
    )
}

export default AlertBanner

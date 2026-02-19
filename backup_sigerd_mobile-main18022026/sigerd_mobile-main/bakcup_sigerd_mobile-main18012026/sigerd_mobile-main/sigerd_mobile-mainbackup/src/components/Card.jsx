import React from 'react'

const Card = ({ title, value, icon, color = 'primary' }) => {
    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: 'var(--secondary-color)' }}>
                {icon && <span style={{ marginRight: '10px' }}>{icon}</span>}
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{title}</span>
            </div>
            <div className="card-value" style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {value}
            </div>
        </div>
    )
}

export default Card

import React from 'react'
import Card from '../../components/Card'
import { CloudRain, Thermometer } from 'lucide-react'

const Monitoramento = () => {
    // Mock data for initial proposal
    const stations = [
        { id: 1, name: 'Centro', rain: '12mm', level: 'Normal' },
        { id: 2, name: 'Rio Possmoser', rain: '45mm', level: 'Atenção' },
        { id: 3, name: 'Garrafão', rain: '0mm', level: 'Normal' },
        { id: 4, name: 'São Luiz', rain: '8mm', level: 'Normal' },
    ]

    return (
        <div className="p-4" style={{ paddingBottom: '80px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Estações Pluviométricas</h2>

            <div className="grid gap-4">
                {stations.map(station => (
                    <div key={station.id} style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        borderLeft: `5px solid ${station.level === 'Atenção' ? '#ffc107' : '#4CAF50'}`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        marginBottom: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: 'bold', color: '#2a5299' }}>{station.name}</h3>
                            <span style={{
                                background: station.level === 'Atenção' ? '#fff3cd' : '#d4edda',
                                color: station.level === 'Atenção' ? '#856404' : '#155724',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {station.level}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <CloudRain size={16} style={{ marginRight: '5px', color: '#2196F3' }} />
                                <span style={{ fontWeight: 'bold' }}>{station.rain}</span>
                                <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>24h</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                            Atualizado há 10 min
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Monitoramento

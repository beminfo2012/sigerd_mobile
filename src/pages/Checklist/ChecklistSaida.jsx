import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ChecklistSaida() {
    const navigate = useNavigate()
    const [confirmed, setConfirmed] = useState(false)

    const handleConfirm = () => {
        // Save confirmation timestamp
        const today = new Date().toDateString()
        localStorage.setItem(`equipment_check_v2_${today}`, new Date().toISOString())
        setConfirmed(true)

        // Navigate to inspections after a brief moment
        setTimeout(() => {
            navigate('/vistorias')
        }, 1500)
    }

    const handleCancel = () => {
        navigate('/')
    }

    if (confirmed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-5">
                <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-600" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-3">Prontidão Confirmada!</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Redirecionando para o formulário de vistoria...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-5">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
                {/* Icon Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Truck size={40} className="text-white" strokeWidth={2.5} />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black text-slate-800 text-center mb-2">
                    Iniciar Vistoria
                </h1>
                <p className="text-sm text-slate-500 text-center mb-8 font-medium">
                    Verificação de Prontidão
                </p>

                {/* Warning Box */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-lg mb-8">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <div>
                            <p className="text-sm font-bold text-amber-900 mb-2">
                                Confirmação de Equipamentos
                            </p>
                            <p className="text-sm text-amber-800 leading-relaxed">
                                Você e a viatura estão portando <strong>todos os equipamentos e ferramentas disponíveis</strong> para realizar essa vistoria?
                            </p>
                        </div>
                    </div>
                </div>

                {/* Equipment Reminder List */}
                <div className="bg-slate-50 rounded-xl p-4 mb-8">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-wide mb-3">
                        Itens Essenciais
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>Rádio</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>Lanterna</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>EPIs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>Ferramentas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>Sinalização</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>Primeiros Socorros</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all"
                    >
                        ✓ Sim, Confirmar
                    </button>
                </div>

                <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
                    A confirmação será registrada para controle interno
                </p>
            </div>
        </div>
    )
}

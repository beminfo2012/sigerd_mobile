import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Users, Package, Plus, MapPin, AlertCircle, TrendingUp, Activity } from 'lucide-react'
import { getShelters } from '../../services/shelterApi'
import { getAllSheltersLocal, getAllOccupantsLocal, getAllDonationsLocal } from '../../services/shelterDb'

const Abrigos = () => {
    const navigate = useNavigate()
    const [shelters, setShelters] = useState([])
    const [stats, setStats] = useState({
        totalShelters: 0,
        activeShelters: 0,
        totalOccupants: 0,
        totalDonations: 0,
        totalCapacity: 0,
        occupancyRate: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Fetch from API and local storage
            const [apiResult, localShelters, localOccupants, localDonations] = await Promise.all([
                getShelters().catch(() => ({ success: false, data: [] })),
                getAllSheltersLocal().catch(() => []),
                getAllOccupantsLocal().catch(() => []),
                getAllDonationsLocal().catch(() => [])
            ])

            // Combine remote and local data
            const allShelters = [
                ...(apiResult.success ? apiResult.data : []),
                ...localShelters
            ]

            // Calculate statistics
            const activeShelters = allShelters.filter(s => s.status === 'active')
            const totalOccupants = localOccupants.filter(o => o.status === 'active').length
            const totalCapacity = allShelters.reduce((sum, s) => sum + (s.current_occupancy || 0), 0)
            const occupancyRate = allShelters.length > 0
                ? Math.round((totalCapacity / allShelters.reduce((sum, s) => sum + (s.capacity || 0), 0)) * 100)
                : 0

            setStats({
                totalShelters: allShelters.length,
                activeShelters: activeShelters.length,
                totalOccupants,
                totalDonations: localDonations.length,
                totalCapacity,
                occupancyRate
            })

            setShelters(allShelters)
        } catch (error) {
            console.error('Error loading shelter data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getOccupancyColor = (current, capacity) => {
        const percentage = (current / capacity) * 100
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 70) return 'bg-orange-500'
        if (percentage >= 50) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getStatusBadge = (status) => {
        const badges = {
            active: { color: 'bg-green-50 text-green-600 border-green-200', label: 'Ativo' },
            inactive: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Inativo' },
            full: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Lotado' }
        }
        return badges[status] || badges.active
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-slate-600">Carregando abrigos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Gestão de Abrigos</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assistência Humanitária</p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                        <Building size={20} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{stats.totalShelters}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Abrigos Totais</div>
                    <div className="text-[10px] font-bold text-purple-600 mt-1">{stats.activeShelters} ativos</div>
                </div>

                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
                        <Users size={20} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{stats.totalOccupants}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pessoas Abrigadas</div>
                    <div className="text-[10px] font-bold text-emerald-600 mt-1">{stats.totalCapacity} ocupados</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 mb-3">
                        <Package size={20} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{stats.totalDonations}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Doações Recebidas</div>
                </div>

                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100">
                    <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{stats.occupancyRate}%</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Ocupação</div>
                </div>
            </div>

            {/* Quick Action Button */}
            <div
                className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-[32px] text-white mb-6 shadow-lg cursor-pointer active:scale-95 transition-all"
                onClick={() => navigate('/abrigos/novo')}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-purple-200" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">Cadastro Rápido</span>
                        </div>
                        <h2 className="text-lg font-black leading-tight">Cadastrar Novo<br />Abrigo</h2>
                        <p className="text-[10px] text-purple-200 mt-2 font-bold uppercase">Registro de Estrutura</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <Plus size={24} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Shelters List */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Abrigos Cadastrados</h3>
                    <div className="bg-slate-100 px-2 py-1 rounded-lg text-[9px] font-black text-slate-400">
                        {shelters.length} TOTAL
                    </div>
                </div>

                {shelters.length === 0 ? (
                    <div className="bg-white p-10 rounded-[32px] border border-slate-100 text-center">
                        <Building size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-black text-slate-800 mb-2">Nenhum Abrigo Cadastrado</h3>
                        <p className="text-sm text-slate-400 mb-6">Comece cadastrando o primeiro abrigo emergencial</p>
                        <button
                            onClick={() => navigate('/abrigos/novo')}
                            className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-200 active:scale-95 transition-all"
                        >
                            Cadastrar Abrigo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {shelters.map((shelter) => {
                            const badge = getStatusBadge(shelter.status)
                            const occupancyPercentage = shelter.capacity > 0
                                ? Math.round((shelter.current_occupancy / shelter.capacity) * 100)
                                : 0

                            return (
                                <div
                                    key={shelter.id}
                                    className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all"
                                    onClick={() => navigate(`/abrigos/${shelter.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-base font-black text-slate-800 mb-1">{shelter.name}</h4>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                                                <MapPin size={12} />
                                                <span className="font-bold">{shelter.address}</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full border ${badge.color} text-[9px] font-black uppercase`}>
                                            {badge.label}
                                        </div>
                                    </div>

                                    {/* Occupancy Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Ocupação</span>
                                            <span className="text-[10px] font-black text-slate-600">
                                                {shelter.current_occupancy || 0} / {shelter.capacity} ({occupancyPercentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full ${getOccupancyColor(shelter.current_occupancy || 0, shelter.capacity)} transition-all duration-500`}
                                                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div className="text-[9px] font-bold text-slate-400">
                                            {shelter.responsible_name && (
                                                <span>Resp.: {shelter.responsible_name}</span>
                                            )}
                                        </div>
                                        <div className="text-[9px] font-black text-purple-600 uppercase">
                                            Ver Detalhes →
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Alert if no shelters */}
            {shelters.length > 0 && stats.activeShelters === 0 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-black text-orange-800 mb-1">Atenção</h4>
                        <p className="text-[11px] font-bold text-orange-600">
                            Nenhum abrigo está ativo no momento. Ative abrigos para receber pessoas em situação de emergência.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Abrigos

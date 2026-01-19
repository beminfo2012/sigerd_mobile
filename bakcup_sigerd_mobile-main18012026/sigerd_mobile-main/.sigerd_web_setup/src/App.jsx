import React, { useState, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LayoutDashboard, Map, Radio, Users, Settings, LogOut } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OperationsMap from './pages/OperationsMap'
import FleetManagement from './pages/FleetManagement'
import ShelterManagement from './pages/ShelterManagement'
import { supabase } from './services/supabase'

// Create context for user profile
export const UserContext = createContext(null)

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userProfile, setUserProfile] = useState(null)
    const [activeRoute, setActiveRoute] = useState('dashboard')

    useEffect(() => {
        const auth = localStorage.getItem('auth_web')
        if (auth === 'true') {
            setIsAuthenticated(true)
            loadUserProfile()
        }
    }, [])

    const loadUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setUserProfile(profile)
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    const handleLogin = async () => {
        localStorage.setItem('auth_web', 'true')
        setIsAuthenticated(true)
        await loadUserProfile()
    }

    const handleLogout = () => {
        if (window.confirm("Tem certeza que deseja sair?")) {
            localStorage.removeItem('auth_web')
            setIsAuthenticated(false)
            setUserProfile(null)
        }
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <UserContext.Provider value={userProfile}>
            <Router>
                <div className="flex h-screen bg-slate-50">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-900 text-white flex flex-col">
                        {/* Logo Area */}
                        <div className="p-6 border-b border-slate-700">
                            <h1 className="text-2xl font-black tracking-tight">SIGERD</h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Command Center</p>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-4">
                            <NavItem
                                icon={<LayoutDashboard size={20} />}
                                label="Dashboard"
                                route="dashboard"
                                active={activeRoute === 'dashboard'}
                                onClick={() => setActiveRoute('dashboard')}
                            />
                            <NavItem
                                icon={<Map size={20} />}
                                label="Mapa de Operações"
                                route="map"
                                active={activeRoute === 'map'}
                                onClick={() => setActiveRoute('map')}
                            />
                            <NavItem
                                icon={<Radio size={20} />}
                                label="Frota"
                                route="fleet"
                                active={activeRoute === 'fleet'}
                                onClick={() => setActiveRoute('fleet')}
                            />
                            <NavItem
                                icon={<Users size={20} />}
                                label="Abrigos"
                                route="shelters"
                                active={activeRoute === 'shelters'}
                                onClick={() => setActiveRoute('shelters')}
                            />
                        </nav>

                        {/* User Area */}
                        <div className="p-4 border-t border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                                    {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold truncate">{userProfile?.full_name || 'Usuário'}</div>
                                    <div className="text-xs text-slate-400 truncate">{userProfile?.email || 'Email'}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
                            >
                                <LogOut size={16} />
                                Sair
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-auto">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/map" element={<OperationsMap />} />
                            <Route path="/fleet" element={<FleetManagement />} />
                            <Route path="/shelters" element={<ShelterManagement />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </UserContext.Provider>
    )
}

const NavItem = ({ icon, label, route, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 font-bold text-sm transition-all ${active
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
    >
        {icon}
        {label}
    </button>
)

export default App

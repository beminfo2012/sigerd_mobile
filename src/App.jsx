import React, { useState, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Home, Map, FileText, AlertOctagon, Menu as MenuIcon } from 'lucide-react'
import SyncBackground from './components/SyncBackground'

// Components
import Dashboard from './pages/Dashboard'
import GeoRescue from './pages/GeoRescue'
import Vistorias from './pages/Vistorias'
import Pluviometros from './pages/Pluviometros'
import Interdicao from './pages/Interdicao'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Alerts from './pages/Alerts'
import GeoDashboard from './pages/Monitoramento/GeoDashboard'
import { supabase } from './services/supabase'

// Create context for user profile
export const UserContext = createContext(null)

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    // Initialize userProfile from localStorage if available and authenticated
    const [userProfile, setUserProfile] = useState(() => {
        const isAuth = localStorage.getItem('auth') === 'true'
        const saved = localStorage.getItem('userProfile')
        return (isAuth && saved) ? JSON.parse(saved) : null
    })

    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (auth === 'true') {
            setIsAuthenticated(true)
            // Still try to refresh profile from server to get latest data
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
                    // Persist for offline/reload persistence
                    localStorage.setItem('userProfile', JSON.stringify(profile))
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            // If offline/error, we retain the initial state loaded from localStorage
        }
    }

    const handleLogin = async () => {
        localStorage.setItem('auth', 'true')
        setIsAuthenticated(true)
        await loadUserProfile()
    }

    const handleLogout = () => {
        if (!navigator.onLine) {
            alert('🚫 Você está offline!\n\nNão é seguro sair agora, pois você não conseguirá entrar novamente sem internet.\n\nFique conectado para usar o sistema offline.')
            return
        }
        if (window.confirm("Tem certeza que deseja sair?")) {
            localStorage.removeItem('auth')
            localStorage.removeItem('userProfile')
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
                <div className="app-container">
                    <SyncBackground />
                    {/* Mobile Header */}
                    <header className="mobile-header">
                        <div className="header-logo-area">
                            <img src="/logo_defesa_civil.png?v=2" alt="Logo" className="header-logo" onError={(e) => e.target.style.display = 'none'} />
                            <h1>SIGERD <span>Mobile</span></h1>
                        </div>
                        <div className="header-user" onClick={handleLogout}>
                            <div className="user-avatar cursor-pointer hover:bg-white/20 transition-colors">
                                {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/georescue" element={<GeoRescue />} />
                            <Route path="/vistorias" element={<Vistorias />} />
                            <Route path="/pluviometros" element={<Pluviometros onBack={() => setActiveTab('dashboard')} />} />
                            <Route path="/interdicao" element={<Interdicao />} />
                            <Route path="/menu" element={<Menu userProfile={userProfile} onLogout={handleLogout} setUserProfile={setUserProfile} />} />
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/monitoramento" element={<GeoDashboard />} />
                        </Routes>
                    </main>

                    {/* Bottom Navigation */}
                    <nav className="bottom-nav">
                        <Link to="/" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <Home size={24} />
                            <span>Início</span>
                        </Link>
                        <Link to="/georescue" className={`nav-item ${activeTab === 'georescue' ? 'active' : ''}`} onClick={() => setActiveTab('georescue')}>
                            <Map size={24} />
                            <span>GeoRescue</span>
                        </Link>
                        {/* FAB Action Button */}
                        <div className="nav-item fab-container">
                            <Link to="/vistorias" className="fab-button" onClick={() => setActiveTab('vistorias')}>
                                <FileText size={24} />
                            </Link>
                        </div>
                        <Link to="/interdicao" className={`nav-item ${activeTab === 'interdicao' ? 'active' : ''}`} onClick={() => setActiveTab('interdicao')}>
                            <AlertOctagon size={24} />
                            <span>Interdição</span>
                        </Link>
                        <Link to="/menu" className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
                            <MenuIcon size={24} />
                            <span>Menu</span>
                        </Link>
                    </nav>
                </div>
            </Router>
        </UserContext.Provider>
    )
}

export default App

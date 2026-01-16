import React, { useState, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Home, Map, FileText, AlertOctagon, Menu as MenuIcon, ArrowLeft } from 'lucide-react'
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
import ChecklistSaida from './pages/Checklist/ChecklistSaida'
import { supabase } from './services/supabase'

// Shelter Module
import ShelterDashboard from './pages/Abrigos/index'
import ShelterDetail from './pages/Abrigos/ShelterDetail'
import ShelterForm from './pages/Abrigos/ShelterForm'
import OccupantForm from './pages/Abrigos/OccupantForm'
import DonationForm from './pages/Abrigos/DonationForm'
import DistributionForm from './pages/Abrigos/DistributionForm'
import ShelterReports from './pages/Abrigos/Reports'
import ShelterResidents from './pages/Abrigos/Residents'
import ShelterBottomNav from './components/Shelter/ui/BottomNav'

import { useLocation } from 'react-router-dom'

// Create context for user profile
export const UserContext = createContext(null)

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Error caught by Boundary:", error, errorInfo);
    }

    handleClearCache = () => {
        localStorage.clear();
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h2 style={{ color: '#dc2626' }}>⚠️ Oops! Algo deu errado.</h2>
                    <p style={{ color: '#64748b' }}>O aplicativo encontrou um erro e não pôde continuar.</p>
                    <div style={{
                        background: '#f1f5f9',
                        padding: '15px',
                        borderRadius: '8px',
                        textAlign: 'left',
                        margin: '20px 0',
                        fontSize: '12px',
                        overflowX: 'auto',
                        fontFamily: 'monospace'
                    }}>
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 20px', background: '#2a5299', color: 'white', border: 'none', borderRadius: '8px', marginRight: '10px' }}
                    >
                        Tentar Novamente
                    </button>
                    <button
                        onClick={this.handleClearCache}
                        style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px' }}
                    >
                        Limpar Cache e Sair
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function AppContent({ userProfile, handleLogout, activeTab, setActiveTab, setUserProfile }) {
    const location = useLocation();

    // Total resilience: check router, window, hash, and a manual console flag
    const currentPath = (location.pathname + location.hash + window.location.pathname + window.location.hash).toLowerCase();
    const isShelterRoute = currentPath.includes('abrigo') || (typeof window !== 'undefined' && window.FORCE_SHELTER_MODE);

    if (isShelterRoute) console.log('[SHELTER MODE ACTIVE]');

    // Debug globally accessible
    if (typeof window !== 'undefined') window._lastPath = location.pathname;

    return (
        <div className="app-container">
            <div style={{ background: '#7c3aed', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
                DIAGNOSTICO V4 ATIVO - ROTA: {location.pathname}
            </div>
            <SyncBackground />
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="header-logo-area">
                    {isShelterRoute ? (
                        <>
                            <Link to="/" className="mr-3 text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 transition-all">
                                <ArrowLeft size={24} />
                            </Link>
                            <h1>GESTÃO DE <span>Abrigos</span></h1>
                            <span style={{ fontSize: '7px', opacity: 0.3, marginLeft: '5px', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>VER_3.0</span>
                        </>
                    ) : (
                        <>
                            <img src="/logo_defesa_civil.png?v=2" alt="Logo" className="header-logo" onError={(e) => e.target.style.display = 'none'} />
                            <h1>SIGERD <span>Mobile</span></h1>
                        </>
                    )}
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
                    <Route path="/checklist-saida" element={<ChecklistSaida />} />

                    {/* Shelter Module Routes */}
                    <Route path="/abrigos" element={<ShelterDashboard />} />
                    <Route path="/abrigos/novo" element={<ShelterForm />} />
                    <Route path="/abrigos/:id" element={<ShelterDetail />} />
                    <Route path="/abrigos/:shelterId/abrigados/novo" element={<OccupantForm />} />
                    <Route path="/abrigos/:shelterId/doacoes/novo" element={<DonationForm />} />
                    <Route path="/abrigos/:shelterId/distribuicoes/novo" element={<DistributionForm />} />
                    <Route path="/abrigos/relatorios" element={<ShelterReports />} />
                    <Route path="/abrigos/residentes" element={<ShelterResidents />} />
                </Routes>
            </main>

            {/* Conditional Bottom Navigation */}
            {isShelterRoute ? (
                <ShelterBottomNav />
            ) : (
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
            )}
        </div>
    );
}

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    // Initialize userProfile from localStorage if available and authenticated
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const isAuth = localStorage.getItem('auth') === 'true'
            const saved = localStorage.getItem('userProfile')
            return (isAuth && saved) ? JSON.parse(saved) : null
        } catch (e) {
            console.error('Failed to parse cached profile:', e)
            return null
        }
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
        return (
            <ErrorBoundary>
                <Login onLogin={handleLogin} />
            </ErrorBoundary>
        )
    }

    return (
        <ErrorBoundary>
            <UserContext.Provider value={userProfile}>
                <Router>
                    <AppContent
                        userProfile={userProfile}
                        handleLogout={handleLogout}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        setUserProfile={setUserProfile}
                    />
                </Router>
            </UserContext.Provider>
        </ErrorBoundary>
    )
}


export default App

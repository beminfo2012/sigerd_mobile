import React, { useState, useEffect, createContext, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Home, Map, FileText, AlertOctagon, Menu as MenuIcon } from 'lucide-react'
import SyncBackground from './components/SyncBackground'
import { notificationService } from './services/notificationService'

// Core Components (Always loaded)
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Menu from './pages/Menu'
import ProtectedRoute from './components/ProtectedRoute'
import { supabase } from './services/supabase'

// Lazy loaded components
const GeoRescue = lazy(() => import('./pages/GeoRescue'))
const Vistorias = lazy(() => import('./pages/Vistorias'))
const Pluviometros = lazy(() => import('./pages/Pluviometros'))
const Interdicao = lazy(() => import('./pages/Interdicao'))
const Alerts = lazy(() => import('./pages/Alerts'))
const GeoDashboard = lazy(() => import('./pages/Monitoramento/GeoDashboard'))
const RiskDashboard = lazy(() => import('./pages/Monitoramento/RiskDashboard'))
const ChecklistSaida = lazy(() => import('./pages/Checklist/ChecklistSaida'))
const VistoriaPrint = lazy(() => import('./pages/Vistorias/VistoriaPrint'))

// Shelter Module (Lazy)
const ShelterMenu = lazy(() => import('./pages/Abrigos/Menu'))
const ShelterList = lazy(() => import('./pages/Abrigos/ShelterList'))
const ShelterDetail = lazy(() => import('./pages/Abrigos/ShelterDetail'))
const ShelterForm = lazy(() => import('./pages/Abrigos/ShelterForm'))
const OccupantForm = lazy(() => import('./pages/Abrigos/OccupantForm'))
const DonationForm = lazy(() => import('./pages/Abrigos/DonationForm'))
const DistributionForm = lazy(() => import('./pages/Abrigos/DistributionForm'))
const ShelterReports = lazy(() => import('./pages/Abrigos/Reports'))
const ShelterResidents = lazy(() => import('./pages/Abrigos/Residents'))
const StockHub = lazy(() => import('./pages/Abrigos/StockHub'))
const DonationHub = lazy(() => import('./pages/Abrigos/DonationHub'))
const LogisticsHub = lazy(() => import('./pages/Abrigos/LogisticsHub'))
const ContractList = lazy(() => import('./pages/Abrigos/ContractList'))
const ContractForm = lazy(() => import('./pages/Abrigos/ContractForm'))

// User Management (Lazy)
const UserManagement = lazy(() => import('./pages/UserManagement'))

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

const AppContent = ({
    isAuthenticated, userProfile, setUserProfile, activeTab, setActiveTab, handleLogout,
    handleLogin, AGENT_ROLES, HUMANITARIAN_ROLES, HUMANITARIAN_FULL_ROLES
}) => {
    const location = useLocation();
    const isPrintPage = location.pathname.includes('/imprimir/');

    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <Login onLogin={handleLogin} />
            </ErrorBoundary>
        )
    }

    return (
        <div className="app-container">
            <SyncBackground />

            {/* Mobile Header - Hide on print */}
            {!isPrintPage && (
                <header className="mobile-header">
                    <div className="header-logo-area">
                        <img src="/logo_header.png" alt="Logo" className="header-logo" onError={(e) => e.target.style.display = 'none'} />
                        <h1>SIGERD <span>Mobile</span> <span className="text-[10px] opacity-30 font-light ml-1">v1.46.45-FIXED-BREAKS</span></h1>
                    </div>
                    <div className="header-user" onClick={handleLogout}>
                        <div className="user-avatar cursor-pointer hover:bg-white/20 transition-colors">
                            {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className={isPrintPage ? "" : "main-content"}>
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center p-20 gap-3">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abrindo módulo...</p>
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/georescue" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <GeoRescue />
                            </ProtectedRoute>
                        } />
                        <Route path="/vistorias" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <Vistorias />
                            </ProtectedRoute>
                        } />
                        <Route path="/vistorias/imprimir/:id" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <VistoriaPrint />
                            </ProtectedRoute>
                        } />
                        <Route path="/pluviometros" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <Pluviometros onBack={() => setActiveTab('dashboard')} />
                            </ProtectedRoute>
                        } />
                        <Route path="/interdicao" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <Interdicao />
                            </ProtectedRoute>
                        } />
                        <Route path="/alerts" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <Alerts />
                            </ProtectedRoute>
                        } />
                        <Route path="/monitoramento" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <GeoDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/monitoramento/riscos" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <RiskDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/checklist-saida" element={
                            <ProtectedRoute user={userProfile} allowedRoles={AGENT_ROLES}>
                                <ChecklistSaida />
                            </ProtectedRoute>
                        } />
                        <Route path="/menu" element={<Menu userProfile={userProfile} onLogout={handleLogout} setUserProfile={setUserProfile} />} />
                        <Route path="/abrigos" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <ShelterMenu />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/lista" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterList />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/estoque" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <StockHub />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/doacoes-central" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <DonationHub />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/logistica" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <LogisticsHub />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/novo" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/:id" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterDetail />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/editar/:id" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/:shelterId/abrigados/novo" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <OccupantForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/:shelterId/doacoes/novo" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <DonationForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/:shelterId/distribuicoes/novo" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_ROLES}>
                                <DistributionForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/relatorios" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterReports />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/residentes" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ShelterResidents />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/contratos" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ContractList />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/contratos/novo" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ContractForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/abrigos/contratos/editar/:id" element={
                            <ProtectedRoute user={userProfile} allowedRoles={HUMANITARIAN_FULL_ROLES}>
                                <ContractForm />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </main>

            {/* Bottom Navigation - Hide on print */}
            {!isPrintPage && (AGENT_ROLES.includes(userProfile?.role) || userProfile?.email === 'bruno_pagel@hotmail.com') && (
                <nav className="bottom-nav">
                    <Link to="/" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <Home size={24} />
                        <span>Início</span>
                    </Link>
                    <Link to="/georescue" className={`nav-item ${activeTab === 'georescue' ? 'active' : ''}`} onClick={() => setActiveTab('georescue')}>
                        <Map size={24} />
                        <span>GeoRescue</span>
                    </Link>
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
    )
}

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
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

    const AGENT_ROLES = ['Admin', 'Agente de Defesa Civil', 'Coordenador', 'Secretário', 'Técnico em Edificações']
    const HUMANITARIAN_ROLES = ['Humanitario_Leitura', 'Humanitario_Total', 'Admin', 'Coordenador', 'Assistente Social']
    const HUMANITARIAN_FULL_ROLES = ['Humanitario_Total', 'Admin', 'Coordenador', 'Assistente Social']

    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (auth === 'true') {
            setIsAuthenticated(true)
            loadUserProfile()
            notificationService.requestPermission();
        } else {
            setIsLoading(false)
        }
    }, [])

    const loadUserProfile = async () => {
        if (!navigator.onLine) {
            setIsLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    const standardizedProfile = {
                        ...profile,
                        role: profile.role || 'Agente de Defesa Civil'
                    };
                    setUserProfile(standardizedProfile)
                    localStorage.setItem('userProfile', JSON.stringify(standardizedProfile))
                }
            } else {
                if (navigator.onLine) {
                    setIsAuthenticated(false);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = async () => {
        setIsLoading(true)
        localStorage.setItem('auth', 'true')
        setIsAuthenticated(true)
        await loadUserProfile()
    }

    const handleLogout = () => {
        if (!navigator.onLine) {
            alert('🚫 Você está offline!\n\nNão é seguro sair agora...')
            return
        }
        if (window.confirm("Tem certeza que deseja sair?")) {
            localStorage.removeItem('auth')
            localStorage.removeItem('userProfile')
            setIsAuthenticated(false)
            setUserProfile(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando SIGERD...</p>
                </div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <UserContext.Provider value={userProfile}>
                <Router>
                    <AppContent
                        isAuthenticated={isAuthenticated}
                        userProfile={userProfile}
                        setUserProfile={setUserProfile}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        handleLogout={handleLogout}
                        handleLogin={handleLogin}
                        AGENT_ROLES={AGENT_ROLES}
                        HUMANITARIAN_ROLES={HUMANITARIAN_ROLES}
                        HUMANITARIAN_FULL_ROLES={HUMANITARIAN_FULL_ROLES}
                    />
                </Router>
            </UserContext.Provider>
        </ErrorBoundary>
    )
}

export default App

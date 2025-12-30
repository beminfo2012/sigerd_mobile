import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Home, Map, FileText, Activity, Menu as MenuIcon } from 'lucide-react'

// Placeholder components
import Dashboard from './pages/Dashboard'
import GeoRescue from './pages/GeoRescue'
import Vistorias from './pages/Vistorias'
import Monitoramento from './pages/Monitoramento'
import Menu from './pages/Menu'
import Login from './pages/Login'

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const auth = localStorage.getItem('auth')
        if (auth === 'true') {
            setIsAuthenticated(true)
        }
    }, [])

    const handleLogin = () => {
        localStorage.setItem('auth', 'true')
        setIsAuthenticated(true)
    }

    const handleLogout = () => {
        localStorage.removeItem('auth')
        setIsAuthenticated(false)
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <Router>
            <div className="app-container">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <div className="header-logo-area">
                        <img src="/logo_defesa_civil.png" alt="Logo" className="header-logo" onError={(e) => e.target.style.display = 'none'} />
                        <h1>SIGERD <span>Mobile</span></h1>
                    </div>
                    <div className="header-user" onClick={handleLogout}>
                        <div className="user-avatar cursor-pointer hover:bg-white/20 transition-colors">A</div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/georescue" element={<GeoRescue />} />
                        <Route path="/vistorias" element={<Vistorias />} />
                        <Route path="/monitoramento" element={<Monitoramento />} />
                        <Route path="/menu" element={<Menu />} />
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
                    <Link to="/monitoramento" className={`nav-item ${activeTab === 'monitoramento' ? 'active' : ''}`} onClick={() => setActiveTab('monitoramento')}>
                        <Activity size={24} />
                        <span>Monitor</span>
                    </Link>
                    <Link to="/menu" className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
                        <MenuIcon size={24} />
                        <span>Menu</span>
                    </Link>
                </nav>
            </div>
        </Router>
    )
}

export default App

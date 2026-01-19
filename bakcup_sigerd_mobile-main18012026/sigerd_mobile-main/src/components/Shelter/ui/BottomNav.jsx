import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Gift, User } from 'lucide-react';

const ShelterBottomNav = () => {
    const location = useLocation();
    const path = location.pathname;

    const navItems = [
        {
            label: 'DASHBOARD',
            icon: LayoutDashboard,
            path: '/abrigos',
            active: path === '/abrigos'
        },
        {
            label: 'ABRIGOS',
            icon: Building2,
            path: '/abrigos', // Simplified to index for now, but label matches
            active: path === '/abrigos/lista'
        },
        {
            label: 'RESIDENTES',
            icon: Users,
            path: '/abrigos/residentes',
            active: path === '/abrigos/residentes'
        },
        {
            label: 'RELATÓRIOS',
            icon: Gift,
            path: '/abrigos/relatorios',
            active: path === '/abrigos/relatorios'
        },
        {
            label: 'PERFIL',
            icon: User,
            path: '/menu',
            active: path === '/menu'
        }
    ];

    return (
        <nav className="shelter-bottom-nav">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    to={item.path}
                    className={`shelter-nav-item ${item.active ? 'active' : ''}`}
                >
                    <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {item.active && <div className="active-dot" />}
                </Link>
            ))}
        </nav>
    );
};

export default ShelterBottomNav;

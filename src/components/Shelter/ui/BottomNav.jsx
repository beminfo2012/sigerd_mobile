import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, User } from 'lucide-react';

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
            path: '/abrigos', // For now pointing to index, maybe specific list later
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
            icon: FileText,
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

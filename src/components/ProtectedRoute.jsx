import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute component to enforce Role-Based Access Control (RBAC)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {Object} props.user - The user profile object containing the role
 * @param {Array<string>} props.allowedRoles - List of roles permitted to access this route
 * @param {string} props.fallbackPath - Path to redirect to if authorization fails (defaults to /assisthumanitaria for limited roles)
 */
const getModuleForPath = (pathname) => {
    if (pathname === '/') return 'dashboard';
    if (pathname.startsWith('/ocorrencias')) return 'ocorrencias';
    if (pathname.startsWith('/vistorias')) return 'vistorias';
    if (pathname.startsWith('/interdicao') || pathname.startsWith('/interdicoes') || pathname.startsWith('/desinterdicao')) return 'interdicoes';
    if (pathname.startsWith('/redap')) return 'redap';
    if (pathname.startsWith('/assisthumanitaria') || pathname.startsWith('/pontos-apoio')) return 'humanitaria';
    if (pathname.startsWith('/voluntarios')) return 'voluntarios';
    if (pathname.startsWith('/mci')) return 'mci';
    if (pathname.startsWith('/contingencia') || pathname.startsWith('/plano-contingencia')) return 'contingencia';
    if (pathname.startsWith('/usuarios') || pathname.startsWith('/perfis')) return 'usuarios';
    if (pathname.startsWith('/noprer')) return 'noprer';
    if (pathname.startsWith('/nortis')) return 'nortis';
    if (pathname.startsWith('/mrcr')) return 'mrcr';
    if (pathname.startsWith('/agenda')) return 'agenda';
    if (pathname.startsWith('/pluviometros') || pathname.startsWith('/monitoramento')) return 'pluviometros';
    if (pathname.startsWith('/checklist-saida')) return 'checklist_saida';
    if (pathname.startsWith('/georescue')) return 'georescue';
    if (pathname.startsWith('/alerts') || pathname.startsWith('/alertas')) return 'alertas';
    if (pathname.startsWith('/relatorio-situacional')) return 'dashboard';
    return null;
};

const ProtectedRoute = ({ children, user, allowedRoles, fallbackPath }) => {
    const location = useLocation();

    // Developer bypass for print previews
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('bypassAuth') === 'true') {
        return children;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userRole = user.role || '';
    const moduleId = getModuleForPath(location.pathname);
    const hasDynamicPermission = !!(moduleId && user.permissions?.[moduleId]?.ver === true);

    // Authorization check: Allow if no specific roles required, role matches, OR dynamic role_definitions permission grants access
    const isAuthorized = !allowedRoles || allowedRoles.includes(userRole) || hasDynamicPermission;

    if (!isAuthorized) {
        // If not authorized, redirect to the assigned fallback or a default safe zone
        const defaultFallback = (userRole === 'Assistente Social' || userRole === 'Voluntário')
            ? '/assisthumanitaria'
            : '/';

        // Prevent infinite redirect loop if already at fallback path
        if (location.pathname === (fallbackPath || defaultFallback)) {
            return children; // Allow as a last resort to prevent white screen
        }

        return <Navigate to={fallbackPath || defaultFallback} replace />;
    }

    return children;
};

export default ProtectedRoute;

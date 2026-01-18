import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute component to enforce Role-Based Access Control (RBAC)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {Object} props.user - The user profile object containing the role
 * @param {Array<string>} props.allowedRoles - List of roles permitted to access this route
 * @param {string} props.fallbackPath - Path to redirect to if authorization fails (defaults to /abrigos for limited roles)
 */
const ProtectedRoute = ({ children, user, allowedRoles, fallbackPath }) => {
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userRole = user.role || '';
    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
        // If not authorized, redirect to the assigned fallback or a default safe zone
        const defaultFallback = (userRole === 'Assistente Social' || userRole === 'Voluntário')
            ? '/abrigos'
            : '/';

        return <Navigate to={fallbackPath || defaultFallback} replace />;
    }

    return children;
};

export default ProtectedRoute;

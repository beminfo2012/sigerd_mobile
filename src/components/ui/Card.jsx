import React from 'react';

// Wrapper to match the expected import path or provide specific UI styling
// The user code was importing from ../../components/ui/Card
// But existing Card is likely at ../../components/Card

export const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`} {...props}>
            {children}
        </div>
    );
};

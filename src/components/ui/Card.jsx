import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};


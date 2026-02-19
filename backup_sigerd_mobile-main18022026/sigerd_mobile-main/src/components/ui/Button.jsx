import React from 'react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'default',
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus:ring-slate-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        outline: "border border-slate-200 hover:bg-slate-100 focus:ring-slate-500"
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

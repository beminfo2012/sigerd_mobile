import React from 'react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'default',
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    };

    const sizes = {
        default: "h-11 py-2 px-6 text-sm",
        sm: "h-9 px-4 rounded-md text-xs",
        lg: "h-12 px-10 rounded-xl text-base",
        icon: "h-11 w-11"
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


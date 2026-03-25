import React from 'react';

const HumanitarianIcon = ({ size = 24, className = "" }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {/* Parachute Canopy - Flatter and wider to avoid 'helmet' look */}
        <path d="M2 9a10 10 0 0 1 20 0" />
        <path d="M2 9h20" />
        {/* Canopy details */}
        <path d="M12 2v7" />
        <path d="M7 3.5v5.5" />
        <path d="M17 3.5v5.5" />
        
        {/* Ropes - Longer to distance the canopy from the box */}
        <path d="M2 9l10 7" />
        <path d="M22 9l-10 7" />
        <path d="M12 9v7" />
        
        {/* Aid Box - Smaller and more distinct */}
        <rect x="9" y="16" width="6" height="6" rx="1" />
        
        {/* Small Cross */}
        <path d="M12 18v2" />
        <path d="M11 19h2" />
    </svg>
);

export default HumanitarianIcon;

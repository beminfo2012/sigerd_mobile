import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './notifications/NotificationBell';

export default function MobileHeader({ userProfile }) {
    const avatarLetter = userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <header className="md:hidden shrink-0 bg-gradient-to-b from-navy-900 to-navy-800 px-[22px] pt-4 pb-5 flex items-center justify-between z-50">
            <div className="flex items-center gap-[11px]">
                <img src="/logo_header.png" alt="SIGERD" className="w-[34px] h-[34px] shrink-0 object-contain" />
                <div className="flex flex-col">
                    <div className="font-display font-extrabold text-[19px] text-white tracking-[0.5px] leading-tight drop-shadow-md">SIGERD</div>
                    <div className="text-[10px] font-semibold tracking-[1.6px] text-[#8fa0d6] mt-[1px]">MOBILE</div>
                </div>
            </div>
            
            <div className="flex items-center gap-[14px]">
                <NotificationBell />

                <Link to="/menu" className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white font-bold text-[15px] font-sans shadow-[0_3px_8px_rgba(0,0,0,0.3),inset_0_0_0_1.5px_rgba(255,255,255,0.15)] bg-gradient-to-br from-[#3f5fc4] to-[#25397c]">
                    {avatarLetter}
                </Link>
            </div>
        </header>
    );
}

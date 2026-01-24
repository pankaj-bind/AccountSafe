import React from 'react';

interface BoiHorizonCardProps {
  children?: React.ReactNode;
}

/**
 * BOI Horizon Design
 * Ocean blue with saffron wave
 */
const BoiHorizonCard: React.FC<BoiHorizonCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[20px] overflow-hidden
      bg-gradient-to-b from-[#003b64] to-[#005f99]
      shadow-[0_20px_40px_rgba(0,45,98,0.4),0_10px_10px_rgba(0,0,0,0.05)]
    "
  >
    {/* Blue wave - top right area */}
    <div 
      className="
        absolute -top-[60%] -right-[20%]
        w-[140%] h-[90%] rounded-full
        bg-gradient-to-b from-[#009ceb] to-[#0077b6]
        opacity-20 -rotate-[15deg]
      " 
    />
    
    {/* Orange wave - bottom area */}
    <div 
      className="
        absolute -bottom-[60%] -left-[10%]
        w-[120%] h-full rounded-full
        bg-gradient-to-tr from-[#ff8c00] to-[#ff5e00]
        shadow-[0_-10px_30px_rgba(255,94,0,0.3)]
        -rotate-[5deg]
      " 
    />
    
    {/* Accent line */}
    <div 
      className="
        absolute bottom-[35%] left-0
        w-full h-0.5
        bg-white/10
        -rotate-[5deg] origin-left
      " 
    />
    
    {/* Subtle texture pattern */}
    <div 
      className="
        absolute inset-0 z-[2] opacity-100
        [background-image:url(&quot;data:image/svg+xml,%3Csvg_width='4'_height='4'_viewBox='0_0_4_4'_xmlns='http://www.w3.org/2000/svg'%3E%3Cpath_d='M1_3h1v1H1V3zm2-2h1v1H3V1z'_fill='%23ffffff'_fill-opacity='0.05'_fill-rule='evenodd'/%3E%3C/svg%3E&quot;)]
      " 
    />
    
    {children}
  </div>
);

export default BoiHorizonCard;

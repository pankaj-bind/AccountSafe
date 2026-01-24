import React from 'react';

interface PnbCardProps {
  children?: React.ReactNode;
}

/**
 * PNB Maroon Design
 * Rich maroon with gold accent
 */
const PnbCard: React.FC<PnbCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-gradient-to-br from-[#7a1f2b] via-[#8b1e2d] to-[#a11c2a]
      shadow-[0_22px_50px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.22)]
    "
  >
    {/* Glossy top-left corner effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-br from-white/20 via-white/[0.06] to-transparent
        [background-size:42%_42%] bg-no-repeat
      " 
    />
    
    {/* Right circle - gold tinted */}
    <div 
      className="
        absolute -right-40 top-1/2 -translate-y-1/2
        w-[360px] h-[360px] rounded-full
        bg-[rgba(255,215,0,0.12)]
      " 
    />
    
    {/* Bottom-left circle - dark */}
    <div 
      className="
        absolute -left-[200px] -bottom-[220px]
        w-[420px] h-[420px] rounded-full
        bg-black/[0.18]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.22] to-transparent
        [background-size:100%_42%] bg-no-repeat
      " 
    />
    
    {children}
  </div>
);

export default PnbCard;

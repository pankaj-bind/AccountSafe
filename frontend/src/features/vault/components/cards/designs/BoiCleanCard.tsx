import React from 'react';

interface BoiCleanCardProps {
  children?: React.ReactNode;
}

/**
 * BOI Clean Design
 * Clean blue with orange accent
 */
const BoiCleanCard: React.FC<BoiCleanCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-gradient-to-br from-[#0c3b66] via-[#0f4c81] to-[#103f6e]
      shadow-[0_24px_55px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.22)]
    "
  >
    {/* Geometric gradient overlay */}
    <div 
      className="
        absolute inset-0
        bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_32%,transparent_34%),linear-gradient(300deg,transparent_0%,rgba(0,0,0,0.18)_45%,transparent_47%)]
      " 
    />
    
    {/* Orange accent - top right */}
    <div 
      className="
        absolute -top-[120px] -right-40
        w-[360px] h-[360px] rounded-full
        bg-[radial-gradient(circle,rgba(249,115,22,0.55),rgba(249,115,22,0.15),transparent_65%)]
      " 
    />
    
    {/* Dark counter - bottom left */}
    <div 
      className="
        absolute -bottom-[140px] -left-[180px]
        w-[420px] h-[420px] rounded-full
        bg-black/[0.22]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.18] to-transparent
        [background-size:100%_42%] bg-no-repeat
      " 
    />
    
    {children}
  </div>
);

export default BoiCleanCard;

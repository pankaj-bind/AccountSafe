import React from 'react';

interface CanaraCardProps {
  children?: React.ReactNode;
}

/**
 * Canara Bank Design
 * Blue with yellow arc accent
 */
const CanaraCard: React.FC<CanaraCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-gradient-to-br from-[#0f4c81] via-[#1f6fb2] to-[#2b7fc4]
      shadow-[0_22px_50px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.25)]
    "
  >
    {/* Glossy top-left corner effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-br from-white/[0.22] via-white/[0.08] to-transparent
        [background-size:42%_42%] bg-no-repeat
      " 
    />
    
    {/* Right arc - yellow tinted */}
    <div 
      className="
        absolute -right-[170px] top-1/2 -translate-y-1/2
        w-[380px] h-[380px] rounded-full
        bg-[rgba(255,204,0,0.22)]
      " 
    />
    
    {/* Bottom-left arc - dark */}
    <div 
      className="
        absolute -left-[210px] -bottom-[230px]
        w-[430px] h-[430px] rounded-full
        bg-black/[0.16]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.24] to-transparent
        [background-size:100%_42%] bg-no-repeat
      " 
    />
    
    {children}
  </div>
);

export default CanaraCard;

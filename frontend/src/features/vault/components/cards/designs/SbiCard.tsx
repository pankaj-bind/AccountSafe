import React from 'react';

interface SbiCardProps {
  children?: React.ReactNode;
}

/**
 * SBI Blue Design
 * Deep blue gradient with circular elements
 */
const SbiCard: React.FC<SbiCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500
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
    
    {/* Right circle - white translucent */}
    <div 
      className="
        absolute -right-40 top-1/2 -translate-y-1/2
        w-[360px] h-[360px] rounded-full
        bg-white/[0.14]
      " 
    />
    
    {/* Bottom-left circle - dark */}
    <div 
      className="
        absolute -left-[200px] -bottom-[220px]
        w-[420px] h-[420px] rounded-full
        bg-black/[0.15]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.25] to-transparent
        [background-size:100%_42%] bg-no-repeat
      " 
    />
    
    {children}
  </div>
);

export default SbiCard;

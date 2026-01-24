import React from 'react';

interface HdfcCardProps {
  children?: React.ReactNode;
}

/**
 * HDFC Minimal Design
 * Corporate navy with red glow
 */
const HdfcCard: React.FC<HdfcCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-[radial-gradient(circle_at_top_left,#122b46_0%,#0b1f33_55%,#071726_100%)]
      shadow-[0_30px_70px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.16)]
    "
  >
    {/* Red edge glow - top right */}
    <div 
      className="
        absolute -top-[120px] -right-[120px]
        w-[360px] h-[360px] rounded-full
        bg-[radial-gradient(circle,rgba(220,38,38,0.45),rgba(220,38,38,0.18),transparent_65%)]
      " 
    />
    
    {/* Dark depth - bottom left */}
    <div 
      className="
        absolute -bottom-40 -left-[180px]
        w-[420px] h-[420px] rounded-full
        bg-black/[0.35]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.12] to-transparent
        [background-size:100%_38%] bg-no-repeat
      " 
    />
    
    {/* Subtle grain texture */}
    <div 
      className="
        absolute inset-0 opacity-50
        [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.015)_0,rgba(255,255,255,0.015)_1px,transparent_1px,transparent_3px)]
      " 
    />
    
    {children}
  </div>
);

export default HdfcCard;

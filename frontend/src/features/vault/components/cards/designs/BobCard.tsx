import React from 'react';

interface BobCardProps {
  children?: React.ReactNode;
}

/**
 * Bank of Baroda Design
 * Classic orange gradient with circular accents
 */
const BobCard: React.FC<BobCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[22px] overflow-hidden
      bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600
      shadow-[0_22px_48px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.25)]
    "
  >
    {/* Glossy top-left corner effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-br from-white/[0.22] via-white/[0.08] to-transparent
        [background-size:44%_44%] bg-no-repeat
      " 
    />
    
    {/* Right arc - white translucent circle */}
    <div 
      className="
        absolute -right-40 top-1/2 -translate-y-1/2
        w-[360px] h-[360px] rounded-full
        bg-white/[0.12]
      " 
    />
    
    {/* Bottom-left arc - dark circle */}
    <div 
      className="
        absolute -left-[200px] -bottom-[220px]
        w-[420px] h-[420px] rounded-full
        bg-black/[0.12]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.22] to-transparent
        [background-size:100%_40%] bg-no-repeat
      " 
    />
    
    {children}
  </div>
);

export default BobCard;

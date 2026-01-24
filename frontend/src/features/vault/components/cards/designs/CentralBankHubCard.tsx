import React from 'react';
import BaseCard from '../BaseCard';

interface CentralBankHubCardProps {
  children?: React.ReactNode;
}

/**
 * Central Bank Hub Design
 * Radar rings design
 */
const CentralBankHubCard: React.FC<CentralBankHubCardProps> = ({ children }) => (
  <BaseCard 
    className="bg-[radial-gradient(circle_at_50%_50%,#003366_0%,#001f3f_100%)] shadow-[0_25px_45px_rgba(0,40,85,0.4),0_10px_10px_rgba(0,0,0,0.05)]"
    textColor="white"
  >
    {/* Texture - vertical lines */}
    <div 
      className="
        absolute inset-0 opacity-20 pointer-events-none
        [background-image:repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]
      " 
    />
    
    {/* Core glow - center red dot */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-2.5 h-2.5 rounded-full z-[1]
        bg-[#DA291C]
        shadow-[0_0_60px_20px_rgba(218,41,28,0.6)]
      " 
    />
    
    {/* Ring 1 - innermost red */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[100px] h-[100px] rounded-full
        border-2 border-[rgba(218,41,28,0.8)]
        shadow-[0_0_15px_rgba(0,0,0,0.2)]
      " 
    />
    
    {/* Ring 2 */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[180px] h-[180px] rounded-full
        border border-[rgba(218,41,28,0.4)]
        shadow-[0_0_15px_rgba(0,0,0,0.2)]
      " 
    />
    
    {/* Ring 3 */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[280px] h-[280px] rounded-full
        border border-white/10
        shadow-[0_0_15px_rgba(0,0,0,0.2)]
      " 
    />
    
    {/* Ring 4 - outer arc */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45
        w-[450px] h-[450px] rounded-full
        border-[40px] border-white/[0.05]
        [border-top-color:transparent] [border-bottom-color:transparent]
      " 
    />
    
    {/* Radar sweep effect */}
    <div 
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[300px] h-[300px] rounded-full
        bg-[conic-gradient(from_0deg,transparent_0deg,rgba(218,41,28,0.1)_60deg,transparent_90deg)]
        mix-blend-screen
      " 
    />
    
    {children}
  </BaseCard>
);

export default CentralBankHubCard;

import React from 'react';
import BaseCard from '../BaseCard';

interface BoiHorizonCardProps {
  children?: React.ReactNode;
}

/**
 * BOI Horizon Design
 * Ocean blue with saffron wave
 */
const BoiHorizonCard: React.FC<BoiHorizonCardProps> = ({ children }) => (
  <BaseCard 
    className="bg-gradient-to-b from-[#003b64] to-[#005f99]"
    textColor="white"
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
      className="absolute inset-0 z-[2]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`
      }}
    />
    
    {children}
  </BaseCard>
);

export default BoiHorizonCard;

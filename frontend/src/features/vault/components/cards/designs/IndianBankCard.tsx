import React from 'react';
import BaseCard from '../BaseCard';

interface IndianBankCardProps {
  children?: React.ReactNode;
}

/**
 * Indian Bank Design
 * Deep blue with orange energy
 */
const IndianBankCard: React.FC<IndianBankCardProps> = ({ children }) => (
  <BaseCard 
    className="bg-gradient-to-br from-[#003a8f] via-[#004aad] to-[#00366f]"
    textColor="white"
  >
    {/* Flow - center highlight */}
    <div 
      className="
        absolute inset-0
        bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.10)_48%,transparent_52%)]
      " 
    />
    
    {/* Orange accent - bottom right */}
    <div 
      className="
        absolute -bottom-40 -right-[180px]
        w-[420px] h-[420px] rounded-full
        bg-[radial-gradient(circle,rgba(255,122,0,0.55),rgba(255,122,0,0.20),transparent_65%)]
      " 
    />
    
    {/* Dark counter - top left */}
    <div 
      className="
        absolute -top-[140px] -left-[180px]
        w-[380px] h-[380px] rounded-full
        bg-black/25
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.18] to-transparent
        [background-size:100%_40%] bg-no-repeat
      " 
    />
    
    {children}
  </BaseCard>
);

export default IndianBankCard;

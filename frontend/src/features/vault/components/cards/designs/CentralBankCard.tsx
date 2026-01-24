import React from 'react';
import BaseCard from '../BaseCard';

interface CentralBankCardProps {
  children?: React.ReactNode;
}

/**
 * Central Bank Design
 * Red and blue slabs
 */
const CentralBankCard: React.FC<CentralBankCardProps> = ({ children }) => (
  <BaseCard 
    className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_26px_60px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.22)]"
    textColor="white"
  >
    {/* Red slab - top left */}
    <div 
      className="
        absolute -top-10 -left-[120px]
        w-[420px] h-[200px]
        bg-gradient-to-br from-[#8b1e2d] to-red-700
        opacity-95 -rotate-[8deg]
      " 
    />
    
    {/* Blue slab - bottom right */}
    <div 
      className="
        absolute -bottom-[60px] -right-40
        w-[460px] h-[240px]
        bg-gradient-to-br from-blue-900 to-blue-800
        opacity-90 -rotate-[8deg]
      " 
    />
    
    {/* Divider line effect */}
    <div 
      className="
        absolute inset-0
        bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.08)_42%,transparent_44%)]
      " 
    />
    
    {/* Top shine effect */}
    <div 
      className="
        absolute inset-0
        bg-gradient-to-b from-white/[0.16] to-transparent
        [background-size:100%_40%] bg-no-repeat
      " 
    />
    
    {children}
  </BaseCard>
);

export default CentralBankCard;

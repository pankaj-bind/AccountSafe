import React from 'react';
import BaseCard from '../BaseCard';

interface HdfcGeometricCardProps {
  children?: React.ReactNode;
}

/**
 * HDFC Geometric Design
 * Geometric blocks design
 */
const HdfcGeometricCard: React.FC<HdfcGeometricCardProps> = ({ children }) => (
  <BaseCard 
    className="bg-gradient-to-br from-[#004c8f] to-[#003366] shadow-[0_25px_45px_rgba(0,50,100,0.3),0_10px_10px_rgba(0,0,0,0.05)]"
    textColor="white"
  >
    {/* Grid pattern */}
    <div 
      className="
        absolute inset-0 opacity-50
        [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]
        [background-size:40px_40px]
      " 
    />
    
    {/* Dark block */}
    <div 
      className="
        absolute -top-[50px] left-10
        w-[100px] h-[400px]
        bg-black/20 backdrop-blur-[5px]
        shadow-[0_4px_15px_rgba(0,0,0,0.2)]
        rotate-[25deg]
      " 
    />
    
    {/* Blue block */}
    <div 
      className="
        absolute -top-20 left-[140px]
        w-[140px] h-[400px] z-[1]
        bg-gradient-to-b from-[#2b7de0] to-[#004c8f]
        opacity-60 backdrop-blur-[5px]
        shadow-[0_4px_15px_rgba(0,0,0,0.2)]
        rotate-[25deg]
      " 
    />
    
    {/* Red block */}
    <div 
      className="
        absolute -top-[50px] left-20
        w-[120px] h-[400px] z-[2]
        bg-gradient-to-b from-[#ed2939] to-[#c41e2b]
        opacity-95 backdrop-blur-[5px]
        shadow-[0_4px_15px_rgba(0,0,0,0.2)]
        rotate-[25deg]
      " 
    />
    
    {/* Digital square - bottom right */}
    <div 
      className="
        absolute bottom-[30px] right-[30px]
        w-[60px] h-[60px]
        border-2 border-white/10
        rotate-45
        after:content-[''] after:absolute after:inset-2.5 after:bg-white/[0.05]
      " 
    />
    
    {/* Gloss overlay */}
    <div 
      className="
        absolute -top-[100px] -left-[100px]
        w-[300px] h-[600px]
        bg-gradient-to-r from-transparent via-white/20 to-transparent
        rotate-[25deg] pointer-events-none mix-blend-overlay
      " 
    />
    
    {children}
  </BaseCard>
);

export default HdfcGeometricCard;

import React from 'react';

interface CanaraGoldenCardProps {
  children?: React.ReactNode;
}

/**
 * Canara Golden Design
 * Blue with golden diagonal paths
 */
const CanaraGoldenCard: React.FC<CanaraGoldenCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[20px] overflow-hidden
      bg-gradient-to-br from-[#0060ac] to-[#0085ca]
      shadow-[0_25px_45px_rgba(0,80,150,0.3),0_10px_15px_rgba(0,0,0,0.05)]
    "
  >
    {/* Golden path 1 */}
    <div 
      className="
        absolute -top-40 left-[70px]
        w-[130px] h-[600px] rounded-[100px]
        bg-gradient-to-b from-[#ffcc00] to-[#ffdb4d]
        mix-blend-hard-light opacity-[0.85] blur-[1px]
        rotate-[35deg]
      " 
    />
    
    {/* Golden path 2 */}
    <div 
      className="
        absolute -top-[190px] -left-[30px]
        w-[130px] h-[600px] rounded-[100px]
        bg-gradient-to-b from-[#ffcc00] to-[#ffdb4d]
        mix-blend-hard-light opacity-70 blur-[1px]
        -rotate-[35deg]
      " 
    />
    
    {/* Shimmer overlay */}
    <div 
      className="
        absolute inset-0 pointer-events-none
        bg-[linear-gradient(45deg,transparent_35%,rgba(255,255,255,0.15)_45%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0.15)_55%,transparent_65%)]
      " 
    />
    
    {children}
  </div>
);

export default CanaraGoldenCard;

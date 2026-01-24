import React from 'react';

interface IndianBankTechCardProps {
  children?: React.ReactNode;
}

/**
 * Indian Bank Tech Design
 * Modern tech bars design
 */
const IndianBankTechCard: React.FC<IndianBankTechCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[20px] overflow-hidden
      bg-gradient-to-r from-[#0a1f44] to-[#122b5e]
      shadow-[0_20px_40px_rgba(0,40,85,0.4),0_10px_10px_rgba(0,0,0,0.05)]
    "
  >
    {/* Bars container - skewed */}
    <div 
      className="
        absolute inset-0 flex justify-center items-center gap-[15px]
        -skew-x-[20deg] scale-[1.2]
      "
    >
      {/* Bar 1 */}
      <div className="h-[120%] w-[60px] bg-white/[0.02] border-r border-white/[0.05]" />
      
      {/* Bar 2 */}
      <div className="h-[120%] w-5 bg-white/[0.05] border-r border-white/[0.05]" />
      
      {/* Hero bar - orange accent */}
      <div 
        className="
          w-3 h-[120%] z-[2]
          bg-gradient-to-b from-[#ff9933] to-[#ff6600]
          shadow-[0_0_25px_rgba(255,102,0,0.6)]
        " 
      />
      
      {/* Bar 4 */}
      <div className="h-[120%] w-[30px] bg-white/[0.04] border-r border-white/[0.05]" />
      
      {/* Bar 5 */}
      <div className="h-[120%] w-20 bg-white/[0.01] border-r border-white/[0.05]" />
    </div>
    
    {/* Scan line */}
    <div 
      className="
        absolute top-[40%] left-0 w-full h-px
        bg-gradient-to-r from-transparent via-white/50 to-transparent
        opacity-30
      " 
    />
    
    {/* Noise overlay */}
    <div 
      className="
        absolute inset-0 mix-blend-overlay
        [background-image:url(&quot;data:image/svg+xml,%3Csvg_viewBox='0_0_200_200'_xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter_id='noise'%3E%3CfeTurbulence_type='fractalNoise'_baseFrequency='1.5'_numOctaves='3'_stitchTiles='stitch'/%3E%3C/filter%3E%3Crect_width='100%25'_height='100%25'_filter='url(%23noise)'_opacity='0.07'/%3E%3C/svg%3E&quot;)]
      " 
    />
    
    {children}
  </div>
);

export default IndianBankTechCard;

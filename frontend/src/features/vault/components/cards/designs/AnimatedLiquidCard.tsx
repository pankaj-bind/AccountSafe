import React from 'react';
import BaseCard from '../BaseCard';

interface AnimatedLiquidCardProps {
  children?: React.ReactNode;
}

/**
 * Animated Liquid Design
 * Premium animated liquid blobs with multiple effects
 */
const AnimatedLiquidCard: React.FC<AnimatedLiquidCardProps> = ({ children }) => (
  <BaseCard 
    className="shadow-[0_50px_100px_rgba(0,0,0,0.6),0_0_80px_rgba(220,38,38,0.4),inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] [transform-style:preserve-3d] hover:-translate-y-2.5 hover:[transform:rotateY(-5deg)_rotateX(5deg)] hover:shadow-[0_60px_140px_rgba(0,0,0,0.7),0_0_120px_rgba(220,38,38,0.6),inset_0_0_0_1px_rgba(255,255,255,0.2)]"
    textColor="white"
  >
    {/* Base red gradient background */}
    <div 
      className="
        absolute w-full h-full
        bg-gradient-to-br from-red-700 via-red-600 to-red-500
      " 
    />
    
    {/* Liquid blob 1 - top right */}
    <div 
      className="
        absolute -top-[120px] -right-[100px]
        w-[380px] h-[380px]
        bg-[radial-gradient(circle,#f87171_0%,#dc2626_50%,transparent_70%)]
        rounded-[40%_60%_70%_30%/40%_50%_60%_50%]
        blur-[30px] opacity-50
        animate-blob-morph
      " 
    />
    
    {/* Liquid blob 2 - bottom left */}
    <div 
      className="
        absolute -bottom-[100px] -left-20
        w-[300px] h-[300px]
        bg-[radial-gradient(circle,#991b1b_0%,#b91c1c_50%,transparent_70%)]
        rounded-[40%_60%_70%_30%/40%_50%_60%_50%]
        blur-[30px] opacity-50
        animate-blob-morph [animation-delay:3s]
      " 
    />
    
    {/* Liquid blob 3 - center */}
    <div 
      className="
        absolute top-[45%] left-[45%] -translate-x-1/2 -translate-y-1/2
        w-[250px] h-[250px]
        bg-[radial-gradient(circle,#ef4444_0%,#dc2626_50%,transparent_70%)]
        rounded-[40%_60%_70%_30%/40%_50%_60%_50%]
        blur-[30px] opacity-50
        animate-blob-morph [animation-delay:6s]
      " 
    />
    
    {/* Hexagon dot pattern */}
    <div 
      className="
        absolute w-full h-full opacity-60
        [background-image:radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)]
        [background-size:25px_25px]
      " 
    />
    
    {/* Wave layer */}
    <div className="absolute w-[200%] h-full bottom-0 left-0">
      {/* Wave 1 */}
      <div 
        className="
          absolute bottom-0 left-0 w-full h-[120px] rounded-full
          bg-gradient-to-b from-transparent via-[rgba(185,28,28,0.4)] to-[rgba(153,27,27,0.6)]
          animate-wave
        " 
      />
      {/* Wave 2 */}
      <div 
        className="
          absolute bottom-0 left-0 w-full h-[100px] rounded-full
          bg-gradient-to-b from-transparent via-[rgba(220,38,38,0.3)] to-[rgba(185,28,28,0.5)]
          opacity-70 animate-wave [animation-delay:3s]
        " 
      />
    </div>
    
    {/* Geometric rotating rings */}
    <div className="absolute w-full h-full">
      {/* Ring 1 */}
      <div 
        className="
          absolute top-[20%] left-[60%]
          w-[180px] h-[180px] rounded-full
          border-2 border-white/[0.15]
          animate-rotate-ring
        " 
      />
      {/* Ring 2 */}
      <div 
        className="
          absolute bottom-[25%] left-[15%]
          w-[120px] h-[120px] rounded-full
          border-2 border-white/[0.15]
          animate-rotate-ring [animation-delay:5s] [animation-direction:reverse]
        " 
      />
    </div>
    
    {/* Light streak effect */}
    <div 
      className="
        absolute -top-full -left-full
        w-[300%] h-[300%]
        bg-[linear-gradient(100deg,transparent_0%,transparent_45%,rgba(255,255,255,0.15)_48%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.15)_52%,transparent_55%,transparent_100%)]
        animate-light-sweep
      " 
    />
    
    {/* Glow particles */}
    <div 
      className="
        absolute top-[20%] left-[25%]
        w-1.5 h-1.5 rounded-full
        bg-white/90
        shadow-[0_0_20px_rgba(248,113,113,0.8),0_0_40px_rgba(220,38,38,0.6)]
        animate-particle-drift
      " 
    />
    <div 
      className="
        absolute top-[65%] left-[70%]
        w-1.5 h-1.5 rounded-full
        bg-white/90
        shadow-[0_0_20px_rgba(248,113,113,0.8),0_0_40px_rgba(220,38,38,0.6)]
        animate-particle-drift [animation-delay:2s]
      " 
    />
    <div 
      className="
        absolute top-[40%] left-[80%]
        w-1.5 h-1.5 rounded-full
        bg-white/90
        shadow-[0_0_20px_rgba(248,113,113,0.8),0_0_40px_rgba(220,38,38,0.6)]
        animate-particle-drift [animation-delay:4s]
      " 
    />
    
    {/* Radial gradient overlay */}
    <div 
      className="
        absolute w-full h-full
        bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.15)_0%,transparent_60%)]
        mix-blend-overlay
      " 
    />
    
    {/* Shimmer effect */}
    <div 
      className="
        absolute w-full h-full
        bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.1)_50%,transparent_70%)]
        animate-shimmer-slide
      " 
    />
    
    {/* Inner glow border */}
    <div 
      className="
        absolute top-[3px] left-[3px] rounded-[20px] pointer-events-none
        w-[calc(100%-6px)] h-[calc(100%-6px)]
        shadow-[inset_0_0_80px_rgba(248,113,113,0.3),inset_0_0_40px_rgba(220,38,38,0.2)]
      " 
    />
    
    {children}
  </BaseCard>
);

export default AnimatedLiquidCard;

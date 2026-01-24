import React from 'react';

interface LiquidGradientCardProps {
  children?: React.ReactNode;
}

/**
 * Liquid Gradient Design
 * Animated multi-color blobs with dark background
 */
const LiquidGradientCard: React.FC<LiquidGradientCardProps> = ({ children }) => (
  <div 
    className="
      relative w-full h-full rounded-[24px] overflow-hidden
      bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]
      shadow-[0_20px_40px_rgba(0,0,0,0.5)]
    "
  >
    {/* Blob 1 - Orange/red - top left */}
    <div 
      className="
        absolute -top-[100px] -left-[50px]
        w-[250px] h-[250px]
        bg-gradient-to-r from-[#ff4b1f] to-[#ff9068]
        rounded-[30%_70%_70%_30%/30%_30%_70%_70%]
        blur-[40px] opacity-80 mix-blend-screen
        animate-blob-rotate
      " 
    />
    
    {/* Blob 2 - Blue - bottom right */}
    <div 
      className="
        absolute -bottom-[120px] -right-20
        w-[300px] h-[300px]
        bg-gradient-to-r from-[#00c6ff] to-[#0072ff]
        rounded-[60%_40%_30%_70%/60%_30%_70%_40%]
        blur-[40px] opacity-80 mix-blend-screen
        animate-blob-rotate [animation-duration:25s] [animation-direction:reverse]
      " 
    />
    
    {/* Blob 3 - Purple - center */}
    <div 
      className="
        absolute top-1/2 left-1/2
        w-[150px] h-[150px]
        bg-gradient-to-r from-[#8e2de2] to-[#4a00e0]
        rounded-full
        blur-[40px] opacity-80 mix-blend-screen
        animate-blob-move
      " 
    />
    
    {/* Overlay with inner glow and vignette */}
    <div 
      className="
        absolute inset-0 pointer-events-none
        shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]
        bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(255,255,255,0.05)_100%)]
      " 
    />
    
    {children}
  </div>
);

export default LiquidGradientCard;

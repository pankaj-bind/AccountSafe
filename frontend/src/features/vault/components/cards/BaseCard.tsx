import React from 'react';
import { BaseCardProps } from './types';

/**
 * BaseCard - A reusable responsive card wrapper component
 * 
 * Uses aspect-ratio for proper scaling on all devices
 * Provides shared glass/shine effect overlay
 * Handles text color accessibility through textColor prop
 */
const BaseCard: React.FC<BaseCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  textColor = 'white'
}) => {
  const textColorClasses = textColor === 'white' 
    ? 'text-white' 
    : 'text-gray-900';

  return (
    <div
      onClick={onClick}
      className={`
        relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden
        shadow-[0_22px_48px_rgba(0,0,0,0.35)]
        transition-all duration-500 ease-out
        hover:shadow-[0_30px_60px_rgba(0,0,0,0.45)]
        hover:scale-[1.02]
        ${onClick ? 'cursor-pointer' : ''}
        ${textColorClasses}
        ${className}
      `}
    >
      {/* Content Container */}
      {children}
      
      {/* Shared Glass/Shine Effect Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[5]
          bg-gradient-to-b from-white/20 via-white/5 to-transparent"
        style={{ mixBlendMode: 'overlay' }}
      />
      
      {/* Inner border glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-[6]
          rounded-2xl ring-1 ring-inset ring-white/20"
      />
    </div>
  );
};

export default BaseCard;

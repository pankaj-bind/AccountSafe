import React from 'react';
import { CardDetailsProps, TextColorType, CARD_NETWORKS } from './types';

interface CardDetailsOverlayProps extends CardDetailsProps {
  textColor?: TextColorType;
}

const CardDetailsOverlay: React.FC<CardDetailsOverlayProps> = ({
  bankName = 'BANK NAME',
  cardNetwork = '',
  cardNumber = '•••• •••• •••• ••••',
  cardHolder = 'CARD HOLDER',
  expiryDate = 'MM/YY',
  showDetails = true,
  textColor = 'white',
}) => {
  if (!showDetails) return null;

  const formatCardNumber = (num: string): string => {
    if (num === '•••• •••• •••• ••••') return num;
    const cleaned = num.replace(/\s/g, '');
    // Show masked format: **** **** **** 1234
    if (cleaned.length >= 4) {
      const last4 = cleaned.slice(-4);
      return `****  ****  ****  ${last4}`;
    }
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join('  ');
  };

  // Text color classes based on prop
  const textClasses = textColor === 'white' 
    ? 'text-white' 
    : 'text-slate-900';
  
  const labelOpacity = textColor === 'white' 
    ? 'text-white/70' 
    : 'text-slate-600';

  const shadowClass = textColor === 'white'
    ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
    : 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]';

  return (
    <div className="absolute inset-0 p-[5%_6%] flex flex-col z-10">
      {/* Header: Bank Name & Card Network Logo */}
      <div className="flex justify-between items-start mb-[4%]">
        <span 
          className={`
            text-[clamp(12px,4.5vw,18px)] font-bold italic uppercase
            tracking-[0.5px] ${textClasses} ${shadowClass}
          `}
        >
          {bankName}
        </span>
        <div className="flex items-center">
          {cardNetwork && (() => {
            const network = CARD_NETWORKS.find(n => n.id === cardNetwork);
            if (!network || !network.logo) return null;
            
            // Visa needs invert filter on white text backgrounds
            const needsInvert = cardNetwork === 'visa' && textColor === 'white';
            
            return (
              <img 
                src={network.logo} 
                alt={network.name} 
                className={`
                  h-[clamp(20px,7vw,28px)] w-auto object-contain
                  ${needsInvert ? 'brightness-0 invert' : ''}
                `}
              />
            );
          })()}
        </div>
      </div>

      {/* Card Number - Single Line */}
      <div className="mb-[4%]">
        <span 
          className={`
            text-[clamp(14px,5vw,20px)] tracking-[clamp(1px,0.8vw,3px)]
            font-semibold font-mono whitespace-nowrap
            ${textClasses} ${shadowClass}
          `}
        >
          {formatCardNumber(cardNumber)}
        </span>
      </div>
      
      {/* EMV Chip */}
      <div className="mb-[4%]">
        <img 
          src="/logo/chip.png" 
          alt="Chip" 
          className="w-[clamp(35px,13vw,50px)] h-[clamp(28px,10vw,40px)] object-contain"
        />
      </div>
      
      {/* Bottom Info: Card Holder & Expiry */}
      <div className="flex justify-between items-end mt-auto">
        <div className="flex flex-col gap-0.5">
          <span className={`text-[clamp(7px,2.5vw,9px)] tracking-[0.3px] uppercase ${labelOpacity}`}>
            Card Holder Name
          </span>
          <span 
            className={`
              text-[clamp(10px,3.5vw,14px)] font-semibold uppercase
              tracking-[0.5px] ${textClasses} ${shadowClass}
            `}
          >
            {cardHolder}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className={`text-[clamp(7px,2.5vw,9px)] tracking-[0.3px] uppercase ${labelOpacity}`}>
            Expiry Date
          </span>
          <span 
            className={`
              text-[clamp(10px,3.5vw,14px)] font-semibold uppercase
              tracking-[0.5px] ${textClasses} ${shadowClass}
            `}
          >
            {expiryDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsOverlay;

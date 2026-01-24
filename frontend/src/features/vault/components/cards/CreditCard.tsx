import React from 'react';
import { CardDesignType, CreditCardProps } from './types';
import CardDetailsOverlay from './CardDetailsOverlay';
import {
  BobCard,
  SbiCard,
  PnbCard,
  AnimatedLiquidCard,
  CanaraCard,
  CanaraGoldenCard,
  LiquidGradientCard,
  BoiHorizonCard,
  BoiCleanCard,
  IndianBankCard,
  IndianBankTechCard,
  CentralBankCard,
  CentralBankHubCard,
  HdfcCard,
  HdfcGeometricCard,
} from './designs';

// Map of design IDs to their components
const designComponents: Record<CardDesignType, React.FC<{ children?: React.ReactNode }>> = {
  'bob': BobCard,
  'sbi': SbiCard,
  'pnb': PnbCard,
  'animated-liquid': AnimatedLiquidCard,
  'canara': CanaraCard,
  'canara-golden': CanaraGoldenCard,
  'liquid-gradient': LiquidGradientCard,
  'boi-horizon': BoiHorizonCard,
  'boi-clean': BoiCleanCard,
  'indian-bank': IndianBankCard,
  'indian-bank-tech': IndianBankTechCard,
  'central-bank': CentralBankCard,
  'central-bank-hub': CentralBankHubCard,
  'hdfc': HdfcCard,
  'hdfc-geometric': HdfcGeometricCard,
};

/**
 * CreditCard Component
 * Factory component that renders the appropriate card design with details overlay
 */
export const CreditCard: React.FC<CreditCardProps> = ({
  design,
  bankName,
  cardNetwork,
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  showDetails = true,
  className = '',
  onClick,
}) => {
  const DesignComponent = designComponents[design] || SbiCard;

  const detailsOverlay = (
    <CardDetailsOverlay
      bankName={bankName}
      cardNetwork={cardNetwork}
      cardNumber={cardNumber}
      cardHolder={cardHolder}
      expiryDate={expiryDate}
      cvv={cvv}
      showDetails={showDetails}
    />
  );

  return (
    <div
      className={`
        w-full max-w-[380px]
        md:max-w-full
        ${className}
      `}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <DesignComponent>
        {detailsOverlay}
      </DesignComponent>
    </div>
  );
};

export default CreditCard;

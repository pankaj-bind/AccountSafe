// ============================================
// CREDIT CARD TYPES & CONSTANTS
// ============================================

export type CardDesignType = 
  | 'bob' 
  | 'sbi' 
  | 'pnb' 
  | 'animated-liquid' 
  | 'canara' 
  | 'canara-golden' 
  | 'liquid-gradient' 
  | 'boi-horizon' 
  | 'boi-clean' 
  | 'indian-bank' 
  | 'indian-bank-tech' 
  | 'central-bank' 
  | 'central-bank-hub' 
  | 'hdfc' 
  | 'hdfc-geometric';

export type CardNetworkType = 'visa' | 'mastercard' | '';

export type TextColorType = 'white' | 'dark';

export interface CardDesignOption {
  id: CardDesignType;
  name: string;
  description: string;
}

export interface BaseCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  textColor?: TextColorType;
}

export interface CardDetailsProps {
  bankName?: string;
  cardNetwork?: CardNetworkType;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  showDetails?: boolean;
  textColor?: TextColorType;
}

export interface CreditCardProps extends CardDetailsProps {
  design: CardDesignType;
  className?: string;
  onClick?: () => void;
}

// Card design options with metadata
export const CARD_DESIGNS: CardDesignOption[] = [
  { id: 'bob', name: 'Bank of Baroda', description: 'Classic orange gradient with circular accents' },
  { id: 'sbi', name: 'SBI Blue', description: 'Deep blue gradient with circular elements' },
  { id: 'pnb', name: 'PNB Maroon', description: 'Rich maroon with gold accent' },
  { id: 'animated-liquid', name: 'Animated Liquid', description: 'Premium animated liquid blobs' },
  { id: 'canara', name: 'Canara Bank', description: 'Blue with yellow arc accent' },
  { id: 'canara-golden', name: 'Canara Golden', description: 'Blue with golden diagonal paths' },
  { id: 'liquid-gradient', name: 'Liquid Gradient', description: 'Animated multi-color blobs' },
  { id: 'boi-horizon', name: 'BOI Horizon', description: 'Ocean blue with saffron wave' },
  { id: 'boi-clean', name: 'BOI Clean', description: 'Clean blue with orange accent' },
  { id: 'indian-bank', name: 'Indian Bank', description: 'Deep blue with orange energy' },
  { id: 'indian-bank-tech', name: 'Indian Bank Tech', description: 'Modern tech bars design' },
  { id: 'central-bank', name: 'Central Bank', description: 'Red and blue slabs' },
  { id: 'central-bank-hub', name: 'Central Bank Hub', description: 'Radar rings design' },
  { id: 'hdfc', name: 'HDFC Minimal', description: 'Corporate navy with red glow' },
  { id: 'hdfc-geometric', name: 'HDFC Geometric', description: 'Geometric blocks design' },
];

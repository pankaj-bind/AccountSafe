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

export type CardNetworkType = 
  | 'visa' 
  | 'mastercard' 
  | 'amex' 
  | 'discover' 
  | 'diners' 
  | 'jcb' 
  | 'maestro' 
  | 'unionpay' 
  | 'rupay' 
  | '';

export type TextColorType = 'white' | 'dark';

// Card network options with metadata
export interface CardNetworkOption {
  id: CardNetworkType;
  name: string;
  logo: string;
}

export const CARD_NETWORKS: CardNetworkOption[] = [
  { id: '', name: 'None', logo: '' },
  { id: 'visa', name: 'Visa', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/960px-Visa_Inc._logo.svg.png' },
  { id: 'mastercard', name: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/960px-Mastercard_2019_logo.svg.png' },
  { id: 'amex', name: 'American Express', logo: 'https://1000logos.net/wp-content/uploads/2016/10/American-Express-Color.png' },
  { id: 'discover', name: 'Discover', logo: 'https://1000logos.net/wp-content/uploads/2021/05/Discover-logo-500x281.png' },
  { id: 'diners', name: 'Diners Club', logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968288.png' },
  { id: 'jcb', name: 'JCB', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/JCB_logo.svg/330px-JCB_logo.svg.png' },
  { id: 'maestro', name: 'Maestro', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Maestro_Logo.svg/960px-Maestro_Logo.svg.png' },
  { id: 'unionpay', name: 'UnionPay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/UnionPay_logo.svg/330px-UnionPay_logo.svg.png' },
  { id: 'rupay', name: 'RuPay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/330px-RuPay.svg.png' },
];

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

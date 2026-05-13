// src/features/vault/components/CreditCardItem.tsx
/**
 * CreditCardItem - Credit Card Display Component
 *
 * Displays a credit card profile with visual card preview and action buttons.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from './cards';
import type { Profile } from '../types/profile.types';
import type { CardDesignType, CardNetworkType } from './cards';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface CardData {
  bankName: string;
  cardNetwork: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  design: string;
}

interface CreditCardItemProps {
  profile: Profile;
  cardData: CardData;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const CreditCardItem: React.FC<CreditCardItemProps> = ({
  profile,
  cardData,
  copiedField,
  onCopy,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group w-full max-w-[380px]"
    >
      {/* Credit Card Visual */}
      <div className="transition-all duration-300 group-hover:scale-[1.02]">
        <CreditCard
          design={cardData.design as CardDesignType}
          bankName={cardData.bankName}
          cardNetwork={cardData.cardNetwork as CardNetworkType}
          cardNumber={cardData.cardNumber}
          cardHolder={cardData.cardHolder}
          expiryDate={cardData.expiry}
          showDetails={true}
        />
      </div>

      {/* Card Actions */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Copy Card Number */}
          <button
            onClick={() => onCopy(cardData.cardNumber, `cardnum-${profile.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              copiedField === `cardnum-${profile.id}`
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {copiedField === `cardnum-${profile.id}` ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedField === `cardnum-${profile.id}` ? 'Copied!' : 'Card No.'}
          </button>

          {/* Copy CVV */}
          <button
            onClick={() => onCopy(cardData.cvv, `cvv-${profile.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              copiedField === `cvv-${profile.id}`
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {copiedField === `cvv-${profile.id}` ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedField === `cvv-${profile.id}` ? 'Copied!' : 'CVV'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditCardItem;

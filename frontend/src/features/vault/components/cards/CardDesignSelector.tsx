import React from 'react';
import { CardDesignType, CARD_DESIGNS } from './types';
import CreditCard from './CreditCard';

export interface CardDesignSelectorProps {
  selectedDesign: CardDesignType;
  onSelectDesign: (design: CardDesignType) => void;
  showPreview?: boolean;
  cardDetails?: {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
  };
}

/**
 * CardDesignSelector Component
 * Displays a grid of card designs for user selection with optional preview
 */
export const CardDesignSelector: React.FC<CardDesignSelectorProps> = ({
  selectedDesign,
  onSelectDesign,
  showPreview = true,
  cardDetails,
}) => {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-[800px] mx-auto">
      {/* Preview Section */}
      {showPreview && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800 m-0">Preview</h3>
          <div className="flex justify-center">
            <CreditCard
              design={selectedDesign}
              cardNumber={cardDetails?.cardNumber}
              cardHolder={cardDetails?.cardHolder}
              expiryDate={cardDetails?.expiryDate}
              showDetails={true}
            />
          </div>
        </div>
      )}
      
      {/* Design Selection Grid */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800 m-0">Select Card Design</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {CARD_DESIGNS.map((design) => (
            <button
              key={design.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl bg-white cursor-pointer
                text-left relative transition-all duration-200
                border-2
                ${selectedDesign === design.id 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-blue-500'
                }
                hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              `}
              onClick={() => onSelectDesign(design.id)}
            >
              {/* Mini Card Preview */}
              <div className="w-[100px] h-[63px] flex-shrink-0 rounded-lg overflow-hidden">
                <CreditCard design={design.id} showDetails={false} className="!max-w-full" />
              </div>
              
              {/* Design Info */}
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-semibold text-gray-800">{design.name}</span>
                <span className="text-xs text-gray-500">{design.description}</span>
              </div>
              
              {/* Selected Indicator */}
              {selectedDesign === design.id && (
                <div className="absolute top-2 right-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#22c55e" />
                    <path 
                      d="M6 10l3 3 5-6" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardDesignSelector;

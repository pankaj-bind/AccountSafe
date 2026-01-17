import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchBrands, getBrandLogoUrl, getFallbackLogoUrl, BrandSearchResult } from '../services/brandService';

interface BrandSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onBrandSelect: (brand: BrandSearchResult) => void;
  placeholder?: string;
  className?: string;
}

const BrandSearchInput: React.FC<BrandSearchInputProps> = ({
  value,
  onChange,
  onBrandSelect,
  placeholder = "e.g., Google, GitHub, Netflix",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<BrandSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change and search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (newValue.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce search
    searchTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchBrands(newValue);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  // Handle brand selection
  const handleBrandClick = (brand: BrandSearchResult) => {
    onBrandSelect(brand);
    setShowDropdown(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleBrandClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowDropdown(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
          >
            {loading && (
              <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Searching brands...
              </div>
            )}

            {!loading && suggestions.map((brand, index) => (
              <motion.div
                key={`${brand.domain}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleBrandClick(brand)}
                className={`
                  flex items-center gap-3 p-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 last:border-b-0
                  transition-colors
                  ${selectedIndex === index 
                    ? 'bg-blue-50 dark:bg-blue-500/10' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {/* Brand Logo */}
                <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-zinc-800 rounded-lg p-1.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={getBrandLogoUrl(brand.domain, 128)}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = getFallbackLogoUrl(brand.domain);
                    }}
                  />
                </div>

                {/* Brand Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 dark:text-white truncate">
                    {brand.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {brand.domain}
                  </div>
                </div>

              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandSearchInput;

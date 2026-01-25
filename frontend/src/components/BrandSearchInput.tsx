import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchBrands, getBrandLogoUrl, getFallbackLogoUrl, BrandSearchResult, isUrlOrDomain, lookupOrganizationByUrl } from '../services/brandService';
import { Globe, Loader2 } from 'lucide-react';

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
  placeholder = "e.g., Google, GitHub, or paste URL",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<BrandSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [urlLookupResult, setUrlLookupResult] = useState<BrandSearchResult | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
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
    setUrlLookupResult(null);

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (newValue.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsUrlMode(false);
      return;
    }

    // Check if input looks like a URL/domain
    const looksLikeUrl = isUrlOrDomain(newValue.trim());
    setIsUrlMode(looksLikeUrl);

    // Debounce search
    searchTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (looksLikeUrl) {
          // URL lookup mode
          const result = await lookupOrganizationByUrl(newValue);
          if (result) {
            setUrlLookupResult(result);
            setSuggestions([]);
            setShowDropdown(true);
          } else {
            // Fallback to regular search
            const results = await searchBrands(newValue);
            setSuggestions(results);
            setShowDropdown(results.length > 0);
          }
        } else {
          // Regular brand search
          const results = await searchBrands(newValue);
          setSuggestions(results);
          setShowDropdown(results.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setUrlLookupResult(null);
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
    setUrlLookupResult(null);
    setSelectedIndex(-1);
    setIsUrlMode(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle URL lookup result selection
    if (urlLookupResult && showDropdown) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBrandClick(urlLookupResult);
        return;
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setUrlLookupResult(null);
        return;
      }
      return;
    }

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
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || urlLookupResult) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {/* URL mode indicator */}
        {isUrlMode && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {showDropdown && (urlLookupResult || suggestions.length > 0) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
          >
            {/* URL Lookup Result */}
            {urlLookupResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleBrandClick(urlLookupResult)}
                className="p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 border-b border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2 mb-2 text-xs text-blue-600 dark:text-blue-400">
                  <Globe className="w-3 h-3" />
                  <span>Organization found from URL</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Brand Logo */}
                  <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-zinc-800 rounded-lg p-1.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={urlLookupResult.logo || getBrandLogoUrl(urlLookupResult.domain, 128)}
                      alt={urlLookupResult.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getFallbackLogoUrl(urlLookupResult.domain);
                      }}
                    />
                  </div>
                  
                  {/* Brand Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate text-lg">
                      {urlLookupResult.name}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {urlLookupResult.domain}
                    </div>
                  </div>
                  
                  <div className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    Press Enter
                  </div>
                </div>
              </motion.div>
            )}

            {/* Regular Search Results */}
            {!urlLookupResult && !loading && suggestions.map((brand, index) => (
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

            {/* Loading state */}
            {loading && (
              <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {isUrlMode ? 'Looking up organization from URL...' : 'Searching brands...'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandSearchInput;

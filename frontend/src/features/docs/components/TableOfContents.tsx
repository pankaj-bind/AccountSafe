// TableOfContents - Right pane "On This Page" navigation
// Features: Auto-generated from headings, scroll spy, smooth navigation

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { List } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

// Parse markdown content to extract headings
export const parseHeadings = (markdown: string): TocItem[] => {
  const headings: TocItem[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // Match h2 (##) and h3 (###) only
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    
    if (h2Match) {
      const text = h2Match[1].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ id, text, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ id, text, level: 3 });
    }
  }
  
  return headings;
};

// Hook for scroll spy functionality
const useScrollSpy = (ids: string[], offset: number = 100) => {
  const [activeId, setActiveId] = useState<string>('');
  
  useEffect(() => {
    const handleScroll = () => {
      let current = '';
      
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset) {
            current = id;
          }
        }
      }
      
      setActiveId(current);
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [ids, offset]);
  
  return activeId;
};

// Single ToC item
const TocLink: React.FC<{
  item: TocItem;
  isActive: boolean;
  onClick: (id: string) => void;
}> = ({ item, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(item.id)}
      className={clsx(
        'block w-full text-left py-1.5 text-sm transition-all duration-200 border-l-2',
        item.level === 2 ? 'pl-3' : 'pl-6',
        isActive
          ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 font-medium'
          : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      <span className="line-clamp-2">{item.text}</span>
    </button>
  );
};

const TableOfContents: React.FC<TableOfContentsProps> = ({ content, className }) => {
  const headings = parseHeadings(content);
  const ids = headings.map(h => h.id);
  const activeId = useScrollSpy(ids, 120);
  
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);
  
  // Don't render if no headings
  if (headings.length === 0) {
    return null;
  }
  
  return (
    <nav className={clsx('', className)}>
      <div className="sticky top-24">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-4">
          <List className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          On this page
        </h4>
        
        <div className="space-y-0.5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 -mr-2">
          {headings.map((item) => (
            <TocLink
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={handleClick}
            />
          ))}
        </div>
        
        {/* Scroll to top button */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Back to top
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TableOfContents;

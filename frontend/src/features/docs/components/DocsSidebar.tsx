// DocsSidebar - Categorized navigation sidebar
// Inspired by Stripe/Vercel docs navigation

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  Rocket, 
  Shield, 
  Code, 
  Settings, 
  Users, 
  Database, 
  GitBranch,
  ChevronRight,
  ExternalLink,
  Github,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { DOC_CATEGORIES, type DocEntry, type DocCategory } from '../config';

// Icon mapping
const IconMap: Record<string, React.FC<{ className?: string }>> = {
  rocket: Rocket,
  shield: Shield,
  code: Code,
  settings: Settings,
  users: Users,
  database: Database,
  'git-branch': GitBranch,
};

interface DocsSidebarProps {
  currentSlug: string;
  onNavigate?: () => void;
  className?: string;
}

// Single navigation item
const NavItem: React.FC<{
  doc: DocEntry;
  isActive: boolean;
  onClick?: () => void;
}> = ({ doc, isActive, onClick }) => {
  const Icon = doc.icon ? IconMap[doc.icon] : BookOpen;
  
  return (
    <Link
      to={`/docs/${doc.slug}`}
      onClick={onClick}
      className={clsx(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-l-[3px] border-indigo-600 dark:border-indigo-400 -ml-[3px] pl-[calc(0.75rem+3px)]'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
      )}
    >
      {Icon && (
        <Icon 
          className={clsx(
            'w-4 h-4 flex-shrink-0 transition-colors',
            isActive 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
          )} 
        />
      )}
      <span className="truncate">{doc.title}</span>
      {isActive && (
        <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />
      )}
    </Link>
  );
};

// Category section
const CategorySection: React.FC<{
  category: DocCategory;
  currentSlug: string;
  onNavigate?: () => void;
}> = ({ category, currentSlug, onNavigate }) => {
  const hasActiveDoc = category.docs.some(doc => doc.slug === currentSlug);
  
  return (
    <div className="mb-6">
      <h3 className={clsx(
        'px-3 mb-2 text-xs font-semibold uppercase tracking-wider',
        hasActiveDoc 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : 'text-slate-400 dark:text-slate-500'
      )}>
        {category.title}
      </h3>
      <nav className="space-y-0.5">
        {category.docs.map((doc) => (
          <NavItem
            key={doc.slug}
            doc={doc}
            isActive={doc.slug === currentSlug}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
};

// Main sidebar component
const DocsSidebar: React.FC<DocsSidebarProps> = ({ 
  currentSlug, 
  onNavigate,
  className 
}) => {
  return (
    <aside className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-6 border-b border-slate-200 dark:border-slate-800">
        <Link 
          to="/" 
          onClick={onNavigate}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Documentation
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Everything you need to know
        </p>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {DOC_CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            currentSlug={currentSlug}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
        <a
          href="https://github.com/pankaj-bind/AccountSafe.git"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <Github className="w-4 h-4" />
          <span className="font-medium">View on GitHub</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
        </a>
      </div>
    </aside>
  );
};

// Mobile sidebar wrapper with animation
export const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentSlug: string;
}> = ({ isOpen, onClose, currentSlug }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-50 shadow-2xl"
          >
            <DocsSidebar 
              currentSlug={currentSlug} 
              onNavigate={onClose}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DocsSidebar;

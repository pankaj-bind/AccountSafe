// DocsLayout - Triple-pane documentation architecture
// Inspired by Stripe/Vercel/GitBook documentation portals
// Left: Navigation sidebar | Center: Content | Right: Table of contents

import React, { useState, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Menu, 
  ChevronRight, 
  Home,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import DocViewer from '../components/DocViewer';
import DocsSidebar, { MobileSidebar } from '../components/DocsSidebar';
import TableOfContents from '../components/TableOfContents';
import { 
  getDocBySlug, 
  getAdjacentDocs, 
  getCategoryForDoc,
  DEFAULT_DOC_SLUG 
} from '../config';

// ============================================================================
// Breadcrumb Component
// ============================================================================

const Breadcrumb: React.FC<{ 
  currentTitle: string;
  categoryTitle?: string;
}> = ({ currentTitle, categoryTitle }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-8">
      <Link 
        to="/" 
        className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      <ChevronRight className="w-4 h-4 text-slate-400" />
      <Link 
        to="/docs" 
        className="text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        Docs
      </Link>
      {categoryTitle && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-500">{categoryTitle}</span>
        </>
      )}
      <ChevronRight className="w-4 h-4 text-slate-400" />
      <span className="text-slate-900 dark:text-white font-medium truncate">{currentTitle}</span>
    </nav>
  );
};

// ============================================================================
// Navigation Cards (Previous / Next)
// ============================================================================

const NavigationCards: React.FC<{ currentSlug: string }> = ({ currentSlug }) => {
  const { prev, next } = getAdjacentDocs(currentSlug);
  
  return (
    <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous Article */}
        {prev ? (
          <Link
            to={`/docs/${prev.slug}`}
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-1">
                Previous
              </div>
              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {prev.title}
              </div>
            </div>
          </Link>
        ) : (
          <div></div>
        )}
        
        {/* Next Article */}
        {next ? (
          <Link
            to={`/docs/${next.slug}`}
            className="group flex items-center justify-end gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all text-right"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-1">
                Next
              </div>
              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {next.title}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
          </Link>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Mobile Header
// ============================================================================

const MobileHeader: React.FC<{
  onMenuClick: () => void;
  title: string;
}> = ({ onMenuClick, title }) => {
  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Documentation</div>
          <div className="font-semibold text-slate-900 dark:text-white truncate">{title}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main DocsLayout Component
// ============================================================================

const DocsLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [docContent, setDocContent] = useState<string>('');
  
  // All hooks must be called before any conditional returns
  const handleContentLoad = useCallback((content: string) => {
    setDocContent(content);
  }, []);

  // Redirect to default doc if no slug provided
  if (!slug) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }
  
  const currentDoc = getDocBySlug(slug);
  
  // If slug doesn't exist in our map, redirect to default
  if (!currentDoc) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }

  const category = getCategoryForDoc(slug);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        currentSlug={slug}
      />

      {/* Main Layout - 12-column grid */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12">
          
          {/* ══════════════════════════════════════════════════════════════════
              LEFT PANE - Navigation Sidebar (Desktop)
              ══════════════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:block col-span-3 xl:col-span-2">
            <div className="sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800 overflow-hidden">
              <DocsSidebar currentSlug={slug} />
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════════
              CENTER PANE - Main Content
              ══════════════════════════════════════════════════════════════════ */}
          <main className={clsx(
            'col-span-12 lg:col-span-9 xl:col-span-7',
            'min-w-0' // Prevent content overflow
          )}>
            <div className="px-4 sm:px-6 lg:px-10 xl:px-12 py-8 lg:py-10">
              {/* Mobile Header */}
              <MobileHeader 
                onMenuClick={() => setIsMobileSidebarOpen(true)} 
                title={currentDoc.title}
              />
              
              {/* Breadcrumb - Desktop */}
              <div className="hidden lg:block">
                <Breadcrumb 
                  currentTitle={currentDoc.title} 
                  categoryTitle={category?.title}
                />
              </div>
              
              {/* Document Content */}
              <DocViewer 
                filename={currentDoc.file} 
                onContentLoad={handleContentLoad}
              />
              
              {/* Previous / Next Navigation */}
              <NavigationCards currentSlug={slug} />
              
              {/* Footer */}
              <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-500 dark:text-slate-500">
                  <div>
                    Last updated: {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <a 
                    href={`https://github.com/pankajkumar037/AccountSafe/edit/main/docs/${currentDoc.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Edit this page on GitHub →
                  </a>
                </div>
              </footer>
            </div>
          </main>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT PANE - Table of Contents
              ══════════════════════════════════════════════════════════════════ */}
          <aside className="hidden xl:block col-span-3">
            <div className="sticky top-24 px-6 py-8">
              <TableOfContents content={docContent} />
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
};

export default DocsLayout;

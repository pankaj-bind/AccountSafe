import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import DocViewer from '../components/DocViewer';
import { DOCS_MAP, getDocBySlug, DEFAULT_DOC_SLUG, DocEntry } from '../config';

// Icon components for sidebar
const IconMap: Record<string, React.FC<{ className?: string }>> = {
  rocket: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  shield: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  code: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  settings: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  database: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
};

// Default icon for unknown types
const DefaultIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// Sidebar navigation item component
const NavItem: React.FC<{ doc: DocEntry; isActive: boolean; onClick?: () => void }> = ({ doc, isActive, onClick }) => {
  const Icon = doc.icon ? IconMap[doc.icon] || DefaultIcon : DefaultIcon;
  
  return (
    <Link
      to={`/docs/${doc.slug}`}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' 
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
        }
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{doc.title}</div>
        {doc.description && (
          <div className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5 hidden lg:block">
            {doc.description}
          </div>
        )}
      </div>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
      )}
    </Link>
  );
};

const DocsLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Redirect to default doc if no slug provided
  if (!slug) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }
  
  const currentDoc = getDocBySlug(slug);
  
  // If slug doesn't exist in our map, redirect to default
  if (!currentDoc) {
    return <Navigate to={`/docs/${DEFAULT_DOC_SLUG}`} replace />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 min-h-[calc(100vh-64px)] sticky top-16 self-start">
            <div className="p-6">
              {/* Docs Header */}
              <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to App
                </Link>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Documentation</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                  Learn how AccountSafe works
                </p>
              </div>
              
              {/* Navigation */}
              <nav className="space-y-1">
                {DOCS_MAP.map((doc) => (
                  <NavItem 
                    key={doc.slug} 
                    doc={doc} 
                    isActive={doc.slug === slug}
                  />
                ))}
              </nav>
              
              {/* GitHub Link */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <a
                  href="https://github.com/pankajkumar037/AccountSafe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  <span className="text-sm font-medium">View on GitHub</span>
                  <svg className="w-4 h-4 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            </div>
          </aside>
          
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all"
            >
              {isMobileSidebarOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <>
              <div 
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              ></div>
              <aside className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-zinc-900 z-50 shadow-2xl overflow-y-auto">
                <div className="p-6">
                  {/* Close Button */}
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Docs Header */}
                  <div className="mb-8">
                    <Link 
                      to="/" 
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to App
                    </Link>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Documentation</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                      Learn how AccountSafe works
                    </p>
                  </div>
                  
                  {/* Navigation */}
                  <nav className="space-y-1">
                    {DOCS_MAP.map((doc) => (
                      <NavItem 
                        key={doc.slug} 
                        doc={doc} 
                        isActive={doc.slug === slug}
                        onClick={() => setIsMobileSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                </div>
              </aside>
            </>
          )}
          
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                <Link to="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Home
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <Link to="/docs" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                  Docs
                </Link>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-zinc-900 dark:text-white font-medium">{currentDoc.title}</span>
              </nav>
              
              {/* Document Content */}
              <DocViewer filename={currentDoc.file} />
              
              {/* Navigation Footer */}
              <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  {/* Previous */}
                  {(() => {
                    const currentIndex = DOCS_MAP.findIndex(d => d.slug === slug);
                    const prevDoc = currentIndex > 0 ? DOCS_MAP[currentIndex - 1] : null;
                    const nextDoc = currentIndex < DOCS_MAP.length - 1 ? DOCS_MAP[currentIndex + 1] : null;
                    
                    return (
                      <>
                        {prevDoc ? (
                          <Link
                            to={`/docs/${prevDoc.slug}`}
                            className="flex-1 group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all"
                          >
                            <svg className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Previous</div>
                              <div className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {prevDoc.title}
                              </div>
                            </div>
                          </Link>
                        ) : <div className="flex-1"></div>}
                        
                        {nextDoc ? (
                          <Link
                            to={`/docs/${nextDoc.slug}`}
                            className="flex-1 group flex items-center justify-end gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all text-right"
                          >
                            <div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Next</div>
                              <div className="font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {nextDoc.title}
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        ) : <div className="flex-1"></div>}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DocsLayout;

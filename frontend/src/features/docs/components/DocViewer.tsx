// DocViewer - Professional markdown renderer with syntax highlighting
// Features: Prism syntax highlighting, callouts, copy button, custom typography

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Lightbulb
} from 'lucide-react';
import { DOCS_MAP } from '../config';

interface DocViewerProps {
  filename: string;
  onContentLoad?: (content: string) => void;
}

// ============================================================================
// Copy Button Component
// ============================================================================

const CopyButton: React.FC<{ code: string; className?: string }> = ({ code, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'p-2 rounded-md transition-all duration-200',
        'bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600',
        'text-slate-400 hover:text-white',
        className
      )}
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

// ============================================================================
// Code Block with Syntax Highlighting
// ============================================================================

const CodeBlock: React.FC<{
  language: string;
  children: string;
}> = ({ language, children }) => {
  const code = children.replace(/\n$/, '');
  
  // Languages where we hide the badge
  const hiddenBadgeLanguages = ['bash', 'sh', 'shell', 'zsh', 'cmd', 'powershell', 'console', 'terminal', 'text', ''];
  const showBadge = language && !hiddenBadgeLanguages.includes(language.toLowerCase());
  
  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
        {showBadge ? (
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {language}
          </span>
        ) : (
          <span></span>
        )}
        <CopyButton code={code} className="opacity-0 group-hover:opacity-100" />
      </div>
      
      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem 1.25rem',
          background: 'transparent',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ============================================================================
// Callout/Alert Components
// ============================================================================

type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info';

const calloutConfig: Record<CalloutType, {
  icon: React.FC<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  title: string;
}> = {
  note: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800 dark:text-blue-300',
    title: 'Note',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    iconColor: 'text-emerald-500',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    title: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800 dark:text-amber-300',
    title: 'Warning',
  },
  danger: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-500/10',
    borderColor: 'border-red-200 dark:border-red-500/30',
    iconColor: 'text-red-500',
    textColor: 'text-red-800 dark:text-red-300',
    title: 'Danger',
  },
  info: {
    icon: Info,
    bgColor: 'bg-slate-50 dark:bg-slate-500/10',
    borderColor: 'border-slate-200 dark:border-slate-500/30',
    iconColor: 'text-slate-500',
    textColor: 'text-slate-800 dark:text-slate-300',
    title: 'Info',
  },
};

const Callout: React.FC<{
  type: CalloutType;
  children: React.ReactNode;
}> = ({ type, children }) => {
  const config = calloutConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={clsx(
      'my-6 rounded-xl border p-4',
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex gap-3">
        <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className={clsx('flex-1 text-sm', config.textColor)}>
          <span className="font-semibold">{config.title}:</span>{' '}
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Custom Link Handler
// ============================================================================

const DocLink: React.FC<{ href?: string; children: React.ReactNode }> = ({ href, children }) => {
  if (!href) return <>{children}</>;
  
  // External links
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {children}
        <ExternalLink className="w-3 h-3 opacity-60" />
      </a>
    );
  }
  
  // Internal doc links
  const normalizedHref = href.replace(/^\.?\/?/, '');
  const matchedDoc = DOCS_MAP.find(doc => {
    const hrefLower = normalizedHref.toLowerCase();
    const fileLower = doc.file.toLowerCase();
    return hrefLower === fileLower || 
           hrefLower === `docs/${fileLower}` ||
           hrefLower.endsWith(fileLower);
  });
  
  if (matchedDoc) {
    return (
      <Link 
        to={`/docs/${matchedDoc.slug}`}
        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
      >
        {children}
      </Link>
    );
  }
  
  // Anchor links
  if (href.startsWith('#')) {
    return (
      <a 
        href={href}
        className="text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {children}
      </a>
    );
  }
  
  return <a href={href} className="text-indigo-600 dark:text-indigo-400 hover:underline">{children}</a>;
};

// ============================================================================
// Loading & Error States
// ============================================================================

const DocSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
    </div>
    <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 mt-8"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
    </div>
    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl mt-6"></div>
  </div>
);

const DocNotFound: React.FC<{ filename: string }> = ({ filename }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 mb-6 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Document Not Found</h2>
    <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
      The file <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">{filename}</code> could not be found.
    </p>
    <Link
      to="/docs/getting-started"
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
    >
      Back to Getting Started
    </Link>
  </div>
);

const DocError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 mb-6 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
      <AlertTriangle className="w-8 h-8 text-amber-500" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load</h2>
    <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">{error}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
    >
      Try Again
    </button>
  </div>
);

// ============================================================================
// Main DocViewer Component
// ============================================================================

const DocViewer: React.FC<DocViewerProps> = ({ filename, onContentLoad }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await fetch(`/docs/${filename}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        throw new Error(`Failed to fetch document (${response.status})`);
      }

      const text = await response.text();
      setContent(text);
      onContentLoad?.(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filename, onContentLoad]);

  useEffect(() => {
    fetchDocument();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchDocument]);

  if (loading) return <DocSkeleton />;
  if (notFound) return <DocNotFound filename={filename} />;
  if (error) return <DocError error={error} onRetry={fetchDocument} />;

  return (
    <article className="doc-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with IDs for ToC linking
          h1: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h1 id={id} className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h2 id={id} className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-12 mb-6 scroll-mt-24">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h3 id={id} className="text-xl lg:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-8 mb-4 scroll-mt-24">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-3">
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {children}
            </p>
          ),
          
          // Code blocks with syntax highlighting
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 text-sm font-mono bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <CodeBlock language={match?.[1] || ''}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
          
          // Pre wrapper (handled by code block)
          pre: ({ children }) => <>{children}</>,
          
          // Links
          a: ({ href, children }) => <DocLink href={href}>{children}</DocLink>,
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-slate-600 dark:text-slate-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-slate-600 dark:text-slate-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          
          // Blockquotes (with callout detection)
          blockquote: ({ children }) => {
            // Check if it's a callout syntax
            const text = String(children);
            const calloutMatch = text.match(/\[!(NOTE|TIP|WARNING|DANGER|INFO)\]/i);
            
            if (calloutMatch) {
              const type = calloutMatch[1].toLowerCase() as CalloutType;
              const content = text.replace(/\[!(NOTE|TIP|WARNING|DANGER|INFO)\]/i, '').trim();
              return <Callout type={type}>{content}</Callout>;
            }
            
            return (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-r-lg pl-4 pr-4 py-3 my-6 text-slate-700 dark:text-slate-300 italic">
                {children}
              </blockquote>
            );
          },
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 dark:bg-slate-800/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: () => <hr className="my-8 border-slate-200 dark:border-slate-800" />,
          
          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-xl shadow-lg my-6 max-w-full"
            />
          ),
          
          // Strong & Em
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};

export default DocViewer;

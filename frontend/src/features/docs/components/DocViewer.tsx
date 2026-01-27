import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocViewerProps {
  filename: string;
}

// Skeleton loader component for loading state
const DocSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* Title skeleton */}
    <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4"></div>
    
    {/* Paragraph skeletons */}
    <div className="space-y-3">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6"></div>
    </div>
    
    {/* Subheading skeleton */}
    <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/2 mt-8"></div>
    
    {/* More paragraphs */}
    <div className="space-y-3">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
    </div>
    
    {/* Code block skeleton */}
    <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full mt-6"></div>
    
    {/* More content */}
    <div className="space-y-3 mt-6">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
    </div>
  </div>
);

// 404 Not Found component
const DocNotFound: React.FC<{ filename: string }> = ({ filename }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 mb-6 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
      <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
      Document Not Found
    </h2>
    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
      The documentation file <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm">{filename}</code> could not be found.
    </p>
    <a
      href="/docs/getting-started"
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Getting Started
    </a>
  </div>
);

// Error state component
const DocError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 mb-6 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
      <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
      Failed to Load Document
    </h2>
    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
      {error}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      Try Again
    </button>
  </div>
);

const DocViewer: React.FC<DocViewerProps> = ({ filename }) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    fetchDocument();
    // Scroll to top when document changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchDocument]);

  if (loading) {
    return <DocSkeleton />;
  }

  if (notFound) {
    return <DocNotFound filename={filename} />;
  }

  if (error) {
    return <DocError error={error} onRetry={fetchDocument} />;
  }

  return (
    <article className="prose prose-zinc dark:prose-invert lg:prose-lg max-w-none
      prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h1:lg:text-4xl prose-h1:border-b prose-h1:border-zinc-200 prose-h1:dark:border-zinc-800 prose-h1:pb-4 prose-h1:mb-8
      prose-h2:text-2xl prose-h2:lg:text-3xl prose-h2:mt-12 prose-h2:mb-6
      prose-h3:text-xl prose-h3:lg:text-2xl prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-zinc-600 prose-p:dark:text-zinc-400 prose-p:leading-relaxed
      prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:no-underline prose-a:font-medium hover:prose-a:underline
      prose-strong:text-zinc-900 prose-strong:dark:text-zinc-100
      prose-code:text-sm prose-code:bg-zinc-100 prose-code:dark:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-zinc-900 prose-pre:dark:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:shadow-lg
      prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:dark:bg-blue-500/10 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
      prose-ul:list-disc prose-ol:list-decimal
      prose-li:text-zinc-600 prose-li:dark:text-zinc-400
      prose-table:border-collapse prose-table:w-full
      prose-th:bg-zinc-100 prose-th:dark:bg-zinc-800 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-zinc-200 prose-th:dark:border-zinc-700
      prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-zinc-200 prose-td:dark:border-zinc-700
      prose-hr:border-zinc-200 prose-hr:dark:border-zinc-800
      prose-img:rounded-xl prose-img:shadow-lg
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
};

export default DocViewer;

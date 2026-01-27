// Documentation Registry - Categorized documentation entries
// Inspired by Stripe/Vercel docs structure

export interface DocEntry {
  slug: string;
  title: string;
  file: string;
  description?: string;
  icon?: string;
}

export interface DocCategory {
  id: string;
  title: string;
  docs: DocEntry[];
}

// Categorized documentation structure
export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    docs: [
      { 
        slug: 'getting-started', 
        title: 'Introduction', 
        file: 'README.md',
        description: 'Overview of AccountSafe and quick start guide',
        icon: 'rocket'
      },
      { 
        slug: 'contributing', 
        title: 'Contributing', 
        file: 'CONTRIBUTING.md',
        description: 'Development guidelines and code standards',
        icon: 'git-branch'
      },
    ]
  },
  {
    id: 'security',
    title: 'Security',
    docs: [
      { 
        slug: 'security', 
        title: 'Security Model', 
        file: 'SECURITY.md',
        description: 'Zero-knowledge architecture and encryption',
        icon: 'shield'
      },
    ]
  },
  {
    id: 'guides',
    title: 'Guides',
    docs: [
      { 
        slug: 'configuration', 
        title: 'Configuration', 
        file: 'CONFIGURATION.md',
        description: 'Environment variables and settings',
        icon: 'settings'
      },
      { 
        slug: 'administration', 
        title: 'Administration', 
        file: 'ADMINISTRATION.md',
        description: 'Admin panel and user management',
        icon: 'users'
      },
      { 
        slug: 'disaster-recovery', 
        title: 'Disaster Recovery', 
        file: 'DISASTER_RECOVERY.md',
        description: 'Backup and restore procedures',
        icon: 'database'
      },
    ]
  },
  {
    id: 'api',
    title: 'API Reference',
    docs: [
      { 
        slug: 'api', 
        title: 'REST API', 
        file: 'API.md',
        description: 'Complete API documentation',
        icon: 'code'
      },
    ]
  },
];

// Flatten for backwards compatibility
export const DOCS_MAP: DocEntry[] = DOC_CATEGORIES.flatMap(cat => cat.docs);

// Helper function to get doc entry by slug
export const getDocBySlug = (slug: string): DocEntry | undefined => {
  return DOCS_MAP.find(doc => doc.slug === slug);
};

// Helper function to get file path from slug
export const getDocFilePath = (slug: string): string | null => {
  const doc = getDocBySlug(slug);
  return doc ? `/docs/${doc.file}` : null;
};

// Get category for a doc
export const getCategoryForDoc = (slug: string): DocCategory | undefined => {
  return DOC_CATEGORIES.find(cat => cat.docs.some(doc => doc.slug === slug));
};

// Get previous and next docs
export const getAdjacentDocs = (slug: string): { prev: DocEntry | null; next: DocEntry | null } => {
  const allDocs = DOCS_MAP;
  const currentIndex = allDocs.findIndex(doc => doc.slug === slug);
  
  return {
    prev: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  };
};

// Default doc slug for redirects
export const DEFAULT_DOC_SLUG = 'getting-started';

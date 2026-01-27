// Documentation Registry - Maps slugs to markdown files
export interface DocEntry {
  slug: string;
  title: string;
  file: string;
  description?: string;
  icon?: string;
}

export const DOCS_MAP: DocEntry[] = [
  { 
    slug: 'getting-started', 
    title: 'Getting Started', 
    file: 'README.md',
    description: 'Introduction to AccountSafe and quick start guide',
    icon: 'rocket'
  },
  { 
    slug: 'security', 
    title: 'Security Model', 
    file: 'SECURITY.md',
    description: 'Zero-knowledge architecture and encryption details',
    icon: 'shield'
  },
  { 
    slug: 'api', 
    title: 'API Reference', 
    file: 'API.md',
    description: 'Complete REST API documentation',
    icon: 'code'
  },
  { 
    slug: 'configuration', 
    title: 'Configuration', 
    file: 'CONFIGURATION.md',
    description: 'Environment variables and deployment settings',
    icon: 'settings'
  },
  { 
    slug: 'administration', 
    title: 'Administration', 
    file: 'ADMINISTRATION.md',
    description: 'Admin panel and user management guide',
    icon: 'users'
  },
  { 
    slug: 'disaster-recovery', 
    title: 'Disaster Recovery', 
    file: 'DISASTER_RECOVERY.md',
    description: 'Backup, restore, and recovery procedures',
    icon: 'database'
  },
];

// Helper function to get doc entry by slug
export const getDocBySlug = (slug: string): DocEntry | undefined => {
  return DOCS_MAP.find(doc => doc.slug === slug);
};

// Helper function to get file path from slug
export const getDocFilePath = (slug: string): string | null => {
  const doc = getDocBySlug(slug);
  return doc ? `/docs/${doc.file}` : null;
};

// Default doc slug for redirects
export const DEFAULT_DOC_SLUG = 'getting-started';

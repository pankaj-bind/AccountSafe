// Docs Feature - Public API
export { default as DocsLayout } from './layouts/DocsLayout';
export { default as DocViewer } from './components/DocViewer';
export { default as DocsSidebar, MobileSidebar } from './components/DocsSidebar';
export { default as TableOfContents } from './components/TableOfContents';
export { 
  DOCS_MAP, 
  DOC_CATEGORIES,
  getDocBySlug, 
  getDocFilePath, 
  getAdjacentDocs,
  getCategoryForDoc,
  DEFAULT_DOC_SLUG 
} from './config';
export type { DocEntry, DocCategory } from './config';

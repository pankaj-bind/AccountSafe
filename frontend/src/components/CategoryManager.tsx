import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import ProfileManager from './ProfileManager';

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  profile_count: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  organizations: Organization[];
}

const CategoryManager: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newOrg, setNewOrg] = useState({ name: '', logo_url: '' });

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('categories/');
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    
    setError(null);
    try {
      const response = await apiClient.post('categories/', newCategory);
      setCategories([response.data, ...categories]);
      setNewCategory({ name: '', description: '' });
      setShowCategoryModal(false);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(err.response?.data?.name?.[0] || 'Failed to create category');
    }
  };

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name.trim() || !selectedCategoryId) return;

    setError(null);
    try {
      const response = await apiClient.post(
        `categories/${selectedCategoryId}/organizations/`,
        { name: newOrg.name, logo_url: newOrg.logo_url || null }
      );
      
      setCategories(categories.map(cat => 
        cat.id === selectedCategoryId 
          ? { ...cat, organizations: [...cat.organizations, response.data] }
          : cat
      ));
      
      setNewOrg({ name: '', logo_url: '' });
      setShowOrgModal(false);
      setSelectedCategoryId(null);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to create organization');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    
    try {
      await apiClient.delete(`categories/${id}/`);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err: any) {
      setError('Failed to delete category');
    }
  };

  const handleDeleteOrganization = async (orgId: number, catId: number) => {
    if (!window.confirm('Delete this organization?')) return;
    
    try {
      await apiClient.delete(`organizations/${orgId}/`);
      setCategories(categories.map(cat => 
        cat.id === catId
          ? { ...cat, organizations: cat.organizations.filter(org => org.id !== orgId) }
          : cat
      ));
    } catch (err: any) {
      setError('Failed to delete organization');
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const nameMatch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const orgMatch = cat.organizations.some(org => 
      org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatch || orgMatch;
  });

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to manage categories</p>
      </div>
    );
  }

  // If organization is selected, show profile manager
  if (selectedOrganization) {
    return (
      <ProfileManager 
        organization={selectedOrganization}
        onBack={() => setSelectedOrganization(null)}
      />
    );
  }

  return (
    <div className="w-full win-bg-solid min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold win-text-primary mb-2 sm:mb-3">Secure Vault</h1>
          <p className="text-sm sm:text-base win-text-secondary px-2">Organize and manage your credentials securely in one place.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 win-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for an organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base border win-border rounded-xl shadow-win-card focus:outline-none focus:ring-2 focus:ring-win-accent focus:border-transparent win-bg-layer win-text-primary placeholder:text-win-text-tertiary"
            />
          </div>
        </div>

        {/* Create Button */}
        <div className="text-center mb-6 sm:mb-10">
          <button
            onClick={() => { setShowCategoryModal(true); setError(null); }}
            className="win-btn-primary shadow-win-card text-sm sm:text-base px-4 sm:px-6"
          >
            + Create New Category
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base">
            <div className="flex justify-between items-center gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="font-bold text-xl hover:opacity-70 flex-shrink-0">&times;</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-win-accent border-t-transparent"></div>
            <p className="mt-4 win-text-secondary">Loading...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">📁</div>
            <h3 className="text-xl font-semibold win-text-primary mb-2">No categories yet</h3>
            <p className="win-text-tertiary">Create your first category to get started!</p>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-8 sm:space-y-12">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              {/* Category Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 win-text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <h2 className="text-xl sm:text-2xl font-bold win-text-primary">{category.name}</h2>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-4">
                  <button
                    onClick={() => { setSelectedCategoryId(category.id); setShowOrgModal(true); setError(null); }}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg shadow-win-card transition-colors whitespace-nowrap"
                  >
                    + Add Organization
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-lg shadow-win-card transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Organizations Grid */}
              {category.organizations.length === 0 ? (
                <div className="text-center py-12 sm:py-16 win-text-tertiary win-bg-subtle rounded-xl border border-win-border-subtle text-sm sm:text-base">
                  <p>No organizations yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                  {category.organizations
                    .filter(org => !searchQuery || org.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((org) => (
                      <div
                        key={org.id}
                        onClick={() => setSelectedOrganization(org)}
                        className="win-bg-layer border border-win-border-default rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-win-elevated transition-all duration-200 group relative cursor-pointer hover:scale-105 hover:border-win-accent"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrganization(org.id, category.id); }}
                          className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600 shadow-win-card"
                        >
                          ✕
                        </button>

                        <div className="h-12 sm:h-16 md:h-20 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt={org.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-win-card ${org.logo_url ? 'hidden' : ''}`}>
                            <span className="text-white font-bold text-base sm:text-xl md:text-2xl">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-medium win-text-primary text-center text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2" title={org.name}>
                          {org.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs win-text-tertiary text-center">
                          {org.profile_count} Profile{org.profile_count === 1 ? '' : 's'}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
          <div className="win-bg-layer rounded-xl sm:rounded-2xl shadow-win-flyout max-w-lg w-full border border-win-border-default max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-4 sm:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Create New Category</h3>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-5">
                <label className="block win-text-primary text-sm font-semibold mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Microsoft Windows"
                  className="win-input text-sm sm:text-base"
                  autoFocus
                  required
                />
              </div>
              <div className="mb-5 sm:mb-6">
                <label className="block win-text-primary text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Optional description"
                  className="win-input resize-none text-sm sm:text-base"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 sm:gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}
                  className="win-btn-secondary text-sm sm:text-base px-4 sm:px-6"
                >
                  Cancel
                </button>
                <button type="submit" className="win-btn-primary text-sm sm:text-base px-4 sm:px-6">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setShowOrgModal(false)}>
          <div className="win-bg-layer rounded-xl sm:rounded-2xl shadow-win-flyout max-w-lg w-full border border-win-border-default max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 px-4 sm:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Add Organization</h3>
            </div>
            <form onSubmit={handleAddOrganization} className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-5">
                <label className="block win-text-primary text-sm font-semibold mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="e.g., Windows 11"
                  className="win-input text-sm sm:text-base"
                  autoFocus
                  required
                />
              </div>
              <div className="mb-5 sm:mb-6">
                <label className="block win-text-primary text-sm font-semibold mb-2">Logo URL</label>
                <input
                  type="url"
                  value={newOrg.logo_url}
                  onChange={(e) => setNewOrg({ ...newOrg, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="win-input text-sm sm:text-base"
                />
                <p className="text-xs win-text-tertiary mt-2">Optional: URL to organization logo</p>
              </div>
              <div className="flex gap-2 sm:gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowOrgModal(false); setNewOrg({ name: '', logo_url: '' }); setSelectedCategoryId(null); }}
                  className="win-btn-secondary text-sm sm:text-base px-4 sm:px-6"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 sm:px-6 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

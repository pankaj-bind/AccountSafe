import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
}

interface Profile {
  id: number;
  title: string;
  username: string | null;
  password?: string;
  document: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

interface ProfileManagerProps {
  organization: Organization;
  onBack: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ organization, onBack }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState<{[key: number]: boolean}>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    title: '',
    username: '',
    password: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [organization.id]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`organizations/${organization.id}/profiles/`);
      setProfiles(response.data);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new FormData();
      if (newProfile.title) formData.append('title', newProfile.title);
      if (newProfile.username) formData.append('username', newProfile.username);
      if (newProfile.password) formData.append('password', newProfile.password);
      if (newProfile.notes) formData.append('notes', newProfile.notes);
      if (selectedFile) formData.append('document', selectedFile);

      if (editingProfile) {
        const response = await apiClient.put(
          `profiles/${editingProfile.id}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setProfiles(profiles.map(p => p.id === editingProfile.id ? response.data : p));
      } else {
        const response = await apiClient.post(
          `organizations/${organization.id}/profiles/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setProfiles([...profiles, response.data]);
      }

      setShowModal(false);
      setEditingProfile(null);
      setNewProfile({ title: '', username: '', password: '', notes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error:', err.response || err);
      setError(editingProfile ? 'Failed to update profile' : 'Failed to create profile');
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!window.confirm('Delete this profile?')) return;

    try {
      await apiClient.delete(`profiles/${profileId}/`);
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (err: any) {
      setError('Failed to delete profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setNewProfile({
      title: profile.title || '',
      username: profile.username || '',
      password: '',
      notes: profile.notes || '',
    });
    setShowModal(true);
    setError(null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      setCopiedField(null);
    });
  };

  const togglePasswordVisibility = (profileId: number) => {
    setShowPassword(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {organization.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600">{profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}</p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow"
            >
              + Add Profile
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="font-bold text-xl">&times;</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && profiles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No profiles yet</h3>
            <p className="text-gray-500">Create your first profile to store credentials or documents!</p>
          </div>
        )}

        {/* Profiles Grid */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all group relative"
              >
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <button
                    onClick={() => handleEditProfile(profile)}
                    className="w-7 h-7 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm hover:bg-blue-600"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm hover:bg-red-600"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  {profile.title && <h3 className="text-lg font-bold text-gray-900 mb-3">{profile.title}</h3>}
                  
                  {profile.username && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded border">{profile.username}</p>
                        <button
                          onClick={() => copyToClipboard(profile.username!, `username-${profile.id}`)}
                          className={`p-2 rounded transition-colors ${
                            copiedField === `username-${profile.id}` 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={copiedField === `username-${profile.id}` ? 'Copied!' : 'Copy username'}
                        >
                          {copiedField === `username-${profile.id}` ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {profile.password && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border">
                          <p className="flex-1 text-sm text-gray-800 font-mono">
                            {showPassword[profile.id] ? profile.password : '••••••••'}
                          </p>
                          <button
                            onClick={() => togglePasswordVisibility(profile.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title={showPassword[profile.id] ? 'Hide password' : 'Show password'}
                          >
                            {showPassword[profile.id] ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => copyToClipboard(profile.password!, `password-${profile.id}`)}
                          className={`p-2 rounded transition-colors ${
                            copiedField === `password-${profile.id}` 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={copiedField === `password-${profile.id}` ? 'Copied!' : 'Copy password'}
                        >
                          {copiedField === `password-${profile.id}` ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {profile.document_url && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Document</label>
                      <a
                        href={profile.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded border border-blue-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View/Download Document
                      </a>
                    </div>
                  )}
                  
                  {profile.notes && (
                    <div className="mb-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                      <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border whitespace-pre-wrap">{profile.notes}</p>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 pt-2 border-t">
                  Created {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Profile Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 sticky top-0 z-10">
                <h3 className="text-2xl font-bold text-white">{editingProfile ? 'Edit Profile' : 'Add Profile'}</h3>
              </div>
              <form onSubmit={handleCreateProfile} className="p-6">
                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Profile Title
                  </label>
                  <input
                    type="text"
                    value={newProfile.title}
                    onChange={(e) => setNewProfile({ ...newProfile, title: e.target.value })}
                    placeholder="e.g., Admin Account, License Key, Certificate"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={newProfile.username}
                    onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                    placeholder="e.g., admin@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                  <input
                    type="text"
                    value={newProfile.password}
                    onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingProfile && !newProfile.password && (
                    <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password</p>
                  )}
                </div>

                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Document</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">Upload PDF, images, or other documents</p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Notes</label>
                  <textarea
                    value={newProfile.notes}
                    onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
                    placeholder="Additional information..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProfile(null);
                      setNewProfile({ title: '', username: '', password: '', notes: '' });
                      setSelectedFile(null);
                    }}
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingProfile ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;

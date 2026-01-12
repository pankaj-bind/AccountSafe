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
  email: string | null;
  recovery_codes: string | null;
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
  const [orgData, setOrgData] = useState<Organization>(organization);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState<{[key: number]: boolean}>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<{[key: number]: string[]}>({});
  const [expandedNotes, setExpandedNotes] = useState<{[key: number]: boolean}>({});
  const [newProfile, setNewProfile] = useState({
    title: '',
    username: '',
    password: '',
    email: '',
    recovery_codes: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchOrganizationData();
    fetchProfiles();
  }, [organization.id]);

  // Initialize recovery codes for each profile
  useEffect(() => {
    const codes: {[key: number]: string[]} = {};
    profiles.forEach(profile => {
      if (profile.recovery_codes) {
        // Split by whitespace and filter out empty strings
        codes[profile.id] = profile.recovery_codes.split(/\s+/).filter(code => code.trim() !== '');
      }
    });
    setRecoveryCodes(codes);
  }, [profiles]);

  const fetchOrganizationData = async () => {
    try {
      const response = await apiClient.get(`organizations/${organization.id}/`);
      setOrgData(response.data);
    } catch (err: any) {
      console.error('Error fetching organization:', err);
    }
  };

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
      // Always append fields, even if empty, to allow clearing values
      formData.append('title', newProfile.title || '');
      formData.append('username', newProfile.username || '');
      formData.append('password', newProfile.password || '');
      formData.append('email', newProfile.email || '');
      formData.append('recovery_codes', newProfile.recovery_codes || '');
      formData.append('notes', newProfile.notes || '');
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
      setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
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
      email: profile.email || '',
      recovery_codes: profile.recovery_codes || '',
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

  const toggleNotesExpansion = (profileId: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const handleCopyRecoveryCode = async (profileId: number, code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedField(`recovery-${profileId}-${index}`);
      setTimeout(() => setCopiedField(null), 1000);
      
      // Remove the copied code from the list
      setRecoveryCodes(prev => {
        const updated = { ...prev };
        if (updated[profileId]) {
          updated[profileId] = updated[profileId].filter((_, i) => i !== index);
          
          // Update the profile with the new recovery codes
          const updatedCodes = updated[profileId].join(' ');
          updateProfileRecoveryCodes(profileId, updatedCodes);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to copy recovery code:', err);
    }
  };

  const updateProfileRecoveryCodes = async (profileId: number, newCodes: string) => {
    try {
      const formData = new FormData();
      formData.append('recovery_codes', newCodes);
      
      await apiClient.put(`profiles/${profileId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update the profiles list
      setProfiles(profiles.map(p => 
        p.id === profileId ? { ...p, recovery_codes: newCodes } : p
      ));
    } catch (err) {
      console.error('Failed to update recovery codes:', err);
    }
  };

  return (
    <div className="w-full win-bg-solid min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="mb-3 sm:mb-4 flex items-center gap-2 win-text-accent hover:opacity-80 font-medium text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {orgData.logo_url ? (
                <img
                  src={orgData.logo_url}
                  alt={orgData.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl sm:text-2xl">
                    {orgData.name ? orgData.name.charAt(0).toUpperCase() : 'O'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold win-text-primary">{orgData.name || 'Loading...'}</h1>
                <p className="text-sm sm:text-base win-text-secondary">{profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}</p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="w-full sm:w-auto win-btn-primary text-sm sm:text-base px-4 sm:px-6"
            >
              + Add Profile
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
            <div className="flex justify-between items-center gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="font-bold text-xl flex-shrink-0">&times;</button>
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
        {!loading && profiles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold win-text-primary mb-2">No profiles yet</h3>
            <p className="win-text-tertiary">Create your first profile to store credentials or documents!</p>
          </div>
        )}

        {/* Profiles Grid */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="win-bg-layer border border-win-border-default rounded-lg p-4 sm:p-6 hover:shadow-win-elevated transition-all group relative"
              >
                <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 flex gap-1">
                  <button
                    onClick={() => handleEditProfile(profile)}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 dark:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs sm:text-sm hover:bg-blue-600 dark:hover:bg-blue-700 shadow-win-card"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-red-500 dark:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs sm:text-sm hover:bg-red-600 dark:hover:bg-red-700 shadow-win-card"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-3 sm:mb-4">
                  {profile.title && <h3 className="text-base sm:text-lg font-bold win-text-primary mb-2 sm:mb-3 pr-12">{profile.title}</h3>}
                  
                  {profile.username && (
                    <div className="mb-2 sm:mb-3">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">Username</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="flex-1 text-xs sm:text-sm win-text-primary win-bg-subtle px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-win-border-subtle break-all">{profile.username}</p>
                        <button
                          onClick={() => copyToClipboard(profile.username!, `username-${profile.id}`)}
                          className={`p-1.5 sm:p-2 rounded transition-colors flex-shrink-0 ${
                            copiedField === `username-${profile.id}` 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={copiedField === `username-${profile.id}` ? 'Copied!' : 'Copy username'}
                        >
                          {copiedField === `username-${profile.id}` ? (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {profile.password && (
                    <div className="mb-2 sm:mb-3">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">Password</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="flex-1 flex items-center gap-1.5 sm:gap-2 win-bg-subtle px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-win-border-subtle">
                          <p className="flex-1 text-xs sm:text-sm win-text-primary font-mono break-all">
                            {showPassword[profile.id] ? profile.password : '••••••••'}
                          </p>
                          <button
                            onClick={() => togglePasswordVisibility(profile.id)}
                            className="win-text-tertiary hover:win-text-secondary flex-shrink-0"
                            title={showPassword[profile.id] ? 'Hide password' : 'Show password'}
                          >
                            {showPassword[profile.id] ? (
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => copyToClipboard(profile.password!, `password-${profile.id}`)}
                          className={`p-1.5 sm:p-2 rounded transition-colors flex-shrink-0 ${
                            copiedField === `password-${profile.id}` 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={copiedField === `password-${profile.id}` ? 'Copied!' : 'Copy password'}
                        >
                          {copiedField === `password-${profile.id}` ? (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {profile.email && (
                    <div className="mb-2 sm:mb-3">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">Email</label>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="flex-1 text-xs sm:text-sm win-text-primary win-bg-subtle px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-win-border-subtle break-all">{profile.email}</p>
                        <button
                          onClick={() => copyToClipboard(profile.email!, `email-${profile.id}`)}
                          className={`p-1.5 sm:p-2 rounded transition-colors flex-shrink-0 ${
                            copiedField === `email-${profile.id}` 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={copiedField === `email-${profile.id}` ? 'Copied!' : 'Copy email'}
                        >
                          {copiedField === `email-${profile.id}` ? (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {recoveryCodes[profile.id] && recoveryCodes[profile.id].length > 0 && (
                    <div className="mb-2 sm:mb-3">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">
                        Recovery Codes ({recoveryCodes[profile.id].length} remaining)
                      </label>
                      <div className="overflow-x-auto pb-1">
                        <div className="flex gap-1.5 sm:gap-2 min-w-max">
                          {recoveryCodes[profile.id].map((code, index) => (
                            <button
                              key={index}
                              onClick={() => handleCopyRecoveryCode(profile.id, code, index)}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-mono rounded transition-all border whitespace-nowrap ${
                                copiedField === `recovery-${profile.id}-${index}`
                                  ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/30'
                              }`}
                              title={copiedField === `recovery-${profile.id}-${index}` ? 'Copied! Code will be deleted' : 'Click to copy and delete'}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs win-text-tertiary mt-1.5">
                        Click a code to copy it. The code will be automatically deleted after copying.
                      </p>
                    </div>
                  )}
                  
                  {profile.document_url && (
                    <div className="mb-2 sm:mb-3">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">Document</label>
                      <a
                        href={profile.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm win-text-accent hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-blue-200 dark:border-blue-800 break-all"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>View/Download Document</span>
                      </a>
                    </div>
                  )}
                  
                  {profile.notes && (
                    <div className="mb-1 sm:mb-2">
                      <label className="block text-xs font-semibold win-text-tertiary mb-1">Notes</label>
                      <div className="win-bg-subtle px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-win-border-subtle">
                        <p className={`text-xs sm:text-sm win-text-secondary whitespace-pre-wrap break-words ${
                          !expandedNotes[profile.id] ? 'line-clamp-3' : ''
                        }`}>
                          {profile.notes}
                        </p>
                        {profile.notes.length > 30 && (
                          <button
                            onClick={() => toggleNotesExpansion(profile.id)}
                            className="text-xs win-text-accent hover:underline mt-1 font-medium"
                          >
                            {expandedNotes[profile.id] ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs win-text-tertiary pt-2 border-t border-win-border-subtle">
                  Created {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Profile Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="win-bg-layer rounded-xl sm:rounded-2xl shadow-win-flyout max-w-lg w-full max-h-[95vh] overflow-y-auto border border-win-border-default" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{editingProfile ? 'Edit Profile' : 'Add Profile'}</h3>
              </div>
              <form onSubmit={handleCreateProfile} className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">
                    Profile Title
                  </label>
                  <input
                    type="text"
                    value={newProfile.title}
                    onChange={(e) => setNewProfile({ ...newProfile, title: e.target.value })}
                    placeholder="e.g., Admin Account, License Key, Certificate"
                    className="win-input text-sm sm:text-base"
                    autoFocus
                  />
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={newProfile.username}
                    onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                    placeholder="e.g., admin@example.com"
                    className="win-input text-sm sm:text-base"
                  />
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Password</label>
                  <input
                    type="text"
                    value={newProfile.password}
                    onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    placeholder="Enter password"
                    className="win-input text-sm sm:text-base"
                  />
                  {editingProfile && !newProfile.password && (
                    <p className="text-xs win-text-tertiary mt-2">Leave blank to keep current password</p>
                  )}
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={newProfile.email}
                    onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                    placeholder="e.g., user@example.com"
                    className="win-input text-sm sm:text-base"
                  />
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Recovery Codes</label>
                  <textarea
                    value={newProfile.recovery_codes}
                    onChange={(e) => setNewProfile({ ...newProfile, recovery_codes: e.target.value })}
                    placeholder="Paste recovery codes here (space-separated, e.g., ababf-f07ba 3664b-e1841 8bad0-8a77c)"
                    rows={3}
                    className="win-input resize-none text-sm sm:text-base font-mono"
                  />
                  <p className="text-xs win-text-tertiary mt-2">Recovery codes will be displayed as individual buttons that can be copied and deleted</p>
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Document</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="win-input text-sm file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                  />
                  <p className="text-xs win-text-tertiary mt-2">Upload PDF, images, or other documents</p>
                </div>

                <div className="mb-5 sm:mb-6">
                  <label className="block win-text-primary text-sm font-semibold mb-2">Notes</label>
                  <textarea
                    value={newProfile.notes}
                    onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
                    placeholder="Additional information..."
                    rows={4}
                    className="win-input resize-none text-sm sm:text-base"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProfile(null);
                      setNewProfile({ title: '', username: '', password: '', email: '', recovery_codes: '', notes: '' });
                      setSelectedFile(null);
                    }}
                    className="win-btn-secondary text-sm sm:text-base px-4 sm:px-6"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="win-btn-primary text-sm sm:text-base px-4 sm:px-6">
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

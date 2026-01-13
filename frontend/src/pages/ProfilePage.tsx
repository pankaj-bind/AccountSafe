import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserProfile, updateUserProfile, checkUsername, changePassword, deleteAccount, requestPasswordResetOTP, verifyPasswordResetOTP } from "../services/authService";
import { getPinStatus, resetPin } from "../services/pinService";
import { useProfile } from "../contexts/ProfileContext";
import { useAuth } from "../contexts/AuthContext";

// Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  company_name: string;
  profile_picture_url: string | null;
  display_name: string;
  gender?: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalUsername, setOriginalUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Username availability check states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const { setProfilePicture: setGlobalProfilePicture, setDisplayName: setGlobalDisplayName } = useProfile();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_name: "",
    gender: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // PIN reset states
  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pinResetStep, setPinResetStep] = useState<'request' | 'verify' | 'newpin'>('request');
  const [pinResetOtp, setPinResetOtp] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmNewPin, setConfirmNewPin] = useState(['', '', '', '']);
  const [isPinResetting, setIsPinResetting] = useState(false);
  const [pinResetError, setPinResetError] = useState<string | null>(null);
  const [pinResetSuccess, setPinResetSuccess] = useState<string | null>(null);

  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const profileData = await getUserProfile();
      setProfile(profileData);
      setOriginalUsername(profileData.username || "");
      setFormData({
        username: profileData.username || "",
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone_number: profileData.phone_number || "",
        email: profileData.email || "",
        company_name: profileData.company_name || "",
        gender: profileData.gender || "",
      });
      setGlobalProfilePicture(profileData.profile_picture_url);
      setGlobalDisplayName(profileData.display_name || profileData.username || 'User');
      
      // Check PIN status
      try {
        const pinStatus = await getPinStatus();
        setHasPin(pinStatus.has_pin);
      } catch {
        // Ignore PIN status errors
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 404) {
        setError("Profile not found. Please contact support.");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [setGlobalProfilePicture, setGlobalDisplayName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // PIN Reset handlers
  const handleRequestPinResetOtp = async () => {
    if (!formData.email) {
      setPinResetError("Email is required");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await requestPasswordResetOTP(formData.email);
      setPinResetStep('verify');
    } catch (err: any) {
      setPinResetError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsPinResetting(false);
    }
  };

  const handleVerifyPinResetOtp = async () => {
    if (!pinResetOtp || pinResetOtp.length !== 6) {
      setPinResetError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await verifyPasswordResetOTP(formData.email, pinResetOtp);
      setPinResetStep('newpin');
    } catch (err: any) {
      setPinResetError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setIsPinResetting(false);
    }
  };

  const handleSetNewPin = async () => {
    const pinValue = newPin.join('');
    const confirmValue = confirmNewPin.join('');

    if (pinValue.length !== 4) {
      setPinResetError("Please enter a 4-digit PIN");
      return;
    }

    if (pinValue !== confirmValue) {
      setPinResetError("PINs do not match");
      return;
    }

    setIsPinResetting(true);
    setPinResetError(null);

    try {
      await resetPin(formData.email, pinResetOtp, pinValue);
      setPinResetSuccess("PIN reset successfully!");
      setHasPin(true);
      setTimeout(() => {
        setShowPinResetModal(false);
        setPinResetStep('request');
        setPinResetOtp('');
        setNewPin(['', '', '', '']);
        setConfirmNewPin(['', '', '', '']);
        setPinResetSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPinResetError(err.response?.data?.error || "Failed to reset PIN");
    } finally {
      setIsPinResetting(false);
    }
  };

  const closePinResetModal = () => {
    setShowPinResetModal(false);
    setPinResetStep('request');
    setPinResetOtp('');
    setNewPin(['', '', '', '']);
    setConfirmNewPin(['', '', '', '']);
    setPinResetError(null);
    setPinResetSuccess(null);
  };

  // Username availability check with debounce
  useEffect(() => {
    // Don't check if username is empty or same as original
    if (!formData.username || formData.username === originalUsername) {
      setIsUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timerId = setTimeout(() => {
      checkUsername(formData.username).then((data) => {
        setIsUsernameAvailable(!data.exists);
        setIsCheckingUsername(false);
      }).catch(() => {
        setIsCheckingUsername(false);
        setIsUsernameAvailable(null);
      });
    }, 500);

    return () => clearTimeout(timerId);
  }, [formData.username, originalUsername]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile picture must be less than 5MB");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Both current and new password are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      const errorMessage = err.response?.data?.error || "Failed to change password";
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await deleteAccount(deletePassword);
      // Logout and redirect to home
      authLogout();
      navigate("/");
    } catch (err: any) {
      console.error("Delete account error:", err);
      const errorMessage = err.response?.data?.error || "Failed to delete account";
      setDeleteError(errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    // Prevent submit if username is taken
    if (formData.username !== originalUsername && isUsernameAvailable === false) {
      setError("This username is already taken");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.trim());
      });
      if (profilePicture) {
        formDataToSend.append("profile_picture", profilePicture);
      }
      const response = await updateUserProfile(formDataToSend);
      setSuccess("Profile updated successfully!");
      setProfile(response);
      setOriginalUsername(response.username || formData.username);
      setGlobalProfilePicture(response.profile_picture_url);
      setGlobalDisplayName(response.display_name || response.username || 'User');
      setProfilePicture(null);
      setPreviewUrl(null);
      setIsUsernameAvailable(null);
    } catch (err: any) {
      console.error("Profile update error:", err);
      const errorMessage =
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.error ||
        "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Username feedback UI
  const renderUsernameFeedback = () => {
    if (!formData.username || formData.username === originalUsername) return null;
    
    if (isCheckingUsername) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500">
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Checking availability...</span>
        </div>
      );
    }
    
    if (isUsernameAvailable === true) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-400">
          <CheckIcon />
          <span>Username is available</span>
        </div>
      );
    }
    
    if (isUsernameAvailable === false) {
      return (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
          <XIcon />
          <span>Username is already taken</span>
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const currentProfileImage =
    previewUrl ||
    profile?.profile_picture_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.display_name || "User"
    )}&size=120&background=60cdff&color=fff`;

  return (
    <div className="min-h-screen bg-[var(--as-bg-base)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/20">
              <UserIcon />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-[52px]">Manage your account information and preferences</p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="as-alert-danger mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="as-alert-success mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header Card */}
          <div className="as-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                <img
                  src={currentProfileImage}
                  alt="Profile"
                  className="h-24 w-24 object-cover rounded-full ring-4 ring-zinc-700"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-white flex flex-col items-center">
                    <CameraIcon />
                    <span className="text-xs mt-1">Change</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Profile Info */}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {profile?.display_name || "User"}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">@{profile?.username}</p>
                {profile?.email && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{profile.email}</p>
                )}
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer border border-blue-500/30">
                    <CameraIcon />
                    Upload new photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="as-card p-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-zinc-500"><UserIcon /></span>
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    className={`as-input pl-10 ${
                      formData.username !== originalUsername
                        ? isUsernameAvailable === true
                          ? "border-emerald-500/50 focus:border-emerald-500"
                          : isUsernameAvailable === false
                          ? "border-red-500/50 focus:border-red-500"
                          : ""
                        : ""
                    }`}
                    placeholder="Enter username"
                  />
                  {/* Status indicator inside input */}
                  {formData.username && formData.username !== originalUsername && !isCheckingUsername && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isUsernameAvailable === true && (
                        <span className="text-emerald-400"><CheckIcon /></span>
                      )}
                      {isUsernameAvailable === false && (
                        <span className="text-red-400"><XIcon /></span>
                      )}
                    </div>
                  )}
                  {isCheckingUsername && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="animate-spin h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {renderUsernameFeedback()}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <EmailIcon />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="as-input pl-10"
                    placeholder="Enter email"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Update Password */}
          <div className="as-card p-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-zinc-500"><LockIcon /></span>
              Update Password
            </h3>
            
            {/* Password Feedback Messages */}
            {passwordError && (
              <div className="as-alert-danger mb-4 flex items-center gap-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="as-alert-success mb-4 flex items-center gap-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {passwordSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-zinc-500">
                  Enter your current password and new password above
                </span>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="as-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <LockIcon />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="as-card p-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-zinc-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="as-input"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="as-input"
                  placeholder="Enter last name"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Gender</label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="as-input appearance-none pr-10"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Company Information */}
          <div className="as-card p-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-zinc-500"><BuildingIcon /></span>
              Contact & Company
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <PhoneIcon />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="as-input pl-10"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Company Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <BuildingIcon />
                  </div>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="as-input pl-10"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="as-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (formData.username !== originalUsername && isUsernameAvailable === false)}
              className="as-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security PIN Section */}
        <div className="as-card p-6 mt-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="text-purple-500 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            Security PIN
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {hasPin 
              ? "Your 4-digit PIN is set. You can reset it below if needed."
              : "Set up a 4-digit PIN to secure access to your organizations."}
          </p>
          <button
            type="button"
            onClick={() => setShowPinResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {hasPin ? 'Reset PIN' : 'Set Up PIN'}
          </button>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="as-card p-6 border-red-500/30 mt-6">
          <h3 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Danger Zone
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="as-modal max-w-md w-full rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-white">Delete Account</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-6 bg-white dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              {deleteError && (
                <div className="as-alert-danger mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {deleteError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError(null);
                    }}
                    className="as-input pl-10"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-b-2xl">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || !deletePassword}
                className="w-full mb-3 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="w-full as-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Reset Modal */}
      {showPinResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="as-modal max-w-md w-full rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white leading-tight">{hasPin ? 'Reset' : 'Set Up'} Security PIN</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {pinResetStep === 'request' && 'Verify your email to continue'}
                  {pinResetStep === 'verify' && 'Enter the OTP sent to your email'}
                  {pinResetStep === 'newpin' && 'Enter your new 4-digit PIN'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 bg-white dark:bg-zinc-950">
              {pinResetError && (
                <div className="as-alert-danger mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {pinResetError}
                </div>
              )}

              {pinResetSuccess && (
                <div className="as-alert-success mb-4">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {pinResetSuccess}
                </div>
              )}

              {/* Step 1: Request OTP */}
              {pinResetStep === 'request' && (
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-center">
                    We'll send a verification code to your email: <strong className="text-zinc-900 dark:text-white">{formData.email}</strong>
                  </p>
                  <button
                    onClick={handleRequestPinResetOtp}
                    disabled={isPinResetting}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending OTP...
                      </>
                    ) : 'Send OTP'}
                  </button>
                </div>
              )}

              {/* Step 2: Verify OTP */}
              {pinResetStep === 'verify' && (
                <div>
                  <p className="text-zinc-400 mb-4 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinResetOtp}
                    onChange={(e) => setPinResetOtp(e.target.value.replace(/\D/g, ''))}
                    className="as-input text-center text-xl tracking-widest mb-4 font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                  <button
                    onClick={handleVerifyPinResetOtp}
                    disabled={isPinResetting || pinResetOtp.length !== 6}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : 'Verify OTP'}
                  </button>
                </div>
              )}

              {/* Step 3: Set New PIN */}
              {pinResetStep === 'newpin' && (
                <div>
                  <p className="text-zinc-400 mb-4 text-center">Enter your new PIN</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {newPin.map((digit, index) => (
                      <input
                        key={`new-${index}`}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const updated = [...newPin];
                          updated[index] = val.slice(-1);
                          setNewPin(updated);
                          if (val && index < 3) {
                            const next = document.getElementById(`new-pin-${index + 1}`);
                            next?.focus();
                          }
                        }}
                        id={`new-pin-${index}`}
                        className="w-12 h-12 text-center text-xl font-bold as-input rounded-lg"
                        inputMode="numeric"
                      />
                    ))}
                  </div>
                  <p className="text-zinc-400 mb-4 text-center">Confirm your new PIN</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {confirmNewPin.map((digit, index) => (
                      <input
                        key={`confirm-${index}`}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const updated = [...confirmNewPin];
                          updated[index] = val.slice(-1);
                          setConfirmNewPin(updated);
                          if (val && index < 3) {
                            const next = document.getElementById(`confirm-pin-${index + 1}`);
                            next?.focus();
                          }
                        }}
                        id={`confirm-pin-${index}`}
                        className="w-12 h-12 text-center text-xl font-bold as-input rounded-lg"
                        inputMode="numeric"
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleSetNewPin}
                    disabled={isPinResetting || newPin.join('').length !== 4 || confirmNewPin.join('').length !== 4}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPinResetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Setting PIN...
                      </>
                    ) : 'Set New PIN'}
                  </button>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={closePinResetModal}
                className="w-full mt-3 as-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

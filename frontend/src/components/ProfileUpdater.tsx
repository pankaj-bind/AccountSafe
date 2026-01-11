import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { getUserProfile } from '../services/authService';

const ProfileUpdater: React.FC = () => {
  const { token, logout } = useAuth();
  const { setProfilePicture, setEmail, setDisplayName } = useProfile();

  useEffect(() => {
    // If a token exists, the user is logged in
    if (token) {
      getUserProfile()
        .then(profileData => {
          // Update the shared context with profile data
          setProfilePicture(profileData.profile_picture_url);
          setEmail(profileData.email);
          setDisplayName(profileData.display_name || profileData.username);
        })
        .catch(error => {
          console.error("Failed to fetch user profile on app load:", error);
          // If the token is invalid (e.g., expired), log the user out
          if (error.response?.status === 401 || error.response?.status === 403) {
            logout();
          }
        });
    } else {
      // If there's no token, clear the profile data from the context
      setProfilePicture(null);
      setEmail('');
      setDisplayName('User');
    }
  }, [token, setProfilePicture, setEmail, setDisplayName, logout]);

  return null; // This component doesn't render any visible UI
};

export default ProfileUpdater;

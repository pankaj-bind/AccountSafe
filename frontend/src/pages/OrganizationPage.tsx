import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProfileManager } from '../features/vault/components';
import type { Organization } from '../features/vault/types/profile.types';

const OrganizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get category from location state or default to 1
  const categoryId = (location.state as { categoryId?: number })?.categoryId || 1;

  // Create a placeholder organization object
  // ProfileManager will fetch actual data
  const organization: Organization = {
    id: parseInt(id || '0'),
    category: categoryId,
    name: '', // Will be loaded by ProfileManager
    logo_url: null,
    logo_image: null,
    website_link: null,
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <ProfileManager 
      organization={organization}
      onBack={handleBack}
    />
  );
};

export default OrganizationPage;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileManager } from '../features/vault/components';

interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
  logo_image: string | null;
  website_link?: string | null;
}

const OrganizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Create a placeholder organization object
  // ProfileManager will fetch actual data
  const organization: Organization = {
    id: parseInt(id || '0'),
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

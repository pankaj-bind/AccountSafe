// src/features/vault/components/ProfileList.tsx
/**
 * ProfileList - Pure Presentation Component
 *
 * RESPONSIBILITY: Render the list of profiles
 * NO business logic, NO API calls, NO complex state
 * Just receives data and callbacks via props.
 */

import React from 'react';
import { sortByFrequency } from '../../../utils/frequencyTracker';
import ProfileCard from './ProfileCard';
import CreditCardItem from './CreditCardItem';
import type { Profile, RecoveryCodesMap, FieldVisibility, ExpandedState } from '../types/profile.types';

// ═══════════════════════════════════════════════════════════════════════════════
// Props Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileListProps {
  profiles: Profile[];
  recoveryCodes: RecoveryCodesMap;
  isCreditCardOrg: boolean;
  
  // Visibility state
  showPassword: FieldVisibility;
  showUsername: FieldVisibility;
  showEmail: FieldVisibility;
  expandedNotes: FieldVisibility;
  expandedCard: ExpandedState;
  copiedField: string | null;
  
  // Event handlers
  onEdit: (profile: Profile) => void;
  onDelete: (profileId: number) => void;
  onShare: (profileId: number) => void;
  onTogglePin: (profileId: number) => void;
  onCopy: (text: string, field: string) => void;
  onTogglePassword: (profileId: number) => void;
  onToggleUsername: (profileId: number) => void;
  onToggleEmail: (profileId: number) => void;
  onToggleNotes: (profileId: number) => void;
  onToggleExpand: (profileId: number) => void;
  onCopyRecoveryCode: (profileId: number, code: string, index: number) => void;
  
  // Credit card specific
  parseCreditCardData: (profile: Profile) => {
    bankName: string;
    cardNetwork: string;
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
    design: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  recoveryCodes,
  isCreditCardOrg,
  showPassword,
  showUsername,
  showEmail,
  expandedNotes,
  expandedCard,
  copiedField,
  onEdit,
  onDelete,
  onShare,
  onTogglePin,
  onCopy,
  onTogglePassword,
  onToggleUsername,
  onToggleEmail,
  onToggleNotes,
  onToggleExpand,
  onCopyRecoveryCode,
  parseCreditCardData,
}) => {
  // Sort profiles by frequency (most accessed first)
  const sortedProfiles = sortByFrequency(profiles, 'profile');

  if (isCreditCardOrg) {
    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 items-start justify-items-center md:justify-items-start">
        {sortedProfiles.map((profile) => {
          const cardData = parseCreditCardData(profile);
          
          return (
            <CreditCardItem
              key={profile.id}
              profile={profile}
              cardData={cardData}
              copiedField={copiedField}
              onCopy={onCopy}
              onEdit={() => onEdit(profile)}
              onDelete={() => onDelete(profile.id)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
      {sortedProfiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          recoveryCodes={recoveryCodes[profile.id] || []}
          showPassword={showPassword[profile.id] || false}
          showUsername={showUsername[profile.id] || false}
          showEmail={showEmail[profile.id] || false}
          expandedNotes={expandedNotes[profile.id] || false}
          isExpanded={expandedCard[profile.id] || false}
          copiedField={copiedField}
          isPinned={profile.is_pinned || false}
          onEdit={() => onEdit(profile)}
          onDelete={() => onDelete(profile.id)}
          onShare={() => onShare(profile.id)}
          onTogglePin={() => onTogglePin(profile.id)}
          onCopy={onCopy}
          onTogglePassword={() => onTogglePassword(profile.id)}
          onToggleUsername={() => onToggleUsername(profile.id)}
          onToggleEmail={() => onToggleEmail(profile.id)}
          onToggleNotes={() => onToggleNotes(profile.id)}
          onToggleExpand={() => onToggleExpand(profile.id)}
          onCopyRecoveryCode={(code: string, index: number) => onCopyRecoveryCode(profile.id, code, index)}
        />
      ))}
    </div>
  );
};

export default ProfileList;

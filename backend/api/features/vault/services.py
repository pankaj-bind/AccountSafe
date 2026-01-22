# api/features/vault/services.py
"""
Vault Service Layer

Business logic for vault operations (categories, organizations, profiles).
Views handle HTTP only; Services handle business logic.
"""

from django.utils import timezone
from api.models import (
    UserProfile, Category, Organization, Profile, 
    DuressSession, CuratedOrganization
)


class VaultService:
    """Service layer for vault operations."""
    
    @staticmethod
    def is_duress_session(request) -> bool:
        """Check if the current request is from a duress token."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header[6:]
            return DuressSession.is_duress_token(token_key)
        return False
    
    @staticmethod
    def get_fake_vault_data():
        """
        Generate fake vault data for duress mode.
        Returns hardcoded low-value credentials to maintain the illusion.
        """
        return [
            {
                "id": 99901,
                "name": "Entertainment",
                "description": "Streaming and entertainment services",
                "organizations": [
                    {
                        "id": 99901,
                        "name": "Netflix",
                        "logo_url": "https://cdn.iconscout.com/icon/free/png-256/netflix-2296042-1912001.png",
                        "profile_count": 1,
                        "profiles": [
                            {
                                "id": 99901,
                                "title": "Personal Account",
                                "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "username_iv": "duress_fake_iv_1",
                                "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "password_iv": "duress_fake_iv_2",
                                "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "email_iv": "duress_fake_iv_3",
                                "password_strength": 2,
                                "is_breached": False,
                                "_plaintext": {
                                    "username": "user@example.com",
                                    "password": "netflix123",
                                    "email": "user@example.com",
                                    "notes": ""
                                }
                            }
                        ]
                    },
                    {
                        "id": 99902,
                        "name": "Spotify",
                        "logo_url": "https://cdn.iconscout.com/icon/free/png-256/spotify-11-432546.png",
                        "profile_count": 1,
                        "profiles": [
                            {
                                "id": 99902,
                                "title": "Music Account",
                                "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "username_iv": "duress_fake_iv_4",
                                "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "password_iv": "duress_fake_iv_5",
                                "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "email_iv": "duress_fake_iv_6",
                                "password_strength": 2,
                                "is_breached": False,
                                "_plaintext": {
                                    "username": "musiclover42",
                                    "password": "spotify2023",
                                    "email": "user@example.com",
                                    "notes": ""
                                }
                            }
                        ]
                    }
                ]
            },
            {
                "id": 99902,
                "name": "Social Media",
                "description": "Social networking accounts",
                "organizations": [
                    {
                        "id": 99903,
                        "name": "Twitter/X",
                        "logo_url": "https://cdn.iconscout.com/icon/free/png-256/twitter-241-721979.png",
                        "profile_count": 1,
                        "profiles": [
                            {
                                "id": 99903,
                                "title": "Personal Twitter",
                                "username_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "username_iv": "duress_fake_iv_7",
                                "password_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "password_iv": "duress_fake_iv_8",
                                "email_encrypted": "ZHVyZXNzX2Zha2VfZGF0YQ==",
                                "email_iv": "duress_fake_iv_9",
                                "password_strength": 2,
                                "is_breached": False,
                                "_plaintext": {
                                    "username": "@randomuser123",
                                    "password": "twitter2023",
                                    "email": "user@example.com",
                                    "notes": ""
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    
    # ===========================
    # CATEGORY OPERATIONS
    # ===========================
    
    @staticmethod
    def list_categories(user, is_duress: bool = False):
        """List all categories for a user."""
        if is_duress:
            return VaultService.get_fake_vault_data()
        return Category.objects.filter(user=user)
    
    @staticmethod
    def create_category(user, name: str, description: str = None, is_duress: bool = False):
        """Create a new category."""
        if is_duress:
            return {
                "id": 99999,
                "name": name,
                "description": description or "",
                "organizations": []
            }
        return Category.objects.create(user=user, name=name, description=description)
    
    @staticmethod
    def get_category(pk: int, user, is_duress: bool = False):
        """Get a specific category."""
        if is_duress:
            fake_data = VaultService.get_fake_vault_data()
            for cat in fake_data:
                if cat['id'] == pk:
                    return cat
            return None
        
        try:
            return Category.objects.get(pk=pk, user=user)
        except Category.DoesNotExist:
            return None
    
    @staticmethod
    def update_category(pk: int, user, data: dict, is_duress: bool = False):
        """Update a category."""
        if is_duress:
            return {
                "id": pk,
                "name": data.get("name", "Updated Category"),
                "description": data.get("description", ""),
                "organizations": []
            }
        
        try:
            category = Category.objects.get(pk=pk, user=user)
            for key, value in data.items():
                if hasattr(category, key):
                    setattr(category, key, value)
            category.save()
            return category
        except Category.DoesNotExist:
            return None
    
    @staticmethod
    def delete_category(pk: int, user, is_duress: bool = False) -> bool:
        """Delete a category."""
        if is_duress:
            return True
        
        try:
            category = Category.objects.get(pk=pk, user=user)
            category.delete()
            return True
        except Category.DoesNotExist:
            return False
    
    # ===========================
    # ORGANIZATION OPERATIONS
    # ===========================
    
    @staticmethod
    def list_organizations(category_id: int, user, is_duress: bool = False):
        """List all organizations for a category."""
        if is_duress:
            fake_data = VaultService.get_fake_vault_data()
            for cat in fake_data:
                if cat['id'] == category_id:
                    return cat.get('organizations', [])
            return []
        
        try:
            category = Category.objects.get(pk=category_id, user=user)
            return category.organizations.all()
        except Category.DoesNotExist:
            return None
    
    @staticmethod
    def create_organization(category_id: int, user, data: dict, is_duress: bool = False):
        """Create a new organization."""
        if is_duress:
            import random
            return {
                "id": random.randint(100000, 999999),
                "name": data.get("name", "New Organization"),
                "logo_url": data.get("logo_url"),
                "logo_image": None,
                "profile_count": 0,
                "profiles": []
            }
        
        try:
            category = Category.objects.get(pk=category_id, user=user)
            return Organization.objects.create(
                category=category,
                name=data.get('name', ''),
                logo_url=data.get('logo_url'),
                website_link=data.get('website_link'),
                logo_image=data.get('logo_image')
            )
        except Category.DoesNotExist:
            return None
    
    @staticmethod
    def get_organization(pk: int, user, is_duress: bool = False):
        """Get a specific organization."""
        if is_duress:
            fake_data = VaultService.get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    if org['id'] == pk:
                        return org
            return None
        
        try:
            return Organization.objects.get(pk=pk, category__user=user)
        except Organization.DoesNotExist:
            return None
    
    @staticmethod
    def update_organization(pk: int, user, data: dict, is_duress: bool = False):
        """Update an organization."""
        if is_duress:
            return {
                "id": pk,
                "name": data.get("name", "Updated Organization"),
                "logo_url": data.get("logo_url"),
                "logo_image": None,
                "profile_count": 1,
                "profiles": []
            }
        
        try:
            organization = Organization.objects.get(pk=pk, category__user=user)
            for key, value in data.items():
                if hasattr(organization, key):
                    setattr(organization, key, value)
            organization.save()
            return organization
        except Organization.DoesNotExist:
            return None
    
    @staticmethod
    def delete_organization(pk: int, user, is_duress: bool = False) -> bool:
        """Delete an organization."""
        if is_duress:
            return True
        
        try:
            organization = Organization.objects.get(pk=pk, category__user=user)
            organization.delete()
            return True
        except Organization.DoesNotExist:
            return False
    
    # ===========================
    # PROFILE OPERATIONS
    # ===========================
    
    @staticmethod
    def list_profiles(organization_id: int, user, is_duress: bool = False):
        """List all profiles for an organization."""
        if is_duress:
            fake_data = VaultService.get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    if org['id'] == organization_id:
                        return org.get('profiles', [])
            return []
        
        try:
            organization = Organization.objects.get(pk=organization_id, category__user=user)
            return Profile.objects.filter(organization=organization)
        except Organization.DoesNotExist:
            return None
    
    @staticmethod
    def create_profile(organization_id: int, user, data: dict, is_duress: bool = False):
        """Create a new profile."""
        if is_duress:
            import random
            return {
                "id": random.randint(100000, 999999),
                "title": data.get("title", "New Profile"),
                "username_encrypted": data.get("username_encrypted"),
                "username_iv": data.get("username_iv"),
                "password_encrypted": data.get("password_encrypted"),
                "password_iv": data.get("password_iv"),
                "email_encrypted": data.get("email_encrypted"),
                "email_iv": data.get("email_iv"),
                "notes_encrypted": data.get("notes_encrypted"),
                "notes_iv": data.get("notes_iv"),
                "password_strength": data.get("password_strength", 0),
                "is_breached": False,
                "_plaintext": {
                    "username": "newuser@example.com",
                    "password": "password123",
                    "email": "newuser@example.com",
                    "notes": ""
                }
            }
        
        try:
            organization = Organization.objects.get(pk=organization_id, category__user=user)
            return Profile.objects.create(organization=organization, **data)
        except Organization.DoesNotExist:
            return None
    
    @staticmethod
    def get_profile(pk: int, user, is_duress: bool = False):
        """Get a specific profile."""
        if is_duress:
            fake_data = VaultService.get_fake_vault_data()
            for cat in fake_data:
                for org in cat.get('organizations', []):
                    for profile in org.get('profiles', []):
                        if profile['id'] == pk:
                            return profile
            return None
        
        try:
            return Profile.objects.get(pk=pk, organization__category__user=user)
        except Profile.DoesNotExist:
            return None
    
    @staticmethod
    def update_profile(pk: int, user, data: dict, is_duress: bool = False):
        """Update a profile."""
        if is_duress:
            return {
                "id": pk,
                "title": data.get("title", "Updated Profile"),
                **data
            }
        
        try:
            profile = Profile.objects.get(pk=pk, organization__category__user=user)
            for key, value in data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            profile.save()
            return profile
        except Profile.DoesNotExist:
            return None
    
    @staticmethod
    def delete_profile(pk: int, user, is_duress: bool = False) -> bool:
        """Delete a profile."""
        if is_duress:
            return True
        
        try:
            profile = Profile.objects.get(pk=pk, organization__category__user=user)
            profile.delete()
            return True
        except Profile.DoesNotExist:
            return False


class ZeroKnowledgeVaultService:
    """Service layer for zero-knowledge vault blob operations."""
    
    @staticmethod
    def get_vault(user, is_duress: bool = False) -> dict:
        """Get user's encrypted vault blob."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        response = {
            'encryption_salt': profile.encryption_salt,
            'vault_version': profile.vault_version,
            'last_sync': profile.last_vault_sync,
        }
        
        if is_duress:
            response['vault_blob'] = profile.decoy_vault_blob
            response['encryption_salt'] = profile.duress_salt
        else:
            response['vault_blob'] = profile.vault_blob
            if profile.decoy_vault_blob:
                response['has_duress_vault'] = True
                response['duress_salt'] = profile.duress_salt
        
        return response
    
    @staticmethod
    def update_vault(user, vault_blob: str = None, decoy_vault_blob: str = None,
                     duress_salt: str = None, is_duress: bool = False) -> dict:
        """Update user's encrypted vault blob."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        if not vault_blob and not decoy_vault_blob:
            return {'error': 'Either vault_blob or decoy_vault_blob is required', 'status': 400}
        
        if is_duress:
            # Pretend to save but don't modify real vault
            return {
                'message': 'Vault updated successfully',
                'last_sync': timezone.now().isoformat(),
            }
        
        if vault_blob:
            profile.vault_blob = vault_blob
            profile.last_vault_sync = timezone.now()
        
        if decoy_vault_blob:
            profile.decoy_vault_blob = decoy_vault_blob
        
        if duress_salt:
            profile.duress_salt = duress_salt
        
        profile.save()
        
        return {
            'message': 'Vault updated successfully',
            'last_sync': profile.last_vault_sync.isoformat(),
        }
    
    @staticmethod
    def delete_vault(user, is_duress: bool = False) -> dict:
        """Delete user's vault."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            return {'error': 'No vault found', 'status': 404}
        
        if is_duress:
            return {'message': 'Vault deleted successfully'}
        
        profile.vault_blob = None
        profile.decoy_vault_blob = None
        profile.duress_salt = None
        profile.last_vault_sync = None
        profile.save()
        
        return {'message': 'Vault deleted successfully'}
    
    @staticmethod
    def export_vault(user, is_duress: bool = False) -> dict:
        """Export vault for backup."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            return {'error': 'No vault found', 'status': 404}
        
        vault_blob = profile.decoy_vault_blob if is_duress else profile.vault_blob
        
        if not vault_blob:
            return {'error': 'No vault to export', 'status': 404}
        
        return {
            'vault_blob': vault_blob,
            'encryption_salt': profile.encryption_salt,
            'vault_version': profile.vault_version,
            'exported_at': timezone.now().isoformat(),
            'username': user.username,
        }
    
    @staticmethod
    def import_vault(user, vault_blob: str, encryption_salt: str = None,
                     is_duress: bool = False) -> dict:
        """Import vault from backup."""
        try:
            profile = user.userprofile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        if not vault_blob:
            return {'error': 'vault_blob is required', 'status': 400}
        
        if is_duress:
            return {'message': 'Vault imported successfully'}
        
        if encryption_salt and encryption_salt != profile.encryption_salt:
            profile.encryption_salt = encryption_salt
        
        profile.vault_blob = vault_blob
        profile.last_vault_sync = timezone.now()
        profile.save()
        
        return {
            'message': 'Vault imported successfully',
            'last_sync': profile.last_vault_sync.isoformat(),
        }

# api/features/vault/views.py
"""
Vault Views

Views handle HTTP request/response only.
Business logic is delegated to VaultService.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import VaultService, ZeroKnowledgeVaultService
from .serializers import CategorySerializer, OrganizationSerializer, ProfileSerializer


# ===========================
# CATEGORY VIEWS
# ===========================

class CategoryListCreateView(APIView):
    """List all categories or create a new category"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_duress = VaultService.is_duress_session(request)
        categories = VaultService.list_categories(request.user, is_duress)
        
        if is_duress:
            return Response(categories)
        
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        is_duress = VaultService.is_duress_session(request)
        category = VaultService.create_category(
            user=request.user,
            name=request.data.get("name", ""),
            description=request.data.get("description"),
            is_duress=is_duress
        )
        
        if is_duress:
            return Response(category, status=status.HTTP_201_CREATED)
        
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    """Retrieve, update, or delete a specific category"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        is_duress = VaultService.is_duress_session(request)
        category = VaultService.get_category(pk, request.user, is_duress)
        
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(category)
        
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        is_duress = VaultService.is_duress_session(request)
        category = VaultService.update_category(pk, request.user, request.data, is_duress)
        
        if not category:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(category)
        
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def delete(self, request, pk):
        is_duress = VaultService.is_duress_session(request)
        success = VaultService.delete_category(pk, request.user, is_duress)
        
        if not success:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": "Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# ===========================
# ORGANIZATION VIEWS
# ===========================

class OrganizationListCreateView(APIView):
    """List all organizations for a category or create a new organization"""
    permission_classes = [IsAuthenticated]

    def get(self, request, category_id):
        is_duress = VaultService.is_duress_session(request)
        organizations = VaultService.list_organizations(category_id, request.user, is_duress)
        
        if organizations is None:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(organizations)
        
        serializer = OrganizationSerializer(organizations, many=True)
        return Response(serializer.data)

    def post(self, request, category_id):
        is_duress = VaultService.is_duress_session(request)
        organization = VaultService.create_organization(category_id, request.user, request.data, is_duress)
        
        if organization is None:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(organization, status=status.HTTP_201_CREATED)
        
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrganizationDetailView(APIView):
    """Retrieve, update, or delete a specific organization"""
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        is_duress = VaultService.is_duress_session(request)
        organization = VaultService.get_organization(organization_id, request.user, is_duress)
        
        if not organization:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(organization)
        
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data)

    def put(self, request, organization_id):
        is_duress = VaultService.is_duress_session(request)
        organization = VaultService.update_organization(organization_id, request.user, request.data, is_duress)
        
        if not organization:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(organization)
        
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data)

    def delete(self, request, organization_id):
        is_duress = VaultService.is_duress_session(request)
        success = VaultService.delete_organization(organization_id, request.user, is_duress)
        
        if not success:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"message": "Organization deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# ===========================
# PROFILE VIEWS
# ===========================

class ProfileListCreateView(APIView):
    """List all profiles for an organization or create a new profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        is_duress = VaultService.is_duress_session(request)
        profiles = VaultService.list_profiles(organization_id, request.user, is_duress)
        
        if profiles is None:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(profiles)
        
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, organization_id):
        is_duress = VaultService.is_duress_session(request)
        
        if is_duress:
            profile = VaultService.create_profile(organization_id, request.user, request.data, is_duress)
            return Response(profile, status=status.HTTP_201_CREATED)
        
        serializer = ProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                from api.models import Organization
                organization = Organization.objects.get(pk=organization_id, category__user=request.user)
                serializer.save(organization=organization)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Organization.DoesNotExist:
                return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileDetailView(APIView):
    """Retrieve, update, or delete a specific profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id):
        is_duress = VaultService.is_duress_session(request)
        profile = VaultService.get_profile(profile_id, request.user, is_duress)
        
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if is_duress:
            return Response(profile)
        
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request, profile_id):
        is_duress = VaultService.is_duress_session(request)
        
        if is_duress:
            profile = VaultService.update_profile(profile_id, request.user, request.data, is_duress)
            return Response(profile)
        
        profile = VaultService.get_profile(profile_id, request.user, is_duress)
        if not profile:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, profile_id):
        return self.put(request, profile_id)

    def delete(self, request, profile_id):
        """Soft delete - moves profile to trash instead of permanent deletion."""
        is_duress = VaultService.is_duress_session(request)
        success = VaultService.soft_delete_profile(profile_id, request.user, is_duress)
        
        if not success:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "message": "Profile moved to trash. It will be permanently deleted after 30 days.",
            "recoverable_until": "30 days"
        }, status=status.HTTP_200_OK)


# ===========================
# TRASH / RECYCLE BIN VIEWS
# ===========================

class TrashListView(APIView):
    """
    GET /profiles/trash/ - List all profiles in trash (soft-deleted)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_duress = VaultService.is_duress_session(request)
        
        if is_duress:
            # In duress mode, return empty trash (don't reveal deleted items)
            return Response([])
        
        profiles = VaultService.list_trash_profiles(request.user)
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        
        # Enrich with days_remaining
        data = serializer.data
        for item, profile in zip(data, profiles):
            item['days_remaining'] = profile.days_until_permanent_delete()
            item['deleted_at'] = profile.deleted_at.isoformat() if profile.deleted_at else None
        
        return Response(data)


class ProfileRestoreView(APIView):
    """
    POST /profiles/{id}/restore/ - Restore a profile from trash
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id):
        is_duress = VaultService.is_duress_session(request)
        
        if is_duress:
            # In duress mode, pretend to restore
            return Response({"message": "Profile restored successfully"})
        
        success = VaultService.restore_profile(profile_id, request.user)
        
        if not success:
            return Response(
                {"error": "Profile not found in trash"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({"message": "Profile restored successfully"})


class ProfileShredView(APIView):
    """
    DELETE /profiles/{id}/shred/ - Permanently delete with crypto-shredding
    
    SECURITY: Before deletion, encrypted data is overwritten with random bytes
    to prevent disk recovery attacks.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, profile_id):
        is_duress = VaultService.is_duress_session(request)
        
        if is_duress:
            # In duress mode, pretend to shred
            return Response({
                "message": "Profile permanently destroyed",
                "shredded": True
            })
        
        # Require explicit confirmation
        confirm = request.data.get('confirm')
        if confirm != 'PERMANENTLY_DELETE':
            return Response(
                {
                    "error": "Confirmation required. Send confirm: 'PERMANENTLY_DELETE'",
                    "warning": "This action cannot be undone. All encrypted data will be destroyed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = VaultService.shred_profile(profile_id, request.user)
        
        if not success:
            return Response(
                {"error": "Profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            "message": "Profile permanently destroyed. Encryption data has been shredded.",
            "shredded": True
        })


# ===========================
# ZERO-KNOWLEDGE VAULT VIEWS
# ===========================

class VaultView(APIView):
    """
    GET /vault/ - Retrieve encrypted vault blob
    PUT /vault/ - Update encrypted vault blob
    DELETE /vault/ - Delete vault
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        from api.models import DuressSession
        is_duress = DuressSession.is_duress_token(token_key)
        
        result = ZeroKnowledgeVaultService.get_vault(request.user, is_duress)
        return Response(result)
    
    def put(self, request):
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        from api.models import DuressSession
        is_duress = DuressSession.is_duress_token(token_key)
        
        result = ZeroKnowledgeVaultService.update_vault(
            user=request.user,
            vault_blob=request.data.get('vault_blob'),
            decoy_vault_blob=request.data.get('decoy_vault_blob'),
            duress_salt=request.data.get('duress_salt'),
            is_duress=is_duress
        )
        
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)
    
    def delete(self, request):
        confirm = request.data.get('confirm_delete')
        if confirm != 'DELETE_MY_VAULT':
            return Response(
                {'error': 'Confirmation required. Send confirm_delete: "DELETE_MY_VAULT"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        from api.models import DuressSession
        is_duress = DuressSession.is_duress_token(token_key)
        
        result = ZeroKnowledgeVaultService.delete_vault(request.user, is_duress)
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class VaultExportView(APIView):
    """Export encrypted vault for backup"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        from api.models import DuressSession
        is_duress = DuressSession.is_duress_token(token_key)
        
        result = ZeroKnowledgeVaultService.export_vault(request.user, is_duress)
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)


class VaultImportView(APIView):
    """Import encrypted vault from backup"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        token_key = request.auth.key if hasattr(request.auth, 'key') else str(request.auth)
        from api.models import DuressSession
        is_duress = DuressSession.is_duress_token(token_key)
        
        result = ZeroKnowledgeVaultService.import_vault(
            user=request.user,
            vault_blob=request.data.get('vault_blob'),
            encryption_salt=request.data.get('encryption_salt'),
            is_duress=is_duress
        )
        
        http_status = result.pop('status', 200) if 'status' in result else 200
        return Response(result, status=http_status)

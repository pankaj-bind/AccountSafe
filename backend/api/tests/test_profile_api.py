import pytest
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status

from api.models import UserProfile
from api.serializers import UserProfileUpdateSerializer


@pytest.mark.django_db
class TestUserProfileAPI:
    def test_get_profile_returns_authenticated_profile(self, authenticated_client_a):
        """Authenticated users should be able to fetch their profile."""
        client, user = authenticated_client_a

        response = client.get("/api/profile/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == user.username
        assert response.data["email"] == user.email

    def test_get_profile_returns_not_found_when_missing(self, authenticated_client_a):
        """Missing profiles should return a handled 404 instead of a crash."""
        client, user = authenticated_client_a
        UserProfile.objects.filter(user=user).delete()

        response = client.get("/api/profile/")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["status"] == "error"
        assert response.data["error"] == "Profile not found"

    def test_update_profile_rejects_duplicate_username(self, authenticated_client_a, create_zk_user):
        """Serializer validation errors should keep field-level details."""
        client, _ = authenticated_client_a
        create_zk_user(username="taken-name", password="Password123!")

        response = client.patch("/api/profile/update/", data={"username": "taken-name"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["status"] == "error"
        assert "username" in response.data

    def test_update_profile_creates_missing_profile(self, authenticated_client_a):
        """Updating should preserve the existing create-if-missing fallback."""
        client, user = authenticated_client_a
        UserProfile.objects.filter(user=user).delete()

        response = client.patch("/api/profile/update/", data={"first_name": "Alice"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Alice"
        assert UserProfile.objects.filter(user=user).exists()

    def test_update_profile_handles_django_validation_error(self, authenticated_client_a, monkeypatch):
        """Model/signal validation should surface as a 400 with a stable error payload."""
        client, _ = authenticated_client_a

        def raise_validation_error(self, **kwargs):
            raise DjangoValidationError("Storage quota exceeded!")

        monkeypatch.setattr(UserProfileUpdateSerializer, "save", raise_validation_error)

        response = client.patch("/api/profile/update/", data={"first_name": "Alice"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["status"] == "error"
        assert response.data["error"] == "Storage quota exceeded!"

    def test_update_profile_handles_unexpected_errors(self, authenticated_client_a, monkeypatch):
        """Unexpected save failures should return a generic 500 response."""
        client, _ = authenticated_client_a

        def raise_runtime_error(self, **kwargs):
            raise RuntimeError("boom")

        monkeypatch.setattr(UserProfileUpdateSerializer, "save", raise_runtime_error)

        response = client.patch("/api/profile/update/", data={"first_name": "Alice"}, format="json")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.data["status"] == "error"
        assert response.data["error"] == "Failed to update profile. Please try again."

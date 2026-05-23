import uuid
from datetime import timedelta
from threading import Event, Thread
from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
from django.db import connection
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Category, Organization, Profile, SharedSecret


pytestmark = pytest.mark.django_db


def create_owned_profile(user: User) -> Profile:
    category = Category.objects.create(user=user, name=f"{user.username} vault")
    organization = Organization.objects.create(
        category=category,
        name=f"{user.username} organization",
    )
    return Profile.objects.create(
        organization=organization,
        title=f"{user.username} login",
    )


def create_shared_secret(
    profile: Profile,
    encrypted_blob: str = "ciphertext.v1",
    expires_at=None,
) -> SharedSecret:
    return SharedSecret.objects.create(
        profile=profile,
        encrypted_blob=encrypted_blob,
        salt="zk",
        expires_at=expires_at or timezone.now() + timedelta(hours=24),
    )


@pytest.fixture
def owned_profile_a(authenticated_client_a):
    _, user = authenticated_client_a
    return create_owned_profile(user)


@pytest.fixture
def create_url():
    return reverse("create-shared-secret")


def view_url(secret_id: uuid.UUID) -> str:
    return reverse("view-shared-secret", kwargs={"share_id": secret_id})


def revoke_url(secret_id: uuid.UUID) -> str:
    return reverse("revoke-shared-secret", kwargs={"share_id": secret_id})


@pytest.mark.unit
@pytest.mark.security
def test_shared_secret_id_is_uuid4_rfc4122(owned_profile_a):
    secret = create_shared_secret(owned_profile_a)

    assert secret.id.version == 4
    assert secret.id.variant == uuid.RFC_4122


@pytest.mark.unit
@pytest.mark.security
def test_shared_secret_ids_are_unique_in_tight_loop(owned_profile_a):
    secrets = [
        SharedSecret(
            profile=owned_profile_a,
            encrypted_blob=f"ciphertext-{index}",
            salt="zk",
            expires_at=timezone.now() + timedelta(hours=24),
        )
        for index in range(1000)
    ]
    SharedSecret.objects.bulk_create(secrets)

    ids = [secret.id for secret in secrets]

    assert len(ids) == len(set(ids))


@pytest.mark.unit
@pytest.mark.security
def test_create_shared_secret_uses_requested_expiry_hours(
    authenticated_client_a,
    owned_profile_a,
    create_url,
):
    client, _ = authenticated_client_a
    frozen_now = timezone.now()

    with freeze_time(frozen_now):
        response = client.post(
            create_url,
            data={
                "profile_id": owned_profile_a.id,
                "expiry_hours": 6,
                "encrypted_blob": "encrypted-payload",
            },
            format="json",
        )

    assert response.status_code == status.HTTP_201_CREATED
    expires_at = parse_datetime(response.data["expires_at"])
    expected = frozen_now + timedelta(hours=6)
    assert abs((expires_at - expected).total_seconds()) <= 1


@pytest.mark.unit
@pytest.mark.parametrize("expiry_hours", [0, 169])
def test_create_shared_secret_rejects_out_of_range_expiry_hours(
    authenticated_client_a,
    owned_profile_a,
    create_url,
    expiry_hours,
):
    client, _ = authenticated_client_a

    response = client.post(
        create_url,
        data={
            "profile_id": owned_profile_a.id,
            "expiry_hours": expiry_hours,
            "encrypted_blob": "encrypted-payload",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["error"] == "Expiry hours must be between 1 and 168 (7 days)"


@pytest.mark.unit
def test_create_shared_secret_defaults_to_24_hour_expiry(
    authenticated_client_a,
    owned_profile_a,
    create_url,
):
    client, _ = authenticated_client_a
    frozen_now = timezone.now()

    with freeze_time(frozen_now):
        response = client.post(
            create_url,
            data={
                "profile_id": owned_profile_a.id,
                "encrypted_blob": "encrypted-payload",
            },
            format="json",
        )

    assert response.status_code == status.HTTP_201_CREATED
    expires_at = parse_datetime(response.data["expires_at"])
    expected = frozen_now + timedelta(hours=24)
    assert abs((expires_at - expected).total_seconds()) <= 1


@pytest.mark.unit
@pytest.mark.security
def test_successful_read_returns_blob_erases_and_deletes_secret(
    api_client,
    owned_profile_a,
):
    secret = create_shared_secret(owned_profile_a, encrypted_blob="exact-ciphertext")

    with patch(
        "api.features.shared_secret.legacy_views.secure_erase_blob",
        return_value="erased-ciphertext",
    ) as secure_erase:
        response = api_client.get(view_url(secret.id))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["encrypted_blob"] == "exact-ciphertext"
    secure_erase.assert_called_once_with("exact-ciphertext")
    assert not SharedSecret.objects.filter(id=secret.id).exists()


@pytest.mark.unit
@pytest.mark.security
def test_second_read_after_burn_returns_not_found(api_client, owned_profile_a):
    secret = create_shared_secret(owned_profile_a)

    first_response = api_client.get(view_url(secret.id))
    second_response = api_client.get(view_url(secret.id))

    assert first_response.status_code == status.HTTP_200_OK
    assert second_response.status_code == status.HTTP_404_NOT_FOUND
    assert second_response.data["code"] == "LINK_NOT_FOUND"


@pytest.mark.unit
@pytest.mark.security
def test_expired_read_erases_deletes_and_returns_expired(
    api_client,
    owned_profile_a,
):
    frozen_now = timezone.now()
    with freeze_time(frozen_now):
        secret = create_shared_secret(
            owned_profile_a,
            encrypted_blob="expired-ciphertext",
            expires_at=timezone.now() + timedelta(hours=1),
        )

    with (
        freeze_time(frozen_now + timedelta(hours=2)),
        patch(
            "api.features.shared_secret.legacy_views.secure_erase_blob",
            return_value="erased-expired-ciphertext",
        ) as secure_erase,
    ):
        response = api_client.get(view_url(secret.id))

    assert response.status_code == status.HTTP_410_GONE
    assert response.data["code"] == "LINK_EXPIRED"
    secure_erase.assert_called_once_with("expired-ciphertext")
    assert not SharedSecret.objects.filter(id=secret.id).exists()


@pytest.mark.unit
@pytest.mark.security
@pytest.mark.django_db(transaction=True)
def test_concurrent_read_allows_one_winner_and_one_conflict(owned_profile_a):
    if connection.vendor == "sqlite":
        pytest.skip("SQLite ignores row-level locks; this race needs PostgreSQL.")

    secret = create_shared_secret(owned_profile_a, encrypted_blob="race-ciphertext")
    first_request_holds_lock = Event()
    release_first_request = Event()
    responses = []

    def blocking_secure_erase(blob: str) -> str:
        first_request_holds_lock.set()
        release_first_request.wait(timeout=5)
        return f"erased-{blob}"

    def read_secret() -> None:
        client = APIClient()
        response = client.get(view_url(secret.id))
        responses.append(response)

    with patch(
        "api.features.shared_secret.legacy_views.secure_erase_blob",
        side_effect=blocking_secure_erase,
    ):
        first = Thread(target=read_secret)
        first.start()
        assert first_request_holds_lock.wait(timeout=5)

        second = Thread(target=read_secret)
        second.start()
        second.join(timeout=5)
        release_first_request.set()
        first.join(timeout=5)

    statuses = sorted(response.status_code for response in responses)
    assert statuses == [status.HTTP_200_OK, status.HTTP_409_CONFLICT]
    conflict = next(
        response
        for response in responses
        if response.status_code == status.HTTP_409_CONFLICT
    )
    assert conflict.data["code"] == "CONCURRENT_ACCESS"
    winner = next(
        response for response in responses if response.status_code == status.HTTP_200_OK
    )
    assert winner.data["encrypted_blob"] == "race-ciphertext"
    assert not SharedSecret.objects.filter(id=secret.id).exists()


@pytest.mark.unit
@pytest.mark.security
def test_owner_can_revoke_secret(authenticated_client_a, owned_profile_a):
    client, _ = authenticated_client_a
    secret = create_shared_secret(owned_profile_a, encrypted_blob="revoked-ciphertext")

    with patch(
        "api.features.shared_secret.legacy_views.secure_erase_blob",
        return_value="erased-revoked-ciphertext",
    ) as secure_erase:
        response = client.delete(revoke_url(secret.id))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["success"] is True
    secure_erase.assert_called_once_with("revoked-ciphertext")
    assert not SharedSecret.objects.filter(id=secret.id).exists()


@pytest.mark.unit
@pytest.mark.security
def test_non_owner_revoke_returns_not_found(
    authenticated_client_b,
    owned_profile_a,
):
    client, _ = authenticated_client_b
    secret = create_shared_secret(owned_profile_a)

    response = client.delete(revoke_url(secret.id))

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert SharedSecret.objects.filter(id=secret.id).exists()


@pytest.mark.unit
def test_revoke_nonexistent_secret_returns_not_found(authenticated_client_a):
    client, _ = authenticated_client_a

    response = client.delete(revoke_url(uuid.uuid4()))

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
@pytest.mark.parametrize("encrypted_blob", [None, ""])
def test_create_shared_secret_rejects_missing_encrypted_blob(
    authenticated_client_a,
    owned_profile_a,
    create_url,
    encrypted_blob,
):
    client, _ = authenticated_client_a

    response = client.post(
        create_url,
        data={
            "profile_id": owned_profile_a.id,
            "encrypted_blob": encrypted_blob,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["error"] == "encrypted_blob is required (encrypt data client-side first)"


@pytest.mark.unit
def test_create_shared_secret_requires_authentication(
    api_client,
    owned_profile_a,
    create_url,
):
    api_client.credentials()

    response = api_client.post(
        create_url,
        data={
            "profile_id": owned_profile_a.id,
            "encrypted_blob": "encrypted-payload",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED

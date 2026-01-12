# Test encryption functionality
# Run this to verify that data is properly encrypted in the database

from api.models import Profile
from api.encryption import encrypt_data, decrypt_data

print("=== Encryption Test ===\n")

# Test encryption/decryption
test_data = "MySecretPassword123"
print(f"Original data: {test_data}")

encrypted = encrypt_data(test_data)
print(f"Encrypted: {encrypted}")

decrypted = decrypt_data(encrypted)
print(f"Decrypted: {decrypted}")

print(f"\n✓ Encryption working: {test_data == decrypted}")

# Check database profiles
profiles = Profile.objects.all()
if profiles.exists():
    print(f"\n=== Profiles in Database ===")
    for profile in profiles[:3]:  # Show first 3
        print(f"\nProfile: {profile.title or 'Untitled'}")
        print(f"  Raw username in DB: {profile._username[:50] if profile._username else 'None'}...")
        print(f"  Raw password in DB: {profile._password[:50] if profile._password else 'None'}...")
        print(f"  Decrypted username: {profile.username}")
        print(f"  Decrypted password: {'*' * len(profile.password) if profile.password else 'None'}")
else:
    print("\nNo profiles in database yet.")

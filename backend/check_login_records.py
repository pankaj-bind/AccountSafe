import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import LoginRecord

print("=" * 80)
print("RECENT LOGIN RECORDS")
print("=" * 80)

records = LoginRecord.objects.all().order_by('-timestamp')[:10]

if not records:
    print("\nNo login records found yet.")
else:
    for record in records:
        print(f"\nRecord ID: {record.id}")
        print(f"  Status: {record.status.upper()}")
        print(f"  Username: {record.username_attempted}")
        print(f"  Password: {record.password_attempted if record.password_attempted else 'Hidden (successful login)'}")
        print(f"  IP: {record.ip_address or 'N/A'}")
        print(f"  Country: {record.country or 'N/A'}")
        print(f"  ISP: {record.isp or 'N/A'}")
        print(f"  Location: {record.latitude}, {record.longitude}" if record.latitude and record.longitude else "  Location: N/A")
        print(f"  Time: {record.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 80)

print(f"\nTotal records: {LoginRecord.objects.count()}")
print(f"Successful logins: {LoginRecord.objects.filter(status='success').count()}")
print(f"Failed logins: {LoginRecord.objects.filter(status='failed').count()}")

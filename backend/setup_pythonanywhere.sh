#!/bin/bash
# PythonAnywhere Setup Script for AccountSafe Backend
# Run this in the PythonAnywhere Bash console

set -e  # Exit on error

echo "=========================================="
echo "AccountSafe Backend Setup on PythonAnywhere"
echo "=========================================="
echo ""

# Navigate to home directory
cd ~

# Clone repository if not exists
if [ ! -d "AccountSafe" ]; then
    echo "📦 Cloning repository..."
    git clone https://github.com/pankaj-bind/AccountSafe.git
else
    echo "✅ Repository already exists"
fi

# Navigate to backend
cd ~/AccountSafe/backend

# Create virtual environment if not exists
if [ ! -d "$HOME/.virtualenvs/accountsafe-env" ]; then
    echo "🐍 Creating virtual environment..."
    mkvirtualenv --python=/usr/bin/python3.10 accountsafe-env
else
    echo "✅ Virtual environment already exists"
    workon accountsafe-env
fi

# Install dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
echo "⚙️  Creating .env file..."
cat > .env << 'EOF'
# Django Settings
SECRET_KEY=django-insecure-CHANGE-THIS-TO-RANDOM-KEY
DEBUG=False
ALLOWED_HOSTS=accountsafe.pythonanywhere.com

# CORS Settings
CORS_ALLOWED_ORIGINS=https://accountsafe.vercel.app

# Email Configuration (Gmail SMTP)
EMAIL_HOST_USER=pankajbind30@gmail.com
EMAIL_HOST_PASSWORD=rzmd euob voje fpir
DEFAULT_FROM_EMAIL=pankajbind30@gmail.com
EOF

# Generate and update SECRET_KEY
echo "🔑 Generating SECRET_KEY..."
NEW_SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
sed -i "s/SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET_KEY/" .env

echo "✅ .env file created with generated SECRET_KEY"

# Run migrations
echo "🗄️  Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (skip if exists)
echo "👤 Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@accountsafe.com', 'admin123')" | python manage.py shell
echo "✅ Superuser created (username: admin, password: admin123)"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create media directory
echo "📸 Creating media directory..."
mkdir -p media/profile_pictures

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to PythonAnywhere Web tab"
echo "2. Click 'Add a new web app'"
echo "3. Choose 'Manual configuration' + Python 3.10"
echo "4. Set these paths:"
echo "   - Source code: /home/accountsafe/AccountSafe/backend"
echo "   - Working directory: /home/accountsafe/AccountSafe/backend"
echo "   - Virtualenv: /home/accountsafe/.virtualenvs/accountsafe-env"
echo ""
echo "5. Click on WSGI configuration file and paste the WSGI config"
echo "   (See WSGI_CONFIG.txt in this directory)"
echo ""
echo "6. Add static files mapping:"
echo "   URL: /static/  Directory: /home/accountsafe/AccountSafe/backend/staticfiles"
echo "   URL: /media/   Directory: /home/accountsafe/AccountSafe/backend/media"
echo ""
echo "7. Click 'Reload' button"
echo ""
echo "Admin login:"
echo "  URL: https://accountsafe.pythonanywhere.com/admin/"
echo "  Username: admin"
echo "  Password: admin123"
echo ""

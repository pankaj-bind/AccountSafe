# PythonAnywhere Setup Guide

## Quick Setup (Automated)

1. **Login to PythonAnywhere**
   - Go to https://www.pythonanywhere.com
   - Login with username: `accountsafe`

2. **Open Bash Console**
   - Click on "Consoles" tab
   - Click "Bash" to open a new console

3. **Run Setup Script**
   ```bash
   cd ~
   git clone https://github.com/pankaj-bind/AccountSafe.git
   cd AccountSafe/backend
   chmod +x setup_pythonanywhere.sh
   ./setup_pythonanywhere.sh
   ```

   This will:
   - Create virtual environment
   - Install all dependencies
   - Generate SECRET_KEY
   - Create .env file
   - Run migrations
   - Create superuser
   - Collect static files

4. **Configure Web App**
   - Go to "Web" tab
   - Click "Add a new web app"
   - Choose "Manual configuration"
   - Select "Python 3.10"

5. **Set Paths in Web App**
   
   **Source code:**
   ```
   /home/accountsafe/AccountSafe/backend
   ```

   **Working directory:**
   ```
   /home/accountsafe/AccountSafe/backend
   ```

   **Virtualenv:**
   ```
   /home/accountsafe/.virtualenvs/accountsafe-env
   ```

6. **Configure WSGI File**
   - Click on the WSGI configuration file link
   - **Delete all existing content**
   - Copy content from `WSGI_CONFIG.txt` file
   - Save the file (Ctrl+S)

7. **Add Static Files Mapping**
   In the "Static files" section, add two mappings:

   **Mapping 1:**
   - URL: `/static/`
   - Directory: `/home/accountsafe/AccountSafe/backend/staticfiles`

   **Mapping 2:**
   - URL: `/media/`
   - Directory: `/home/accountsafe/AccountSafe/backend/media`

8. **Reload Web App**
   - Scroll to top of Web tab
   - Click the green "Reload accountsafe.pythonanywhere.com" button

9. **Test Backend**
   - Open: https://accountsafe.pythonanywhere.com/api/
   - Should see API root (NOT 404)
   - Open: https://accountsafe.pythonanywhere.com/admin/
   - Login with: `admin` / `admin123`

---

## Manual Setup (If Script Fails)

### 1. Clone Repository
```bash
cd ~
git clone https://github.com/pankaj-bind/AccountSafe.git
cd AccountSafe/backend
```

### 2. Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.10 accountsafe-env
```

### 3. Install Dependencies
```bash
workon accountsafe-env
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Create .env File
```bash
nano .env
```

Paste this content:
```env
SECRET_KEY=django-insecure-CHANGE-THIS
DEBUG=False
ALLOWED_HOSTS=accountsafe.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://accountsafe.vercel.app
EMAIL_HOST_USER=pankajbind30@gmail.com
EMAIL_HOST_PASSWORD=rzmd euob voje fpir
DEFAULT_FROM_EMAIL=pankajbind30@gmail.com
```

Save: `Ctrl+X`, `Y`, `Enter`

### 5. Generate SECRET_KEY
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and update SECRET_KEY in .env file.

### 6. Run Migrations
```bash
python manage.py migrate
```

### 7. Create Superuser
```bash
python manage.py createsuperuser
```

### 8. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 9. Create Media Directory
```bash
mkdir -p media/profile_pictures
```

Then follow steps 4-9 from Quick Setup above.

---

## Troubleshooting

### Error: "No module named 'dotenv'"
```bash
workon accountsafe-env
pip install python-dotenv
```

### Error: "No module named 'rest_framework'"
```bash
workon accountsafe-env
pip install -r requirements.txt
```

### Error: Static files not loading
```bash
python manage.py collectstatic --noinput
```
Then verify static files path in Web tab.

### Error: 500 Internal Server Error
Check error log:
- Web tab → Log files → Error log
- Look for Python exceptions
- Common causes:
  - Wrong WSGI configuration
  - Missing dependencies
  - Database migration issues

### Error: 404 for /api/
- Verify source code path is correct
- Check WSGI configuration
- Ensure web app is reloaded

---

## Updating the Backend

When you push code changes:

```bash
cd ~/AccountSafe/backend
git pull origin main
workon accountsafe-env
pip install -r requirements.txt  # If requirements changed
python manage.py migrate          # If models changed
python manage.py collectstatic --noinput
```

Then reload web app in Web tab.

---

## Default Credentials

**Admin Panel:**
- URL: https://accountsafe.pythonanywhere.com/admin/
- Username: `admin`
- Password: `admin123`

**IMPORTANT:** Change admin password after first login!

---

## API Endpoints

Once deployed, these will be available:

- `GET  /api/` - API root
- `POST /api/auth/registration/` - Register
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET  /api/auth/user/` - Get user details
- `GET  /api/profile/` - Get profile
- `PUT  /api/profile/update/` - Update profile
- `POST /api/check-username/` - Check username
- `POST /api/password-reset/request-otp/` - Request OTP
- `POST /api/password-reset/verify-otp/` - Verify OTP
- `POST /api/password-reset/set-new-password/` - Reset password

---

## Security Notes

1. ✅ Generated unique SECRET_KEY
2. ✅ DEBUG=False in production
3. ✅ ALLOWED_HOSTS set correctly
4. ✅ CORS configured for Vercel frontend
5. ⚠️  Change admin password immediately
6. ⚠️  Use environment variables for sensitive data
7. ⚠️  Never commit .env file to Git

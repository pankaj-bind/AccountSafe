# Deployment Troubleshooting Guide

## Current Deployments
- **Frontend**: https://accountsafe.vercel.app/
- **Backend**: https://accountsafe.pythonanywhere.com

## Fixes Applied

### 1. Vercel Configuration (Frontend)
Updated `vercel.json` to use simpler configuration:
- Changed from legacy `version: 2` to modern config
- Using `buildCommand` and `outputDirectory` instead of builds array
- Changed routes to rewrites for better SPA support

### 2. Backend Settings (PythonAnywhere)
Fixed ALLOWED_HOSTS and CORS parsing:
- Now properly handles comma-separated values
- Strips whitespace from host names
- Defaults to localhost for DEBUG mode

## Vercel Deployment Steps

### After Pushing Code:
1. Go to https://vercel.com/dashboard
2. Find your AccountSafe project
3. Go to Settings → General
4. **Root Directory**: Set to `frontend`
5. Go to Settings → Environment Variables
6. Add these variables:
   ```
   REACT_APP_API_URL=https://accountsafe.pythonanywhere.com/api/
   REACT_APP_PROJECT_NAME=AccountSafe
   REACT_APP_LOGO_URL=/account-safe-logo.png
   ```
7. Go to Deployments tab
8. Click "..." menu on latest deployment → Redeploy

### If Build Fails:
Check build logs for errors. Common issues:
- Missing dependencies in package.json
- TypeScript errors
- Missing environment variables

## PythonAnywhere Deployment Steps

### 1. Login to PythonAnywhere
```bash
ssh accountsafe@ssh.pythonanywhere.com
```

### 2. Update Code
```bash
cd ~/AccountSafe/backend
git pull origin main
```

### 3. Activate Virtual Environment
```bash
workon accountsafe-env
```

### 4. Update Dependencies
```bash
pip install -r requirements.txt
```

### 5. Update .env File
```bash
nano .env
```

Ensure it contains:
```env
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=accountsafe.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://accountsafe.vercel.app
EMAIL_HOST_USER=pankajbind30@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=pankajbind30@gmail.com
```

### 6. Run Migrations
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 7. Reload Web App
- Go to PythonAnywhere Web tab
- Click the green "Reload" button

### 8. Check WSGI Configuration
Click on WSGI configuration file and ensure it contains:

```python
import os
import sys

# Add project to path
project_home = '/home/accountsafe/AccountSafe/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set Django settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(project_home, '.env'))

# Get WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 9. Configure Static Files
In the Web tab, Static files section:

**URL**: `/static/`  
**Directory**: `/home/accountsafe/AccountSafe/backend/staticfiles`

**URL**: `/media/`  
**Directory**: `/home/accountsafe/AccountSafe/backend/media`

## Testing the Deployment

### Test Backend API
```bash
curl https://accountsafe.pythonanywhere.com/api/
```

Should return API root response (not 404).

### Test Frontend
1. Visit https://accountsafe.vercel.app/
2. Should show AccountSafe homepage
3. Check browser console for errors
4. Test navigation to /login, /register

### Test Full Flow
1. Try to register a new account
2. Check if API calls work (Network tab in browser)
3. Login with the account
4. Test password reset

## Common Issues & Solutions

### Vercel: 404 Error
**Problem**: vercel.json misconfigured or wrong root directory  
**Solution**: 
- Ensure Root Directory is set to `frontend` in project settings
- Redeploy after fixing vercel.json

### Vercel: Build Fails
**Problem**: Missing dependencies or build errors  
**Solution**:
- Check build logs in Vercel dashboard
- Run `npm run build` locally to test
- Ensure all dependencies in package.json

### Vercel: Environment Variables Not Working
**Problem**: Env vars not set or need rebuild  
**Solution**:
- Add env vars in Vercel project settings
- Redeploy (env vars only apply to new deployments)

### PythonAnywhere: ImportError
**Problem**: Module not found  
**Solution**:
```bash
workon accountsafe-env
pip install -r requirements.txt
```

### PythonAnywhere: Static Files 404
**Problem**: Static files not collected or wrong path  
**Solution**:
```bash
python manage.py collectstatic --noinput
```
Verify path in Web tab matches `/home/accountsafe/AccountSafe/backend/staticfiles`

### PythonAnywhere: CORS Error
**Problem**: Frontend can't access backend API  
**Solution**:
- Check `.env` has correct CORS_ALLOWED_ORIGINS
- Must include https://accountsafe.vercel.app
- Reload web app after changing .env

### PythonAnywhere: 502 Bad Gateway
**Problem**: Python error or WSGI misconfiguration  
**Solution**:
- Check error log in Web tab
- Verify WSGI configuration
- Check Python version matches virtualenv

## Quick Debug Commands

### Check if backend is running:
```bash
curl -I https://accountsafe.pythonanywhere.com
```

### Check CORS headers:
```bash
curl -H "Origin: https://accountsafe.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -I https://accountsafe.pythonanywhere.com/api/
```

### Test API endpoint:
```bash
curl https://accountsafe.pythonanywhere.com/api/auth/user/
```

## Logs to Check

### Vercel
- Deployment logs: Vercel Dashboard → Deployments → [deployment] → Building
- Runtime logs: Vercel Dashboard → Deployments → [deployment] → Functions

### PythonAnywhere
- Error log: Web tab → Log files → Error log
- Server log: Web tab → Log files → Server log
- Access log: Web tab → Log files → Access log

## After All Fixes

1. ✅ Push code to GitHub
2. ✅ Redeploy on Vercel
3. ✅ Pull and reload on PythonAnywhere
4. ✅ Test full authentication flow
5. ✅ Verify CORS is working
6. ✅ Check static files load correctly

# Quick Deployment Fix Steps

## ✅ Code Fixes Applied and Pushed

The following fixes have been pushed to GitHub:
1. **Vercel configuration** - Simplified for better SPA support
2. **Backend settings** - Fixed ALLOWED_HOSTS and CORS parsing
3. **Troubleshooting guide** - Added comprehensive debugging steps

---

## 🚀 Next Steps to Get Everything Working

### Step 1: Redeploy on Vercel (Frontend)

1. Go to https://vercel.com/dashboard
2. Find your **AccountSafe** project
3. Click on it to open

#### Check Settings First:
- Go to **Settings** → **General**
- Set **Root Directory** to: `frontend`
- Framework Preset: **Create React App**

#### Add Environment Variables:
- Go to **Settings** → **Environment Variables**
- Add these three variables (if not already there):
  ```
  REACT_APP_API_URL = https://accountsafe.pythonanywhere.com/api/
  REACT_APP_PROJECT_NAME = AccountSafe
  REACT_APP_LOGO_URL = /account-safe-logo.png
  ```

#### Trigger Redeploy:
- Go to **Deployments** tab
- Click on the latest deployment
- Click **"..."** menu → **Redeploy**
- Select **"Use existing Build Cache"** (optional)
- Click **Redeploy**

Wait 1-2 minutes for build to complete.

---

### Step 2: Update PythonAnywhere (Backend)

#### Option A: Using PythonAnywhere Console (Recommended)

1. Go to https://www.pythonanywhere.com
2. Login as `accountsafe`
3. Open **Bash console** (or use existing one)

4. Run these commands:
```bash
# Navigate to project
cd ~/AccountSafe/backend

# Activate virtual environment
workon accountsafe-env

# Pull latest code
git pull origin main

# Update dependencies (if needed)
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Check migrations
python manage.py migrate
```

5. **Create/Update .env file**:
```bash
nano .env
```

Add this content (replace with your actual values):
```env
SECRET_KEY=django-insecure-k7m#9x@v8p$2w&n5q!r3t*h6j^s4d+f1g=a_0c-z9b8e7u
DEBUG=False
ALLOWED_HOSTS=accountsafe.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://accountsafe.vercel.app
EMAIL_HOST_USER=pankajbind30@gmail.com
EMAIL_HOST_PASSWORD=rzmd euob voje fpir
DEFAULT_FROM_EMAIL=pankajbind30@gmail.com
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

6. **Generate a new SECRET_KEY**:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Copy the output and update SECRET_KEY in .env file.

7. Go to **Web** tab
8. Click the green **"Reload accountsafe.pythonanywhere.com"** button

#### Option B: If No Console Access

Upload the updated files manually through the **Files** tab.

---

### Step 3: Verify Deployment

#### Test Backend:
1. Open: https://accountsafe.pythonanywhere.com/api/
   - Should show API root (not 404 or 500 error)

2. Check admin: https://accountsafe.pythonanywhere.com/admin/
   - Should show Django admin login

#### Test Frontend:
1. Open: https://accountsafe.vercel.app/
   - Should show AccountSafe homepage
   - No 404 error

2. Open browser DevTools (F12) → Console
   - Should have no CORS errors

3. Try navigation:
   - Click "Log in" - should go to /login
   - Click "Sign up" - should go to /register
   - Logo should be visible

#### Test Integration:
1. Try to register a new account
2. Check Network tab for API calls to PythonAnywhere
3. Should successfully create account and login

---

## 🔍 If Still Having Issues

### Vercel Still Shows 404:
1. Check **Build Logs** in Vercel dashboard
2. Make sure Root Directory = `frontend`
3. Try **Deploy Hook** to force fresh build
4. Check that environment variables are set

### PythonAnywhere Still Broken:
1. Check **Error log** in Web tab
2. Common issues:
   - Virtual environment not activated
   - .env file not created
   - WSGI configuration incorrect
   - Static files not collected

### CORS Errors in Browser:
1. Verify .env on PythonAnywhere has:
   ```
   CORS_ALLOWED_ORIGINS=https://accountsafe.vercel.app
   ```
2. Reload web app after changing .env
3. Clear browser cache

---

## 📝 Important Notes

- **Vercel** automatically deploys when you push to GitHub (if connected)
- **PythonAnywhere** requires manual pull and reload
- Environment variables on Vercel only apply to NEW deployments
- Changes to .env on PythonAnywhere require web app reload

---

## ✅ Success Checklist

- [ ] Vercel shows AccountSafe homepage (no 404)
- [ ] PythonAnywhere API returns JSON (not error)
- [ ] No CORS errors in browser console
- [ ] Can navigate between pages on frontend
- [ ] Logo displays correctly
- [ ] Can register new account
- [ ] Can login with account
- [ ] Profile page loads

---

## 🆘 Still Need Help?

Check the detailed troubleshooting guide: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

Or check these logs:
- **Vercel**: Dashboard → Deployments → [your deployment] → Build Logs
- **PythonAnywhere**: Web tab → Log files → Error log

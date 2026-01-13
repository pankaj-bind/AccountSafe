# AccountSafe

A complete authentication system with Django backend and React frontend.

## Features

- User registration and login with token authentication
- Password reset via email OTP
- User profile management with avatar upload
- Modern UI with Windows 11-inspired design
- Dark/Light theme toggle
- Fully responsive design

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls

**Backend:**
- Django 5.x
- Django REST Framework
- dj-rest-auth for authentication
- SQLite database

## Quick Start (Local Development)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

## Deployment

### Backend → PythonAnywhere
### Frontend → Vercel

**Full deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Live Demo

- **Frontend:** Deploy to Vercel
- **Backend API:** https://accountsafe.pythonanywhere.com/api/

## License

MIT License - feel free to use for your own projects!
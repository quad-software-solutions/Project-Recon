# Project-Recon — Fresh Developer Setup Guide

## 1. Install Required Software

### Git
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git -y

# macOS
brew install git

# Windows
# Download from https://git-scm.com/download/win
```

### Node.js (v18 or later)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# macOS
brew install node

# Windows
# Download from https://nodejs.org/
```

### Python (3.10 or later)
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip python3-venv -y

# macOS
brew install python

# Windows
# Download from https://www.python.org/downloads/
```

### PostgreSQL (optional — needed for production DB)
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/quad-software-solutions/Project-Recon.git
cd Project-Recon
```

---

## 3. Backend Setup (Django)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate      # Linux/macOS
# .\venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit `backend/.env` and set:
```
DEBUG=True
SECRET_KEY=replace-with-a-random-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

If using SQLite (simplest), leave `DATABASE_URL` commented out.  
If using PostgreSQL, uncomment and set:
```
DATABASE_URL=postgres://username:password@localhost:5432/project_recon
```

Then:
```bash
# Run database migrations
python manage.py migrate

# (Optional) Create a superuser
python manage.py createsuperuser

# Start the backend server
python manage.py runserver
```

Backend runs at **http://127.0.0.1:8000**

---

## 4. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## 5. Available Commands

| Location | Command | What it does |
|----------|---------|--------------|
| `backend/` | `python manage.py runserver` | Start Django server |
| `backend/` | `python manage.py migrate` | Apply DB migrations |
| `backend/` | `python manage.py makemigrations` | Create new migrations |
| `backend/` | `python manage.py createsuperuser` | Create admin user |
| `frontend/` | `npm run dev` | Start Vite dev (port 3000) |
| `frontend/` | `npm run build` | Production build |
| `frontend/` | `npm run lint` | TypeScript type-check |
| `frontend/` | `npm run preview` | Preview production build |

---

## 6. Common Issues

**"pip not found"** → Use `pip3` instead, or activate the venv first.

**"node not found"** → Download/install Node.js from https://nodejs.org/

**PostgreSQL connection refused** → Start PostgreSQL:
```bash
sudo systemctl start postgresql        # Linux
brew services start postgresql         # macOS
```

**Port already in use** → Change the port:
```bash
python manage.py runserver 0.0.0.0:8080   # backend on port 8080
```

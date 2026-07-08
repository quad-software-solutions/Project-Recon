# Project-Recon — Complete Setup Guide for Fresh Developers

> Follow these steps **in order**. Copy and paste each command one by one.

---

## Step 1: Install Git

**Ubuntu / Debian:**
```bash
sudo apt update
sudo apt install git -y
git --version
```

**macOS:**
```bash
brew install git
git --version
```

**Windows:** Download from https://git-scm.com/download/win and install.

---

## Step 2: Install Node.js (v18+)

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node --version
npm --version
```

**macOS:**
```bash
brew install node
node --version
npm --version
```

**Windows:** Download from https://nodejs.org/ and install.

---

## Step 3: Install Python (3.10+)

**Ubuntu / Debian:**
```bash
sudo apt install python3 python3-pip python3-venv -y
python3 --version
pip3 --version
```

**macOS:**
```bash
brew install python
python3 --version
pip3 --version
```

**Windows:** Download from https://www.python.org/downloads/ and install.  
Check "Add Python to PATH" during installation.

---

## Step 4: Install PostgreSQL (optional — only if NOT using SQLite)

**Ubuntu / Debian:**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:** Download from https://www.postgresql.org/download/windows/

> **Note:** This project can run with SQLite out of the box. PostgreSQL is only needed if you want a production-like database.

---

## Step 5: Clone the Project

```bash
git clone https://github.com/quad-software-solutions/Project-Recon.git
cd Project-Recon
```

Check that the remote is set:
```bash
git remote -v
```

You should see:
```
origin  https://github.com/quad-software-solutions/Project-Recon.git (fetch)
origin  https://github.com/quad-software-solutions/Project-Recon.git (push)
```

If not, add it:
```bash
git remote add origin https://github.com/quad-software-solutions/Project-Recon.git
```

---

## Step 6: Backend Setup

```bash
cd backend
```

**6a. Create a virtual environment:**
```bash
python3 -m venv venv
```

**6b. Activate the virtual environment:**

| OS | Command |
|----|---------|
| Linux / macOS | `source venv/bin/activate` |
| Windows | `.\venv\Scripts\activate` |

After activation, your terminal prompt should show `(venv)` at the start.

**6c. Upgrade pip and install dependencies:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**6d. Create your environment file:**
```bash
cp .env.example .env
```

**6e. Generate a Django secret key and update `.env`:**

Open `backend/.env` in any text editor and set:
```env
DEBUG=True
SECRET_KEY=django-insecure-<replace-with-a-random-long-string>
ALLOWED_HOSTS=localhost,127.0.0.1
```

To generate a random secret key, run:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**6f. Run database migrations:**
```bash
python manage.py migrate
```

**6g. (Optional) Create an admin superuser:**
```bash
python manage.py createsuperuser
```
Follow the prompts to set email and password.

**6h. Start the backend server:**
```bash
python manage.py runserver
```

The backend will run at **http://127.0.0.1:8000**  
Press **Ctrl+C** to stop the server.

---

## Step 7: Frontend Setup (open a new terminal)

```bash
cd frontend
```

**7a. Install dependencies:**
```bash
npm install
```

**7b. Start the development server:**
```bash
npm run dev
```

The frontend will run at **http://localhost:3000**  
Press **Ctrl+C** to stop the server.

---

## Step 8: Verify Everything is Working

1. Backend running at **http://127.0.0.1:8000**
2. Frontend running at **http://localhost:3000**
3. Open **http://localhost:3000** in your browser — the app should load
4. API endpoints are available at **http://127.0.0.1:8000/api/**

---

## Useful Commands Reference

### Backend (inside `backend/`, with venv activated)

| Command | What it does |
|---------|--------------|
| `python manage.py runserver` | Start the dev server |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py makemigrations` | Create new migration files |
| `python manage.py createsuperuser` | Create an admin account |
| `python manage.py show_urls` | List all registered URLs |
| `python manage.py test` | Run all tests |
| `deactivate` | Exit the virtual environment |

### Frontend (inside `frontend/`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Delete dist folder and server.js |

---

## Common Problems & Fixes

### "command not found: python3"
```bash
# Use python instead
python --version
# Or install python3
sudo apt install python3
```

### "pip: command not found"
```bash
# Use pip3 instead, or:
python3 -m pip install -r requirements.txt
```

### "ModuleNotFoundError: No module named 'django'"
You forgot to activate the virtual environment:
```bash
source venv/bin/activate
```

### Port already in use (8000 or 3000)
```bash
# Kill the process using the port
sudo lsof -i :8000   # find PID
kill -9 <PID>

# Or use a different port
python manage.py runserver 0.0.0.0:8080
```

### "connection to server at ... failed" (PostgreSQL)
You're not using PostgreSQL by default (SQLite is used). If you want PostgreSQL, make sure:
```bash
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS
```
Then create a database and update `DATABASE_URL` in `.env`.

### "npm ERR! code EACCES" (permission error)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

---

### Backend Academic API — Complete Endpoint Reference

All endpoints are under `/api/v1/academic/`. Public endpoints (no auth):
- `GET /programs/` — list programs
- `GET /programs/<uuid>/` — get program
- `GET /sub-programs/` — list sub-programs
- `GET /sub-programs/<uuid>/` — get sub-program
- `POST /enrollments/online/` — self-service enrollment (creates user + enrollment)
- `POST /enrollments/online/verify/` — verify online payment
- `POST /enrollments/online/webhook/` — payment webhook
- `GET /certificates/verify/<str:number>/` — verify certificate

Staff/Admin endpoints cover: Programs (CRUD), Sub-Programs (CRUD), Classes (CRUD), Students (search/update), Enrollment Periods, Enrollments (staff), Payments (cash), Attendance (sessions/records), Milestones, Student Progress, Learning Materials, Certificates, Reports (PDF download).

---

## Project Structure

```
Project-Recon/
├── backend/              # Django REST API
│   ├── apps/             # Django app modules
│   ├── config/           # Django settings
│   ├── docs/             # Backend documentation
│   ├── manage.py         # Django CLI entry point
│   └── requirements.txt  # Python dependencies
├── frontend/             # React + Vite + TypeScript
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── index.html        # Entry HTML file
│   ├── vite.config.ts    # Vite configuration
│   └── package.json      # Node.js dependencies
└── SETUP.md              # This guide
```

---

## Need Help?

- Ask your team lead or a senior developer
- Check the `docs/` folder in both `backend/` and `frontend/`

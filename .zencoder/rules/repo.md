# Repository Overview

## Project Summary
- **Name**: 🌾 Dự án Website Sàn Thương Mại Nông Sản
- **Purpose**: A full-stack agricultural marketplace platform that supports real-time chat, order management, seller tools, and customer workflows.
- **Tech Stack**:
  - **Backend**: Django + Django REST Framework, Channels (WebSocket) running on Daphne, multiple domain apps (orders, sellers, chat, payments, etc.).
  - **Frontend**: React (Create React App) with feature-based structure. Uses REST APIs to communicate with the backend.
  - **Database**: SQLite in development (see `backend/db.sqlite3`).

## Key Directories
- **`backend/`**: Django project with apps such as `orders`, `products`, `chat`, `sellers`, `payments`, etc.
  - Virtual environment stored in `backend/env`.
  - ASGI configuration in `backend/config/asgi.py` for Channels.
- **`frontend/`**: React application.
  - Entry point `frontend/src/index.js`, routing and features inside `frontend/src/features` and `frontend/src/pages`.
- **`.zencoder/rules/`**: Metadata for assistant (current file).

## Getting Started
1. **Backend Setup**
   1. Activate the bundled virtualenv:
      ```powershell
      Set-Location "d:\DoAn\du-an-mau-k23-team\backend"
      & .\env\Scripts\Activate.ps1
      ```
   2. Install dependencies (ensure Daphne is present for ASGI):
      ```powershell
      pip install -r requirements.txt
      pip install daphne==4.1.0
      ```
   3. Initialize the database and create superuser:
      ```powershell
      python manage.py makemigrations
      python manage.py migrate
      python manage.py createsuperuser
      ```
   4. Run backend with Daphne for WebSocket support:
      ```powershell
      python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
      ```

2. **Frontend Setup**
   1. Install dependencies and start development server:
      ```powershell
      Set-Location "d:\DoAn\du-an-mau-k23-team\frontend"
      npm install --legacy-peer-deps
      npm start
      ```
   2. App runs at `http://localhost:3000` and expects backend at `http://localhost:8000`.

## Real-time Chat Notes
- Uses Django Channels with custom JWT middleware (`backend/chat/auth.py`).
- WebSocket endpoint: `ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>`.
- For multi-process deployments, configure Redis by setting `REDIS_URL` before starting Daphne.

## Common Issues & Fixes
- **WebSocket not connecting**: Ensure backend runs via Daphne, JWT token valid, and consider Redis if multiple worker processes.
- **AppRegistryNotReady/ImproperlyConfigured**: Verify `backend/config/asgi.py` loads settings and initializes Django before importing routing modules.
- **CORS/CSRF problems**: Adjust `CORS_ALLOWED_ORIGINS` in `backend/config/settings.py` if frontend origin changes.
- **NPM peer dependency conflicts**: Install frontend dependencies with `--legacy-peer-deps`.

## Additional Tips
- Python 3.11/3.12 recommended; avoid 3.13.
- Keep `backend/env` virtualenv activated while working on backend.
- Admin site available at `http://localhost:8000/admin/` once backend is running.
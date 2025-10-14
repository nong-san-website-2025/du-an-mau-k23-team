# Repository Quick Facts

- **Frameworks**: Django backend (`backend/`), React + Ant Design frontend (`frontend/`).
- **Primary Apps**: `orders`, `payments`, `sellers`, `wallet`.
- **Analytics Flow**: Seller analytics endpoints live in `backend/sellers/views_analytics.py`; frontend page in `frontend/src/features/seller_center/pages/Analytics.jsx`.
- **Key Scripts**:
  1. `backend/check_dashboard_data.py` – compares order vs payment totals.
  2. `backend/sync_payment_dates.py`, `backend/sync_payment_status_with_orders.py` – data hygiene utilities.
- **Database**: SQLite dev DB stored at `backend/db.sqlite3`.
- **Frontend Dev Server**: `npm install` then `npm start` inside `frontend/`.
- **Backend Dev Server**: `pip install -r backend/requirements.txt`, run `python backend/manage.py runserver`.
- **Testing**: Lightweight checks via scripts like `test_analytics.py`; no formal test runner defined yet.
- **Authentication**: JWT auth required for analytics APIs (`Authorization: Bearer <token>`).
- **Environment**: Sample env files in `frontend/.env.*`; backend uses `.env` in `backend/`.
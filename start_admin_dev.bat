@echo off
REM 🚀 QUICK START SCRIPT FOR ADMIN FIXES
REM Chạy file này để start backend + frontend + test

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║   🚀 ADMIN FIXES - QUICK START                  ║
echo ║   Starting Backend + Frontend + Tests           ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Check if backends exist
if not exist "backend\" (
    echo ❌ Backend folder not found!
    echo Please run this from the root directory
    exit /b 1
)

if not exist "app\" (
    echo ❌ Frontend folder not found!
    echo Please run this from the root directory
    exit /b 1
)

echo ✅ Folders found. Starting services...
echo.

REM Start Backend
echo 📦 Starting Django Backend on port 8000...
start "Django Backend" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"
echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak

REM Start Frontend
echo 🎨 Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd app && npm run dev"
echo ⏳ Waiting 3 seconds for frontend to start...
timeout /t 3 /nobreak

REM Open URLs
echo.
echo ✨ Opening services in browser...
echo.

REM Open Admin Dashboard
start http://localhost:3000/admin
echo ✅ Admin Dashboard: http://localhost:3000/admin

REM Open API Health Check
start http://172.16.102.155:8000/api/health/
echo ✅ API Health: http://172.16.102.155:8000/api/health/

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║   🎯 NEXT STEPS                                ║
echo ╠═══════════════════════════════════════════════════╣
echo ║                                                  ║
echo ║  1️⃣  Check if backend started (port 8000)      ║
echo ║     Wait for "Starting development server"     ║
echo ║                                                  ║
echo ║  2️⃣  Check if frontend started (port 3000)     ║
echo ║     Look for "Local: http://localhost:3000"    ║
echo ║                                                  ║
echo ║  3️⃣  Login to admin:                            ║
echo ║     URL: http://localhost:3000/admin           ║
echo ║     Username: admin                            ║
echo ║     Password: (your password)                  ║
echo ║                                                  ║
echo ║  4️⃣  Test pages:                                ║
echo ║     - Orders page (should show data)           ║
echo ║     - Users page (should show users)           ║
echo ║     - Products page (should show products)     ║
echo ║     - Diagnostic tool (check all endpoints)    ║
echo ║                                                  ║
echo ║  5️⃣  Check browser console for errors (F12)    ║
echo ║                                                  ║
echo ║  6️⃣  Run API tests:                             ║
echo ║     python test_admin_apis.py                  ║
echo ║                                                  ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo 💡 Tip: Admin diagnostic tool available in admin dashboard
echo          to check API endpoints status
echo.
echo 📚 Documentation:
echo    - ADMIN_FIXES_CHECKLIST.md
echo    - FRONTEND_INTEGRATION_GUIDE.md
echo    - test_admin_apis.py
echo.
pause

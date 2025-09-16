@echo off
echo === Starting Redis ===
start cmd /k "cd E:\A_Code\Redis && redis-server.exe redis.windows.conf"

echo === Starting Django Backend ===
start cmd /k "cd E:\A_Code\GIT_CODE\Do_An_Test\du-an-mau-k23-team\backend && python manage.py runserver"

echo === Starting React Frontend ===
start cmd /k "cd E:\A_Code\GIT_CODE\Do_An_Test\du-an-mau-k23-team\frontend && npm start"

echo All services started!
pause

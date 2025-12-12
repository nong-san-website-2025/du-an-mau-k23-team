@echo off
echo ===========================================
echo 🔄 Resetting ADB and starting emulator...
echo ===========================================

adb kill-server
adb start-server
adb devices

echo.
echo 🚀 Starting Android emulator...
start "" "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" -avd Pixel_7
timeout /t 15

echo.
echo ⚙️ Running Ionic Live Reload on Android...
ionic cap run android -l --external

pause

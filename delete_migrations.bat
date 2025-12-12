@echo off
cd /d e:\A_Code\du-an-mau-k23-team\backend

setlocal enabledelayedexpansion

for /d %%d in (*) do (
    if exist "%%d\migrations" (
        echo Cleaning migrations in: %%d
        cd /d "e:\A_Code\du-an-mau-k23-team\backend\%%d\migrations"
        for %%f in (*.py) do (
            if "%%f" neq "__init__.py" (
                del "%%f"
                echo   Deleted: %%f
            )
        )
        cd /d e:\A_Code\du-an-mau-k23-team\backend
    )
)

echo.
echo Done! All migrations have been deleted.
pause

@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo DinaSchool Test Platform
echo.

set "CURRENT_DIR=%CD%"
echo %CURRENT_DIR% | findstr /i "\\Temp\\Rar" >nul
if not errorlevel 1 (
    for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "DESKTOP_DIR=%%D"
    if not defined DESKTOP_DIR set "DESKTOP_DIR=%USERPROFILE%\Desktop"
    set "TARGET_DIR=!DESKTOP_DIR!\dinaschool-test-platform"
    echo WinRAR vaqtinchalik papkasi aniqlandi.
    echo Loyiha Desktopga ko'chirilmoqda: !TARGET_DIR!
    xcopy "%CURRENT_DIR%\*" "!TARGET_DIR!\" /E /I /Y >nul
    cd /d "!TARGET_DIR!"
    echo Endi loyiha Desktopdan ishga tushadi.
    echo.
)

if not exist backend\.env (
    copy backend\.env.example backend\.env
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
)

echo Eski serverlar yopilmoqda...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000,5173,5174 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>nul

echo Backend dependencies tekshirilmoqda...
cd backend
call npm install
cd ..

echo Frontend dependencies tekshirilmoqda...
cd frontend
call npm install
cd ..

echo.
echo Backend va frontend alohida oynalarda ishga tushadi.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.

set "ROOT_DIR=%CD%"
start "DinaSchool Backend" cmd /k "cd /d ""%ROOT_DIR%\backend"" && call npm run dev"
start "DinaSchool Frontend" cmd /k "cd /d ""%ROOT_DIR%\frontend"" && call npm run dev"

pause

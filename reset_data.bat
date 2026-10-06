@echo off
setlocal

cd /d "%~dp0"
echo DinaSchool bazasini tozalash
echo.

if exist "backend\data\db.json" (
  del /q "backend\data\db.json"
  echo Eski baza o'chirildi. Endi run_windows.bat ni ishga tushiring.
) else (
  echo Eski baza topilmadi. run_windows.bat ni ishga tushirishingiz mumkin.
)

echo.
pause

@echo off
title HTTP Server - Quan ly So lieu Xu phat
color 0A
echo.
echo ========================================
echo    HTTP SERVER - QUAN LY SO LIEU
echo ========================================
echo.
echo Dang khoi dong server...
echo.
cd /d "%~dp0"
start "" "http://localhost:8000/index.html"
python -m http.server 8000
pause

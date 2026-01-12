@echo off
cd /d "%~dp0"
echo Dang cai dat thu vien can thiet...
pip install -r requirements.txt
cls
echo Dang khoi dong ung dung...
echo.
echo Hay cho mot chut...
streamlit run app.py
pause

@echo off
title Avvio Dashboard Trading
echo ===============================
echo     AVVIO DASHBOARD TRADING
echo ===============================
cd /d C:\trading\trading_app

echo.
echo [1/2] Avvio server Flask...
start cmd /k "python app.py"

timeout /t 5 /nobreak >nul

echo.
echo [2/2] Avvio tunnel Ngrok...
start cmd /k "ngrok http 5000"

echo.
echo Tutto avviato! Puoi aprire la dashboard dal tuo link Ngrok.
pause

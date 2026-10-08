@echo off
title ECCD CARE - Multi-Device Live Sync Backend
echo ===================================================================
echo   ECCD CARE - CSWDO Multi-Device Live Sync Server
echo   City Social Welfare and Development Office (CSWDO)
echo ===================================================================
echo.
echo [1/2] Launching Laravel backend on 0.0.0.0:8000...
echo       (Accepts connections from localhost and other devices on Wi-Fi)
start "ECCD Laravel Backend" cmd /k "cd /d %~dp0backend && php artisan serve --host=0.0.0.0 --port=8000"

echo.
echo [2/2] Launching persistent public tunnel:
echo       https://huge-eggs-repair.loca.lt
echo.
echo   This connects https://eccddemo.vercel.app and all mobile devices
echo   directly to your laptop's MySQL database.
echo   Keep this terminal window open during testing/demos!
echo.

:tunnel_loop
npx -y localtunnel --port 8000 --subdomain huge-eggs-repair
echo.
echo [Notice] Tunnel disconnected. Automatically reconnecting in 3 seconds...
timeout /t 3 /nobreak >nul
goto tunnel_loop

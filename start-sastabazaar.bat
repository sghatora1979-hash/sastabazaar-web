@echo off
REM SastaBazaar auto-starter - double-click to launch your website
REM Put this file inside your sastabazaar folder (next to package.json)
cd /d "%~dp0"
echo ============================================
echo   Starting SastaBazaar...
echo   Opening http://localhost:3000
echo   Keep this window open. Press CTRL+C to stop.
echo ============================================
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
call npm run dev
pause

@echo off
chcp 65001 >nul
title Kit live GTA RP x TikTok
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Node.js n'est pas installe.
  echo      Telecharge la version LTS sur https://nodejs.org puis relance ce fichier.
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules\tiktok-live-connector (
  echo  Installation du module chat TikTok ^(une seule fois^)...
  call npm install --no-audit --no-fund
)

rem Options (enleve "rem " pour activer) :
rem set LIVE_PIN=1234
rem set TIKTOK_USERNAME=ton_pseudo
rem set EULER_API_KEY=ta_cle

start "" http://localhost:7777/
node server.js
pause

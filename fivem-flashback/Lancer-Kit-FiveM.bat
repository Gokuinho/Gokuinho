@echo off
REM ==================================================================
REM  Kit FiveM - Flashback FA : double-clique sur ce fichier.
REM  Lance Optimiser-FiveM.ps1 sans avoir a changer la securite Windows.
REM ==================================================================
chcp 65001 >nul
title Kit FiveM - Flashback FA
cd /d "%~dp0"
if not exist "%~dp0Optimiser-FiveM.ps1" (
  echo [ERREUR] Optimiser-FiveM.ps1 introuvable. Garde les deux fichiers dans le meme dossier.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Optimiser-FiveM.ps1" %*
echo.
pause

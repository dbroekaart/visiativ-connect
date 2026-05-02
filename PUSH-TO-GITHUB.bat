@echo off
title Visiativ Connect - Push to GitHub
color 0A
echo.
echo  ============================================
echo   Visiativ Connect - GitHub Upload Script
echo  ============================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 goto :no_git

echo  Step 1: Copying files via PowerShell (handles OneDrive)...
if exist "C:\visiativ-connect" rmdir /s /q "C:\visiativ-connect"
mkdir "C:\visiativ-connect"

powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse -Force | Where-Object { $_.FullName -notmatch '\\.git' -and $_.FullName -notmatch 'node_modules' -and $_.Name -ne 'PUSH-TO-GITHUB.bat' } | ForEach-Object { $dest = $_.FullName.Replace('%~dp0', 'C:\visiativ-connect\'); $dir = Split-Path $dest; if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }; if (-not $_.PSIsContainer) { Copy-Item -Path $_.FullName -Destination $dest -Force } }"

REM Count copied files
for /f %%i in ('powershell -NoProfile -Command "(Get-ChildItem -Path 'C:\visiativ-connect' -Recurse -Force -File).Count"') do set FILECOUNT=%%i
echo  Copied %FILECOUNT% files to C:\visiativ-connect
echo.

if "%FILECOUNT%"=="0" goto :no_files

echo  Step 2: Initialising git...
git -C "C:\visiativ-connect" init -b main 2>nul
if errorlevel 1 (
    git -C "C:\visiativ-connect" init
    git -C "C:\visiativ-connect" symbolic-ref HEAD refs/heads/main
)
git -C "C:\visiativ-connect" config user.email "dbroekaart@hotmail.com"
git -C "C:\visiativ-connect" config user.name "Dolf Broekaart"
echo.

echo  Step 3: Staging %FILECOUNT% files...
git -C "C:\visiativ-connect" add -A
echo.

echo  Step 4: Committing...
git -C "C:\visiativ-connect" commit -m "Update: deploy latest changes"
echo.

echo  Step 5: Pushing to GitHub...
git -C "C:\visiativ-connect" remote add origin https://YOUR_GITHUB_TOKEN_HERE@github.com/dbroekaart/visiativ-connect.git
git -C "C:\visiativ-connect" push -u origin main --force

if errorlevel 1 goto :push_failed

color 0A
echo.
echo  ============================================
echo   SUCCESS! App deployed to GitHub!
echo  ============================================
echo.
echo  Wait 2-3 minutes then visit:
echo  https://dbroekaart.github.io/visiativ-connect/
echo.
pause
exit /b 0

:no_git
color 0C
echo  ERROR: Git is not installed.
echo  Download from: https://git-scm.com/download/win
pause
exit /b 1

:no_files
color 0C
echo.
echo  ERROR: No files were copied!
echo  OneDrive may not have the files downloaded locally.
echo.
echo  Fix: Open File Explorer, right-click the Event Networking App
echo  folder, choose "Always keep on this device", wait for sync,
echo  then run this script again.
echo.
pause
exit /b 1

:push_failed
color 0C
echo.
echo  Push failed. The GitHub token may have expired.
echo  Please let Claude know and a new one will be generated.
echo.
pause
exit /b 1

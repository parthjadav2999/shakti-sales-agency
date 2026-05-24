@echo off
echo ==========================================
echo   SHAKTI SALES AGENCY - Deploy to Live
echo ==========================================
echo.

REM Navigate to project directory
cd /d "d:\Shakti Sales Agency"

REM Add all changes
git add .

REM Get current date/time for commit message
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set mydate=%%a-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b

REM Commit and push source code
echo Saving your code changes...
git commit -m "Update: %mydate% %mytime%"
git push origin main

REM Build and deploy to GitHub Pages
echo.
echo Building and publishing to GitHub Pages...
call npm run deploy

echo.
echo ==========================================
echo   DONE! Your site will update in ~2 mins
echo   https://parthjadav2999.github.io/shakti-sales-agency/
echo ==========================================
echo.
pause

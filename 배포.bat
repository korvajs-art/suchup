@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo [1/2] Stopping local wrangler/node if any...
for /f "tokens=2 delims=," %%P in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH 2^>nul') do (
  rem best-effort: user can also Ctrl+C the pages dev window
)

echo [2/2] Deploying Pages project "suchup"...
call npx wrangler pages deploy . --project-name=suchup
if errorlevel 1 (
  echo.
  echo Deploy failed. Close any running "npm run dev" / wrangler / egov-suchup window, then retry.
  pause
  exit /b 1
)
echo.
echo Done.
pause

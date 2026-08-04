@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo [수첩] 로컬 서버를 시작합니다...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 가 설치되어 있지 않습니다.
  echo https://nodejs.org 에서 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo 패키지를 설치합니다. 잠시만 기다려 주세요...
  call npm install
  if errorlevel 1 (
    echo npm install 실패
    pause
    exit /b 1
  )
)

echo.
echo 브라우저에서 아래 주소로 접속하세요.
echo   로그인 : http://127.0.0.1:8788/login.html
echo   수첩   : http://127.0.0.1:8788/
echo   관리자 : http://127.0.0.1:8788/admin.html
echo   계정   : admin / changeme
echo.
echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

call npm run dev
if errorlevel 1 (
  echo.
  echo 서버 실행에 실패했습니다.
  pause
  exit /b 1
)

pause

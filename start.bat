@echo off
setlocal
cd /d "%~dp0"
if not exist "content\catalog.json" (
  echo ERROR: content\catalog.json not found. Put start.bat in the project folder.
  pause
  exit /b 1
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js / npm not found.
  pause
  exit /b 1
)
node scripts\check-port.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
echo BAZA Russian: http://localhost:8001/
start "" /min powershell.exe -NoProfile -Command "$ProgressPreference='SilentlyContinue'; for($i=0;$i -lt 60;$i++){try{$r=Invoke-RestMethod -Uri 'http://127.0.0.1:8001/content/catalog.json' -TimeoutSec 1; if($r.courseId -eq 'ru'){Start-Process 'http://localhost:8001/'; exit}}catch{}; Start-Sleep -Milliseconds 500}"
call npm.cmd start
if errorlevel 1 pause

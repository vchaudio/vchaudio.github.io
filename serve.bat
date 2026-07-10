@echo off
REM Local static server for vchaudio.github.io (no-cache headers on).
REM Usage: serve.bat [port]   (default port 8000)
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8000

where python >nul 2>nul
if %errorlevel%==0 (
  python scripts\serve.py %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py scripts\serve.py %PORT%
  goto :eof
)

echo Python was not found on PATH.
echo Install Python from https://www.python.org/  ^(tick "Add python.exe to PATH"^) and retry.
exit /b 1

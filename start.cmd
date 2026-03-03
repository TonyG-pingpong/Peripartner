@echo off
REM Run the Peripartner startup script (Local or Network).
REM Use this if double-clicking .ps1 doesn't work.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"
pause

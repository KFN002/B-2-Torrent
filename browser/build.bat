@echo off
echo Building B2 Secure Browser for Windows...

cd browser

:: Install dependencies
call npm install

:: Build for Windows
call npm run build:win

echo Build complete! Executable in browser\dist\
pause

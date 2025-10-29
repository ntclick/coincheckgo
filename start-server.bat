@echo off
echo Starting web server for MetaMask testing...
echo.
echo This will start a local web server on port 8000
echo Open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8000

pause

# PowerShell script to start web server for MetaMask testing
Write-Host "Starting web server for MetaMask testing..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start a local web server on port 8000" -ForegroundColor Yellow
Write-Host "Open your browser and go to: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Start Python HTTP server
try {
    python -m http.server 8000
} catch {
    Write-Host "Python not found. Trying alternative methods..." -ForegroundColor Red
    
    # Try Node.js http-server
    try {
        npx http-server -p 8000
    } catch {
        Write-Host "Node.js not found. Please install Python or Node.js" -ForegroundColor Red
        Write-Host "Or use the no-MetaMask version: test-buttons-no-metamask.html" -ForegroundColor Yellow
    }
}

Read-Host "Press Enter to continue"

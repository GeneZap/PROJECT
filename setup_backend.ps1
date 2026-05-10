# Setup script for GeneZap backend
$backendPath = "d:\MY_GITHUB_PROJECT\BV-BRC_Dataset\backend"
cd $backendPath

# Create and activate virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Cyan
python -m venv .venv --without-pip
Write-Host "Virtual environment created!" -ForegroundColor Green

# Activate venv
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip setuptools wheel

# Install requirements
Write-Host "Installing requirements..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host "To start the server, run:" -ForegroundColor Yellow
Write-Host "  cd $backendPath" -ForegroundColor Yellow
Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "  uvicorn main:app --reload --port 8000" -ForegroundColor Yellow

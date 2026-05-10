# Setup script for GeneZap frontend
$frontendPath = "d:\MY_GITHUB_PROJECT\BV-BRC_Dataset\frontend"
cd $frontendPath

Write-Host "Frontend setup starting..." -ForegroundColor Cyan

# Create .env.local with API base URL
Write-Host "Creating .env.local..." -ForegroundColor Cyan
@'
VITE_API_BASE_URL=http://127.0.0.1:8000
'@ | Out-File -Encoding UTF8 .env.local

Write-Host ".env.local created!" -ForegroundColor Green

# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host "To start the dev server, run:" -ForegroundColor Yellow
Write-Host "  cd $frontendPath" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host "Dev server will be available at: http://localhost:5173" -ForegroundColor Yellow

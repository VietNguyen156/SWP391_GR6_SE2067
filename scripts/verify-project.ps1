$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "=== Backend tests ===" -ForegroundColor Cyan
Push-Location (Join-Path $projectRoot "backend")
try {
    mvn test
    if ($LASTEXITCODE -ne 0) { throw "Backend tests failed" }
}
finally {
    Pop-Location
}

Write-Host "`n=== Frontend build ===" -ForegroundColor Cyan
Push-Location (Join-Path $projectRoot "frontend")
try {
    if (-not (Test-Path "node_modules")) {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed" }
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
}
finally {
    Pop-Location
}

Write-Host "`nAll checks passed." -ForegroundColor Green


$ErrorActionPreference = "Continue"

Write-Host "=== TOEIC Path environment check ===" -ForegroundColor Cyan

Write-Host "`nJava"
java -version

Write-Host "`nJava compiler"
javac -version

Write-Host "`nMaven"
mvn -version

Write-Host "`nNode.js"
node -v

Write-Host "`nnpm"
npm -v

Write-Host "`nGit"
git --version

Write-Host "`nEnvironment files"
Write-Host "Root .env: $(Test-Path (Join-Path $PSScriptRoot '..\.env'))"
Write-Host "Frontend .env: $(Test-Path (Join-Path $PSScriptRoot '..\frontend\.env'))"


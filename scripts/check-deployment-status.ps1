#!/usr/bin/env pwsh
# Check Deployment Status for Sanaathana-Aalaya-Charithra

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sanaathana-Aalaya-Charithra Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Port {
    param($Port, $ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            Write-Host "✓ $ServiceName (Port $Port)" -ForegroundColor Green -NoNewline
            Write-Host " - RUNNING" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ $ServiceName (Port $Port)" -ForegroundColor Red -NoNewline
            Write-Host " - NOT RUNNING" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ $ServiceName (Port $Port)" -ForegroundColor Red -NoNewline
        Write-Host " - NOT RUNNING" -ForegroundColor Red
        return $false
    }
}

Write-Host "Service Status:" -ForegroundColor Yellow
$localstack = Test-Port -Port 4566 -ServiceName "LocalStack"
$backend = Test-Port -Port 4000 -ServiceName "Backend API"
$admin = Test-Port -Port 5173 -ServiceName "Admin Portal"
$mobile = Test-Port -Port 8081 -ServiceName "Mobile App (Expo)"
Write-Host ""

Write-Host "Docker Status:" -ForegroundColor Yellow
try {
    $dockerRunning = docker ps --filter "name=temple-localstack" --filter "status=running" --format "{{.Names}}" 2>$null
    if ($dockerRunning -eq "temple-localstack") {
        Write-Host "✓ LocalStack Container - RUNNING" -ForegroundColor Green
    } else {
        Write-Host "✗ LocalStack Container - NOT RUNNING" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Docker - NOT ACCESSIBLE" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$total = 4
$running = @($localstack, $backend, $admin, $mobile) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "Services Running: $running/$total" -ForegroundColor $(if ($running -eq $total) { "Green" } else { "Yellow" })
Write-Host ""

if ($running -eq $total) {
    Write-Host "All services are running! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Cyan
    Write-Host "  Backend API:    http://localhost:4000" -ForegroundColor White
    Write-Host "  Admin Portal:   http://localhost:5173" -ForegroundColor White
    Write-Host "  Mobile App:     http://localhost:8081" -ForegroundColor White
    Write-Host "  LocalStack:     http://localhost:4566" -ForegroundColor White
} elseif ($running -eq 0) {
    Write-Host "No services are running." -ForegroundColor Red
    Write-Host "Run .\scripts\start-dev-environment.ps1 to start all services." -ForegroundColor Yellow
} else {
    Write-Host "Some services are not running." -ForegroundColor Yellow
    Write-Host "Run .\scripts\start-dev-environment.ps1 to start all services." -ForegroundColor Yellow
}

Write-Host ""

# Health check if backend is running
if ($backend) {
    Write-Host "Backend Health Check:" -ForegroundColor Yellow
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 5
        Write-Host "✓ Backend Status: $($health.status)" -ForegroundColor Green
        Write-Host "✓ Environment: $($health.environment)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Backend health check failed" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "For troubleshooting, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
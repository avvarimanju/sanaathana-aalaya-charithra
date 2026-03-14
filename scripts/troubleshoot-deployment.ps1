#!/usr/bin/env pwsh
# Troubleshooting Script for Sanaathana-Aalaya-Charithra Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Troubleshooting Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to check port
function Test-PortInUse {
    param($Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connections.Count -gt 0
}

# Function to get process using port
function Get-ProcessOnPort {
    param($Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $processId = $connections[0].OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        return $process
    }
    return $null
}

Write-Host "1. Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

$issues = @()

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -lt 18) {
            $issues += "Node.js version is $nodeVersion but v18+ is required"
            Write-Host "  ⚠ Warning: Node.js v18+ recommended" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✗ Node.js: NOT FOUND" -ForegroundColor Red
    $issues += "Node.js is not installed"
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm: NOT FOUND" -ForegroundColor Red
    $issues += "npm is not installed"
}

# Check Docker
if (Test-Command "docker") {
    $dockerVersion = docker --version
    Write-Host "✓ Docker: $dockerVersion" -ForegroundColor Green
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Host "✓ Docker is running" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker is not running" -ForegroundColor Red
        $issues += "Docker is installed but not running"
    }
} else {
    Write-Host "✗ Docker: NOT FOUND" -ForegroundColor Red
    $issues += "Docker is not installed"
}

Write-Host ""
Write-Host "2. Checking Port Availability..." -ForegroundColor Yellow
Write-Host ""

$ports = @{
    4000 = "Backend API"
    4566 = "LocalStack"
    5173 = "Admin Portal"
    8081 = "Mobile App (Expo)"
}

foreach ($port in $ports.Keys) {
    if (Test-PortInUse -Port $port) {
        $process = Get-ProcessOnPort -Port $port
        if ($process) {
            Write-Host "✗ Port $port ($($ports[$port])): IN USE by $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Red
            $issues += "Port $port is already in use by $($process.ProcessName)"
        } else {
            Write-Host "✗ Port $port ($($ports[$port])): IN USE" -ForegroundColor Red
            $issues += "Port $port is already in use"
        }
    } else {
        Write-Host "✓ Port $port ($($ports[$port])): Available" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "3. Checking Project Dependencies..." -ForegroundColor Yellow
Write-Host ""

# Check project components
$components = @(
    @{Path="backend/src/local-server"; Name="Backend Server"; Type="node"},
    @{Path="admin-portal"; Name="Admin Portal"; Type="node"},
    @{Path="mobile-app"; Name="Mobile App"; Type="node"}
)

foreach ($component in $components) {
    if (Test-Path $component.Path) {
        if (Test-Path "$($component.Path)/node_modules") {
            Write-Host "✓ $($component.Name): Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "✗ $($component.Name): Dependencies NOT installed" -ForegroundColor Red
            $issues += "$($component.Name) dependencies not installed (run 'npm install' in $($component.Path))"
        }
    } else {
        Write-Host "✗ $($component.Name): Directory NOT found" -ForegroundColor Red
        $issues += "$($component.Name) directory not found at $($component.Path)"
    }
}

Write-Host ""
Write-Host "4. Checking Docker Configuration..." -ForegroundColor Yellow
Write-Host ""

# Check docker-compose.yml
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ docker-compose.yml: Found" -ForegroundColor Green
} else {
    Write-Host "✗ docker-compose.yml: NOT found" -ForegroundColor Red
    $issues += "docker-compose.yml file is missing"
}

# Check LocalStack container
try {
    $localstackContainer = docker ps -a --filter "name=temple-localstack" --format "{{.Names}}" 2>$null
    if ($localstackContainer -eq "temple-localstack") {
        $containerStatus = docker ps --filter "name=temple-localstack" --filter "status=running" --format "{{.Status}}" 2>$null
        if ($containerStatus) {
            Write-Host "✓ LocalStack Container: Running" -ForegroundColor Green
        } else {
            Write-Host "⚠ LocalStack Container: Exists but not running" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ LocalStack Container: Not found" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Cannot check LocalStack container" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Checking Disk Space..." -ForegroundColor Yellow
Write-Host ""

$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -lt 5) {
    Write-Host "✗ Free disk space: $freeSpaceGB GB (Low)" -ForegroundColor Red
    $issues += "Low disk space: $freeSpaceGB GB available (recommend 10+ GB)"
} elseif ($freeSpaceGB -lt 10) {
    Write-Host "⚠ Free disk space: $freeSpaceGB GB (Adequate)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Free disk space: $freeSpaceGB GB" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "✓ No issues found! You're ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Run the deployment script:" -ForegroundColor Cyan
    Write-Host "  .\scripts\start-dev-environment.ps1" -ForegroundColor White
} else {
    Write-Host "✗ Found $($issues.Count) issue(s):" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $issues) {
        Write-Host "  • $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($issues -match "Node.js is not installed") {
        Write-Host "  1. Install Node.js v18+ from https://nodejs.org/" -ForegroundColor White
    }
    
    if ($issues -match "Docker is not installed") {
        Write-Host "  2. Install Docker Desktop from https://www.docker.com/" -ForegroundColor White
    }
    
    if ($issues -match "Docker is installed but not running") {
        Write-Host "  3. Start Docker Desktop application" -ForegroundColor White
    }
    
    if ($issues -match "Port .* is already in use") {
        Write-Host "  4. Stop services using required ports:" -ForegroundColor White
        Write-Host "     Get-Process -Id <PID> | Stop-Process -Force" -ForegroundColor Gray
    }
    
    if ($issues -match "dependencies not installed") {
        Write-Host "  5. Install project dependencies:" -ForegroundColor White
        Write-Host "     cd <component-path> && npm install" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "For more help, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
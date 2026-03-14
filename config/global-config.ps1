# Global Configuration for Sanaathana Aalaya Charithra (PowerShell)
# 
# This file provides centralized configuration management for PowerShell scripts.
# All PowerShell scripts should source this file rather than hardcoding values.
# 
# To change AWS region or domain globally, update the .env.global file.

# Function to load global environment variables
function Get-GlobalConfig {
    $globalEnvPath = Join-Path $PSScriptRoot ".." ".env.global"
    $globalEnv = @{}
    
    if (Test-Path $globalEnvPath) {
        Get-Content $globalEnvPath | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith('#')) {
                $parts = $line.Split('=', 2)
                if ($parts.Length -eq 2) {
                    $globalEnv[$parts[0].Trim()] = $parts[1].Trim()
                }
            }
        }
    }
    
    # Return configuration object
    return @{
        AWS_REGION = if ($globalEnv.AWS_REGION) { $globalEnv.AWS_REGION } else { "ap-south-1" }
        DOMAIN_ROOT = if ($globalEnv.DOMAIN_ROOT) { $globalEnv.DOMAIN_ROOT } else { "charithra.org" }
        GITHUB_REPO_URL = if ($globalEnv.GITHUB_REPO_URL) { $globalEnv.GITHUB_REPO_URL } else { "https://github.com/avvarimanju/sanaathana-aalaya-charithra.git" }
    }
}

# Function to get environment-specific configuration
function Get-EnvironmentConfig {
    param(
        [string]$Environment = "development"
    )
    
    $global = Get-GlobalConfig
    
    $domains = @{
        development = @{
            api = "http://localhost:4000"
            admin = "http://localhost:5173"
            mobile = "http://localhost:19006"
        }
        staging = @{
            api = "https://api-staging.$($global.DOMAIN_ROOT)"
            admin = "https://admin-staging.$($global.DOMAIN_ROOT)"
            mobile = "https://app-staging.$($global.DOMAIN_ROOT)"
        }
        production = @{
            api = "https://api.$($global.DOMAIN_ROOT)"
            admin = "https://admin.$($global.DOMAIN_ROOT)"
            mobile = "https://app.$($global.DOMAIN_ROOT)"
        }
    }
    
    return @{
        AWS_REGION = $global.AWS_REGION
        DOMAIN_ROOT = $global.DOMAIN_ROOT
        GITHUB_REPO_URL = $global.GITHUB_REPO_URL
        API_URL = $domains[$Environment].api
        ADMIN_URL = $domains[$Environment].admin
        MOBILE_URL = $domains[$Environment].mobile
    }
}

# Export functions for use in other scripts
Export-ModuleMember -Function Get-GlobalConfig, Get-EnvironmentConfig
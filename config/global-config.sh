#!/bin/bash
# Global Configuration for Sanaathana Aalaya Charithra (Bash)
# 
# This file provides centralized configuration management for Bash scripts.
# All Bash scripts should source this file rather than hardcoding values.
# 
# Usage: source config/global-config.sh
# 
# To change AWS region or domain globally, update the .env.global file.

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_ENV_FILE="$SCRIPT_DIR/../.env.global"

# Function to load global environment variables
load_global_config() {
    # Set defaults
    export AWS_REGION="ap-south-1"
    export DOMAIN_ROOT="charithra.org"
    export GITHUB_REPO_URL="https://github.com/avvarimanju/sanaathana-aalaya-charithra.git"
    
    # Load from .env.global if it exists
    if [[ -f "$GLOBAL_ENV_FILE" ]]; then
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^[[:space:]]*# ]] && continue
            [[ -z $key ]] && continue
            
            # Remove leading/trailing whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            
            # Export the variable
            if [[ -n $key && -n $value ]]; then
                export "$key"="$value"
            fi
        done < "$GLOBAL_ENV_FILE"
    fi
}

# Function to get environment-specific configuration
get_environment_config() {
    local environment=${1:-development}
    
    case $environment in
        development)
            export API_URL="http://localhost:4000"
            export ADMIN_URL="http://localhost:5173"
            export MOBILE_URL="http://localhost:19006"
            ;;
        staging)
            export API_URL="https://api-staging.$DOMAIN_ROOT"
            export ADMIN_URL="https://admin-staging.$DOMAIN_ROOT"
            export MOBILE_URL="https://app-staging.$DOMAIN_ROOT"
            ;;
        production)
            export API_URL="https://api.$DOMAIN_ROOT"
            export ADMIN_URL="https://admin.$DOMAIN_ROOT"
            export MOBILE_URL="https://app.$DOMAIN_ROOT"
            ;;
        *)
            echo "Unknown environment: $environment"
            exit 1
            ;;
    esac
}

# Function to display current configuration
show_config() {
    echo "=== Global Configuration ==="
    echo "AWS_REGION: $AWS_REGION"
    echo "DOMAIN_ROOT: $DOMAIN_ROOT"
    echo "GITHUB_REPO_URL: $GITHUB_REPO_URL"
    
    if [[ -n $API_URL ]]; then
        echo ""
        echo "=== Environment URLs ==="
        echo "API_URL: $API_URL"
        echo "ADMIN_URL: $ADMIN_URL"
        echo "MOBILE_URL: $MOBILE_URL"
    fi
}

# Load configuration when sourced
load_global_config

# If script is run directly (not sourced), show configuration
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_config
fi
# Global Configuration Management

This document explains the centralized configuration system for the Sanaathana Aalaya Charithra project.

## Overview

Instead of hardcoding values like AWS regions and domains throughout the project, we use a centralized configuration system. This makes it easy to change global settings in one place.

## Configuration Files

### 1. `.env.global` - Master Configuration
The single source of truth for global settings:

```env
# Global Configuration for Sanaathana Aalaya Charithra
AWS_REGION=ap-south-1
DOMAIN_ROOT=charithra.org
GITHUB_REPO_URL=https://github.com/avvarimanju/sanaathana-aalaya-charithra.git
```

**To change AWS region globally**: Edit this file and change `AWS_REGION=ap-south-1` to your desired region.

### 2. Configuration Utilities

#### JavaScript/Node.js: `config/global-config.js`
```javascript
const globalConfig = require('./config/global-config');
const config = globalConfig.getConfig('production');
console.log(config.aws.region); // ap-south-1
```

#### PowerShell: `config/global-config.ps1`
```powershell
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig
$region = $config.AWS_REGION
```

#### Bash: `config/global-config.sh`
```bash
source config/global-config.sh
echo $AWS_REGION  # ap-south-1
```

## Environment Files

All environment files now reference the global configuration:

### `.env.development`
```env
AWS_REGION=${AWS_REGION:-ap-south-1}
```

### `.env.staging.example`
```env
AWS_REGION=${AWS_REGION:-ap-south-1}
```

### `.env.production.example`
```env
AWS_REGION=${AWS_REGION:-ap-south-1}
```

## Script Integration

### PowerShell Scripts
```powershell
# Import global configuration
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig

# Use configuration
$REGION = $config.AWS_REGION
```

### Bash Scripts
```bash
# Import global configuration
source "$(dirname "$0")/../config/global-config.sh"

# Use configuration
REGION="$AWS_REGION"
```

### Node.js/TypeScript
```javascript
const globalConfig = require('../config/global-config');
const config = globalConfig.getConfig(process.env.NODE_ENV || 'development');

// Use configuration
const region = config.aws.region;
const apiUrl = config.domains.api;
```

## Domain Configuration

The system automatically generates environment-specific URLs:

| Environment | API URL | Admin URL | Mobile URL |
|-------------|---------|-----------|------------|
| Development | http://localhost:4000 | http://localhost:5173 | http://localhost:19006 |
| Staging | https://api-staging.charithra.org | https://admin-staging.charithra.org | https://app-staging.charithra.org |
| Production | https://api.charithra.org | https://admin.charithra.org | https://app.charithra.org |

## Benefits

1. **Single Source of Truth**: Change AWS region in one place (`.env.global`)
2. **Consistency**: All scripts and environments use the same configuration
3. **Maintainability**: Easy to update global settings without searching through files
4. **Environment Flexibility**: Different environments automatically get correct URLs
5. **Version Control**: Global settings are tracked in git

## Migration Guide

### Before (Hardcoded)
```powershell
$REGION = "ap-south-1"  # Hardcoded in every script
```

### After (Centralized)
```powershell
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig
$REGION = $config.AWS_REGION  # Loaded from .env.global
```

## Changing AWS Region

To change the AWS region for the entire project:

1. Edit `.env.global`:
   ```env
   AWS_REGION=us-west-2  # Change to desired region
   ```

2. All scripts, environment files, and applications will automatically use the new region.

3. No need to search and replace through multiple files.

## Best Practices

1. **Always use global config**: Never hardcode regions or domains in scripts
2. **Import at the top**: Load configuration at the beginning of scripts
3. **Use environment helpers**: Use `getConfig(environment)` for environment-specific settings
4. **Document changes**: Update this file when adding new global configuration options

## Troubleshooting

### Configuration not loading
- Ensure the path to config files is correct
- Check that `.env.global` exists and has proper format
- Verify file permissions

### Wrong region being used
- Check if local environment variables override global config
- Ensure scripts are importing the global configuration
- Verify `.env.global` has the correct AWS_REGION value

## Future Enhancements

- Add validation for configuration values
- Support for environment-specific overrides
- Integration with CI/CD pipelines
- Configuration schema validation
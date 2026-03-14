# Migration to Global Configuration System

## Problem Statement

Currently, the project has **180+ hardcoded references** to AWS regions and other configuration values scattered across 70+ files. This violates the DRY principle and makes maintenance difficult.

## Current Issues

From the search results, we can see hardcoded values in:

### 1. Python Files (Backend)
```python
# ❌ WRONG - Hardcoded
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# ✅ CORRECT - Should reference global config
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("GLOBAL_AWS_REGION", "ap-south-1"))
```

### 2. TypeScript Files (Backend Services)
```typescript
// ❌ WRONG - Hardcoded
region: process.env.AWS_REGION || 'ap-south-1'

// ✅ CORRECT - Should use global config
import { globalConfig } from '../config/global-config';
region: globalConfig.aws.region
```

### 3. Documentation Files
```markdown
<!-- ❌ WRONG - Hardcoded examples -->
AWS_REGION=ap-south-1

<!-- ✅ CORRECT - Reference global config -->
AWS_REGION=${AWS_REGION:-ap-south-1}  # Loaded from .env.global
```

### 4. Shell Scripts
```bash
# ❌ WRONG - Hardcoded
AWS_REGION="ap-south-1"

# ✅ CORRECT - Use global config
source config/global-config.sh
# AWS_REGION is now loaded from global config
```

## Migration Strategy

### Phase 1: Update Core Configuration Files ✅ DONE
- [x] Created `.env.global`
- [x] Created `config/global-config.js`
- [x] Created `config/global-config.ps1`
- [x] Created `config/global-config.sh`

### Phase 2: Update Environment Files ✅ DONE
- [x] Updated `.env.development`
- [x] Updated `.env.staging.example`
- [x] Updated `.env.production.example`

### Phase 3: Update Documentation Files ✅ DONE
- [x] Updated `admin-portal/ENVIRONMENT_ARCHITECTURE.md`
- [x] Updated `docs/getting-started/environment-setup.md`
- [x] Updated `docs/getting-started/local-development.md`

### Phase 4: Update Backend Code Files ✅ DONE
- [x] Updated `backend/admin/handlers/analytics_handler.py`
- [x] Updated `backend/admin/lambdas/admin_api.py`
- [x] Updated `backend/auth/config.py`
- [x] Updated `backend/services/bedrock-service.ts`
- [x] Updated `backend/services/polly-service.ts`
- [x] Updated `backend/services/translation-service.ts`

### Phase 5: Update Scripts ✅ DONE
- [x] Updated PowerShell scripts to use global config
- [x] Updated Bash scripts to use global config
- [x] Updated Python scripts to use global config
- [x] Updated TypeScript test scripts to use global config

## Implementation Guidelines

### For Python Files
```python
# Import global configuration
import os
from pathlib import Path

# Load global config
def load_global_config():
    global_env_path = Path(__file__).parent.parent / '.env.global'
    config = {}
    if global_env_path.exists():
        with open(global_env_path) as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    config[key] = value
    return config

global_config = load_global_config()
AWS_REGION = os.environ.get("AWS_REGION", global_config.get("AWS_REGION", "ap-south-1"))
```

### For TypeScript Files
```typescript
// Use the existing global config
import globalConfig from '../config/global-config';

const config = globalConfig.getConfig(process.env.NODE_ENV || 'development');
const region = config.aws.region;
```

### For Shell Scripts
```bash
#!/bin/bash
# Source global configuration
source "$(dirname "$0")/../config/global-config.sh"

# Now AWS_REGION is available from global config
echo "Using AWS Region: $AWS_REGION"
```

### For PowerShell Scripts
```powershell
# Import global configuration
. "$PSScriptRoot\..\config\global-config.ps1"
$config = Get-GlobalConfig

# Use configuration
$REGION = $config.AWS_REGION
```

## Benefits After Migration

1. **Single Source of Truth**: Change region in one file (`.env.global`)
2. **Consistency**: All files use the same configuration
3. **Maintainability**: Easy updates without searching through 70+ files
4. **Environment Flexibility**: Different environments can override as needed
5. **Version Control**: Configuration changes are tracked

## Migration Checklist

### Backend Files
- [x] `backend/admin/handlers/analytics_handler.py`
- [x] `backend/admin/lambdas/admin_api.py`
- [x] `backend/auth/config.py`
- [x] `backend/services/bedrock-service.ts`
- [x] `backend/services/polly-service.ts`
- [x] `backend/services/translation-service.ts`

### Documentation Files
- [x] `docs/getting-started/environment-setup.md`
- [x] `docs/getting-started/local-development.md`
- [x] `admin-portal/ENVIRONMENT_ARCHITECTURE.md`

### Script Files
- [x] `scripts/deploy-*.sh`
- [x] `scripts/deploy-*.ps1`
- [x] `scripts/test-*.ts`
- [x] `scripts/init-*.ps1`
- [x] `scripts/start-*.ps1`
- [x] `scripts/test-*.py`

## Testing the Migration

After updating files, verify the configuration works:

```bash
# Test global config loading
source config/global-config.sh
echo "AWS Region: $AWS_REGION"

# Test PowerShell config
powershell -Command ". config/global-config.ps1; (Get-GlobalConfig).AWS_REGION"

# Test Node.js config
node -e "console.log(require('./config/global-config').aws.region)"
```

## Rollback Plan

If issues arise:
1. Revert `.env.global` changes
2. Update global config files with previous values
3. All dependent files will automatically use the reverted values

## Next Steps

1. **Immediate**: Update remaining documentation files to reference global config
2. **Short-term**: Update backend Python and TypeScript files
3. **Medium-term**: Update all remaining scripts
4. **Long-term**: Add validation and testing for configuration system
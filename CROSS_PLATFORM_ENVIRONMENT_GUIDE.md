# Cross-Platform Environment Variable Guide

**Purpose**: Ensure consistent environment variable usage across Windows (PowerShell) and Linux/WSL (Bash) for seamless developer experience.

---

## Environment Variable Naming Convention

All scripts use **identical environment variable names** regardless of platform:

| Variable Name | Purpose | Default Value |
|--------------|---------|---------------|
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint URL | `http://localhost:4566` |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `test` (local only) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `test` (local only) |
| `AWS_ENDPOINT_URL` | AWS CLI endpoint | Set from `DYNAMODB_ENDPOINT` |

---

## Platform-Specific Syntax

### PowerShell (Windows)

```powershell
# Read environment variable with fallback
$ENDPOINT = if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }

# Set environment variable
$env:AWS_ENDPOINT_URL = $ENDPOINT
$env:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }
$env:AWS_ACCESS_KEY_ID = if ($env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID } else { "test" }
$env:AWS_SECRET_ACCESS_KEY = if ($env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY } else { "test" }
```

### Bash (Linux/WSL)

```bash
# Read environment variable with fallback
ENDPOINT=${DYNAMODB_ENDPOINT:-http://localhost:4566}

# Set environment variable
export AWS_ENDPOINT_URL=$ENDPOINT
export AWS_REGION=${AWS_REGION:-ap-south-1}
export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}
```

---

## Setting Environment Variables

### PowerShell (Windows)

#### Temporary (Current Session Only)
```powershell
$env:DYNAMODB_ENDPOINT = "http://localhost:4566"
$env:AWS_REGION = "ap-south-1"
```

#### Permanent (User Level)
```powershell
[System.Environment]::SetEnvironmentVariable('DYNAMODB_ENDPOINT', 'http://localhost:4566', 'User')
[System.Environment]::SetEnvironmentVariable('AWS_REGION', 'ap-south-1', 'User')
```

#### Using .env File
```powershell
# Load from .env.development
Get-Content .env.development | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}
```

### Bash (Linux/WSL)

#### Temporary (Current Session Only)
```bash
export DYNAMODB_ENDPOINT=http://localhost:4566
export AWS_REGION=ap-south-1
```

#### Permanent (User Level)
Add to `~/.bashrc` or `~/.bash_profile`:
```bash
export DYNAMODB_ENDPOINT=http://localhost:4566
export AWS_REGION=ap-south-1
```

Then reload:
```bash
source ~/.bashrc
```

#### Using .env File
```bash
# Load from .env.development
export $(cat .env.development | xargs)
```

---

## Verification Commands

### PowerShell (Windows)

```powershell
# Check if variable is set
$env:DYNAMODB_ENDPOINT

# List all environment variables
Get-ChildItem Env: | Where-Object { $_.Name -like "AWS*" -or $_.Name -like "DYNAMODB*" }

# Check variable with fallback
if ($env:DYNAMODB_ENDPOINT) { $env:DYNAMODB_ENDPOINT } else { "http://localhost:4566" }
```

### Bash (Linux/WSL)

```bash
# Check if variable is set
echo $DYNAMODB_ENDPOINT

# List all environment variables
env | grep -E "AWS|DYNAMODB"

# Check variable with fallback
echo ${DYNAMODB_ENDPOINT:-http://localhost:4566}
```

---

## Script Consistency Matrix

All scripts follow the same pattern across platforms:

| Script | PowerShell | Bash | Variable Names Match |
|--------|-----------|------|---------------------|
| `init-db-simple.ps1` | ✅ | N/A | ✅ |
| `init-local-db.ps1` | ✅ | N/A | ✅ |
| `init-local-db.sh` | N/A | ✅ | ✅ |
| `start-local-backend.ps1` | ✅ | N/A | ✅ |
| `start-local-integration.ps1` | ✅ | N/A | ✅ |
| `fix-temples-table.ps1` | ✅ | N/A | ✅ |

---

## Developer Workflow Examples

### Scenario 1: Developer Switches from Windows to WSL

**Windows (PowerShell)**:
```powershell
$env:DYNAMODB_ENDPOINT = "http://localhost:4566"
.\scripts\init-local-db.ps1
```

**WSL (Bash)** - Same variable names:
```bash
export DYNAMODB_ENDPOINT=http://localhost:4566
./scripts/init-local-db.sh
```

### Scenario 2: Team Member Uses Different OS

**Team Member A (Windows)**:
```powershell
# .env.development
DYNAMODB_ENDPOINT=http://localhost:4566
AWS_REGION=ap-south-1
```

**Team Member B (Linux)**:
```bash
# Same .env.development file works!
DYNAMODB_ENDPOINT=http://localhost:4566
AWS_REGION=ap-south-1
```

### Scenario 3: CI/CD Pipeline (GitHub Actions)

```yaml
# Works on both ubuntu-latest and windows-latest runners
- name: Set Environment Variables
  env:
    DYNAMODB_ENDPOINT: http://localhost:4566
    AWS_REGION: ap-south-1
  run: |
    # Scripts automatically use these variables
```

---

## Best Practices

1. ✅ **Use Identical Variable Names**: Never use platform-specific prefixes or suffixes
2. ✅ **Document Fallbacks**: Always show default values in comments
3. ✅ **Test Cross-Platform**: Verify scripts work on both Windows and Linux
4. ✅ **Use .env Files**: Share configuration across platforms
5. ✅ **Avoid Hardcoding**: Always use environment variables with fallbacks

---

## Common Pitfalls to Avoid

### ❌ DON'T: Use Different Variable Names

```powershell
# PowerShell - BAD
$env:WIN_DYNAMODB_ENDPOINT = "http://localhost:4566"
```

```bash
# Bash - BAD
export LINUX_DYNAMODB_ENDPOINT=http://localhost:4566
```

### ✅ DO: Use Consistent Names

```powershell
# PowerShell - GOOD
$env:DYNAMODB_ENDPOINT = "http://localhost:4566"
```

```bash
# Bash - GOOD
export DYNAMODB_ENDPOINT=http://localhost:4566
```

### ❌ DON'T: Hardcode Platform-Specific Paths

```powershell
# BAD
$env:AWS_ENDPOINT_URL = "C:\localstack\endpoint"
```

### ✅ DO: Use Platform-Agnostic URLs

```powershell
# GOOD
$env:AWS_ENDPOINT_URL = "http://localhost:4566"
```

---

## Environment Variable Precedence

1. **Explicitly Set** (highest priority)
   - `$env:DYNAMODB_ENDPOINT = "..."`
   - `export DYNAMODB_ENDPOINT=...`

2. **.env Files**
   - `.env.development`
   - `.env.staging`
   - `.env.production`

3. **Script Fallbacks** (lowest priority)
   - PowerShell: `if ($env:VAR) { $env:VAR } else { "default" }`
   - Bash: `${VAR:-default}`

---

## Related Documentation

- `ENTERPRISE_BEST_PRACTICES.md` - Enterprise configuration patterns
- `ENVIRONMENT_CONFIGURATION_GUIDE.md` - Detailed environment setup
- `HARDCODED_ENDPOINTS_AUDIT.md` - Audit results and findings
- `.env.example` - Template with all variables

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ CROSS-PLATFORM ENVIRONMENT VARIABLES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Variable Names (IDENTICAL on all platforms):                │
│   • DYNAMODB_ENDPOINT                                       │
│   • AWS_REGION                                              │
│   • AWS_ACCESS_KEY_ID                                       │
│   • AWS_SECRET_ACCESS_KEY                                   │
│                                                             │
│ PowerShell Syntax:                                          │
│   $env:DYNAMODB_ENDPOINT = "http://localhost:4566"         │
│                                                             │
│ Bash Syntax:                                                │
│   export DYNAMODB_ENDPOINT=http://localhost:4566           │
│                                                             │
│ Fallback Pattern:                                           │
│   PowerShell: if ($env:VAR) { $env:VAR } else { "default" }│
│   Bash: ${VAR:-default}                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Conclusion

✅ **Consistency Achieved**: All scripts use identical environment variable names across Windows and Linux, ensuring a seamless developer experience regardless of platform choice.

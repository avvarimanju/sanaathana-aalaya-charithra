# Auto-Commit Guide for Dev Environment

## Overview
Automatically commit and push changes from all parts of your project:
- Admin Portal
- Mobile App
- Backend
- Main Repository

## Quick Start

### Windows (PowerShell)
```powershell
# Basic usage - commits all changes
.\scripts\auto-commit-dev.ps1

# With custom message
.\scripts\auto-commit-dev.ps1 -Message "Fixed button sizing"

# Dry run (see what would be committed without committing)
.\scripts\auto-commit-dev.ps1 -DryRun
```

### Linux/Mac (Bash)
```bash
# Make script executable (first time only)
chmod +x scripts/auto-commit-dev.sh

# Basic usage
./scripts/auto-commit-dev.sh

# With custom message
./scripts/auto-commit-dev.sh "Fixed button sizing"

# Dry run
./scripts/auto-commit-dev.sh "Test message" true
```

## Features

### 1. Multi-Repository Support
Automatically handles:
- **Admin Portal** (`admin-portal/`) - if it's a separate git repo
- **Mobile App** (`mobile-app/`) - if it's a separate git repo
- **Backend** (`backend/`) - if it's a separate git repo
- **Main Repository** (root) - always checked

### 2. Smart Detection
- Only commits repositories with actual changes
- Skips repositories with no changes
- Shows detailed status for each repository

### 3. Safety Features
- **Dry Run Mode**: Preview what would be committed without actually committing
- **Timestamp**: Automatically adds timestamp to commit messages
- **Error Handling**: Continues even if one repository fails

### 4. Clear Output
```
🔄 Auto-Commit Script for Dev Environment
==========================================

📁 Processing: Admin Portal
   Location: admin-portal
   📝 Changes detected:
   M  src/index.css
   M  src/pages/TempleListPage.tsx
   
   ➕ Staging changes...
   💾 Committing...
   🚀 Pushing to remote...
   ✅ Successfully committed and pushed!

📊 Summary
==========================================
✅ Successful: 3 / 3
🎉 All repositories updated successfully!
```

## Usage Examples

### Example 1: Quick Commit After UI Changes
```powershell
.\scripts\auto-commit-dev.ps1 -Message "Updated button UI/UX"
```

### Example 2: Check What Would Be Committed
```powershell
# Dry run first to see changes
.\scripts\auto-commit-dev.ps1 -DryRun

# If looks good, commit for real
.\scripts\auto-commit-dev.ps1 -Message "Button sizing improvements"
```

### Example 3: End of Day Commit
```powershell
.\scripts\auto-commit-dev.ps1 -Message "EOD: Entry fee manager and button fixes"
```

### Example 4: Feature Complete
```powershell
.\scripts\auto-commit-dev.ps1 -Message "Feature: Entry fee management complete"
```

## Automated Scheduling (Optional)

### Windows Task Scheduler
Create a scheduled task to auto-commit every hour:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, repeat every 1 hour
4. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "C:\path\to\scripts\auto-commit-dev.ps1" -Message "Scheduled auto-commit"`
5. Save

### Linux/Mac Cron Job
Add to crontab (`crontab -e`):
```bash
# Auto-commit every hour
0 * * * * cd /path/to/Sanaathana-Aalaya-Charithra && ./scripts/auto-commit-dev.sh "Scheduled auto-commit"
```

## Git Hook Integration (Advanced)

### Pre-Commit Hook
Automatically run checks before committing:

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Run linting before commit
cd admin-portal && npm run lint
cd ../mobile-app && npm run lint
```

### Post-Commit Hook
Automatically push after commit:

Create `.git/hooks/post-commit`:
```bash
#!/bin/bash
git push origin main
```

## Best Practices

### 1. Meaningful Commit Messages
```powershell
# Good
.\scripts\auto-commit-dev.ps1 -Message "Fixed button sizing issue"

# Better
.\scripts\auto-commit-dev.ps1 -Message "UI: Applied enterprise button sizing standards"

# Best
.\scripts\auto-commit-dev.ps1 -Message "UI: Button sizing - Applied Microsoft/Google design standards, fixed full-width issue"
```

### 2. Commit Frequency
- **After each feature**: When you complete a feature or fix
- **Before switching tasks**: Save your work before context switching
- **End of day**: Ensure all work is backed up
- **Before testing**: Commit stable state before experimental changes

### 3. Use Dry Run First
```powershell
# Always check first
.\scripts\auto-commit-dev.ps1 -DryRun

# Then commit if satisfied
.\scripts\auto-commit-dev.ps1 -Message "Your message"
```

### 4. Avoid Committing
- `node_modules/` (should be in .gitignore)
- `.env` files with secrets
- Build artifacts (`dist/`, `build/`)
- IDE-specific files (`.vscode/`, `.idea/`)
- Temporary files

## Troubleshooting

### Issue: "Not a git repository"
**Solution**: Initialize git in that directory
```bash
cd admin-portal
git init
git remote add origin <your-repo-url>
```

### Issue: "Permission denied"
**Solution**: Make script executable (Linux/Mac)
```bash
chmod +x scripts/auto-commit-dev.sh
```

### Issue: "Push rejected"
**Solution**: Pull first, then push
```bash
git pull origin main
git push origin main
```

### Issue: "Merge conflicts"
**Solution**: Resolve manually
```bash
git status
# Edit conflicted files
git add .
git commit -m "Resolved merge conflicts"
git push
```

## Integration with CI/CD

### GitHub Actions
The script works well with GitHub Actions:

```yaml
name: Auto-commit on schedule
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  auto-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Auto-commit changes
        run: ./scripts/auto-commit-dev.sh "Scheduled auto-commit"
```

## Alternative: Git Aliases

Add to `.gitconfig`:
```ini
[alias]
    ac = !pwsh -File scripts/auto-commit-dev.ps1
    acd = !pwsh -File scripts/auto-commit-dev.ps1 -DryRun
```

Usage:
```bash
git ac -Message "Quick commit"
git acd  # Dry run
```

## Security Considerations

### 1. Never Commit Secrets
Ensure `.gitignore` includes:
```
.env
.env.local
.env.production
*.key
*.pem
secrets/
```

### 2. Review Before Push
Always use dry run for sensitive changes:
```powershell
.\scripts\auto-commit-dev.ps1 -DryRun
```

### 3. Branch Protection
Set up branch protection rules on GitHub:
- Require pull request reviews
- Require status checks
- Restrict who can push

## Summary

The auto-commit script provides:
- ✅ One-command commit across all repositories
- ✅ Automatic timestamp in commit messages
- ✅ Dry run mode for safety
- ✅ Clear, colorful output
- ✅ Error handling and recovery
- ✅ Cross-platform support (Windows/Linux/Mac)

Use it to streamline your development workflow and ensure your work is always backed up!

#!/bin/bash
# Auto-commit script for development environment (Linux/Mac)
# Commits and pushes changes from Admin Portal, Mobile App, and Backend

MESSAGE="${1:-Auto-commit: Dev changes}"
DRY_RUN="${2:-false}"

echo "🔄 Auto-Commit Script for Dev Environment"
echo "=========================================="
echo ""

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
COMMIT_MESSAGE="$MESSAGE - $TIMESTAMP"

# Check if we're in the right directory
if [ ! -d "admin-portal" ] || [ ! -d "mobile-app" ]; then
    echo "❌ Error: Must run from project root (Sanaathana-Aalaya-Charithra)"
    exit 1
fi

# Function to commit and push
commit_and_push() {
    local PATH_DIR=$1
    local NAME=$2
    local MESSAGE=$3
    
    echo "📁 Processing: $NAME"
    echo "   Location: $PATH_DIR"
    
    cd "$PATH_DIR" || return 1
    
    # Check if there are changes
    STATUS=$(git status --porcelain)
    
    if [ -z "$STATUS" ]; then
        echo "   ✓ No changes to commit"
        cd - > /dev/null || return 1
        return 0
    fi
    
    echo "   📝 Changes detected:"
    git status --short
    echo ""
    
    if [ "$DRY_RUN" = "true" ]; then
        echo "   🔍 DRY RUN - Would commit these changes"
        cd - > /dev/null || return 1
        return 0
    fi
    
    # Stage all changes
    echo "   ➕ Staging changes..."
    git add -A
    
    # Commit
    echo "   💾 Committing..."
    git commit -m "$MESSAGE"
    
    # Push
    echo "   🚀 Pushing to remote..."
    git push
    
    echo "   ✅ Successfully committed and pushed!"
    echo ""
    
    cd - > /dev/null || return 1
    return 0
}

# Main execution
echo "Commit Message: $COMMIT_MESSAGE"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo "🔍 DRY RUN MODE - No changes will be committed"
    echo ""
fi

SUCCESS_COUNT=0
TOTAL_COUNT=0

# 1. Admin Portal
if [ -d "admin-portal/.git" ]; then
    if commit_and_push "admin-portal" "Admin Portal" "$COMMIT_MESSAGE"; then
        ((SUCCESS_COUNT++))
    fi
    ((TOTAL_COUNT++))
else
    echo "⚠️  Admin Portal: Not a git repository (skipping)"
    echo ""
fi

# 2. Mobile App
if [ -d "mobile-app/.git" ]; then
    if commit_and_push "mobile-app" "Mobile App" "$COMMIT_MESSAGE"; then
        ((SUCCESS_COUNT++))
    fi
    ((TOTAL_COUNT++))
else
    echo "⚠️  Mobile App: Not a git repository (skipping)"
    echo ""
fi

# 3. Backend (if separate repo)
if [ -d "backend/.git" ]; then
    if commit_and_push "backend" "Backend" "$COMMIT_MESSAGE"; then
        ((SUCCESS_COUNT++))
    fi
    ((TOTAL_COUNT++))
else
    echo "ℹ️  Backend: Not a separate git repository (part of main repo)"
    echo ""
fi

# 4. Main Repository (root)
echo "📁 Processing: Main Repository (Root)"
echo "   Location: ."

STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    echo "   ✓ No changes to commit"
else
    echo "   📝 Changes detected:"
    git status --short
    echo ""
    
    if [ "$DRY_RUN" = "true" ]; then
        echo "   🔍 DRY RUN - Would commit these changes"
    else
        echo "   ➕ Staging changes..."
        git add -A
        
        echo "   💾 Committing..."
        git commit -m "$COMMIT_MESSAGE"
        
        echo "   🚀 Pushing to remote..."
        git push
        
        echo "   ✅ Successfully committed and pushed!"
        ((SUCCESS_COUNT++))
    fi
    ((TOTAL_COUNT++))
fi

echo ""
echo "=========================================="
echo "📊 Summary"
echo "=========================================="

if [ "$DRY_RUN" = "true" ]; then
    echo "🔍 Dry run completed - no changes were committed"
else
    echo "✅ Successful: $SUCCESS_COUNT / $TOTAL_COUNT"
    
    if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
        echo "🎉 All repositories updated successfully!"
    else
        echo "⚠️  Some repositories had issues"
    fi
fi

echo ""

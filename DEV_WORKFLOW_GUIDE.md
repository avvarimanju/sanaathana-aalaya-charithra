# Development Workflow Guide

## Quick Start - One Command to Rule Them All

### Start All Dev Servers with Hot Reload
```powershell
.\scripts\dev-watch-all.ps1
```

This opens 3 terminal windows:
- **Backend Server** (http://localhost:4000) - Auto-restarts on changes
- **Admin Portal** (http://localhost:5173) - Hot Module Replacement
- **Mobile App** (Expo) - Fast Refresh

## What is Hot Reload?

Hot reload means your changes appear instantly without manual restarts:

### Admin Portal (Vite HMR)
- Save a `.tsx` or `.css` file
- Browser updates **instantly** (< 1 second)
- No page refresh needed
- State is preserved

### Mobile App (Expo Fast Refresh)
- Save a `.tsx` file
- App updates **instantly** on your device/emulator
- Component state is preserved
- No app restart needed

### Backend (Nodemon)
- Save a `.ts` or `.js` file
- Server **auto-restarts** (2-3 seconds)
- New code is loaded automatically

## Development Workflow

### Typical Development Session

1. **Start all servers** (once per session):
   ```powershell
   .\scripts\dev-watch-all.ps1
   ```

2. **Make changes** to any file:
   - Edit `admin-portal/src/pages/TempleListPage.tsx`
   - Save file (Ctrl+S)
   - Browser updates automatically ✨

3. **See changes instantly**:
   - Admin Portal: Refresh happens automatically
   - Mobile App: Shake device or press 'r' in Expo
   - Backend: Server restarts automatically

4. **Commit when ready**:
   ```powershell
   .\scripts\auto-commit-dev.ps1 -Message "Your changes"
   ```

### No Manual Deployment Needed!

For development, you DON'T need to:
- ❌ Run build commands
- ❌ Restart servers manually
- ❌ Deploy anywhere
- ❌ Wait for compilation

Everything happens automatically! 🎉

## Manual Server Start (Alternative)

If you prefer to start servers individually:

### Backend
```powershell
cd src/local-server
npm start
# Server runs on http://localhost:4000
# Auto-restarts on file changes
```

### Admin Portal
```powershell
cd admin-portal
npm run dev
# Opens http://localhost:5173
# Hot reload enabled
```

### Mobile App
```powershell
cd mobile-app
npx expo start
# Opens Expo Dev Tools
# Scan QR code with Expo Go app
```

## How Hot Reload Works

### Admin Portal (Vite)
```
You save file → Vite detects change → HMR updates browser → Done!
                                    (< 1 second)
```

### Mobile App (Expo)
```
You save file → Metro bundler detects → Fast Refresh updates app → Done!
                                       (< 2 seconds)
```

### Backend (Nodemon)
```
You save file → Nodemon detects → Restarts server → Done!
                                 (2-3 seconds)
```

## Configuration Files

### Backend Auto-Restart
`src/local-server/package.json`:
```json
{
  "scripts": {
    "start": "nodemon --watch src --exec ts-node src/server.ts"
  }
}
```

### Admin Portal HMR
`admin-portal/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5173,
    hmr: true  // Hot Module Replacement enabled
  }
})
```

### Mobile App Fast Refresh
`mobile-app/metro.config.js`:
```javascript
module.exports = {
  transformer: {
    enableBabelRCLookup: false,
  },
  // Fast Refresh is enabled by default
}
```

## Troubleshooting

### Hot Reload Not Working

#### Admin Portal
```powershell
# Clear cache and restart
cd admin-portal
rm -rf node_modules/.vite
npm run dev
```

#### Mobile App
```powershell
# Clear Metro cache
cd mobile-app
npx expo start --clear
```

#### Backend
```powershell
# Restart nodemon
cd src/local-server
npm start
```

### Changes Not Appearing

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. **Reload app**: Shake device → "Reload"
3. **Check console**: Look for errors in terminal

### Port Already in Use

```powershell
# Kill process on port 5173 (Admin Portal)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Kill process on port 4000 (Backend)
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

## Best Practices

### 1. Keep Servers Running
- Start servers once at beginning of day
- Leave them running while you work
- They'll auto-reload on every save

### 2. Save Frequently
- Changes only appear when you save
- Use `Ctrl + S` after every edit
- Auto-save in VS Code: `File → Auto Save`

### 3. Watch the Console
- Keep terminal windows visible
- Check for errors after saving
- Red text = something broke

### 4. Commit Regularly
```powershell
# After completing a feature
.\scripts\auto-commit-dev.ps1 -Message "Feature: Button sizing fix"

# End of day
.\scripts\auto-commit-dev.ps1 -Message "EOD: UI improvements"
```

## Development vs Production

### Development (What You're Doing Now)
- ✅ Hot reload enabled
- ✅ Source maps for debugging
- ✅ Detailed error messages
- ✅ Fast compilation
- ❌ Not optimized
- ❌ Larger bundle sizes

### Production (Later)
- ❌ No hot reload
- ✅ Optimized bundles
- ✅ Minified code
- ✅ Fast loading
- ✅ Small bundle sizes
- ❌ Harder to debug

## When to Actually Deploy

You only need to deploy when:

### Staging Deployment
- ✅ Feature is complete and tested
- ✅ Ready for team review
- ✅ Want to share with stakeholders

```powershell
.\scripts\auto-deploy-all.ps1 -Environment staging
```

### Production Deployment
- ✅ Tested in staging
- ✅ Approved by team
- ✅ Ready for users

```powershell
.\scripts\auto-deploy-all.ps1 -Environment production
```

## Typical Day Workflow

### Morning (9:00 AM)
```powershell
# Start all dev servers
.\scripts\dev-watch-all.ps1

# Open your code editor
code .
```

### During Development (9:00 AM - 5:00 PM)
```
1. Edit code
2. Save file (Ctrl+S)
3. See changes instantly
4. Repeat
```

### Periodic Commits
```powershell
# Every hour or after completing a feature
.\scripts\auto-commit-dev.ps1 -Message "Progress update"
```

### End of Day (5:00 PM)
```powershell
# Final commit
.\scripts\auto-commit-dev.ps1 -Message "EOD: Completed button UI improvements"

# Close terminal windows (stops servers)
```

## Advanced: File Watching

### What Files Trigger Reload?

#### Admin Portal
- `.tsx`, `.ts` files → Instant HMR
- `.css` files → Instant style update
- `.json` files → Full reload

#### Mobile App
- `.tsx`, `.ts` files → Fast Refresh
- `assets/*` → Requires app restart
- `app.json` → Requires app restart

#### Backend
- `.ts`, `.js` files → Auto-restart
- `.json` files → Auto-restart
- `.env` files → Manual restart needed

## Summary

For rapid development with frequent changes:

1. ✅ **Start servers once**: `.\scripts\dev-watch-all.ps1`
2. ✅ **Edit and save**: Changes appear automatically
3. ✅ **Commit regularly**: `.\scripts\auto-commit-dev.ps1`
4. ❌ **No manual deployment**: Not needed for dev!

Your development environment is optimized for speed. Just code, save, and see your changes instantly! 🚀

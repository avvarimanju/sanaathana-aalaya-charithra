# Migration Checklist

Use this checklist to ensure a smooth transition to the new project structure.

## ✅ Completed (Automatic)

- [x] Created `/backend` directory
- [x] Moved `/src` to `/backend/src`
- [x] Moved `/infrastructure` to `/backend/infrastructure`
- [x] Copied `template.yaml` to `/backend/template.yaml`
- [x] Copied `cdk.json` to `/backend/cdk.json`
- [x] Copied `package_backend.json` to `/backend/package.json`
- [x] Copied `tsconfig.json` to `/backend/tsconfig.json`
- [x] Copied environment files to `/backend/`
- [x] Created `/shared` directory structure
- [x] Created `/shared/types`, `/shared/utils`, `/shared/constants`
- [x] Updated root `package.json` with workspace configuration
- [x] Created README files for `/backend` and `/shared`
- [x] Updated main README.md with new structure
- [x] Created REORGANIZATION_GUIDE.md
- [x] Created PROJECT_STRUCTURE.md
- [x] Created MIGRATION_CHECKLIST.md

## ⏳ Manual Tasks Required

### 1. Verify Backend Setup

- [ ] Navigate to `/backend` and run `npm install`
- [ ] Verify all dependencies install correctly
- [ ] Run `npm run build` to ensure TypeScript compiles
- [ ] Run `npm test` to verify tests pass
- [ ] Start local server: `npm run start:local`
- [ ] Verify backend responds at http://localhost:3000

### 2. Update Scripts

Review and update scripts in `/scripts` directory:

- [ ] `scripts/start-local-backend.ps1` - Update paths to `/backend`
- [ ] `scripts/init-local-db.ps1` - Verify paths
- [ ] `scripts/start-local-integration.ps1` - Update paths
- [ ] `scripts/test-backend.ps1` - Update to use `/backend`
- [ ] `scripts/run-all-tests.ps1` - Update paths
- [ ] Any custom scripts you've created

**Example Update:**
```powershell
# OLD
cd src
npm run build

# NEW
cd backend
npm run build
```

### 3. Update CI/CD Workflows

Update `.github/workflows/*.yml` files:

- [ ] `deploy-staging.yml` - Update working directories
- [ ] `deploy-production.yml` - Update working directories
- [ ] Any other workflow files

**Example Update:**
```yaml
# OLD
- name: Build Backend
  run: |
    npm install
    npm run build

# NEW
- name: Build Backend
  working-directory: ./backend
  run: |
    npm install
    npm run build
```

### 4. Update Documentation

- [ ] Review all docs in `/docs` for path references
- [ ] Update any references to `/src` → `/backend/src`
- [ ] Update any references to `/infrastructure` → `/backend/infrastructure`
- [ ] Update deployment guides
- [ ] Update API documentation

### 5. Update Import Paths (If Needed)

Most imports should still work, but check:

- [ ] Backend internal imports (should work as-is)
- [ ] Admin portal imports (check if any reference backend)
- [ ] Mobile app imports (check if any reference backend)
- [ ] Test files that import from backend

### 6. Environment Variables

- [ ] Verify `/backend/.env.development` has correct values
- [ ] Verify `/backend/.env.example` is up to date
- [ ] Update any scripts that reference environment files
- [ ] Test environment variable loading

### 7. Test All Applications

#### Backend
```bash
cd backend
npm install
npm run build
npm test
npm run start:local
```

- [ ] Backend builds successfully
- [ ] Backend tests pass
- [ ] Local server starts
- [ ] API endpoints respond correctly

#### Admin Portal
```bash
cd admin-portal
npm install
npm run dev
```

- [ ] Admin portal starts
- [ ] Can connect to backend
- [ ] All features work
- [ ] Tests pass

#### Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

- [ ] Mobile app starts
- [ ] Can connect to backend
- [ ] All features work
- [ ] Tests pass

### 8. Integration Testing

- [ ] Start LocalStack: `docker-compose up -d`
- [ ] Initialize database: `.\scripts\init-local-db.ps1`
- [ ] Start backend: `.\scripts\start-local-backend.ps1`
- [ ] Start admin portal: `cd admin-portal && npm run dev`
- [ ] Test full workflow: Create temple → View in admin → View in mobile
- [ ] Test state management features
- [ ] Test pricing calculator

### 9. Clean Up Old Files (Optional)

After verifying everything works, you can optionally remove old files:

⚠️ **WARNING: Only do this after thorough testing!**

- [ ] Backup project first
- [ ] Remove old `/src` directory (now in `/backend/src`)
- [ ] Remove old `/infrastructure` directory (now in `/backend/infrastructure`)
- [ ] Remove `package_backend.json` (now `/backend/package.json`)
- [ ] Remove old `template.yaml` (now `/backend/template.yaml`)
- [ ] Remove old `cdk.json` (now `/backend/cdk.json`)

**Cleanup Commands:**
```powershell
# ONLY RUN AFTER THOROUGH TESTING
Remove-Item -Recurse -Force Sanaathana-Aalaya-Charithra/src
Remove-Item -Recurse -Force Sanaathana-Aalaya-Charithra/infrastructure
Remove-Item -Force Sanaathana-Aalaya-Charithra/package_backend.json
Remove-Item -Force Sanaathana-Aalaya-Charithra/template.yaml
Remove-Item -Force Sanaathana-Aalaya-Charithra/cdk.json
```

### 10. Update Team Documentation

- [ ] Notify team members of structure change
- [ ] Share REORGANIZATION_GUIDE.md
- [ ] Update onboarding documentation
- [ ] Update README with any team-specific notes
- [ ] Schedule team walkthrough if needed

### 11. Git Operations

- [ ] Review all changes: `git status`
- [ ] Stage new files: `git add .`
- [ ] Commit changes: `git commit -m "refactor: reorganize to monorepo structure"`
- [ ] Push to remote: `git push`
- [ ] Update any open PRs with new paths

### 12. Optional Enhancements

Consider these future improvements:

- [ ] Set up npm/yarn/pnpm workspaces
- [ ] Move common types to `/shared/types`
- [ ] Move common utilities to `/shared/utils`
- [ ] Create shared ESLint configuration
- [ ] Create shared Prettier configuration
- [ ] Set up Turborepo or Nx for better monorepo management
- [ ] Create shared testing utilities
- [ ] Set up shared Storybook (for components)

## Verification Commands

Run these commands to verify everything works:

```bash
# 1. Install all dependencies
npm install

# 2. Build all apps
npm run build:all

# 3. Test all apps
npm run test:all

# 4. Start backend
npm run dev:backend

# 5. Start admin portal (in new terminal)
npm run dev:admin

# 6. Start mobile app (in new terminal)
npm run dev:mobile
```

## Rollback Plan

If you encounter issues, you can rollback:

1. The old structure still exists (we copied, not moved)
2. Simply continue using old paths
3. Remove `/backend` and `/shared` directories
4. Revert changes to root `package.json` and `README.md`

## Success Criteria

You've successfully migrated when:

- ✅ All applications build without errors
- ✅ All tests pass
- ✅ Local development works end-to-end
- ✅ CI/CD pipelines work (if applicable)
- ✅ Team members can onboard with new structure
- ✅ Documentation is updated

## Need Help?

- Review [REORGANIZATION_GUIDE.md](REORGANIZATION_GUIDE.md)
- Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Check [docs/getting-started/quick-start.md](docs/getting-started/quick-start.md)
- Open an issue on GitHub

## Timeline Estimate

- **Quick verification:** 30 minutes
- **Full testing:** 2-4 hours
- **Script updates:** 1-2 hours
- **CI/CD updates:** 1-2 hours
- **Documentation updates:** 1-2 hours
- **Total:** 1-2 days for thorough migration

## Notes

- The old structure is preserved (copied, not moved)
- You can work in parallel with old structure during transition
- No breaking changes to application code
- Only path references need updating
- Take your time and test thoroughly

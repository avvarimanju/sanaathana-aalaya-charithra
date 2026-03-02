# Admin Portal - Quick Start Guide

## Run on Localhost

### Option 1: Quick Start (Recommended)
```bash
cd admin-portal
npm run dev
```

The dashboard will open at: **http://localhost:5173**

### Option 2: Step by Step

1. **Navigate to Admin Portal folder**
   ```bash
   cd Sanaathana-Aalaya-Charithra/admin-portal
   ```

2. **Install dependencies** (if not already installed)
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - URL: http://localhost:5173
   - Or press 'o' in terminal to open automatically

## Available Pages

Once running, you can access:

- **Dashboard**: http://localhost:5173/
- **Temple List**: http://localhost:5173/temples
- **Artifact List**: http://localhost:5173/artifacts
- **Content Generation**: http://localhost:5173/content-generation
- **User Management**: http://localhost:5173/users

## Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Stopping the Server

Press `Ctrl + C` in the terminal to stop the development server.

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

### Dependencies Not Installed
```bash
npm install
```

### Clear Cache and Restart
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### TypeScript Errors
```bash
npm run type-check
```

## Environment Configuration

The dashboard uses environment variables for API configuration:

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

## Features Available

- ✅ Temple Management
- ✅ Artifact Management
- ✅ Content Generation
- ✅ User Management
- ✅ Defect Tracking
- ✅ Dashboard Overview

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool (Fast!)
- **React Router** - Navigation

## Next Steps

After starting the server:
1. Open http://localhost:5173 in your browser
2. Navigate through different pages using the sidebar
3. Test the UI and functionality
4. Make changes and see hot reload in action

---

*Quick Start Guide - Admin Portal*
*Last Updated: 2026-02-27*

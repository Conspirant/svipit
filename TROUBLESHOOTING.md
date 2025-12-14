# Troubleshooting Image Display Issues

## Images Not Showing?

If the SVIT logo and NAAC badge are not displaying, try these steps:

### 1. Verify File Names and Extensions

Make sure the files in the `public/` folder are named exactly:
- `svit-logo.png` (or `svit-logo.PNG`)
- `naac-badge.png` (or `naac-badge.PNG`)

**Important:** Windows may hide file extensions. To check:
1. Open File Explorer
2. Go to View → Show → File name extensions
3. Verify the files have `.png` or `.PNG` extension

### 2. Restart the Dev Server

After adding images to the `public/` folder:
1. Stop the dev server (Ctrl+C)
2. Start it again with `npm run dev` or `yarn dev`

Vite needs to restart to recognize new files in the public folder.

### 3. Check Browser Console

Open your browser's developer console (F12) and look for:
- ✅ Success messages showing which path worked
- ❌ Error messages showing failed paths
- ⚠️ Warnings if all paths failed

### 4. Verify File Location

The files should be in:
```
project-root/
  └── public/
      ├── svit-logo.png
      └── naac-badge.png
```

NOT in:
- `src/assets/` ❌
- `src/public/` ❌
- Any subfolder ❌

### 5. Clear Browser Cache

Sometimes browsers cache 404 errors. Try:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely

### 6. Check File Permissions

Make sure the image files are readable and not corrupted.

### 7. Alternative: Use Import Statements

If public folder approach doesn't work, you can move images to `src/assets/` and import them:

```typescript
import svitLogo from "@/assets/svit-logo.png";
import naacBadge from "@/assets/naac-badge.png";
```

Then update the component to use these imports instead of public paths.

### Still Not Working?

Check the browser console for specific error messages and share them for further debugging.


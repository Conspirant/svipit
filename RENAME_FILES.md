# 🔧 Fix: Rename Image Files

## The Problem
Your files are named `naac-badge` and `svit-logo` **without the `.png` extension**.

## Quick Fix

**Option 1: Rename in File Explorer (Recommended)**

1. Open the `public` folder in File Explorer
2. Right-click `naac-badge` → Rename
3. Change it to: `naac-badge.png` (make sure to add `.png` at the end)
4. Right-click `svit-logo` → Rename  
5. Change it to: `svit-logo.png` (make sure to add `.png` at the end)

**Option 2: Use PowerShell (Faster)**

Open PowerShell in the project root and run:

```powershell
cd public
Rename-Item "naac-badge" "naac-badge.png"
Rename-Item "svit-logo" "svit-logo.png"
```

## After Renaming

1. **Restart your dev server:**
   - Stop: `Ctrl+C`
   - Start: `npm run dev`

2. **Hard refresh browser:** `Ctrl+Shift+R`

The images should now load! ✅

## Note
The component will now try both `/naac-badge.png` and `/naac-badge` (and same for svit), but it's best to have the proper `.png` extension.


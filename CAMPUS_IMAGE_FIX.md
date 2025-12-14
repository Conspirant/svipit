# Campus Image Not Showing? Here's the Fix

## Quick Checklist

1. **File Location:** Make sure the file is in `public/` folder (not `src/assets/`)
2. **File Name:** Should be exactly `svit-campus.jpg` (or `svit-campus.JPG`)
3. **File Extension:** Make sure it has `.jpg` or `.JPG` extension

## To Check Your File

1. Open the `public` folder
2. Look for a file named `svit-campus.jpg` or `svit-campus.JPG`
3. If it's named differently, rename it to `svit-campus.jpg`

## If File Doesn't Have Extension

1. **Show file extensions in Windows:**
   - File Explorer → View tab → Check "File name extensions"
   
2. **Rename the file:**
   - Right-click → Rename
   - Add `.jpg` at the end: `svit-campus.jpg`

## After Fixing

1. **Restart dev server:**
   - Stop: `Ctrl+C`
   - Start: `npm run dev`

2. **Hard refresh browser:**
   - `Ctrl+Shift+R`

## What You Should See

- Very subtle campus image in the background of the hero section (8% opacity)
- Blurred campus image behind the association badge (10% opacity)

The image should be barely visible but add depth and institutional feel!

## Still Not Working?

Check the browser console (F12) for any error messages about the image path.


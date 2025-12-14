# Image Setup Instructions

## Adding Association Images

To display the Sai Vidya Institute of Technology logo and NAAC accreditation badge, please add the following images to the `public/` folder:

### Required Images:

1. **SVIT Logo** (`svit-logo.png`)
   - Location: `public/svit-logo.png`
   - Recommended size: 200x200px or larger
   - Format: PNG with transparent background
   - This should be the official Sai Vidya Institute of Technology logo

2. **NAAC Badge** (`naac-badge.png`)
   - Location: `public/naac-badge.png`
   - Recommended size: 200x200px or larger
   - Format: PNG with transparent background
   - This should be the NAAC A-Grade accreditation badge

### How to Add:

1. Download or obtain the official SVIT logo and NAAC badge images
2. Save them as `svit-logo.png` and `naac-badge.png` respectively
3. Place both files in the `public/` directory (at the root of your project)
4. The images will automatically appear in the hero section

### Fallback Behavior:

If the images are not found, the component will display:
- A graduation cap icon with "SVIT" text for the logo
- An "A" badge with "NAAC GRADE" text for the accreditation badge

The association badge is displayed prominently at the top of the hero section, showing that the project is created in association with Sai Vidya Institute of Technology, Bangalore.


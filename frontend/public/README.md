# Public Assets Directory

This folder contains all static resources for the frontend (images, icons, fonts, etc.).

## Folder Structure

```
public/
├── images/          # Logos, banners, hero images
├── icons/           # SVG or PNG icons for UI
├── fonts/           # Custom font files (.woff2, .ttf)
└── README.md        # This file
```

## How to Use

### Images

Place image files in `public/images/`:

```tsx
<img src="/images/logo.png" alt="Epson Logo" />
```

### Icons

Place icon files in `public/icons/`:

```tsx
<img src="/icons/printer.svg" alt="Printer Icon" />
```

### Fonts

Place font files in `public/fonts/` and reference in CSS:

```css
@font-face {
  font-family: "CustomFont";
  src: url("/fonts/custom-font.woff2") format("woff2");
}
```

## Recommended Assets to Add

- [ ] Epson logo (logo.png or logo.svg)
- [ ] Favicon (favicon.ico)
- [ ] Printer icon
- [ ] Chat icon
- [ ] Escalation icon
- [ ] Success/error/warning icons
- [ ] Loading spinner animation (GIF or Lottie JSON)
- [ ] Hero/banner images for login page

## File Format Best Practices

- **Images**: Use WebP for modern browsers (with PNG fallback), or optimized JPEG
- **Icons**: Use SVG when possible (scalable, small file size)
- **Logos**: SVG recommended for crisp quality at any size

## Next Steps

1. Add icon library (optional but recommended):
   - Install: `npm install react-icons` (free icon library)
   - Or use: Heroicons, Feather Icons, Material Icons

2. Example with react-icons:

   ```tsx
   import { FaPrint, FaComments } from 'react-icons/fa';

   <FaPrint size={24} />
   <FaComments size={24} />
   ```

3. Add images specific to your Epson product lines
4. Create branded color scheme icons/badges

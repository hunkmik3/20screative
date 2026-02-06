# 20sCreative Portfolio

A premium photography and filmmaking portfolio website built with Next.js, inspired by [Vivienne & Tamas](https://www.vivienneandtamas.com/).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd portfolio-20s
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

## 📁 Project Structure

```
portfolio-20s/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Homepage with video background
│   │   ├── jewelry/           # Jewelry gallery page
│   │   ├── beauty/            # Beauty gallery page
│   │   ├── fashion/           # Fashion gallery page
│   │   ├── showreel/          # Video showreel page
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact page
│   │   ├── privacy-policy/    # Privacy policy
│   │   └── disclaimer/        # Disclaimer
│   ├── components/            # Reusable components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── Footer.tsx         # Footer
│   │   ├── Gallery.tsx        # Image gallery grid
│   │   ├── Lightbox.tsx       # Image lightbox viewer
│   │   └── VideoPlayer.tsx    # Custom video player
│   └── data/
│       └── gallery.ts         # Gallery images & site config
└── public/
    ├── images/                # Your images
    └── videos/                # Your videos
```

## 🖼️ Replace Placeholder Content

### 1. Replace Images
Edit `src/data/gallery.ts` to add your own images:

```typescript
export const jewelryImages: GalleryImage[] = [
  {
    id: "jewelry-1",
    src: "/images/jewelry/your-image.jpg", // Local image
    // or
    src: "https://your-cdn.com/image.jpg", // External image
    alt: "Description of image",
    width: 800,
    height: 1200,
  },
  // Add more images...
];
```

### 2. Replace Videos
Add your videos to `public/videos/`:
- `showreel.mp4` - Homepage background video
- `showreel-fashion.mp4` - Fashion showreel
- `showreel-beauty.mp4` - Beauty showreel

### 3. Update Site Config
Edit `src/data/gallery.ts`:

```typescript
export const siteConfig = {
  name: "20sCreative",
  tagline: "Your tagline here",
  email: "your@email.com",
  phone: "+84.XXX.XXX.XXX",
  // ...
};
```

## 🎨 Customization

### Colors
Edit CSS variables in `src/app/globals.css`:

```css
:root {
  --color-bg: #0a0a0a;           /* Background */
  --color-text: #ffffff;          /* Text */
  --color-accent: #d4af37;        /* Accent (gold) */
  /* ... */
}
```

### Fonts
The site uses:
- **Cormorant Garamond** - Display/headings
- **Inter** - Body text

Change in `src/app/layout.tsx`.

## 📱 Features

- ✅ Fullscreen video background homepage
- ✅ Responsive image gallery with lightbox
- ✅ Smooth page transitions
- ✅ Mobile-friendly navigation
- ✅ SEO optimized
- ✅ Dark luxury theme
- ✅ Keyboard navigation in lightbox

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Static Export
```bash
npm run build
# Output in .next folder
```

## 📄 License

This project is for personal portfolio use.

---

Made with ❤️ by 20sCreative

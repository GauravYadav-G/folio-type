# Folio — Interactive Variable Type Foundry · Amsterdam

**Variable Type Foundry · Amsterdam, Netherlands** · Standalone Production Website

Independent type foundry publishing expressive variable typefaces with real-time browser manipulation of optical size, weight, width, and casualness.

---

## Key Highlights & Features

- **Interactive Variable Font Sandbox**: Live sliders for weight (100–1000), width (50–150), optical size (12–96), casualness, and monospace axes.
- **Typeface Catalog**: Tarn (Display variable), Bruit (Grotesque optical size), and Casa (Casual to mono).
- **Variable Font Breathing Loop**: Kinetic showcase demonstrating font-variation-settings interpolation in real time.
- **Commercial Licensing Drawer**: Instant license selection (Desktop, Web, App) with instant checkout.

---

## Quick Start

Run this website locally in development mode:

```bash
# Navigate to this website
cd websites/folio

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Project Structure

```
websites/folio/
├── index.html           # Bespoke page title, fonts, meta & theme color
├── package.json         # Standalone dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Bundler config with Tailwind CSS v4 & single-file
├── README.md            # Quick-start documentation
├── public/              # Dedicated assets
└── src/
    ├── main.tsx         # React root
    ├── App.tsx          # Standalone application entry
    ├── index.css        # Tailwind v4 theme & animation tokens
    ├── lib/             # Shared motion, WebGL canvas, smooth scroll & images
    └── ...              # Dedicated components and data
```

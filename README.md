# Tower Defense

A browser-based tower defense game built with React, TypeScript, Vite, and Canvas 2D.

## Play

[Play online](https://ai-test-2-three.vercel.app/)

Or run locally:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- 4 tower types: Basic, Sniper, Splash, Slow
- 4 enemy types: Normal, Fast, Tank, Boss
- 3 difficulty levels: Easy, Medium, Hard
- 12 waves per game
- Tower upgrades (3 levels)
- Sell towers for 50% refund
- Game speed controls (1x, 2x, 3x)
- Pause/resume
- Responsive HiDPI canvas

## Controls

| Key | Action |
|-----|--------|
| Space | Pause / Resume |
| > | Cycle speed (1x → 2x → 3x) |
| 1-4 | Select tower |
| Esc | Deselect tower |
| U | Upgrade selected tower |
| S | Sell selected tower |

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Canvas 2D
- Vitest

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Check code style
npm run typecheck  # Verify TypeScript types
npm run test       # Run test suite
```

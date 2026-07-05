# Agents

## Project

Minimalist tower defense game built with Vite, React, TypeScript, and Tailwind CSS. No backend — client-side game logic with Canvas 2D rendering. Inspired by Bloons TD. SPA with responsive design, optimized for performance.

## MVP

### Towers (4 types)

- **Basic** — balanced damage and range
- **Sniper** — high damage, long range, slow fire rate
- **Splash** — area damage, medium range
- **Slow** — reduces enemy movement speed

### Enemies (4 types)

- **Normal** — balanced stats
- **Fast** — high speed, low health
- **Tank** — slow, high health
- **Boss** — appears at end of wave, very high health

### Difficulty Levels

- **Easy** — fewer enemies, slower speed
- **Medium** — moderate count and speed
- **Hard** — more enemies, faster, higher health

### Mechanics

- Wave-based enemy spawning
- Grid-based tower placement
- Money earned per kill
- Tower upgrades (3 levels each)
- Health system — enemies reaching the end reduce lives

### Visual Style

- Simple geometric shapes (circles, squares)
- Rainbow color palette
- Canvas 2D rendering

## Commands

- `npm run lint` – Check code style
- `npm run typecheck` – Verify TypeScript types
- `npm test` – Run test suite
- `npm run build` – Create production build

## Guidelines

### Conventions

- Follow existing code style and patterns
- Run lint and typecheck after changes
- Do not add comments unless requested

### Workflow

1. Explore the codebase to understand patterns
2. Plan approach — consider trade-offs, security, edge cases
3. Write tests when applicable
4. Verify with lint and typecheck

### Principles

- **Clean code**: meaningful names, small focused functions, DRY, no dead code, no secrets
- **Accessibility**: semantic HTML, keyboard navigation, ARIA labels, color contrast
- **Performance**: minimize bundle size, lazy load where appropriate
- **Security**: never commit secrets, validate and sanitize inputs

### Communication

- Be concise
- Reference file paths with line numbers when relevant
- Do not add explanations unless asked

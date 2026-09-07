# Personal Homepage

An interactive personal homepage built with React, TypeScript, and Vite. It features an animated 3D name and a playful bouncing-football toy layered on top.

## Features

- **3D animated title** — the name renders as gradient text with a shimmering color sweep, a slow 3D spin, a floating bob, and a synced neon glow. Move the mouse to tilt it in 3D following the cursor.
- **Bouncing footballs** — a ⚽ bounces around the screen. Click anywhere to spawn more, each with a random direction and speed.
- **Ball-to-ball collisions** — footballs collide with each other using equal-mass elastic physics.
- **Corner hits** — when a ball hits a corner the counter ticks up. With more than one ball on screen, a corner hit removes that ball (the last one always survives).
- **Live counters** — on-screen readouts for corner hits and the current number of balls.
- **Background music** — royalty-free chiptune generated live with the Web Audio API; toggle it on/off with the Music button.
- **Reset** — clear all balls and reset the counter.

## Tech stack

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) with the React Compiler enabled

## Getting started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open the printed local URL (default http://localhost:5173/).

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Project structure

- `src/App.tsx` — app component: title animation, ball physics, collisions, counters, and music
- `src/App.css` — styles and keyframe animations
- `src/main.tsx` — app entry point

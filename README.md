# Productivity App

## Setup

```bash
npm install
```

### Run in the browser (fastest for day-to-day frontend work)

```bash
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Run as a desktop window (Electron)

```bash
npm run electron:dev
```

This starts the Vite dev server and opens it in an Electron window instead of
a browser tab — same app, same hot-reload, just in its own window.

### Build a real Windows installer (.exe)

```bash
npm run electron:build
```

Produces an installer under `release/`. Run it once to install the app; after
that it shows up as a normal Windows application with its own icon, no
terminal or browser required.

## Structure

- `src/types/schema.ts` — the shared data model used by every module (Task,
  Project, Job, Event, ResearchNote, Tag, Relation).
- `src/store/useAppStore.ts` — the single Zustand store holding all module
  state, persisted to localStorage.
- `src/modules/todo/` — Module 1: the To-Do List.
- `src/modules/calendar/` — Module 2: the Calendar (month view).
- `src/components/shared/` — cross-module UI: the Tag color palette,
  `CategoryFilter` (filter-by-tag bar), and `TagPicker` (the category
  selector used in both TaskForm and EventForm).
- `electron/main.cjs` — creates the desktop window; loads the Vite dev server
  in development or the built `dist/index.html` in production.
- `electron/preload.cjs` — placeholder preload script (empty for now — no
  renderer-to-OS bridge exists yet, add one here when a module needs it).

## Status

- [x] Module 1: To-Do List (categories via tags, full CRUD)
- [x] Module 2: Calendar (month view, events colored/filterable by the same
      tags as To-Do categories, full CRUD)
- [ ] Module 3: Project Board
- [ ] Module 4: Job Board
- [ ] Module 5: Deep-Dive research

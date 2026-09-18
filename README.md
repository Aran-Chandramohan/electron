# Productivity App

## Setup

```bash
npm install
```

### Run tests

```bash
npm run test
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

### Build a standalone .exe

```bash
npm run electron:build
```

Produces `release/Productivity App <version>.exe` — a single portable
executable (Windows "portable" target, not an NSIS installer). Just
double-click it; nothing to install, no terminal or browser required. NSIS
was tried first but its build step self-launches an intermediate installer
exe to generate the uninstaller, which Windows blocked as an unrecognized
freshly-built binary (`spawn UNKNOWN`) — portable sidesteps that whole
pipeline and is all a single-user local app actually needs.

## Structure

- `src/types/schema.ts` — the shared data model used by every module (Task,
  Project, Job, Event, ResearchNote, Tag, Relation).
- `src/store/useAppStore.ts` — the single Zustand store holding all module
  state, persisted to localStorage.
- `src/modules/todo/` — Module 1: the To-Do List.
- `src/modules/calendar/` — Module 2: the Calendar (day/week/month views).
  - `recurrence.ts` — the recurrence engine (RFC 5545/RRULE-based, via the
    `rrule` package): occurrence expansion, series splitting, validation.
    Has a companion `recurrence.test.ts` (run with `npm run test`).
  - `RepeatSelect.tsx` / `CustomRecurrenceModal.tsx` / `WeekdayToggle.tsx` —
    the recurrence UI (simple picker + progressive-disclosure custom editor).
  - `EditScopeDialog.tsx` — the "This event / This and following / All
    events" chooser shown when editing or deleting a recurring occurrence.
- `src/components/shared/` — cross-module UI: the Tag color palette,
  `CategoryFilter` (filter-by-tag bar), and `TagPicker` (the category
  selector used in both TaskForm and EventForm).
- `electron/main.cjs` — creates the desktop window; loads the Vite dev server
  in development or the built `dist/index.html` in production.
- `electron/preload.cjs` — placeholder preload script (empty for now — no
  renderer-to-OS bridge exists yet, add one here when a module needs it).

## Status

- [x] Module 1: To-Do List (categories via tags, full CRUD)
- [x] Module 2: Calendar (day/week/month views, per-category show/hide
      toggles, events colored by the same tags as To-Do categories, full CRUD)
- [x] Recurring events (daily/weekly/monthly/yearly, custom intervals,
      multi-weekday, end date/count, per-occurrence edit/move/delete
      exceptions, drag-to-reschedule a single occurrence)
- [x] Dark theme (app-wide, no light mode currently)
- [ ] Module 3: Project Board
- [ ] Module 4: Job Board
- [ ] Module 5: Deep-Dive research

# CLAUDE.md — Screenshot Quiz Night

You are a senior frontend engineer working on a live production web app. Read this file fully before making any change.

---

## What this project is

**Screenshot Quiz Night** is a lightweight, Firebase-powered trivia platform built by Screenshot Interactive. It runs on plain HTML, CSS, and vanilla JavaScript. There is no framework, no build step, and no backend beyond Firebase Realtime Database.

It is deployed at `quiz.screenshotinteractive.com` via GitHub Pages (CNAME to `abrown876.github.io/Screenshot-trivia-night`).

There are two distinct product modes. Keep them clearly separated.

1. **Quiz Night (self-serve)** — always available, used for parties and casual play. Existing flow. Must remain unchanged unless explicitly asked.
2. **Featured Quiz (scheduled)** — countdown-based, mass participation, prize-driven. New flow. Build as separate files, do not overload existing ones.

---

## Core principles

- Do not rebuild the system.
- Do not introduce frameworks, bundlers, or runtime dependencies.
- Do not refactor aggressively.
- Make minimal, controlled, surgical changes.
- Preserve stability above all else. This is a live product used at real events.
- When unsure, preserve. Do not delete code unless it is clearly unused or broken.

---

## File structure

```
index.html          Player-facing quiz experience
host.html           Host control panel (desktop-first, three-column layout)
leaderboard.html    TV / public display (live question + leaderboard + winner podium)
join.html           Entry point
demo.html           Practice mode
branding.js         Shared BRANDING config + applyBranding() (NOT yet wired into index.html)
```

All HTML files share a design system. Do not diverge from it.

---

## Design system (do not change without explicit instruction)

- Background: `#080818`
- Primary purple: `#7C6EF6`
- Primary coral: `#FF5C8A`
- Fonts: `Outfit` and `Space Mono` from Google Fonts
- Glassmorphism / layered surfaces with CSS variables
- Radial gradient body overlays

---

## Branding rules (strict, untouchable)

- Screenshot logo stays top left.
- Chilitos sponsor banner stays exactly as is where it appears.
- Footer remains unchanged.
- Do not move, resize, or restyle logos.
- Do not add backgrounds behind transparent PNG logos.
- Do not shrink logos to fix layout problems — fix the layout instead.

Note: Chilitos branding has been **selectively removed** from some views (e.g. leaderboard footer). Do not re-add it without being asked. Do not remove it elsewhere without being asked.

---

## Firebase

- Project: `screenshot-trivia-night` (Realtime Database)
- Same config across all files — do not edit unless rotating credentials
- All Firebase calls are wrapped in `try/catch` so the game degrades gracefully when opened as `file://`. Preserve this pattern in any new code.
- Preserve all existing Firebase reads/writes. Preserve timers, scoring, and game flow logic exactly.
- Do not rename keys, paths, or shared variables (`teams`, `gameState`, `scores`, `commands`, etc.) unless the rename is the actual point of the task.

---

## Hard rules

- **Email collection is mandatory.** Do not make it optional, do not remove the field, do not allow bypass. UX improvements around it are fine; the requirement is not.
- **No frameworks.** No React, Vue, Svelte, jQuery, Tailwind, or build tooling. Vanilla only.
- **No npm install / package.json runtime dependencies.** Dev-only tooling (e.g. linters, local servers) is fine if it stays out of the deployed bundle.
- **External assets over base64.** Sponsor banners, logos, etc. are referenced as external files (e.g. `sponsorbanner.jpg`) and co-deployed. Do not inline as base64.
- **QR codes use inline SVG.** External QR APIs failed to render reliably. Stick with inline SVG.

---

## UX priorities

- Fast onboarding
- Clear states: waiting, live, closed, reveal, results
- Strong readability on mobile and tablet
- Touch-friendly hit targets
- Game-show energy
- Reliability during live play above all else

---

## Working approach

When asked to make a change:

1. Briefly explain what you are changing and why.
2. Implement cleanly with the smallest diff that does the job.
3. Avoid unnecessary edits — do not "tidy up" adjacent code.
4. Include a short test checklist (what to click, what to verify).

When in doubt, ask before doing. A clarifying question is cheaper than a regression.

---

## Known gotchas (learned the hard way)

- **`branding.js` is incomplete.** The config object and `applyBranding()` exist, but `index.html` is not yet wired up with the script tag and DOM hooks (`sponsor-wrap`, `sponsor-logo`, `sponsor-label`, `sponsor-link`, `.footer-text`). Finishing this is on the backlog.
- **Live deployed URL lags behind local files.** When testing via browser automation, prefer JS injection against a local server over hitting the deployed site.
- **Large HTML files truncate when injected into browser tools.** Use `node --check path/to/file.html.js` (or extract scripts) and a local server to validate instead.
- **Questions are randomized per session** via `pickQuestions()` shuffle. Do not assume question order is stable across loads.
- **Host panel supports category filtering and CSV export.** Preserve both when editing host.html.

---

## Deployment

- GitHub Pages, served from the `main` branch
- CNAME to `abrown876.github.io/Screenshot-trivia-night`
- No build step — what you commit is what ships
- Always verify locally (open the file in a browser, hit Firebase, walk a full game flow) before pushing to `main`

---

## When responding in Claude Code

- Use the smallest viable patch.
- Show diffs, not full file rewrites, unless the file is genuinely new.
- After edits, give a one-paragraph summary and a 3–5 item test checklist.
- Flag anything you touched that you weren't explicitly asked to touch. Default to not touching it.

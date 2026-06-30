# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimalist, no-build static site publishing a working research document on cancer pain / opioid
tolerance interventions. There is no compiler, bundler, or package.json — the only "build" is
plain Markdown rendered client-side.

## Running locally

The pages `fetch()` their Markdown source, so they must be served over HTTP, not opened as `file://`:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

There is no lint, test, or build command — there's nothing to compile.

## Architecture

Two HTML shells render Markdown into the same DOM structure via `js/script.js` (vanilla JS, no
framework, no bundler):

- **`index.html`** — fixed `data-md-file`, always loads `cancer-pain-relief.md` (the top-level
  document: summary, access gap, tolerance/dependence/OIH framing, and the mechanism landscape table).
- **`mechanism.html`** — a single reusable template. It reads a `?candidate=<slug>` query param
  (`data-md-param="candidate"`, `data-md-base="mechanisms"`) and fetches `mechanisms/<slug>.md`.
  Every row in the mechanism landscape table in `cancer-pain-relief.md` links here, e.g.
  `mechanism.html?candidate=ketamine`. The slug must match `^[a-z0-9-]+$` or the page refuses to load.

`js/script.js` does all the DOM work after `marked.js` parses the Markdown:
- Wraps each `<h2>` and its following content into a `<section class="mapping-section">` with a
  slugified `id` (`wrapSections`) — this is what the TOC and scroll-spy hook into.
- Builds a sidebar TOC (`buildToc`) from those sections, and a breadcrumb (`buildBreadcrumb`) on
  mechanism pages using `data-home-label`/`data-home-href` from `<body>`.
- Wires scroll-spy + a reading-progress bar, and wraps every `<img>` in a click-to-zoom lightbox.
- Opens external links in a new tab.

Because the section/TOC/breadcrumb structure is generated from `<h2>` boundaries at render time,
the heading hierarchy in the Markdown source *is* the page structure — there's no separate config.

## Content model

- **`cancer-pain-relief.md`** — the top-level document. Its `## Mechanism landscape` table is the
  index of every intervention candidate; each row's verdict/status must stay in sync with the
  corresponding file in `mechanisms/`.
- **`mechanisms/*.md`** — one file per candidate, following a fixed four-section template:
  `## What it is` → `## Human evidence` → `## Why it failed / what would change the verdict` →
  `## Verdict`. Keep new candidate pages in this shape; the `status-active` / `status-pending`
  badges in the landscape table (`<span class="status status-active">…</span>`) are CSS classes
  defined in `css/main.css`, not Markdown syntax.
- Citations are Markdown reference-style links collected at the bottom of each file
  (`[1]: https://...`). Every claim should trace to one of these.

## The `research/` directory

`research/` is git-ignored (see `.gitignore`: "Private working material — not for the public
site") — it is never committed and has no public-facing role. It's the private corpus the
published pages are drafted from: raw source dumps (`research/dump`), a cleaned corpus
(`research/dump-cleaned`), draft reports (`research/report`), and source PDFs (`research/papers`).
Treat anything under `research/` as scratch/source material, not something to wire into the site.

## Writing conventions

- No em dashes in prose anywhere in this repo (page content or commit messages) — use commas,
  parentheses, or separate sentences instead.
- When adding or updating a mechanism page: gather the real evidence first (don't draft from
  memory), use one verbatim quote per key claim with its source, and verify each link resolves
  before finalizing. A page should prove the one-line verdict the landscape table states, not just
  restate it.

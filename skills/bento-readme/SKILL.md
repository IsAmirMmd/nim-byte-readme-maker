---
name: bento-readme
description: Makes a bento-grid GitHub profile README (github.com/<user>/<user>, or an organization's .github/profile/README.md) in the نیم‌بایت (nimbyte) look - rounded tiles of different sizes on a cream ground, drawn as images because GitHub strips CSS - from the user's own information, in English (left to right) or Persian (right to left), with optional stats tiles (contributions, streaks, profile views, the last year) that a GitHub Action redraws every six hours. Use it whenever someone wants a new, nicer or "bento" GitHub profile README, to restyle their GitHub profile or organization page, or to update one this skill made («ریدمی گیت‌هاب»، «پروفایل گیت‌هابم رو خوشگل کن»، «بنتو گرید»).
---

# bento-readme

A GitHub profile README in tiles, like [IsAmirMmd's](https://github.com/IsAmirMmd). The tiles are
PNGs drawn from one file, `.bento/profile.json`, by plain Node scripts, so any agent (or a person)
can make and update it. Read `references/design.md` before writing the user's copy or changing
a tile: it has the look's rules and why the README is built the way it is.

Talk to the user in their language. Ask only for what you can't find yourself.

## What gets made, in the user's profile repo

```
README.md                       the tiles, between <!-- bento:start --> and <!-- bento:end -->
.bento/profile.json             everything the tiles say: the one file to edit
.bento/images/                  the user's pictures: a photo or avatar, project screenshots
.bento/scripts/, .bento/fonts/  this skill's scripts and fonts (Vazirmatn, JetBrains Mono; OFL)
assets/bento/v<N>/              the tiles (a new N on every build, so GitHub's cache never shows old ones)
assets/bento/stats/             the stats tiles, redrawn by the workflow
.github/workflows/bento-stats.yml   only with stats
```

Text outside the markers in an existing README is kept. A README without markers is replaced,
after a copy is saved to `.bento/README.before-bento.md`.

## Steps

1. **Find the repo.** A personal profile README lives in the repo named exactly like the user's
   GitHub username (`<user>/<user>`, public); an organization's lives in `<org>/.github` at
   `profile/README.md` (then run everything inside `profile/`'s parent and move README.md into
   `profile/`, or keep `.bento` at the root and copy the block). Clone it, or create it if it doesn't exist
   and the user agrees.
2. **Set it up:** `node <this skill>/scripts/init.mjs <repo> --lang en|fa [--stats]`. `--lang fa`
   makes the tiles Persian and right to left (rows run from the right); `en` is English, left to
   right. Ask which one if it isn't obvious from how the user writes. `--stats` adds the workflow.
3. **Gather the content** into `.bento/profile.json` (the starting one is
   `examples/profile.<lang>.json`; every section is optional, leave out what doesn't apply):
   - Read what already exists before asking: the current README, the user's site, their résumé
     or LinkedIn text if they paste it, their pinned repos (`gh api users/<user>/repos`).
   - Ask for what's missing, a few questions at a time: name and one-line role; what they do now;
     a project, studio or product to feature; their stack; three projects with a link each;
     experience and education; how to reach them.
   - Pictures: a photo or avatar for the `image` tile, and a real screenshot or cover (wider than
     tall, about 1200×560 shows best) for each project, saved in `.bento/images/`. Never invent
     a mock-up and present it as their work; a project tile without an image is fine.
   - Write short: tiles hold one or two lines each (limits in `references/design.md`).
4. **Install Playwright** in the repo once, if it isn't there:
   `npm i --no-save playwright && npx playwright install chromium` (node_modules is gitignored).
5. **Build:** `node .bento/scripts/build.mjs` (from the repo root).
6. **Check it:** `node .bento/scripts/preview.mjs` writes `.bento/build/preview-light.png`,
   `preview-dark.png` and `preview-phone.png`, the README as GitHub roughly shows it. Look at
   them: text that overflows a tile, a row that wraps, a picture cropped badly. Fix the copy in
   profile.json and build again. Show the user the previews before you push.
7. **Push** to the repo's default branch, with the user's go-ahead (it's their public profile):
   `README.md`, `.bento/` (not `.bento/build/`), `assets/bento/`, `.gitignore`, and the workflow.
8. **Stats** (if wanted): the workflow runs after the push (it watches `.bento/profile.json`),
   fetches the numbers with the repo's own `GITHUB_TOKEN`, draws `assets/bento/stats/`, adds the
   stats rows to the README and commits. Locally, `GITHUB_TOKEN=… node .bento/scripts/stats.mjs`
   then a build does the same. The views counter is komarev.com's, through a 1px image in the
   README (it counts the visits that load it).

## Updating later

Edit `.bento/profile.json` (or ask the agent to), build, preview, push. To change the colours,
add a `"theme"` object with any of: ink, muted, cream, sand, paper, accent, accentInk,
accentSoft, blueSoft, greenSoft. Keep one accent; see the design rules.

## profile.json

| Key | What |
| --- | --- |
| `github` | username: the stats and the views counter |
| `lang` | `en` (default, left to right) or `fa` (right to left); `dir` overrides the direction |
| `stats` | `true` for the stats rows (needs the workflow), `false` to leave them out |
| `hero` | `label`, `title`, `lead`, `chips[]`: the first, wide tile |
| `image` | `src`, `caption`, `tone`, `href`: a picture beside the hero |
| `now` | `label`, `title`, `meta`, `text`: the dark tile (it gets a dark-theme variant) |
| `feature` | `label`, `title`, `titleDir`, `subtitle`, `text`, `chips[]`, `href`: the one accent tile |
| `stack` | `[{ group, items[] }]`: one full-width tile, a line per group |
| `projects` | `[{ title, text, image, href }]`: rows of three |
| `experience` | `[{ when, role, where }]` |
| `education` | `title`, `text`, `chips[]`, `label` |
| `contacts` | `[{ label, value, href }]`: up to five, one row |
| `notes` | `[{ label, title, text, tone, href }]`: free tiles of text (ids `note-1`, `note-2`, …) |
| `blocks` | `[{ type, … }]`: extra tiles (ids `block-1`, `block-2`, …), `type` one of: `quote` (text, author), `chips` (label, items[]), `number` (label, value, text), `status` (label, title, text), `photo` (src, caption: an image filling the tile), `links` (label, items[{name, value}]); each takes `tone` and `href` |
| `layout` | the order and widths: rows of tile ids, each a string or `{ id, width }` (widths on a 1000 scale; missing ones share what's left). Ids: `hero`, `image`, `now`, `feature`, `stack`, `work-N`, `experience`, `education`, `contact-N`, `note-N`, `block-N`. Without it, the default order. The editor site writes it |
| `theme` | colour overrides |

`tone` (image and note tiles): `accent-soft`, `blue`, `green`, `sand`, `paper`.

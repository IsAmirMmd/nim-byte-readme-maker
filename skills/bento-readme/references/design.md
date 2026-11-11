# The look, and why the README is built this way

## The bento look (نیم‌بایت's)

- **Tiles, not boxes.** Rounded tiles (24px corners on the 1000px design) of their own size, with
  a 16px gap, on the cream ground. No outlines. Soft shadows only on tiles that are links
  (projects, contacts, the feature tile); flat tiles for what's only read.
- **Tones say what a tile is.** Paper for text, sand for lists (the stack), ink (dark) for the
  one "now" tile, accent-soft / blue / green for the picture and education, and the accent
  (coral) **once** per page, on the feature tile. Text on the accent is ink, never white.
- **Type.** Vazirmatn (Persian and Latin) for text, JetBrains Mono for small labels, handles and
  dates. Labels are short, uppercase in English. Bold titles, muted secondary text.
- **Real pictures.** Project tiles show the real thing: a screenshot, a cover, the app's banner.
  Never a mock-up of boxes standing in for content.

## Copy that fits

The tiles are fixed-width images, so long text overflows or makes tiles tall and uneven.

| Tile | Keep it to |
| --- | --- |
| hero title | 2 lines (about 40 characters) |
| hero lead | 2 lines (about 110 characters); chips: 3, short |
| now title / meta / text | 1 line / 1 line / 3 lines (about 100 characters) |
| feature title | a word or two; subtitle a domain; chips: up to 6 |
| stack | up to 5 groups, up to about 9 items each |
| project | title 1 line, text up to 2 lines (about 50 characters) |
| experience | up to 4 rows; `when` short ("2024–now") |
| contact value | up to about 28 characters |

Persian copy: write it the way the person speaks to their audience, keep technical names in
English (React, Next.js), and use Persian digits in Persian text. The ZWNJ (U+200C) belongs in
words like «می‌سازم» and «نیم‌بایت».

## Why images, and the rules that come from it

- **GitHub strips CSS and most HTML attributes from READMEs**, so a grid can't be laid out with
  styles. Each tile is a PNG (rendered at 2x by Chromium) and the README sets them side by side.
- **Widths are percentages** of the 1000px design (`width="63.9%"`), so the grid scales with the
  page, down to a phone. Each row adds up to just under 100%, or the last tile wraps.
- **No whitespace between the images** of a row (a space would add a gap), and `align="top"` on
  each, which removes the gap under each line that the text baseline would leave.
- **The gap is in the pictures**: each PNG has an 8px transparent margin, so two tiles side by
  side leave 16px between them, and rows (joined by `<br/>`) do the same.
- **Dark theme:** the README can't know the theme, but `<picture>` with
  `media="(prefers-color-scheme: dark)"` can; the dark ink tile gets a variant with a faint edge
  so it doesn't vanish on GitHub's dark page. The other tiles are light and read on both.
- **Caching:** GitHub and browsers cache images by their path. Each build writes a new
  `assets/bento/v<N>/` and the README points to it, so an edit shows at once.
- **Stats:** github-readme-stats-style services are often down or rate-limited, and their cards
  can't match the look. The workflow fetches the numbers itself (GraphQL contributions calendar
  with the repo's `GITHUB_TOKEN`; streaks counted like GitHub's: today without a contribution
  doesn't break one) and draws them as tiles. Profile views come from komarev.com, which counts
  each load of its badge: the README keeps a 1px copy of it so the count goes on.
- **Links:** a tile is a link when its `href` is set; alt text is the tile's text, for screen
  readers and when images don't load.

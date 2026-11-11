// Draws the bento tiles from .bento/profile.json and writes them into README.md.
//   node .bento/scripts/build.mjs [.bento/profile.json] [--stats] [--no-readme]
// Without --stats: every tile, into assets/bento/v<N>/ (a new N each time, so GitHub's image cache
// never shows an old picture; older v folders are removed), and the stats tiles too when
// .bento/stats.json exists. With --stats: only the stats tiles, into assets/bento/stats/ (the
// workflow's daily run). Needs Playwright with Chromium (npm i --no-save playwright).
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TILES, css, themeOf } from "./tiles.mjs";
import { rows as layout, statRows, dirOf, langOf, isStat, statsPlaced } from "./layout.mjs";
import { statTile, yearTile } from "./stat-tiles.mjs";
import { bentoBlock, hasBlock, withBlock } from "./readme.mjs";

const args = process.argv.slice(2);
const profilePath = resolve(args.find((a) => !a.startsWith("--")) ?? ".bento/profile.json");
const statsOnly = args.includes("--stats");
const bento = dirname(profilePath);
const repo = dirname(bento);
const profile = JSON.parse(readFileSync(profilePath, "utf8"));
// pictures named in profile.json are relative to .bento/ (or full URLs)
const local = (src) => (!src || /^(https?|data|file):/.test(src) ? src : pathToFileURL(resolve(bento, src)).href);
if (profile.image) profile.image = { ...profile.image, src: local(profile.image.src) };
profile.projects = (profile.projects ?? []).map((p) => ({ ...p, image: local(p.image) }));
profile.blocks = (profile.blocks ?? []).map((b) => (b.type === "photo" ? { ...b, src: local(b.src) } : b));
const theme = themeOf(profile.theme);
const dir = dirOf(profile);
const lang = langOf(profile);
const statsPath = join(bento, "stats.json");
const stats = profile.stats !== false && existsSync(statsPath) ? JSON.parse(readFileSync(statsPath, "utf8")) : null;

function playwright() {
  for (const from of [join(repo, "package.json"), import.meta.url, join(process.cwd(), "x.js")]) {
    try { return createRequire(from)("playwright"); } catch {}
  }
  throw new Error("Playwright isn't installed: run `npm i --no-save playwright && npx playwright install chromium` in the repo");
}

// stats tiles placed among others are drawn with zeros when only the others' heights need them
const ZERO = { total: 0, since: new Date().toISOString().slice(0, 10), current: { length: 0 }, longest: { length: 0 }, views: 0, lastYear: [0] };
const tileHtml = (t) => (t.kind === "stat" ? statTile(t.data, stats ?? ZERO, lang) : t.kind === "year" ? yearTile(t.data, stats ?? ZERO, lang) : TILES[t.kind](t.data, t));
const page = (rowList) => `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><style>${css(theme, "../fonts")}</style></head><body>
${rowList.map((r) => `<div class="row-box">${r.tiles.map((t) => `<div class="wrap" id="${t.id}" style="width:${t.width}px;min-height:${r.minHeight ?? 0}px">${tileHtml(t)}</div>`).join("")}</div>`).join("\n")}
</body></html>`;

// Draws the rows (so a row's tiles share a height) and screenshots the tiles `pick` keeps.
async function render(rowList, out, pick = () => true) {
  mkdirSync(join(bento, "build"), { recursive: true });
  const file = join(bento, "build", "tiles.html");
  writeFileSync(file, page(rowList));
  mkdirSync(out, { recursive: true });
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const tab = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1100, height: 900 } });
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => { i.onload = i.onerror = ok; }))));
    // the tiles of a row share the tallest one's height
    for (const row of document.querySelectorAll(".row-box")) {
      const h = Math.max(...[...row.children].map((w) => w.offsetHeight));
      for (const w of row.children) w.style.height = `${h}px`;
    }
  });
  for (const r of rowList) for (const t of r.tiles.filter(pick)) {
    await tab.locator(`#${t.id}`).screenshot({ path: join(out, `${t.id}.png`), omitBackground: true });
    if (t.ink) {
      // GitHub's dark theme: an ink tile gets a faint edge so it doesn't sink into the page
      await tab.evaluate((id) => document.querySelector(`#${id} .tile`).classList.add("dark"), t.id);
      await tab.locator(`#${t.id}`).screenshot({ path: join(out, `${t.id}-dark.png`), omitBackground: true });
    }
  }
  await browser.close();
}

const assets = join(repo, "assets", "bento");
const statsFolder = join(assets, "stats");
const main = layout(profile);
const placed = statsPlaced(profile);
// stats tiles: in the rows the layout puts them in, or (without stat ids in the layout) at the end
const stat = stats && !placed ? statRows(profile) : null;
if (stats) await render(placed ? main.filter((r) => r.tiles.some(isStat)) : stat, statsFolder, placed ? isStat : () => true);

const versions = existsSync(assets) ? readdirSync(assets).filter((d) => /^v\d+$/.test(d)).map((d) => Number(d.slice(1))) : [];
let folder = versions.length ? join(assets, `v${Math.max(...versions)}`) : null;
if (!statsOnly) {
  folder = join(assets, `v${Math.max(0, ...versions) + 1}`);
  await render(main, folder, (t) => !isStat(t));
  for (const v of versions) rmSync(join(assets, `v${v}`), { recursive: true });
}
// until the workflow has drawn them, placed stats tiles stay out of the README
const shown = stats ? main : main.map((r) => ({ ...r, tiles: r.tiles.filter((t) => !isStat(t)) })).filter((r) => r.tiles.length);
// --stats keeps the drawn tiles and only rewrites the README block, so the stats row joins it
if (folder && !args.includes("--no-readme")) {
  const block = bentoBlock({ rows: shown, dir, folder: relative(repo, folder), statRows: stat, statsFolder: relative(repo, statsFolder), github: profile.github });
  writeReadme(join(repo, "README.md"), block, join(bento, "README.before-bento.md"));
}
console.log(`${statsOnly ? "stats tiles" : "tiles"}: ${folder ? relative(repo, folder) : "-"}${stats ? ` and ${relative(repo, statsFolder)}` : ""}; README.md updated`);

// Puts the block in README.md: between the markers, or as a new README (keeping a copy of the old one).
function writeReadme(path, block, backup) {
  const old = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (old !== null && !hasBlock(old)) copyFileSync(path, backup);
  writeFileSync(path, withBlock(old, block));
}

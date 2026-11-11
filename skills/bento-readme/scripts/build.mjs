// Draws the bento tiles from .bento/profile.json and writes them into README.md.
//   node .bento/scripts/build.mjs [.bento/profile.json] [--stats] [--no-readme]
// Without --stats: every tile, into assets/bento/v<N>/ (a new N each time, so GitHub's image cache
// never shows an old picture; older v folders are removed), and the stats tiles too when
// .bento/stats.json exists. With --stats: only the stats tiles, into assets/bento/stats/ (the
// workflow's daily run). Needs Playwright with Chromium (npm i --no-save playwright).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TILES, THEMES, css } from "./tiles.mjs";
import { rows as layout, statRows, dirOf, langOf } from "./layout.mjs";
import { statTile, yearTile } from "./stat-tiles.mjs";
import { bentoBlock, writeReadme } from "./readme.mjs";

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
const theme = { ...THEMES.nimbyte, ...(profile.theme ?? {}) };
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

const tileHtml = (t) => (t.kind === "stat" ? statTile(t.data, stats, lang) : t.kind === "year" ? yearTile(t.data, stats, lang) : TILES[t.kind](t.data, t));
const page = (rowList) => `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><style>${css(theme, "../fonts")}</style></head><body>
${rowList.map((r) => `<div class="row-box">${r.tiles.map((t) => `<div class="wrap" id="${t.id}" style="width:${t.width}px;min-height:${r.minHeight ?? 0}px">${tileHtml(t)}</div>`).join("")}</div>`).join("\n")}
</body></html>`;

async function render(rowList, out) {
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
  for (const r of rowList) for (const t of r.tiles) {
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
const stat = stats ? statRows(profile) : null;
if (stats) await render(stat, statsFolder);

const versions = existsSync(assets) ? readdirSync(assets).filter((d) => /^v\d+$/.test(d)).map((d) => Number(d.slice(1))) : [];
const main = layout(profile);
let folder = versions.length ? join(assets, `v${Math.max(...versions)}`) : null;
if (!statsOnly) {
  folder = join(assets, `v${Math.max(0, ...versions) + 1}`);
  await render(main, folder);
  for (const v of versions) rmSync(join(assets, `v${v}`), { recursive: true });
}
// --stats keeps the drawn tiles and only rewrites the README block, so the stats row joins it
if (folder && !args.includes("--no-readme")) {
  const block = bentoBlock({ rows: main, dir, folder: relative(repo, folder), statRows: stat, statsFolder: relative(repo, statsFolder), github: profile.github });
  writeReadme(join(repo, "README.md"), block, join(bento, "README.before-bento.md"));
}
console.log(`${statsOnly ? "stats tiles" : "tiles"}: ${folder ? relative(repo, folder) : "-"}${stats ? ` and ${relative(repo, statsFolder)}` : ""}; README.md updated`);

// Screenshots README.md roughly as GitHub shows it (light, dark and phone width), to check the grid
// before pushing: the tiles line up, nothing wraps, the dark variant shows.
//   node .bento/scripts/preview.mjs [out-dir]   → preview-light.png, preview-dark.png, preview-phone.png
// Remote images (the views counter) don't load offline; that's expected.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const out = resolve(process.argv[2] ?? join(repo, ".bento", "build"));
mkdirSync(out, { recursive: true });
let chromium;
for (const from of [join(repo, "package.json"), import.meta.url]) {
  try { ({ chromium } = createRequire(from)("playwright")); break; } catch {}
}
if (!chromium) throw new Error("Playwright isn't installed: npm i --no-save playwright && npx playwright install chromium");

const md = readFileSync(join(repo, "README.md"), "utf8");
const browser = await chromium.launch();
for (const [name, width, dark] of [["light", 830, false], ["dark", 830, true], ["phone", 360, false]]) {
  const bg = dark ? "#0d1117" : "#ffffff";
  const file = join(repo, `.bento-preview-${name}.html`);
  writeFileSync(file, `<html><body style="margin:0;background:${bg};color:${dark ? "#e6edf3" : "#1f2328"};font:16px/1.5 -apple-system,sans-serif">
<article style="width:${width}px;padding:16px"><style>p{margin:0 0 16px}img{max-width:100%;box-sizing:content-box;background:${bg}}</style>${md}</article></body></html>`);
  const page = await browser.newPage({ viewport: { width: width + 32, height: 800 }, colorScheme: dark ? "dark" : "light" });
  await page.goto(pathToFileURL(file).href);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(out, `preview-${name}.png`), fullPage: true });
  rmSync(file);
}
await browser.close();
console.log(`previews in ${out}`);

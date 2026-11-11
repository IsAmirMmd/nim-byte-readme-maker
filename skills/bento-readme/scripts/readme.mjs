// Writes the tiles into README.md. GitHub strips CSS from READMEs, so the grid is images set side
// by side: no whitespace between them (it would add gaps), align="top" (no baseline gap under a
// row), widths as percentages of the 1000px design that add up to just under 100%.
// No Node APIs here, so the editor site can use it too; build.mjs writes the file.

export const START = "<!-- bento:start -->";
export const END = "<!-- bento:end -->";
const pct = (w) => `${(Math.floor(w) / 10 - 0.1).toFixed(1)}%`;
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function img(tile, src, alt) {
  const tag = `<img src="${src}" width="${pct(tile.width)}" align="top" alt="${esc(alt)}"/>`;
  const pic = tile.ink ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${src.replace(/\.png$/, "-dark.png")}"/>${tag}</picture>` : tag;
  return tile.href ? `<a href="${esc(tile.href)}">${pic}</a>` : pic;
}

// A tile's text for alt: what a screen reader or a broken image shows instead.
const altOf = (t) => {
  const d = t.data;
  if (Array.isArray(d)) return `${t.label}: ${d.map((x) => x.group ? `${x.group}: ${x.items.join(", ")}` : `${x.role} ${x.where ?? ""} ${x.when ?? ""}`).join("; ")}`;
  return [d.title, d.label, d.lead, d.text, d.caption, d.value, d.meta].filter(Boolean).join(" · ") || t.id;
};

export function bentoBlock({ rows, dir, folder, statRows, statsFolder, github }) {
  // a stats tile's picture is in the stats folder, which the workflow redraws
  const base = (t) => (t.kind === "stat" || t.kind === "year" ? statsFolder : folder);
  const line = (tiles) => (dir === "rtl" ? [...tiles].reverse() : tiles).map((t) => img(t, `${base(t)}/${t.id}.png`, altOf(t))).join("");
  const body = rows.map((r) => line(r.tiles));
  if (statRows) body.push(...statRows.map((r) => line(r.tiles)));
  let html = `${START}\n<!-- Made with bento-readme: tiles in ${folder}/, drawn from .bento/profile.json by .bento/scripts/build.mjs. -->\n<p align="center">${body.join("<br/>")}</p>\n`;
  if ((statRows || rows.some((r) => r.tiles.some((t) => t.kind === "stat"))) && github) html += `<!-- komarev counts the views; the number is drawn on a tile above. -->\n<img src="https://komarev.com/ghpvc/?username=${github}" width="1" height="1" alt=""/>\n`;
  return `${html}${END}`;
}

// The README with the block in it: the block between the markers replaced, or the block alone.
export const hasBlock = (old) => old != null && old.indexOf(START) >= 0 && old.indexOf(END) > old.indexOf(START);
export const withBlock = (old, block) => (hasBlock(old) ? old.slice(0, old.indexOf(START)) + block + old.slice(old.indexOf(END) + END.length) : `${block}\n`);

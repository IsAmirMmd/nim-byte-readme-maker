// The tiles: one function per kind, each returning its inner HTML, and the page's CSS.
// Every tile is drawn on a 1000px-wide design canvas; build.mjs screenshots each at 2x.

export const THEMES = {
  // نیم‌بایت's palette (nimbyte.ir): cream ground, paper tiles, ink text, one coral.
  nimbyte: {
    ink: "#20211f", muted: "#5c5650", cream: "#f4efe7", sand: "#ebe3d6", paper: "#fffdf9",
    accent: "#fa604e", accentInk: "#9f3a2b", accentSoft: "#fbdcd4", blueSoft: "#dfe6f7", greenSoft: "#dcebd9",
  },
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chips = (items = [], tone = "") => `<div class="chips">${items.map((c) => `<span class="chip ${tone}">${esc(c)}</span>`).join("")}</div>`;
const label = (text, dot = true) => (text ? `<div class="label">${dot ? "<i></i>" : ""}${esc(text)}</div>` : "");

export const TILES = {
  hero: (p) => `<div class="tile paper">${label(p.label)}<div class="grow"></div>
    <h1>${esc(p.title)}</h1>${p.lead ? `<p class="lead">${esc(p.lead)}</p>` : ""}
    ${p.chips?.length ? `<div style="margin-top:18px">${chips(p.chips, "sand")}</div>` : ""}</div>`,
  image: (p) => `<div class="tile ${p.tone ?? "accent-soft"}" style="align-items:center">
    <img class="picture" src="${esc(p.src)}"><div class="grow"></div>
    ${p.caption ? `<p class="small" style="color:var(--ink)">${esc(p.caption)}</p>` : ""}</div>`,
  now: (p) => `<div class="tile ink">${label(p.label)}<h2 style="margin-top:12px">${esc(p.title)}</h2>
    ${p.meta ? `<p class="small" style="margin-top:2px">${esc(p.meta)}</p>` : ""}<div class="grow"></div>
    ${p.text ? `<p class="small" style="margin-top:14px">${esc(p.text)}</p>` : ""}</div>`,
  feature: (p) => `<div class="tile accent raised">${p.href ? '<div class="arrow">↗</div>' : ""}
    ${label(p.label, false)}<div class="feature-title"><span dir="${p.titleDir ?? "auto"}">${esc(p.title)}</span>
    ${p.subtitle ? `<span class="mono sub">${esc(p.subtitle)}</span>` : ""}</div><div class="grow"></div>
    ${p.text ? `<p class="small" style="color:var(--ink)">${esc(p.text)}</p>` : ""}${p.chips?.length ? chips(p.chips) : ""}</div>`,
  stack: (groups, t) => `<div class="tile sand">${label(t.label ?? "Stack")}<div class="grow"></div><div class="rows">
    ${groups.map((g) => `<div class="row"><span class="when">${esc(g.group)}</span>${chips(g.items, "tight")}</div>`).join("")}</div></div>`,
  project: (p) => `<div class="tile paper raised" style="padding:12px 12px 18px">
    ${p.image ? `<img class="shot" src="${esc(p.image)}">` : ""}<div style="padding:14px 8px 0">
    <h3>${esc(p.title)}</h3>${p.text ? `<p class="small">${esc(p.text)}</p>` : ""}</div></div>`,
  experience: (list, t) => `<div class="tile paper">${label(t.label ?? "Experience")}<div class="grow"></div><div class="rows">
    ${list.map((e) => `<div class="row"><span class="when">${esc(e.when)}</span><span><b>${esc(e.role)}</b>
    ${e.where ? `<span class="small"> · ${esc(e.where)}</span>` : ""}</span></div>`).join("")}</div></div>`,
  education: (p) => `<div class="tile blue">${label(p.label ?? "Education")}<div class="grow"></div>
    <h3>${esc(p.title)}</h3>${p.text ? `<p class="small" style="margin-top:4px">${esc(p.text)}</p>` : ""}
    ${p.chips?.length ? `<div style="margin-top:14px">${chips(p.chips)}</div>` : ""}</div>`,
  contact: (p) => `<div class="tile paper raised" style="padding:20px">${label(p.label, false)}<div class="grow"></div>
    <div class="mono value" style="font-size:${p.value.length > 20 ? 12.5 : 15}px">${esc(p.value)}</div></div>`,
};

export function css(t, fonts) {
  return `
@font-face { font-family: Vazirmatn; src: url(${fonts}/Vazirmatn-Variable.woff2); font-weight: 100 900; }
@font-face { font-family: JBM; src: url(${fonts}/JetBrainsMono-Regular.woff2); font-weight: 400; }
@font-face { font-family: JBM; src: url(${fonts}/JetBrainsMono-ExtraBold.woff2); font-weight: 800; }
:root { --ink:${t.ink}; --muted:${t.muted}; --cream:${t.cream}; --sand:${t.sand}; --paper:${t.paper}; --accent:${t.accent};
  --accent-ink:${t.accentInk}; --accent-soft:${t.accentSoft}; --blue-soft:${t.blueSoft}; --green-soft:${t.greenSoft}; }
* { box-sizing: border-box; margin: 0; }
body { background: transparent; font-family: Vazirmatn, sans-serif; color: var(--ink); padding: 20px; width: 1040px; }
.row-box { display: flex; align-items: stretch; margin-bottom: 30px; }
.wrap { padding: 8px; display: flex; }
.tile { flex: 1; border-radius: 24px; padding: 26px 28px; position: relative; display: flex; flex-direction: column; overflow: hidden; }
.paper { background: var(--paper); } .sand { background: var(--sand); } .accent { background: var(--accent); }
.accent-soft { background: var(--accent-soft); } .blue { background: var(--blue-soft); } .green { background: var(--green-soft); }
.ink { background: var(--ink); color: var(--cream); } .ink.dark { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.16); }
.raised { box-shadow: 0 1px 2px rgba(32,33,31,.05), 0 3px 6px rgba(32,33,31,.05); }
.mono { font-family: JBM, monospace; }
.label { font-family: JBM, monospace; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
  display: flex; align-items: center; gap: 8px; }
[dir=rtl] .label { letter-spacing: 0; text-transform: none; font-family: Vazirmatn; font-size: 14px; font-weight: 600; }
.label i { width: 8px; height: 8px; border-radius: 2px; background: var(--accent); display: inline-block; }
.ink .label { color: rgba(255,255,255,.64); } .accent .label { color: var(--ink); }
h1 { font-size: 46px; line-height: 1.18; font-weight: 900; letter-spacing: -.5px; }
h2 { font-size: 25px; line-height: 1.3; font-weight: 800; } h3 { font-size: 19px; line-height: 1.35; font-weight: 700; }
.lead { font-size: 19px; line-height: 1.6; font-weight: 500; color: var(--muted); margin-top: 12px; }
.small { font-size: 15px; line-height: 1.55; color: var(--muted); } .ink .small { color: rgba(255,255,255,.72); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font-size: 14px; font-weight: 600; padding: 6px 12px; border-radius: 12px; background: var(--paper); }
.chip.sand { background: var(--sand); } .chip.tight { font-size: 13px; padding: 4px 10px; }
.grow { flex: 1; min-height: 12px; }
.rows { display: grid; gap: 10px; } .row { display: flex; gap: 14px; align-items: center; }
.when { font-family: JBM, monospace; font-size: 13px; color: var(--muted); width: 112px; flex: none; }
[dir=rtl] .when { font-family: Vazirmatn; font-size: 14px; }
.arrow { position: absolute; top: 22px; inset-inline-end: 24px; width: 36px; height: 36px; border-radius: 12px; background: rgba(32,33,31,.12);
  display: grid; place-items: center; font-family: JBM; font-weight: 800; font-size: 18px; }
[dir=rtl] .arrow { transform: scaleX(-1); }
.feature-title { display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; margin-top: 4px; font-size: 56px; font-weight: 900; line-height: 1.25; }
.feature-title .sub { font-size: 18px; font-weight: 800; padding-bottom: 12px; }
.picture { max-height: 230px; max-width: 100%; object-fit: contain; margin-top: 4px; border-radius: 16px; }
.shot { width: 100%; aspect-ratio: 1200 / 560; object-fit: cover; border-radius: 16px; display: block; }
.value { font-weight: 800; direction: ltr; text-align: start; } [dir=rtl] .value { text-align: right; }
.num { font-size: 34px; font-weight: 900; line-height: 1.2; letter-spacing: -.5px; }
.unit { font-size: 16px; font-weight: 700; color: var(--muted); letter-spacing: 0; }
.heat { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 13px); gap: 4px; justify-content: space-between; direction: ltr; }
.heat b, .legend b { width: 13px; height: 13px; border-radius: 3px; display: inline-block; }
.legend { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--muted); }
.l0 { background: var(--sand); } .l1 { background: var(--accent-soft); } .l2 { background: color-mix(in srgb, var(--accent) 55%, white); }
.l3 { background: var(--accent); } .l4 { background: var(--accent-ink); }`;
}

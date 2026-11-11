// The tiles: one function per kind, each returning its inner HTML, and the page's CSS.
// Every tile is drawn on a 1000px-wide design canvas; build.mjs screenshots each at 2x.

export const THEMES = {
  // نیم‌بایت's palette (nimbyte.ir): cream ground, paper tiles, ink text, one coral.
  nimbyte: {
    ink: "#20211f", muted: "#5c5650", cream: "#f4efe7", sand: "#ebe3d6", paper: "#fffdf9",
    accent: "#fa604e", accentInk: "#9f3a2b", accentSoft: "#fbdcd4", blueSoft: "#dfe6f7", greenSoft: "#dcebd9",
  },
};

// Ready palettes: five shades each, light to dark, which take the places of sand, accent-soft,
// accent, accent-ink and ink (theme.palette names one; theme.colors gives your own five).
export const PALETTES = {
  nimbyte: ["#ebe3d6", "#fbdcd4", "#fa604e", "#9f3a2b", "#20211f"],
  purple: ["#efeaf8", "#ddd1f6", "#8b5cf6", "#5b30b5", "#221a33"],
  blue: ["#e8eef8", "#d2e1fa", "#3b82f6", "#1e4fae", "#152033"],
  red: ["#f6e9e7", "#f8d3d0", "#e5484d", "#a3262b", "#2b1a1a"],
  neutral: ["#edeae5", "#e0dcd5", "#8a847c", "#55504a", "#1f1e1c"],
  green: ["#e6f1e9", "#cde9d6", "#2f9e5c", "#17663a", "#14261b"],
  yellow: ["#f5efdc", "#f6e6a6", "#e8b10f", "#735200", "#2b2512"],
  orange: ["#f6ebe1", "#fbd9bd", "#f5761a", "#a3430a", "#2d1c10"],
  mono: ["#ececec", "#dcdcdc", "#5f5f5f", "#2e2e2e", "#0d0d0d"],
  pink: ["#f6e9ef", "#f8d2e3", "#e8559a", "#a52463", "#2e1622"],
};
const ROLES = ["sand", "accentSoft", "accent", "accentInk", "ink"];
const HEX = /^#[0-9a-f]{6}$/i;
const light = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// The last two shades are text and dark tiles, so they stay dark: darker, if need be, to `max`.
const MAX = { accentInk: 0.35, ink: 0.18 };
export function deepen(hex, max) {
  const l = light(hex);
  if (l <= max) return hex;
  return `#${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (max / l)).toString(16).padStart(2, "0")).join("")}`;
}
// The theme for a profile: nimbyte's, then a palette's five shades, then single overrides.
export function themeOf(theme = {}) {
  const { palette, colors, ...rest } = theme;
  const five = colors?.length === 5 ? colors : PALETTES[palette];
  const shades = five ? Object.fromEntries(ROLES.map((r, k) => [r, MAX[r] ? deepen(five[k], MAX[r]) : five[k]])) : {};
  return { ...THEMES.nimbyte, ...shades, ...rest };
}

// A tile's tone: one of the palette's names (paper, sand, accent-soft, accent, accent-ink, ink,
// blue, green) or any colour as #rrggbb. Dark ones get light text (and a dark-theme variant).
export const isDark = (tone) => tone === "ink" || tone === "accent-ink" || (HEX.test(tone ?? "") && light(tone) < 0.5);
const box = (tone, def, style = "", extra = "") => {
  const t = tone ?? def;
  const hex = HEX.test(t);
  const cls = hex ? `tile${isDark(t) ? " ink" : ""} custom` : `tile ${t === "accent-ink" ? "ink accent-ink" : t}`;
  const css = (hex ? `background:${t};` : "") + style;
  return `class="${cls}${extra ? ` ${extra}` : ""}"${css ? ` style="${css}"` : ""}`;
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chips = (items = [], tone = "") => `<div class="chips">${items.map((c) => `<span class="chip ${tone}">${esc(c)}</span>`).join("")}</div>`;
const label = (text, dot = true) => (text ? `<div class="label">${dot ? "<i></i>" : ""}${esc(text)}</div>` : "");

// Pictures as the editor crops them: fit (cover or contain), pos ("x% y%", the focal point), zoom
// (0.05 to 2, from pos: below 1 shrinks the picture in its frame) and mask (rounded, square, circle, arch). A picture with none of these
// draws exactly as before. A caption sits below it, or in a corner with capPos.
const CORNERS = ["top-right", "top-left", "bottom-right", "bottom-left"];
const edited = (p) => Boolean(p.fit || p.pos || p.zoom || p.mask);
const crop = (p, fit) => `object-fit:${p.fit ?? fit};object-position:${p.pos ?? "50% 50%"};transform:scale(${p.zoom ?? 1});transform-origin:${p.pos ?? "50% 50%"}`;
const frame = (src, p, cls, fit) => `<div class="frame ${cls} mask-${p.mask ?? "rounded"}"><img src="${esc(src)}" style="${crop(p, fit)}"></div>`;
const corner = (p) => (p.caption && CORNERS.includes(p.capPos) ? `<span class="cap-chip ${p.capPos}">${esc(p.caption)}</span>` : "");

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const count = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
const pct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const icon = (d, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const STAR = icon("M8 .8l2.2 4.6 5 .7-3.6 3.5.9 5L8 12.2l-4.5 2.4.9-5L.8 6.1l5-.7z");
const FORK = icon("M5 3.3a1.8 1.8 0 1 0-1.5 1.8v1.4c0 1 .8 1.8 1.8 1.8h1.9v1.6a1.8 1.8 0 1 0 1.6 0V8.3h1.9c1 0 1.8-.8 1.8-1.8V5.1a1.8 1.8 0 1 0-1.5 0v1.4c0 .2-.1.3-.3.3H5.3c-.2 0-.3-.1-.3-.3V5.1A1.8 1.8 0 0 0 5 3.3z");
const PLAY = icon("M5 3.2v9.6L13 8z", 30);

export const TILES = {
  hero: (p) => `<div ${box(p.tone, "paper")}>${label(p.label)}<div class="grow"></div>
    <h1>${esc(p.title)}</h1>${p.lead ? `<p class="lead">${esc(p.lead)}</p>` : ""}
    ${p.chips?.length ? `<div style="margin-top:18px">${chips(p.chips, "sand")}</div>` : ""}</div>`,
  image: (p) => `<div ${box(p.tone, "accent-soft", "align-items:center")}>
    ${edited(p) ? frame(p.src, p, "pic", "contain") : `<img class="picture" src="${esc(p.src)}">`}<div class="grow"></div>
    ${corner(p) || (p.caption ? `<p class="small" style="color:var(--ink)">${esc(p.caption)}</p>` : "")}</div>`,
  now: (p) => `<div ${box(p.tone, "ink")}>${label(p.label)}<h2 style="margin-top:12px">${esc(p.title)}</h2>
    ${p.meta ? `<p class="small" style="margin-top:2px">${esc(p.meta)}</p>` : ""}<div class="grow"></div>
    ${p.text ? `<p class="small" style="margin-top:14px">${esc(p.text)}</p>` : ""}</div>`,
  feature: (p) => `<div ${box(p.tone, "accent", "", "raised")}>${p.href ? '<div class="arrow">↗</div>' : ""}
    ${label(p.label, false)}<div class="feature-title"><span dir="${p.titleDir ?? "auto"}">${esc(p.title)}</span>
    ${p.subtitle ? `<span class="mono sub">${esc(p.subtitle)}</span>` : ""}</div><div class="grow"></div>
    ${p.text ? `<p class="small" style="color:var(--ink)">${esc(p.text)}</p>` : ""}${p.chips?.length ? chips(p.chips) : ""}</div>`,
  stack: (groups, t) => `<div class="tile sand">${label(t.label ?? "Stack")}<div class="grow"></div><div class="rows">
    ${groups.map((g) => `<div class="row"><span class="when">${esc(g.group)}</span>${chips(g.items, "tight")}</div>`).join("")}</div></div>`,
  project: (p) => `<div ${box(p.tone, "paper", "padding:12px 12px 18px", "raised")}>
    ${p.image ? (edited(p) ? frame(p.image, p, "shot-frame", "cover") : `<img class="shot" src="${esc(p.image)}">`) : ""}<div style="padding:14px 8px 0">
    <h3>${esc(p.title)}</h3>${p.text ? `<p class="small">${esc(p.text)}</p>` : ""}</div></div>`,
  experience: (list, t) => `<div class="tile paper">${label(t.label ?? "Experience")}<div class="grow"></div><div class="rows">
    ${list.map((e) => `<div class="row"><span class="when">${esc(e.when)}</span><span><b>${esc(e.role)}</b>
    ${e.where ? `<span class="small"> · ${esc(e.where)}</span>` : ""}</span></div>`).join("")}</div></div>`,
  education: (p) => `<div ${box(p.tone, "blue")}>${label(p.label ?? "Education")}<div class="grow"></div>
    <h3>${esc(p.title)}</h3>${p.text ? `<p class="small" style="margin-top:4px">${esc(p.text)}</p>` : ""}
    ${p.chips?.length ? `<div style="margin-top:14px">${chips(p.chips)}</div>` : ""}</div>`,
  note: (p) => `<div ${box(p.tone, "paper")}>${label(p.label)}<div class="grow"></div>
    ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}${p.text ? `<p class="small" style="margin-top:4px">${esc(p.text)}</p>` : ""}</div>`,
  // the blocks (profile.blocks): tiles anyone can add from the editor's list
  quote: (p) => `<div ${box(p.tone, "accent-soft")}><div class="quote-mark">“</div>
    <p class="quote">${esc(p.text)}</p><div class="grow"></div>${p.author ? `<p class="small">${esc(p.author)}</p>` : ""}</div>`,
  chips: (p) => `<div ${box(p.tone, "paper")}>${label(p.label)}<div class="grow"></div>${chips(p.items ?? [], "sand")}</div>`,
  number: (p) => `<div ${box(p.tone, "sand")}>${label(p.label)}<div class="grow"></div>
    <div class="big-num">${esc(p.value)}</div>${p.text ? `<p class="small">${esc(p.text)}</p>` : ""}</div>`,
  status: (p) => `<div ${box(p.tone, "green")}>${label(p.label, false)}<div class="grow"></div>
    <div class="status"><i></i><b>${esc(p.title)}</b></div>${p.text ? `<p class="small" style="margin-top:4px">${esc(p.text)}</p>` : ""}</div>`,
  photo: (p) => `<div class="tile photo">${p.src ? `<img src="${esc(p.src)}"${edited(p) ? ` style="${crop(p, "cover")}"` : ""}>` : ""}
    ${corner(p) || (p.caption ? `<span class="photo-cap">${esc(p.caption)}</span>` : "")}</div>`,
  links: (p) => `<div ${box(p.tone, "paper")}>${label(p.label)}<div class="grow"></div><div class="rows">
    ${(p.items ?? []).map((i) => `<div class="row link-row"><span>${esc(i.name)}</span><span class="mono">${esc(i.value)}</span></div>`).join("")}</div></div>`,
  // filled from a link by the editor (or the agent): a song, a repository, a video, and bars
  music: (p) => `<div ${box(p.tone, "ink")}>${p.source ? `<div class="m-src mono">${esc(p.source)}</div>` : ""}${label(p.label)}
    <div class="music">${p.cover ? `<img class="cover" src="${esc(p.cover)}">` : '<div class="cover"></div>'}
    <div class="m-text"><b dir="auto">${esc(p.title)}</b>${p.artist ? `<span class="small" dir="auto">${esc(p.artist)}</span>` : ""}</div></div>
    <div class="grow"></div>${p.duration ? `<div dir="ltr"><div class="m-bar"><i></i></div>
    <div class="m-time mono"><span>${clock(p.duration * 0.38)}</span><span>${clock(p.duration)}</span></div></div>` : ""}</div>`,
  repo: (p) => `<div ${box(p.tone, "paper", "", "raised")}>${label(p.label)}<div class="grow"></div>
    <h3 class="mono repo-name" dir="ltr">${esc(p.repo)}</h3>${p.description ? `<p class="small" style="margin-top:6px" dir="auto">${esc(p.description)}</p>` : ""}
    <div class="repo-meta" dir="ltr">${p.language ? `<span><i style="background:${HEX.test(p.color ?? "") ? p.color : "var(--accent)"}"></i>${esc(p.language)}</span>` : ""}
    ${p.stars != null ? `<span>${STAR}${count(p.stars)}</span>` : ""}${p.forks != null ? `<span>${FORK}${count(p.forks)}</span>` : ""}</div></div>`,
  video: (p) => `<div ${box(p.tone, "paper", "padding:12px 12px 18px", "raised")}>
    <div class="frame video mask-rounded">${p.thumb ? `<img src="${esc(p.thumb)}">` : ""}<span class="play">${PLAY}</span></div>
    <div style="padding:14px 8px 0"><h3 dir="auto">${esc(p.title)}</h3>${p.channel ? `<p class="small">${esc(p.channel)}</p>` : ""}</div></div>`,
  progress: (p) => `<div ${box(p.tone, "paper")}>${label(p.label)}<div class="grow"></div><div class="rows">
    ${(p.items ?? []).map((i) => `<div><div class="bar-head"><span dir="auto">${esc(i.name)}</span><span class="mono">${pct(i.value)}%</span></div>
    <div class="bar"><i style="width:${pct(i.value)}%"></i></div></div>`).join("")}</div></div>`,
  contact: (p) => `<div ${box(p.tone, "paper", "padding:20px", "raised")}>${label(p.label, false)}<div class="grow"></div>
    <div class="mono value" style="font-size:${p.value.length > 20 ? 12.5 : 15}px">${esc(p.value)}</div></div>`,
};

// The first three shades are grounds for ink text; one dark enough gets light text instead.
const GROUNDS = { sand: [".sand", ".chip.sand"], accentSoft: [".accent-soft"], accent: [".accent"] };
const onDark = (t) => Object.entries(GROUNDS).filter(([k]) => light(t[k]) < 0.4).flatMap(([, sel]) => sel).map((c) =>
  `\n${c} { color: var(--cream); } ${c} .label, ${c} .when, ${c} .unit { color: rgba(255,255,255,.64); }
${c} .small, ${c} .lead, ${c} .link-row .mono { color: rgba(255,255,255,.72); } ${c} .chip { color: var(--ink); }`).join("");

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
.ink { background: var(--ink); color: var(--cream); } .accent-ink { background: var(--accent-ink); } .ink.dark { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.16); }
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
.ink .lead, .ink .when, .ink .unit, .ink .link-row .mono { color: rgba(255,255,255,.72); } .ink .chip { color: var(--ink); }
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
.frame { position: relative; overflow: hidden; } .frame img { width: 100%; height: 100%; display: block; }
.frame.pic { width: 100%; flex: 1; min-height: 150px; max-height: 260px; margin-top: 4px; } .frame.shot-frame { width: 100%; aspect-ratio: 1200 / 560; }
.mask-rounded { border-radius: 16px; } .mask-square { border-radius: 0; } .mask-arch { border-radius: 999px 999px 16px 16px; }
.mask-circle { border-radius: 50%; } .frame.pic.mask-circle { flex: none; width: auto; height: 230px; aspect-ratio: 1; align-self: center; }
.frame.pic.mask-arch { flex: none; width: auto; height: 240px; aspect-ratio: 4 / 5; align-self: center; }
.cap-chip { position: absolute; z-index: 2; background: var(--paper); color: var(--ink); border-radius: 12px; padding: 6px 12px; font-size: 14px; font-weight: 700; }
.cap-chip.top-right { top: 16px; right: 16px; } .cap-chip.top-left { top: 16px; left: 16px; }
.cap-chip.bottom-right { bottom: 16px; right: 16px; } .cap-chip.bottom-left { bottom: 16px; left: 16px; }
.value { font-weight: 800; direction: ltr; text-align: start; } [dir=rtl] .value { text-align: right; }
.num { font-size: 34px; font-weight: 900; line-height: 1.2; letter-spacing: -.5px; }
.unit { font-size: 16px; font-weight: 700; color: var(--muted); letter-spacing: 0; }
.heat { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 13px); gap: 4px; justify-content: space-between; direction: ltr; }
.heat b, .legend b { width: 13px; height: 13px; border-radius: 3px; display: inline-block; }
.legend { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--muted); }
.quote-mark { font-size: 72px; line-height: .8; font-weight: 900; color: var(--accent); height: 40px; }
.quote { font-size: 22px; line-height: 1.5; font-weight: 700; margin-top: 8px; }
.big-num { font-size: 56px; font-weight: 900; line-height: 1.1; letter-spacing: -1px; }
.status { display: flex; align-items: center; gap: 10px; font-size: 21px; }
.status i { width: 14px; height: 14px; border-radius: 9999px; background: #2f6b3a; box-shadow: 0 0 0 5px rgba(47,107,58,.18); }
.tile.photo { padding: 0; background: var(--sand); } .photo img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.photo-cap { position: absolute; bottom: 16px; inset-inline-start: 16px; background: var(--paper); border-radius: 12px; padding: 6px 12px; font-size: 14px; font-weight: 700; }
.link-row { justify-content: space-between; font-size: 15px; font-weight: 600; border-bottom: 1px solid var(--sand); padding-bottom: 8px; }
.link-row:last-child { border-bottom: 0; padding-bottom: 0; } .link-row .mono { font-size: 13px; color: var(--muted); direction: ltr; }
.music { display: flex; gap: 18px; align-items: center; margin-top: 16px; } .cover { width: 92px; height: 92px; border-radius: 14px; object-fit: cover; flex: none; background: var(--sand); }
.m-text { display: grid; gap: 2px; min-width: 0; } .m-text b { font-size: 21px; line-height: 1.35; }
.m-src { position: absolute; top: 24px; inset-inline-end: 26px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
.m-bar { height: 6px; border-radius: 6px; background: rgba(32,33,31,.12); margin-top: 16px; overflow: hidden; } .m-bar i { display: block; width: 38%; height: 100%; background: var(--accent); }
.ink .m-bar { background: rgba(255,255,255,.16); }
.m-time { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; opacity: .7; }
.repo-name { font-size: 20px; overflow-wrap: anywhere; } .repo-meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 16px; font-size: 14px; font-weight: 600; }
.repo-meta span { display: inline-flex; align-items: center; gap: 6px; } .repo-meta i { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.frame.video { width: 100%; aspect-ratio: 16 / 9; background: var(--sand); } .frame.video img { object-fit: cover; }
.play { position: absolute; inset: 0; margin: auto; width: 64px; height: 64px; border-radius: 20px; background: var(--accent); color: var(--ink);
  display: grid; place-items: center; padding-left: 4px; }
.bar-head { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; margin-bottom: 6px; } .bar-head .mono { font-size: 13px; }
.bar { height: 8px; border-radius: 8px; background: rgba(32,33,31,.1); overflow: hidden; } .bar i { display: block; height: 100%; border-radius: 8px; background: var(--accent); }
.ink .bar { background: rgba(255,255,255,.16); }
.l0 { background: var(--sand); } .l1 { background: var(--accent-soft); } .l2 { background: color-mix(in srgb, var(--accent) 55%, white); }
.l3 { background: var(--accent); } .l4 { background: var(--accent-ink); }${onDark(t)}`;
}

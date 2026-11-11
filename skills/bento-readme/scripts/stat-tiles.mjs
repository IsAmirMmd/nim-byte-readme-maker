// The stats tiles' HTML, filled from stats.json (stats.mjs): contributions, the current and the
// longest streak, profile views and the last year's squares.
import { STRINGS } from "./layout.mjs";

const n = (v, lang) => Number(v).toLocaleString(lang === "fa" ? "fa-IR" : "en-US");
const date = (iso, lang, year = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US",
    { month: "short", day: "numeric", ...(year && { year: "numeric" }), timeZone: "UTC" });

export function statTile(data, stats, lang) {
  const s = STRINGS[lang];
  const range = (r) => (r.length ? `${date(r.start, lang)} – ${date(r.end, lang, true)}` : s.none);
  const body = {
    total: [n(stats.total, lang), `${s.since} ${date(stats.since, lang, true)}`],
    current: [`${n(stats.current.length, lang)} <span class="unit">${s.days}</span>`, range(stats.current)],
    longest: [`${n(stats.longest.length, lang)} <span class="unit">${s.days}</span>`, range(stats.longest)],
    views: [n(stats.views, lang), s.counter],
  }[data.id];
  return `<div class="tile ${data.tone}" style="padding:20px 22px"><div class="label">${data.id === "current" ? "<i></i>" : ""}${data.title}</div>
    <div class="grow"></div><div class="num">${body[0]}</div><p class="small">${body[1]}</p></div>`;
}

export function yearTile(data, stats, lang) {
  const s = STRINGS[lang];
  // four shades by the quartiles of the active days, like GitHub's own calendar
  const busy = stats.lastYear.filter(Boolean).sort((a, b) => a - b);
  const q = [0.25, 0.5, 0.75].map((p) => busy[Math.floor(p * (busy.length - 1))] ?? 0);
  const level = (c) => (!c ? 0 : 1 + q.filter((x) => c > x).length);
  return `<div class="tile paper"><div class="row" style="justify-content:space-between">
    <div class="label"><i></i>${data.title}</div>
    <div class="legend">${s.less} <b class="l0"></b><b class="l1"></b><b class="l2"></b><b class="l3"></b><b class="l4"></b> ${s.more}</div></div>
    <div class="grow"></div><div class="heat">${stats.lastYear.map((c) => `<b class="l${level(c)}"></b>`).join("")}</div></div>`;
}

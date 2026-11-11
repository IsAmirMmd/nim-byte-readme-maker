// Turns profile.json into rows of tiles on a 1000px design canvas. Each row's widths add up to
// 1000; readme.mjs writes them as percentages. Every section is optional.

export const STRINGS = {
  en: { stack: "Stack", experience: "Experience", education: "Education", contributions: "Contributions",
    current: "Current streak", longest: "Longest streak", views: "Profile views", year: "The last year on GitHub",
    days: "days", since: "since", counter: "since the counter began", less: "less", more: "more", none: "Starts with the next commit" },
  fa: { stack: "مهارت‌ها", experience: "سابقه‌ی کار", education: "تحصیلات", contributions: "مشارکت‌ها",
    current: "روزهای پشت سر هم", longest: "بیشترین روزهای پشت سر هم", views: "بازدید پروفایل", year: "یک سال اخیر در گیت‌هاب",
    days: "روز", since: "از", counter: "از وقتی شمارنده راه افتاد", less: "کمتر", more: "بیشتر", none: "با کامیت بعدی شروع می‌شود" },
};

export const langOf = (profile) => (profile.lang === "fa" ? "fa" : "en");
export const dirOf = (profile) => profile.dir ?? (langOf(profile) === "fa" ? "rtl" : "ltr");

const split = (n) => {
  // n tiles in one row: equal widths that add up to 1000
  const base = Math.floor(1000 / n);
  return Array.from({ length: n }, (_, i) => base + (i < 1000 - base * n ? 1 : 0));
};

export function rows(profile) {
  const s = STRINGS[langOf(profile)];
  const out = [];
  const row = (tiles, minHeight = 0) => tiles.length && out.push({ tiles, minHeight });

  const top = [];
  if (profile.hero) top.push({ id: "hero", kind: "hero", data: profile.hero, width: profile.image ? 640 : 1000 });
  if (profile.image) top.push({ id: "image", kind: "image", data: profile.image, width: profile.hero ? 360 : 1000, href: profile.image.href });
  row(top, 300);

  const mid = [];
  if (profile.now) mid.push({ id: "now", kind: "now", data: profile.now, width: profile.feature ? 333 : 1000, ink: true });
  if (profile.feature) mid.push({ id: "feature", kind: "feature", data: profile.feature, width: profile.now ? 667 : 1000, href: profile.feature.href });
  row(mid, 230);

  if (profile.stack?.length) row([{ id: "stack", kind: "stack", data: profile.stack.map((g) => ({ ...g, group: g.group })), width: 1000, label: s.stack }]);

  const projects = profile.projects ?? [];
  for (let i = 0; i < projects.length; i += 3) {
    const chunk = projects.slice(i, i + 3);
    const widths = split(chunk.length);
    row(chunk.map((p, k) => ({ id: `work-${i + k + 1}`, kind: "project", data: p, width: widths[k], href: p.href })));
  }

  const life = [];
  if (profile.experience?.length) life.push({ id: "experience", kind: "experience", data: profile.experience, width: profile.education ? 620 : 1000, label: s.experience });
  if (profile.education) life.push({ id: "education", kind: "education", data: { label: s.education, ...profile.education }, width: profile.experience?.length ? 380 : 1000 });
  row(life);

  const contacts = (profile.contacts ?? []).slice(0, 5);
  if (contacts.length) {
    // wider tiles for longer values, at least 160 each
    const weight = contacts.map((c) => Math.max(10, String(c.value).length));
    const total = weight.reduce((a, b) => a + b, 0);
    const widths = weight.map((w) => Math.max(160, Math.round((1000 * w) / total)));
    const extra = widths.reduce((a, b) => a + b, 0) - 1000;
    widths[widths.indexOf(Math.max(...widths))] -= extra;
    row(contacts.map((c, k) => ({ id: `contact-${k + 1}`, kind: "contact", data: c, width: widths[k], href: c.href })), 116);
  }
  return out;
}

// The stats tiles (stats.mjs fills them): four counters, then the last year's squares.
export const statRows = (profile) => {
  const s = STRINGS[langOf(profile)];
  return [
    { tiles: [["total", s.contributions, "paper"], ["current", s.current, "accent-soft"], ["longest", s.longest, "sand"], ["views", s.views, "blue"]]
      .map(([id, title, tone]) => ({ id: `stat-${id}`, kind: "stat", data: { id, title, tone }, width: 250 })), minHeight: 150 },
    { tiles: [{ id: "stat-year", kind: "year", data: { title: s.year }, width: 1000 }], minHeight: 200 },
  ];
};

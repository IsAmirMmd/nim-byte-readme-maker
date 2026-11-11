// Fetches the numbers for the stats tiles into .bento/stats.json: contributions by day from GitHub's
// GraphQL API, the streaks worked out from them, and profile views from komarev's counter.
//   GITHUB_TOKEN=… node .bento/scripts/stats.mjs [.bento/profile.json]
// The workflow (templates/bento-stats.yml) runs it, then build.mjs --stats.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const profilePath = resolve(process.argv[2] ?? ".bento/profile.json");
const { github: USER } = JSON.parse(readFileSync(profilePath, "utf8"));
const token = process.env.GITHUB_TOKEN;
if (!USER) throw new Error("profile.json needs \"github\": your GitHub username");
if (!token) throw new Error("GITHUB_TOKEN is not set");

const gql = async (query, variables) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
};

const { user } = await gql(`query($login: String!) { user(login: $login) { createdAt } }`, { login: USER });
const now = new Date();
const today = now.toISOString().slice(0, 10);
const days = [];
for (let year = new Date(user.createdAt).getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
  const data = await gql(
    `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) {
      contributionsCollection(from: $from, to: $to) { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`,
    { login: USER, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` },
  );
  for (const week of data.user.contributionsCollection.contributionCalendar.weeks)
    for (const d of week.contributionDays) if (d.date <= today) days.push({ date: d.date, count: d.contributionCount });
}
days.sort((a, b) => a.date.localeCompare(b.date));

// Streaks: a day without contributions breaks one, except today, which isn't over yet.
let longest = { length: 0 };
let run = null;
for (const d of days) {
  run = d.count > 0 ? (run ? { ...run, end: d.date, length: run.length + 1 } : { start: d.date, end: d.date, length: 1 }) : null;
  if (run && run.length > longest.length) longest = run;
}
let current = run ?? { length: 0 };
if (!run && days.length > 1 && days.at(-2).count > 0) {
  let i = days.length - 2;
  let j = i;
  while (j > 0 && days[j - 1].count > 0) j--;
  current = { start: days[j].date, end: days[i].date, length: i - j + 1 };
}

const svg = await (await fetch(`https://komarev.com/ghpvc/?username=${USER}`)).text();
const views = Number([...svg.matchAll(/>\s*([\d,]+)\s*</g)].at(-1)?.[1].replace(/,/g, "") ?? 0);

const stats = {
  total: days.reduce((sum, d) => sum + d.count, 0),
  since: days.find((d) => d.count > 0)?.date ?? days[0]?.date,
  current,
  longest,
  views,
  // 52 full weeks and this one, starting on a Sunday, as GitHub's calendar draws them
  lastYear: days.slice(-(52 * 7 + now.getUTCDay() + 1)).map((d) => d.count),
};
writeFileSync(resolve(dirname(profilePath), "stats.json"), `${JSON.stringify(stats)}\n`);
console.log({ ...stats, lastYear: `${stats.lastYear.length} days` });

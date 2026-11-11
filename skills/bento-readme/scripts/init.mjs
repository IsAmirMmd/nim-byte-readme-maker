// Sets up a profile repository (github.com/<you>/<you>, or an organization's .github) for the
// bento README: copies this skill's scripts and fonts into <repo>/.bento/, a starting
// profile.json from the example, and, with --stats, the workflow that redraws the stats tiles.
//   node <skill>/scripts/init.mjs <repo> [--lang en|fa] [--stats]
// Files already in <repo>/.bento are kept, except the scripts and fonts, which are updated.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const repo = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const lang = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : "en";
const skill = resolve(dirname(new URL(import.meta.url).pathname), "..");
const bento = join(repo, ".bento");

const copyDir = (from, to, filter = () => true) => {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from).filter(filter)) copyFileSync(join(from, f), join(to, f));
};
copyDir(join(skill, "scripts"), join(bento, "scripts"), (f) => f.endsWith(".mjs"));
copyDir(join(skill, "fonts"), join(bento, "fonts"));
mkdirSync(join(bento, "images"), { recursive: true });

const profile = join(bento, "profile.json");
if (!existsSync(profile)) copyFileSync(join(skill, "examples", `profile.${lang === "fa" ? "fa" : "en"}.json`), profile);

// the build's scratch page and Playwright stay out of git
const ignore = join(repo, ".gitignore");
const have = existsSync(ignore) ? readFileSync(ignore, "utf8") : "";
for (const line of [".bento/build/", "node_modules/"]) if (!have.split("\n").includes(line)) appendFileSync(ignore, `${have && !have.endsWith("\n") ? "\n" : ""}${line}\n`);

if (args.includes("--stats")) {
  const wf = join(repo, ".github", "workflows");
  mkdirSync(wf, { recursive: true });
  writeFileSync(join(wf, "bento-stats.yml"), readFileSync(join(skill, "templates", "bento-stats.yml"), "utf8"));
}
console.log(`ready: ${bento} (edit profile.json, then: node .bento/scripts/build.mjs)`);

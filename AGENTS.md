# AGENTS.md

This repository is one skill, **bento-readme**: it makes a bento-grid GitHub profile README in
the نیم‌بایت (nimbyte) look, in English or Persian. Any coding agent can use it; it's plain
Node.js (18+) and Playwright, with no agent-specific tools.

## Using it

When the user asks for a GitHub profile README, to restyle their GitHub profile or an
organization page, or to update a README this skill made, read and follow
[`skills/bento-readme/SKILL.md`](skills/bento-readme/SKILL.md). It works on the user's profile
repository (`<user>/<user>`), not on this one.

## Working on the skill itself

- Scripts are in `skills/bento-readme/scripts/`, one job each; `references/design.md` has the
  look's rules. Keep the default output the nimbyte look; new options must leave it unchanged.
- Test a change end to end: run `scripts/init.mjs` on a scratch folder with each example profile
  (`examples/profile.en.json`, `examples/profile.fa.json`), build, run `preview.mjs` and look at
  the previews in light, dark and phone width, for both directions.
- Commit each significant change on its own, with a message that says what changed and why.

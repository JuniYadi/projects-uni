---
description: Bump Android app version and open a PR
argument-hint: "<versi>"
---
# /bp-android

Bump Android release version for UniVPN and open a PR. Version argument is required.

Requested version: `$1`

Rules:
- If `$1` is empty, stop immediately and reply: `Versi wajib diisi. Contoh: /bp-android v0.0.8`
- Accept only semantic version `vX.Y.Z` or `X.Y.Z`.
- Do not commit or push to `main`.
- If the working tree is dirty before starting, stop and ask the user to clean/stash it.
- Create a branch named `chore/android-$1` with `/` and spaces replaced by `-`.
- Update `apps/mobile/app.json`:
  - `expo.version` = version without leading `v`
  - `expo.android.versionCode` = `major * 10000 + minor * 100 + patch`
- Update `CHANGELOG.md`:
  - Insert a new `## [v{version}] - {date}` entry at the top (after the intro line)
  - Include empty `### Added`, `### Changed`, `### Fixed` sections as placeholders
  - Date format: YYYY-MM-DD, use current date
- Create/update `distribution/whatsnew/` release notes:
  - `whatsnew-id-ID` — Indonesian release notes
  - `whatsnew-en-US` — English release notes
  - Content is the actual release notes for this version (bullet points from CHANGELOG.md, localized)
- Keep existing Android config intact.
- Commit changes with message `chore(android): bump version to $1`.
- Push the branch.
- Open a PR with `gh pr create` targeting `main`:
  - title: `chore(android): bump version to $1`
  - body: include versionName and versionCode.
- After creating the PR, print the PR URL only plus one short summary line.

Minimal implementation hint:
```sh
VERSION_RAW="$1"
VERSION="${VERSION_RAW#v}"
DATE=$(date +%F)
node -e '
const fs = require("fs");
const raw = process.env.VERSION;
const date = process.env.DATE;
if (!/^\d+\.\d+\.\d+$/.test(raw)) throw new Error("Invalid semver");
const [major, minor, patch] = raw.split(".").map(Number);

// app.json
const p = "apps/mobile/app.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.expo.version = raw;
j.expo.android ??= {};
j.expo.android.versionCode = major * 10000 + minor * 100 + patch;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");

// CHANGELOG.md — insert new version entry before the first existing entry
const changelog = "CHANGELOG.md";
const cl = fs.readFileSync(changelog, "utf8");
const entry = `\\n## [v${raw}] - ${date}\\n\\n### Added\\n\\n### Changed\\n\\n### Fixed\\n`;
const lines = cl.split("\\n");
let insertAt = lines.findIndex(l => l.startsWith("## ["));
if (insertAt === -1) insertAt = lines.length;
lines.splice(insertAt, 0, entry);
fs.writeFileSync(changelog, lines.join("\\n") + "\\n");

// whatsnew — bullet points from CHANGELOG entry (same for both locales)
const clLines = fs.readFileSync(changelog, "utf8").split("\\n");
const idx = clLines.findIndex(l => l.startsWith(`## [v${raw}]`));
let notes = "";
for (let i = idx + 1; i < clLines.length && !clLines[i].startsWith("## ["); i++) {
  if (clLines[i].startsWith("- ")) notes += clLines[i] + "\\n";
}
const dir = "distribution/whatsnew";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + "/whatsnew-en-US", notes);
fs.writeFileSync(dir + "/whatsnew-id-ID", notes);

console.log(`app: ${raw} (code: ${j.expo.android.versionCode})`);
'
```

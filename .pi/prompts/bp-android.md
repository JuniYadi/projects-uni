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
  - Populate `### Added`, `### Changed`, `### Fixed` from git commit history since the previous version tag
  - Find commits with `git log v{prev}..HEAD --format='%s%n%b'` and categorize by conventional commit prefix (`feat:`/`add:`/`ui:` → Added, `chore:`/`refactor:`/`perf:`/`ci:`/`docs:`/`style:` → Changed, `fix:` → Fixed)
  - To find previous version tag: `git tag --sort=-version:refname | head -1`. If no tags exist, use `git log --oneline` and let user pick the range.
  - If no commits are found, use empty sections as a last resort
  - Date format: YYYY-MM-DD, use current date
- Create/update `distribution/whatsnew/` release notes:
  - `whatsnew-id-ID` — Indonesian release notes
  - `whatsnew-en-US` — English release notes
  - Content is the actual release notes for this version (bullet points from CHANGELOG.md, localized)
  - **Must not be empty** — always populate from the CHANGELOG entry above, which is generated from git history
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
# find previous version tag
PREV_TAG=$(git tag --sort=-version:refname | head -1)
[ -z "$PREV_TAG" ] && PREV_TAG=v0.1.0  # fallback
node -e '
const fs = require("fs");
const { execSync } = require("child_process");
const raw = process.env.VERSION;
const date = process.env.DATE;
const prevTag = process.env.PREV_TAG || "HEAD~10";
if (!/^\d+\.\d+\.\d+$/.test(raw)) throw new Error("Invalid semver");
const [major, minor, patch] = raw.split(".").map(Number);

// app.json
const p = "apps/mobile/app.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.expo.version = raw;
j.expo.android ??= {};
j.expo.android.versionCode = major * 10000 + minor * 100 + patch;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");

// read git log since prev tag
const log = execSync(`git log ${prevTag}..HEAD --format="%s%n%b"`, { encoding: "utf8" });
const lines = log.split("\n");
const added = [], changed = [], fixed = [];
for (const l of lines) {
  const s = l.trim().replace(/^\(.*\)\s*/, "").replace(/^\*\s*/,"");
  if (/^(feat|add|ui)/i.test(s)) added.push("- " + s.replace(/^(feat|add|ui)[\s(:]*(.+)/i, "$2"));
  else if (/^(chore|refactor|perf|ci|docs|style|test)/i.test(s)) changed.push("- " + s.replace(/^(chore|refactor|perf|ci|docs|style|test)[\s(:]*/i, ""));
  else if (/^fix/i.test(s)) fixed.push("- " + s.replace(/^fix[\s(:]*/i, ""));
}

// clamp to actual items, skip placeholders if empty
const addSection = added.length ? "### Added\n\n" + added.join("\n") + "\n" : "### Added\n\n";
const chgSection = changed.length ? "### Changed\n\n" + changed.join("\n") + "\n" : "### Changed\n\n";
const fixSection = fixed.length ? "### Fixed\n\n" + fixed.join("\n") + "\n" : "### Fixed\n\n";
const entry = "\n## [v" + raw + "] - " + date + "\n\n" + addSection + chgSection + fixSection;

// CHANGELOG.md — insert before first existing ## [
const changelog = "CHANGELOG.md";
const cl = fs.readFileSync(changelog, "utf8");
const clLines = cl.split("\n");
let insertAt = clLines.findIndex(l => l.startsWith("## ["));
if (insertAt === -1) insertAt = clLines.length;
clLines.splice(insertAt, 0, entry);
fs.writeFileSync(changelog, clLines.join("\n") + "\n");

// whatsnew — extract bullets from the entry we just wrote
let notes = "";
const clText = fs.readFileSync(changelog, "utf8");
const idx = clText.split("\n").findIndex(l => l.startsWith("## [v" + raw + "]"));
for (let i = idx + 1; i < clText.split("\n").length && !clText.split("\n")[i].startsWith("## ["); i++) {
  if (clText.split("\n")[i].startsWith("- ")) notes += clText.split("\n")[i] + "\n";
}
const dir = "distribution/whatsnew";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + "/whatsnew-en-US", notes || "No changes");
fs.writeFileSync(dir + "/whatsnew-id-ID", notes || "Tidak ada perubahan");

console.log(`app: ${raw} (code: ${j.expo.android.versionCode})`);
'
```

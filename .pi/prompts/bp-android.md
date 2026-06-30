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
- Update only `apps/mobile/app.json`:
  - `expo.version` = version without leading `v`
  - `expo.android.versionCode` = `major * 10000 + minor * 100 + patch`
- Keep existing Android config intact.
- Commit the change with message `chore(android): bump version to $1`.
- Push the branch.
- Open a PR with `gh pr create` targeting `main`:
  - title: `chore(android): bump version to $1`
  - body: include versionName and versionCode.
- After creating the PR, print the PR URL only plus one short summary line.

Minimal implementation hint:
```sh
VERSION_RAW="$1"
VERSION="${VERSION_RAW#v}"
node -e '
const fs = require("fs");
const raw = process.env.VERSION;
if (!/^\d+\.\d+\.\d+$/.test(raw)) throw new Error("Invalid semver");
const [major, minor, patch] = raw.split(".").map(Number);
const p = "apps/mobile/app.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.expo.version = raw;
j.expo.android ??= {};
j.expo.android.versionCode = major * 10000 + minor * 100 + patch;
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log(`${raw} ${j.expo.android.versionCode}`);
'
```
